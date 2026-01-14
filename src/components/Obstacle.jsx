import React, { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../constants';

// Shared Constants
const INNER_RADIUS = 2.5;
const THICKNESS = 0.3;
const GAP = 0.2;
const LENGTH = (Math.PI / 2) - GAP * 2;

// Shared Geometry
// 8 radial segments, 16 tubular segments (low poly style is fine for neon)
const sharedArcGeometry = new THREE.TorusGeometry(INNER_RADIUS, THICKNESS, 8, 16, LENGTH);

const NeonArc = ({ color, startAngle }) => {
  return (
    <group rotation={[0, 0, startAngle]}>
        <mesh geometry={sharedArcGeometry}>
            <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={3} 
                toneMapped={false}
            />
        </mesh>
    </group>
  );
};

const Obstacle = ({ position, colorOffset = 0, onRef }) => {
  return (
    <group ref={onRef} position={position}>
       {/* 0: Top - Center PI/2. Start = PI/2 - length/2 */}
       <NeonArc 
         color={COLORS[(0 + colorOffset) % COLORS.length].hex} 
         startAngle={(Math.PI / 2) - (LENGTH / 2)} 
       />
       
       {/* 1: Right - Center 0. Start = -length/2 */}
       <NeonArc 
         color={COLORS[(1 + colorOffset) % COLORS.length].hex} 
         startAngle={0 - (LENGTH / 2)} 
       />

       {/* 2: Bottom - Center 3PI/2. Start = 3PI/2 - length/2 */}
       <NeonArc 
         color={COLORS[(2 + colorOffset) % COLORS.length].hex} 
         startAngle={(3 * Math.PI / 2) - (LENGTH / 2)} 
       />

       {/* 3: Left - Center PI. Start = PI - length/2 */}
       <NeonArc 
         color={COLORS[(3 + colorOffset) % COLORS.length].hex} 
         startAngle={Math.PI - (LENGTH / 2)} 
       />
    </group>
  );
};

export default Obstacle;
