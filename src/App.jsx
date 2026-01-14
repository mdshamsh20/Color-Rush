import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import GameScene from './components/GameScene';
import HUD from './components/HUD';
import useStore from './store';

function App() {
  const status = useStore((state) => state.status);

  return (
    <>
      <HUD />
      <div id="canvas-container">
        <Canvas
          shadows
          camera={{ position: [0, 2, 8], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 30, 90]} />
          
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 10, 5]} intensity={1} />
          
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
            <GameScene />
            
            <EffectComposer>
              <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
            </EffectComposer>
          </Suspense>

          {/* <OrbitControls /> Remove for production gameplay, useful for debug */}
        </Canvas>
      </div>
    </>
  );
}

export default App;
