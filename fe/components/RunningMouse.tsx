
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function MouseCharacter() {
  const mouse = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (mouse.current) {
      // Gentle running bounce
      mouse.current.position.y = -0.52 + Math.abs(Math.sin(t * 12)) * 0.08;
      mouse.current.rotation.z = Math.sin(t * 12) * 0.025;
    }

    if (leftLeg.current) {
      leftLeg.current.rotation.z = Math.sin(t * 12) * 0.65;
    }

    if (rightLeg.current) {
      rightLeg.current.rotation.z =
        Math.sin(t * 12 + Math.PI) * 0.65;
    }

    if (tail.current) {
      tail.current.rotation.z = Math.sin(t * 5) * 0.12;
    }
  });

  const grey = "#A5ADB5";
  const dark = "#3A414A";
  const pink = "#F3AFC5";

  return (
    <group ref={mouse} scale={0.88} position={[0, -0.52, 0]}>
      {/* Curved tail */}
      <mesh ref={tail} position={[-0.78, 0.3, 0]}>
        <tubeGeometry
          args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0.35, 0, 0),
              new THREE.Vector3(0, -0.12, 0),
              new THREE.Vector3(-0.28, 0.08, 0),
              new THREE.Vector3(-0.5, 0.28, 0),
              new THREE.Vector3(-0.72, 0.18, 0),
            ]),
            32,
            0.025,
            8,
            false,
          ]}
        />
        <meshStandardMaterial color={pink} roughness={0.65} />
      </mesh>

      {/* Body */}
      <mesh position={[-0.12, 0.45, 0]} scale={[0.78, 0.48, 0.43]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={grey} roughness={0.72} />
      </mesh>

      {/* Belly */}
      <mesh position={[0.02, 0.27, 0.31]} scale={[0.42, 0.22, 0.12]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#E5D6DB" roughness={0.85} />
      </mesh>

      {/* Head */}
      <group position={[0.52, 0.78, 0]}>
        <mesh scale={[0.52, 0.48, 0.43]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#ADB6BC" roughness={0.65} />
        </mesh>

        {/* Back ear */}
        <group position={[-0.18, 0.39, -0.13]}>
          <mesh scale={[0.24, 0.29, 0.13]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={dark} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0, -0.07]} scale={[0.18, 0.22, 0.08]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={pink} roughness={0.7} />
          </mesh>
        </group>

        {/* Front ear */}
        <group position={[-0.18, 0.39, 0.18]}>
          <mesh scale={[0.24, 0.29, 0.13]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={dark} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0, 0.085]} scale={[0.18, 0.22, 0.08]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={pink} roughness={0.7} />
          </mesh>
        </group>

        {/* Snout */}
        <mesh position={[0.4, -0.12, 0.06]} scale={[0.32, 0.19, 0.24]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#C5CBD0" roughness={0.65} />
        </mesh>

        {/* Nose */}
        <mesh position={[0.68, -0.09, 0.07]} scale={[0.075, 0.055, 0.075]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            color="#30232F"
            roughness={0.25}
            metalness={0.05}
          />
        </mesh>

        {/* Eye */}
        <mesh position={[0.18, 0.04, 0.36]} scale={[0.09, 0.105, 0.055]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#171823" roughness={0.12} />
        </mesh>

        {/* Eye sparkle */}
        <mesh position={[0.2, 0.08, 0.408]} scale={0.025}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>

        {/* Blush */}
        <mesh position={[0.35, -0.21, 0.29]} scale={[0.09, 0.045, 0.025]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshBasicMaterial
            color="#F4A1BD"
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Whiskers */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[0.48, -0.12 - i * 0.045, 0.25]}
            rotation={[0, 0, -0.12 + i * 0.12]}
          >
            <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
            <meshStandardMaterial color="#6C747A" />
          </mesh>
        ))}
      </group>

      {/* Left running leg */}
      <group ref={leftLeg} position={[0.3, 0.2, 0.25]}>
        <mesh position={[0.05, -0.08, 0]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          <meshStandardMaterial color={grey} />
        </mesh>

        <mesh
          position={[0.13, -0.2, 0.04]}
          scale={[0.16, 0.055, 0.09]}
        >
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial color="#F0A5BD" />
        </mesh>
      </group>

      {/* Right running leg */}
      <group ref={rightLeg} position={[-0.28, 0.2, 0.24]}>
        <mesh position={[-0.04, -0.08, 0]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          <meshStandardMaterial color={grey} />
        </mesh>

        <mesh
          position={[-0.12, -0.2, 0.04]}
          scale={[0.16, 0.055, 0.09]}
        >
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial color="#F0A5BD" />
        </mesh>
      </group>
    </group>
  );
}

function MouseScene() {
  return (
    <>
      <ambientLight intensity={1.8} />

      <directionalLight position={[3, 5, 5]} intensity={2.5} />

      <pointLight
        position={[0, 2, 2]}
        color="#E9B7FF"
        intensity={8}
        distance={6}
      />

      <MouseCharacter />
    </>
  );
}

export default function RunningMouse3D() {
  return (
    <div className="relative h-44 w-full overflow-hidden sm:h-52">
      {/* Stationary ground line */}
      <div className="pointer-events-none absolute bottom-21 left-0 z-10 h-px w-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

      {/* Moving mouse */}
      <div className="mouse3d-runner absolute bottom-7 left-0 z-20 h-36 w-56 sm:h-44 sm:w-64">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
        >
          <Suspense fallback={null}>
            <MouseScene />
          </Suspense>
        </Canvas>
      </div>

      <style jsx>{`
        .mouse3d-runner {
          animation: mouse3d-travel 18s linear infinite;
          will-change: transform;
        }

        @keyframes mouse3d-travel {
          from {
            transform: translateX(-280px);
          }

          to {
            transform: translateX(calc(100vw + 280px));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mouse3d-runner {
            animation-play-state: paused;
          }
        }
      `}</style>
    </div>
  );
}

