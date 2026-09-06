"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";

const ORANGE = "#F97316";
const ORANGE_DEEP = "#EA580C";
const ORANGE_SOFT = "#FDBA74";
const CREAM = "#FFF8F0";

const LABELS = [
  { text: "READ", radius: 3.4, angle: 0.4, height: 0.6, speed: 0.18 },
  { text: "LISTEN", radius: 3.7, angle: 2.1, height: -0.4, speed: 0.14 },
  { text: "EXPLAIN", radius: 3.3, angle: 3.6, height: 0.9, speed: 0.2 },
  { text: "PRACTICE", radius: 3.9, angle: 5.0, height: -0.7, speed: 0.16 },
  { text: "FOCUS", radius: 3.5, angle: 1.3, height: -0.1, speed: 0.19 },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function LayeredDocument({ z, scale, rotation, opacity }: { z: number; scale: number; rotation: number; opacity: number }) {
  return (
    <group position={[0.3 * z, -0.15 * z, z]} rotation={[0, rotation, rotation * 0.3]} scale={scale}>
      <RoundedBox args={[2.1, 2.7, 0.06]} radius={0.09} smoothness={3}>
        <meshStandardMaterial color={CREAM} roughness={0.6} metalness={0} transparent opacity={opacity} />
      </RoundedBox>
    </group>
  );
}

function CentralDocument({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const glow = useRef(0.35);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = reduced ? 0.3 : Math.sin(t * 0.15) * 0.12;
    ref.current.position.y = reduced ? 0 : Math.sin(t * 0.4) * 0.08;
    glow.current += ((hovered ? 0.85 : 0.35) - glow.current) * 0.08;
  });

  return (
    <group ref={ref}>
      <LayeredDocument z={-1.1} scale={0.9} rotation={-0.18} opacity={0.35} />
      <LayeredDocument z={-0.55} scale={0.95} rotation={0.1} opacity={0.55} />

      <group onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <RoundedBox args={[2.1, 2.7, 0.1]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color={CREAM}
            emissive={ORANGE}
            emissiveIntensity={hovered ? 0.4 : 0.16}
            roughness={0.35}
            metalness={0.05}
          />
        </RoundedBox>

        {/* accent spine */}
        <mesh position={[-0.92, 0, 0.06]}>
          <boxGeometry args={[0.08, 2.7, 0.11]} />
          <meshStandardMaterial color={ORANGE} emissive={ORANGE_DEEP} emissiveIntensity={0.5} roughness={0.4} />
        </mesh>

        {[0.55, 0.25, -0.05, -0.35, -0.65].map((y, i) => (
          <mesh key={i} position={[0.12, y, 0.06]}>
            <planeGeometry args={[i === 0 ? 1.0 : 1.35 - (i % 2) * 0.3, 0.09]} />
            <meshBasicMaterial color={i === 0 ? ORANGE_DEEP : "#57534E"} transparent opacity={i === 0 ? 0.55 : 0.28} />
          </mesh>
        ))}

        <pointLight color={ORANGE_SOFT} intensity={hovered ? 14 : 8} distance={4} position={[0, 0, 1.2]} />
      </group>
    </group>
  );
}

function OrbitObject({
  radius,
  angleOffset,
  height,
  speed,
  reduced,
  kind,
  variant = 0,
}: {
  radius: number;
  angleOffset: number;
  height: number;
  speed: number;
  reduced: boolean;
  kind: "book" | "node" | "letter";
  variant?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = reduced ? angleOffset : state.clock.elapsedTime * speed + angleOffset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = height + Math.sin(state.clock.elapsedTime * 0.6 + angleOffset) * 0.15;
    ref.current.rotation.y = t * 0.6;
  });

  return (
    <group ref={ref}>
      {kind === "book" &&
        (variant % 2 === 0 ? (
          <mesh rotation={[0.1, 0.4, 0.05]}>
            <boxGeometry args={[0.42, 0.56, 0.08]} />
            <meshStandardMaterial color={ORANGE} emissive={ORANGE_DEEP} emissiveIntensity={0.3} roughness={0.4} />
          </mesh>
        ) : (
          <mesh rotation={[0.1, 0.4, 0.05]}>
            <boxGeometry args={[0.42, 0.56, 0.08]} />
            <meshStandardMaterial color={CREAM} emissive={ORANGE} emissiveIntensity={0.15} roughness={0.5} />
          </mesh>
        ))}
      {kind === "node" && (
        <>
          <mesh>
            <icosahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color={ORANGE_SOFT} emissive={ORANGE} emissiveIntensity={1.3} roughness={0.2} />
          </mesh>
          <pointLight color={ORANGE} intensity={3} distance={1.8} />
        </>
      )}
      {kind === "letter" && (
        <Text fontSize={0.32} color="#44403C" anchorX="center" anchorY="middle" material-transparent material-opacity={0.5}>
          {["Aa", "Bb", "Cc"][Math.round(angleOffset) % 3]}
        </Text>
      )}
    </group>
  );
}

