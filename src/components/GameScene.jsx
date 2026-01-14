import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import * as THREE from 'three';
import useStore from '../store';
import { COLORS, GAME_SPEED_START, JUMP_FORCE, GRAVITY } from '../constants';
import Obstacle from './Obstacle';

const PLAYER_RADIUS = 0.3;
const GROUND_Y = -2;
const POOL_SIZE = 15;
const SPAWN_DISTANCE = 20;

// Reusable FX Geometry (Shared)
const burstGeometry = new THREE.TorusGeometry(3, 0.1, 8, 32);
const burstMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });

function GameScene() {
  const status = useStore(state => state.status);
  const playerColor = useStore(state => state.playerColor);
  const addScore = useStore(state => state.addScore);
  const gameOver = useStore(state => state.gameOver);

  const playerRef = useRef(); // The visual mesh (for scaling)
  const playerGroupRef = useRef(); // The physics container (for position)
  const gridGroupRef = useRef();
  const { camera } = useThree();
  
  // Game State Ref
  const gameState = useRef({
    speed: GAME_SPEED_START,
    velocity: new Vector3(0, 0, 0),
    distance: 0,
    isJumping: false,
    lastObstacleZ: -10,
    shake: 0,
  });

  // FX Pool
  const burstRefs = useRef([]);
  // Fixed pool of 5 burst effects
  const bursts = useMemo(() => new Array(5).fill(0).map((_, i) => ({ id: i, active: false, time: 0, z: 0, color: '#fff' })), []);

  const input = useRef({ jump: false, slow: false });

  // Obstacle Pool
  const obstacles = useMemo(() => {
    return new Array(POOL_SIZE).fill(null).map((_, i) => ({
      index: i,
      z: -SPAWN_DISTANCE * (i + 1), 
      rotationSpeed: (Math.random() - 0.5) * 2,
      colorOffset: Math.floor(Math.random() * 4),
      passed: false,
      rotation: 0,
      ref: null 
    }));
  }, []); 

  // Init
  useEffect(() => {
    if (status === 'PLAYING') {
      const gs = gameState.current;
      gs.distance = 0;
      gs.velocity.set(0, 0, 0);
      gs.speed = GAME_SPEED_START;
      
      if (playerGroupRef.current) {
        playerGroupRef.current.position.set(0, GROUND_Y, 0);
      }
      
      gs.lastObstacleZ = 0;
      obstacles.forEach((obs, i) => {
         obs.z = -SPAWN_DISTANCE * (i + 1);
         obs.passed = false;
         obs.colorOffset = Math.floor(Math.random() * 4);
         obs.rotation = 0;
         obs.rotationSpeed = (Math.random() - 0.5) * 2;
         gs.lastObstacleZ = Math.min(gs.lastObstacleZ, obs.z);
         updateObstacleVisuals(obs);
      });
    }
  }, [status, obstacles]);

  const updateObstacleVisuals = (obs) => {
      if (!obs.ref) return;
      obs.ref.position.z = obs.z;
      obs.ref.rotation.z = obs.rotation;
      obs.ref.children.forEach((arcGroup, idx) => {
          const colorIdx = (idx + obs.colorOffset) % COLORS.length;
          const hex = COLORS[colorIdx].hex;
          const mesh = arcGroup.children[0];
          if (mesh && mesh.material) {
              mesh.material.color.set(hex);
              mesh.material.emissive.set(hex);
          }
      });
  };

  const triggerBurst = (z, color) => {
      // Find inactive burst
      const burst = bursts.find(b => !b.active);
      if (burst) {
          burst.active = true;
          burst.time = 0;
          burst.z = z;
          burst.color = color;
          
          const ref = burstRefs.current[burst.id];
          if(ref) {
              ref.position.set(0, 0, z);
              ref.scale.set(1,1,1);
              ref.material.color.set(color);
              ref.material.opacity = 1;
              ref.visible = true;
          }
      }
      gameState.current.shake = 0.5; // Trigger shake
  };

  // Input Listeners
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') input.current.jump = true;
      if (e.code === 'ShiftLeft' || e.code === 'KeyS') input.current.slow = true;
    };
    const onKeyUp = (e) => {
      input.current.jump = false;
      input.current.slow = false;
    };
    const onPointerDown = () => { input.current.slow = true; input.current.jump = true; };
    const onPointerUp = () => { input.current.slow = false; input.current.jump = false; };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (status !== 'PLAYING') return;

    const gs = gameState.current;
    
    // We use a Group for position logic now, and Mesh for scaling/visuals
    // If we just migrated from 'playerRef' as mesh-with-position to 'playerGroupRef', we need to check ref binding.
    const playerGroup = playerGroupRef.current; 
    const playerMesh = playerRef.current;
    
    // Safety check if refs aren't ready
    if (!playerGroup) return;

    // 1. Movement
    let currentSpeed = gs.speed;
    if (input.current.slow) currentSpeed *= 0.5; 
    else gs.speed += delta * 0.05; 

    playerGroup.position.z -= currentSpeed * delta;
    gs.distance += currentSpeed * delta;

    // Jump
    if (input.current.jump && !gs.isJumping && playerGroup.position.y <= GROUND_Y + 0.1) {
      gs.velocity.y = JUMP_FORCE;
      gs.isJumping = true;
      input.current.jump = false; 
    }

    // Gravity
    gs.velocity.y -= GRAVITY * delta;
    playerGroup.position.y += gs.velocity.y * delta;

    // Ground Check
    if (playerGroup.position.y < GROUND_Y) {
      playerGroup.position.y = GROUND_Y;
      gs.velocity.y = 0;
      gs.isJumping = false;
    }

    // Squash & Stretch
    if (playerMesh) {
       // Base scale 1
       const stretch = Math.min(Math.max(Math.abs(gs.velocity.y) * 0.03, 0), 0.6); 
       // If moving fast Y, stretch Y.
       const sy = 1 + stretch;
       const sx = 1 / Math.sqrt(sy);
       
       playerMesh.scale.lerp(new Vector3(sx, sy, sx), 0.2); // Smooth transition
    }

    // Camera Follow & Shake
    const targetZ = playerGroup.position.z + 8;
    const targetY = playerGroup.position.y + 3;
    
    // Decay Shake
    gs.shake = MathUtils.lerp(gs.shake, 0, 5 * delta);
    
    camera.position.z = MathUtils.lerp(camera.position.z, targetZ, 0.1);
    camera.position.y = MathUtils.lerp(camera.position.y, targetY, 0.1);
    
    // Apply Shake
    camera.position.x = (Math.random() - 0.5) * gs.shake;
    camera.position.y += (Math.random() - 0.5) * gs.shake;

    camera.lookAt(0, playerGroup.position.y, playerGroup.position.z - 10);

    // 2. Obstacles
    obstacles.forEach(obs => {
        if (!obs.ref) return;

        if (obs.z > playerGroup.position.z + 10) {
            // Recycle
            obs.z = gs.lastObstacleZ - SPAWN_DISTANCE;
            gs.lastObstacleZ = obs.z;
            obs.passed = false;
            obs.rotation = 0;
            obs.rotationSpeed = (Math.random() - 0.5) * 2;
            obs.colorOffset = Math.floor(Math.random() * 4);
            updateObstacleVisuals(obs);
        } else {
            obs.rotation += obs.rotationSpeed * delta;
            obs.ref.rotation.z = obs.rotation;
        }

        const dz = playerGroup.position.z - obs.z;
        
        // Pass Check
        if (dz < -0.5 && !obs.passed) {
            obs.passed = true;
            addScore();
            triggerBurst(obs.z, playerColor);
        }

        // Collision
        if (Math.abs(dz) < 0.5) { 
            const py = playerGroup.position.y; // Relative to world 0 is fine if obstacles are 0,0,z
            const px = 0; 
            const r = Math.sqrt(px*px + py*py);
            if (r > 1.3 && r < 4.0) { 
                 let angle = Math.atan2(py, px); 
                 if (angle < 0) angle += Math.PI * 2;
                 let localAngle = (angle - obs.rotation) % (Math.PI * 2);
                 if (localAngle < 0) localAngle += Math.PI * 2;
                 
                 let hitSegment = -1;
                 if (localAngle >= Math.PI/4 && localAngle < 3*Math.PI/4) hitSegment = 0;
                 else if (localAngle >= 3*Math.PI/4 && localAngle < 5*Math.PI/4) hitSegment = 3; 
                 else if (localAngle >= 5*Math.PI/4 && localAngle < 7*Math.PI/4) hitSegment = 2; 
                 else hitSegment = 1; 
                 
                 const colorIdx = (hitSegment + obs.colorOffset) % COLORS.length;
                 const segColor = COLORS[colorIdx].hex;
                 if (segColor !== playerColor) gameOver();
            }
        }
    });

    // 3. FX Update
    bursts.forEach(b => {
        if (b.active) {
            b.time += delta * 4; // Fast burst
            const ref = burstRefs.current[b.id];
            if (ref) {
                const s = 1 + b.time * 3; 
                ref.scale.set(s, s, s);
                ref.rotation.z -= delta;
                ref.material.opacity = Math.max(0, 1 - b.time); 
                if (b.time > 1) {
                    b.active = false;
                    ref.visible = false;
                }
            }
        }
    });

    // Grid Sync
    if (gridGroupRef.current && playerGroup) {
        gridGroupRef.current.position.z = Math.floor(playerGroup.position.z / 10) * 10;
    }
  });
  
  return (
    <>
      <group ref={playerGroupRef} position={[0, GROUND_Y, 0]}>
         <mesh ref={playerRef}>
            <sphereGeometry args={[PLAYER_RADIUS, 32, 32]} />
            <meshStandardMaterial color={playerColor} emissive={playerColor} emissiveIntensity={2} roughness={0.1} metalness={0.5} />
            <pointLight distance={10} intensity={3} color={playerColor} decay={2} />
         </mesh>
      </group>

      <group ref={gridGroupRef} position={[0, GROUND_Y - 0.5, 0]}>
         <gridHelper args={[200, 40, 0x00FFFF, 0x111111]} position={[0, 0, 0]} />
      </group>

      {bursts.map(b => (
          <mesh 
            key={`burst-${b.id}`}
            ref={el => burstRefs.current[b.id] = el}
            geometry={burstGeometry}
          >
             <meshBasicMaterial color="white" transparent opacity={0} />
          </mesh>
      ))}

      {obstacles.map((obs) => (
        <Obstacle 
          key={obs.index} 
          position={[0, 0, obs.z]} 
          colorOffset={obs.colorOffset}
          onRef={(el) => (obs.ref = el)}
        />
      ))}
    </>
  );
}

export default GameScene;
