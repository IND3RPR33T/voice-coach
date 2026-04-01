import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const ParticleSwarm = ({ speed = 0.2, volume = 0 }) => {
  const meshRef = useRef();
  const count = 12000; 
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) pos.push(new THREE.Vector3((Math.random()-0.5)*50, (Math.random()-0.5)*50, (Math.random()-0.5)*50));
     return pos;
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ 
      color: 0x6c63ff, 
      transparent: true,
      opacity: 0.8
  }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.12), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * (speed + volume * 2);

    for (let i = 0; i < count; i++) {
        // Radius shifts based on volume (talking)
        const baseR = 25 + volume * 15;
        const r = baseR + Math.sin(time + i * 0.01) * 3;
        
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        target.set(r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(phi));
        
        // Color shifts from primary to cyan when talking
        const hue = (time * 0.05 + i / count) % 1;
        const sat = 0.6 + volume * 0.4;
        const lum = 0.5 + volume * 0.2;
        pColor.setHSL(hue, sat, lum);

        positions[i].lerp(target, 0.06);
        dummy.position.copy(positions[i]);
        dummy.scale.setScalar(1 + volume * 1.5); // Grow particles when talking
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export default function VoiceSphere({ isActive = false, volume = 0 }) {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      zIndex: 0, 
      pointerEvents: 'none',
      opacity: 0.6 // Slightly lower opacity so chat is readable
    }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }} alpha={true}>
        <fog attach="fog" args={['#0a0d14', 50, 250]} />
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ParticleSwarm speed={isActive ? 0.8 : 0.15} volume={volume} />
        <OrbitControls enableZoom={false} autoRotate={true} autoRotateSpeed={isActive ? 3 : volume > 0 ? 6 : 0.5} />
      </Canvas>
    </div>
  );
}