function FloatingLabel({ text, radius, angle, height, speed, reduced, delay }: (typeof LABELS)[number] & { reduced: boolean; delay: number }) {
  const ref = useRef<THREE.Group>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = reduced ? angle : state.clock.elapsedTime * speed * 0.5 + angle;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = height + Math.sin(state.clock.elapsedTime * 0.5 + angle) * 0.2;
  });

  return (
    <group ref={ref}>
      <Html center distanceFactor={8} occlude={false} style={{ pointerEvents: "none" }}>
        <div
          className="rounded-full border border-orange-300/50 bg-white/85 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-orange-700 backdrop-blur-md transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            boxShadow: "0 4px 24px rgba(249,115,22,0.18)",
          }}
        >
          {text}
        </div>
      </Html>
    </group>
  );
}

function Particles({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={ORANGE_SOFT} size={0.022} transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

function PointerRig({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    function onMove(e: PointerEvent) {
      pointer.current.x = (e.clientX / size.width) * 2 - 1;
      pointer.current.y = (e.clientY / size.height) * 2 - 1;
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, size]);

  useFrame((state) => {
    if (!group.current) return;
    if (reduced) {
      group.current.rotation.y = 0;
      return;
    }
    group.current.rotation.y += 0.0012;
    const targetX = pointer.current.y * 0.15;
    const targetZ = -pointer.current.x * 0.15;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.03;
    group.current.rotation.z += (targetZ - group.current.rotation.z) * 0.03;
  });

  return <group ref={group}>{children}</group>;
}

function CameraRig({ reduced, scrollProgress }: { reduced: boolean; scrollProgress?: MutableRefObject<number> }) {
  const { camera, size } = useThree();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    function onMove(e: PointerEvent) {
      pointer.current.x = (e.clientX / size.width) * 2 - 1;
      pointer.current.y = (e.clientY / size.height) * 2 - 1;
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, size]);

  useFrame(() => {
    const p = scrollProgress?.current ?? 0;
    const px = reduced ? 0 : pointer.current.x;
    const py = reduced ? 0 : pointer.current.y;

    const targetX = px * 0.5;
    const targetY = 0.4 - py * 0.25 + p * 0.6;
    const targetZ = 7.5 - p * 1.6;

    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z += (targetZ - camera.position.z) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function HeroScene({
  onContextLost,
  scrollProgress,
}: {
  onContextLost?: () => void;
  scrollProgress?: MutableRefObject<number>;
}) {
  const reduced = useReducedMotion();
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsSmall(mq.matches);
    const onChange = () => setIsSmall(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const books = isSmall ? 2 : 4;
  const nodes = isSmall ? 3 : 5;

  return (
    <Canvas
      camera={{ position: [0, 0.4, 7.5], fov: 42 }}
      dpr={isSmall ? 1 : [1, 1.5]}
      gl={{ antialias: !isSmall, alpha: true, powerPreference: "low-power", failIfMajorPerformanceCaveat: false }}
      style={{ pointerEvents: "auto" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost?.();
          },
          { once: true },
        );
      }}
    >
      <ambientLight intensity={0.9} color="#FFFFFF" />
      <directionalLight position={[3, 4, 5]} intensity={0.85} color="#FFF7ED" />
      <directionalLight position={[-4, -1, -3]} intensity={0.35} color={ORANGE} />
      <fog attach="fog" args={["#FBF7F2", 9, 17]} />

      <CameraRig reduced={reduced} scrollProgress={scrollProgress} />

      <PointerRig reduced={reduced}>
        <CentralDocument reduced={reduced} />
        {Array.from({ length: books }).map((_, i) => (
          <OrbitObject
            key={`book-${i}`}
            kind="book"
            variant={i}
            radius={2.4 + (i % 2) * 0.3}
            angleOffset={(i / books) * Math.PI * 2}
            height={(i % 2 === 0 ? 1 : -1) * 0.5}
            speed={0.12 + i * 0.02}
            reduced={reduced}
          />
        ))}
        {Array.from({ length: nodes }).map((_, i) => (
          <OrbitObject
            key={`node-${i}`}
            kind="node"
            radius={1.7 + (i % 3) * 0.25}
            angleOffset={(i / nodes) * Math.PI * 2 + 0.7}
            height={(i % 2 === 0 ? -1 : 1) * 0.35}
            speed={0.22 + i * 0.015}
            reduced={reduced}
          />
        ))}
        {!isSmall &&
          [0, 1, 2].map((i) => (
            <OrbitObject
              key={`letter-${i}`}
              kind="letter"
              radius={3.0}
              angleOffset={(i / 3) * Math.PI * 2 + 1.6}
              height={0.2}
              speed={0.1}
              reduced={reduced}
            />
          ))}
        {!isSmall &&
          LABELS.map((label, i) => <FloatingLabel key={label.text} {...label} reduced={reduced} delay={600 + i * 220} />)}
      </PointerRig>

      <ContactShadows position={[0, -1.6, 0]} opacity={0.32} scale={9} blur={2.6} far={3} color="#7C2D12" />
      <Particles count={isSmall ? 120 : 320} />
    </Canvas>
  );
}
