import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Sparkles, Text, useTexture, Sky } from "@react-three/drei";
import {
  RigidBody,
  CuboidCollider,
  CylinderCollider,
} from "@react-three/rapier";
import * as T from "three";
import { islands, shards, interactions } from "./worldData";
import { useGame } from "./store";
const stone = "#aab8aa";
function Rock({
  p,
  s = [1, 1, 1],
  color = "#738d87",
}: {
  p: [number, number, number];
  s?: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={p} scale={s} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.94} />
    </mesh>
  );
}
function Island({ x, z, r, y }: (typeof islands)[number]) {
  const terrain = useTexture("/assets/terrain.jpg");
  const rock = useTexture("/assets/stone.jpg");
  return (
    <group position={[x, y, z]}>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.45, r * 0.98]} position={[0, -0.45, 0]} />
        <mesh receiveShadow position={[0, -0.46, 0]}>
          <cylinderGeometry args={[r, r * 0.94, 0.9, 40]} />
          <meshStandardMaterial map={terrain} color="#87b880" roughness={1} />
        </mesh>
      </RigidBody>
      <mesh position={[0, -3.1, 0]} castShadow>
        <cylinderGeometry args={[r * 0.97, r * 0.55, 5.3, 11]} />
        <meshStandardMaterial
          map={rock}
          color="#8c9b87"
          flatShading
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0, -7.8, 0]} rotation={[0, 0.2, Math.PI]}>
        <coneGeometry args={[r * 0.68, 7, 9]} />
        <meshStandardMaterial color="#536f74" flatShading />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <Rock
            key={i}
            p={[Math.sin(a) * r * 0.88, -1.2, Math.cos(a) * r * 0.88]}
            s={[r * 0.24, 2.3, r * 0.18]}
            color={i % 2 ? "#889e8c" : "#809384"}
          />
        );
      })}
    </group>
  );
}
function Tree({
  x,
  z,
  size = 1,
  autumn = false,
}: {
  x: number;
  z: number;
  size?: number;
  autumn?: boolean;
}) {
  return (
    <group position={[x, 0, z]} scale={size}>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[1.35, 0.26]} position={[0, 1.35, 0]} />
        <mesh position={[0, 1.45, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.38, 2.9, 7]} />
          <meshStandardMaterial color="#79674f" />
        </mesh>
      </RigidBody>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 3) * 0.7,
            3.1 + i * 0.75,
            Math.cos(i * 3) * 0.45,
          ]}
          scale={[1.6 - i * 0.22, 1.7 - i * 0.22, 1.5 - i * 0.2]}
          castShadow
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={
              autumn
                ? ["#e1bd67", "#dca867", "#f4d783"][i]
                : ["#43896c", "#61a379", "#87b985"][i]
            }
            flatShading
            roughness={0.92}
          />
        </mesh>
      ))}
    </group>
  );
}
function Bridge({
  a,
  b,
  magical = false,
}: {
  a: [number, number];
  b: [number, number];
  magical?: boolean;
}) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]),
    n = Math.ceil(length / 0.75);
  return (
    <group
      position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]}
      rotation={[0, Math.atan2(b[0] - a[0], b[1] - a[1]), 0]}
    >
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.65, 0.22, length / 2]} />
        {Array.from({ length: n }, (_, i) => (
          <mesh
            key={i}
            position={[0, -0.07, i * 0.75 - length / 2 + 0.3]}
            receiveShadow
          >
            <boxGeometry args={[3.2, 0.3, 0.66]} />
            <meshStandardMaterial
              color={magical ? "#acd9ce" : i % 2 ? "#ac9069" : "#ba9c77"}
              emissive={magical ? "#4cd0c8" : "#000"}
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </RigidBody>
      {[-1, 1].map((side) => (
        <group key={side}>
          {Array.from({ length: Math.ceil(length / 3) }, (_, i) => (
            <mesh
              key={i}
              position={[side * 1.55, 0.65, i * 3 - length / 2 + 0.5]}
            >
              <boxGeometry args={[0.13, 1.4, 0.13]} />
              <meshStandardMaterial color="#6d7560" />
            </mesh>
          ))}
          <mesh position={[side * 1.55, 1.17, 0]}>
            <boxGeometry args={[0.07, 0.07, length]} />
            <meshStandardMaterial color={magical ? "#8be2d8" : "#8c7859"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Vegetation() {
  const ref = useRef<T.InstancedMesh>(null!);
  const flower = useRef<T.InstancedMesh>(null!);
  const data = useMemo(() => {
    const a: { x: number; z: number; s: number; c: string }[] = [];
    let seed = 72;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 650; i++) {
      const island = islands[i % 5];
      const t = rnd() * 6.28,
        r = Math.sqrt(rnd()) * island.r * 0.92;
      const x = island.x + Math.cos(t) * r,
        z = island.z + Math.sin(t) * r;
      if (
        Math.abs(x) < 2.5 ||
        Math.hypot(x + 25, z + 11) < 6 ||
        Math.hypot(x - 23, z + 19) < 6
      )
        continue;
      a.push({
        x,
        z,
        s: 0.3 + rnd() * 0.55,
        c: ["#719957", "#96b868", "#b5cc7e", "#5c966d"][i % 4],
      });
    }
    return a;
  }, []);
  useFrame(() => {
    if (!ref.current.userData.done) {
      const m = new T.Object3D();
      data.forEach((v, i) => {
        m.position.set(v.x, v.s * 0.45, v.z);
        m.scale.set(v.s * 0.5, v.s, v.s * 0.5);
        m.rotation.y = i * 2.3;
        m.updateMatrix();
        ref.current.setMatrixAt(i, m.matrix);
        ref.current.setColorAt(i, new T.Color(v.c));
        if (i < 100) {
          m.position.y = 0.3;
          m.scale.setScalar(0.11);
          m.updateMatrix();
          flower.current.setMatrixAt(i, m.matrix);
          flower.current.setColorAt(
            i,
            new T.Color(i % 2 ? "#f6dfa3" : "#d2caf5"),
          );
        }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      flower.current.instanceMatrix.needsUpdate = true;
      ref.current.userData.done = true;
    }
  });
  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, data.length]}>
        <coneGeometry args={[0.7, 1.2, 3]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={flower} args={[undefined, undefined, 100]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial />
      </instancedMesh>
    </>
  );
}
function Clouds() {
  const ref = useRef<T.Group>(null!);
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.002;
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 28 }, (_, i) => {
        const a = i * 2.399;
        return (
          <group
            key={i}
            position={[
              Math.cos(a) * (40 + i * 3),
              -13 - (i % 4) * 4,
              Math.sin(a) * (40 + i * 3),
            ]}
          >
            {[0, 1, 2].map((j) => (
              <mesh
                key={j}
                position={[j * 6, Math.sin(j * 3) * 2, 0]}
                scale={[10, 3.3, 5]}
              >
                <sphereGeometry args={[1, 12, 8]} />
                <meshStandardMaterial
                  color="#edf4e7"
                  transparent
                  opacity={0.78}
                  roughness={1}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
function Waterfall() {
  const streams = useRef<T.Group>(null!);
  useFrame(({ clock }) => {
    streams.current.children.forEach((m, i) => {
      m.position.y = -((clock.elapsedTime * (3 + (i % 3)) + i * 2) % 17) + 0.7;
    });
  });
  return (
    <group position={[15, 0, 11]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0.02, -3]}>
        <circleGeometry args={[3.2, 32]} />
        <meshStandardMaterial
          color="#58c6c3"
          metalness={0.3}
          roughness={0.18}
        />
      </mesh>
      <mesh position={[0, -7.5, 0]}>
        <boxGeometry args={[3.1, 16, 0.18]} />
        <meshStandardMaterial
          color="#89e4da"
          transparent
          opacity={0.48}
          emissive="#53b5c8"
          emissiveIntensity={0.3}
          depthWrite={false}
        />
      </mesh>
      <group ref={streams}>
        {Array.from({ length: 24 }, (_, i) => (
          <mesh key={i} position={[(i % 8) * 0.4 - 1.4, -i, 0.12]}>
            <boxGeometry args={[0.05, 2.1, 0.05]} />
            <meshBasicMaterial color="#d3fff6" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
      <Sparkles
        count={35}
        scale={[5, 5, 3]}
        position={[0, -1, 0]}
        size={3}
        speed={0.8}
        color="#cdfff5"
      />
    </group>
  );
}
function Ruins() {
  return (
    <group position={[23, 0, -19]}>
      <mesh receiveShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[6, 6, 0.05, 40]} />
        <meshStandardMaterial color="#b6b8a0" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          {[-5, 5].map((z) => (
            <group key={z} position={[side * 5, 0, z]}>
              <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.9, 5.2, 0.9]} />
                  <meshStandardMaterial color={stone} />
                </mesh>
              </RigidBody>
              <mesh position={[0, 5.2, 0]}>
                <boxGeometry args={[1.3, 0.5, 1.3]} />
                <meshStandardMaterial color="#c5ccaf" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, 5.5, -5]} castShadow>
        <boxGeometry args={[11.7, 0.65, 1.3]} />
        <meshStandardMaterial color="#bac2ad" />
      </mesh>
      <Rock p={[3, 0.3, 3]} s={[1.3, 0.8, 1]} />
      <Rock p={[-5, 0.3, 1]} s={[0.8, 0.6, 0.8]} />
    </group>
  );
}
function Shrine() {
  const secret = useGame((s) => s.secret),
    wind = useGame((s) => s.wind),
    light = useGame((s) => s.light);
  return (
    <group position={[0, 0, -38]}>
      <mesh receiveShadow position={[0, 0.07, 0]}>
        <cylinderGeometry args={[4.4, 4.7, 0.14, 32]} />
        <meshStandardMaterial color="#bcc8b4" />
      </mesh>
      {[-1, 1].map((side) => (
        <RigidBody key={side} type="fixed" colliders="cuboid">
          <mesh position={[side * 2.5, 2.8, -1]} castShadow>
            <boxGeometry args={[0.7, 5.6, 1]} />
            <meshStandardMaterial color="#b0c3b5" />
          </mesh>
        </RigidBody>
      ))}
      <mesh position={[0, 5.5, -1]} castShadow>
        <boxGeometry args={[5.9, 0.65, 1.1]} />
        <meshStandardMaterial color="#c9d6b9" />
      </mesh>
      <Float speed={2} floatIntensity={0.5}>
        <mesh position={[0, 2.7, 0]}>
          <octahedronGeometry args={[1.15]} />
          <meshStandardMaterial
            color={secret ? "#ffe5a0" : "#b5f3de"}
            emissive={secret ? "#e9bc6b" : "#5cd8c1"}
            emissiveIntensity={wind && light ? 1.5 : 0.35}
            metalness={0.3}
            roughness={0.15}
          />
        </mesh>
      </Float>
      <Sparkles
        count={secret ? 100 : 30}
        scale={[5, 7, 5]}
        size={3}
        speed={0.4}
        color="#d9ffe9"
      />
      {secret && (
        <mesh position={[0, 20, 0]}>
          <cylinderGeometry args={[0.2, 1.3, 40, 24, 1, true]} />
          <meshBasicMaterial
            color="#ffe6a5"
            transparent
            opacity={0.22}
            side={T.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
function Symbols() {
  const lenses = useGame((s) => s.lenses),
    wind = useGame((s) => s.wind),
    sequence = useGame((s) => s.sequence),
    light = useGame((s) => s.light);
  return (
    <>
      {interactions
        .filter(
          (i) => i.kind === "note" || i.kind === "lens" || i.kind === "clue",
        )
        .map((i) => (
          <group key={i.id} position={[i.x, 0, i.z]}>
            <RigidBody type="fixed" colliders="cuboid">
              <mesh
                position={[0, i.kind === "clue" ? 0.4 : 0.7, 0]}
                castShadow
                rotation={[0, 0, i.kind === "clue" ? -0.1 : 0]}
              >
                <boxGeometry
                  args={[
                    i.kind === "clue" ? 1.3 : 1.05,
                    i.kind === "clue" ? 0.8 : 1.4,
                    0.65,
                  ]}
                />
                <meshStandardMaterial color={stone} roughness={0.8} />
              </mesh>
            </RigidBody>
            {i.kind === "note" ? (
              <>
                <Text
                  font="/assets/world-font.ttf"
                  position={[0, 1, 0.345]}
                  fontSize={0.55}
                  color={
                    wind || sequence.includes(i.index!) ? "#e6da8f" : "#214c50"
                  }
                >
                  {["☀", "☾", "✦"][i.index!]}
                </Text>
                <Sparkles
                  count={wind ? 15 : 3}
                  size={2}
                  scale={2}
                  color="#c6edd7"
                />
              </>
            ) : i.kind === "lens" ? (
              <group position={[0, 1.6, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.65, 0.065, 8, 32]} />
                  <meshStandardMaterial
                    color="#d6b873"
                    metalness={0.6}
                    roughness={0.35}
                  />
                </mesh>
                <mesh rotation={[0, (lenses[i.index!] * Math.PI) / 2, 0]}>
                  <boxGeometry args={[0.1, 0.1, 1.2]} />
                  <meshStandardMaterial
                    color="#a5f7e8"
                    emissive="#a5f7e8"
                    emissiveIntensity={light ? 2 : 0.3}
                  />
                </mesh>
                <Text
                  font="/assets/world-font.ttf"
                  position={[0, 0.3, 0.2]}
                  fontSize={0.35}
                  color="#214c50"
                  rotation={[-0.5, 0, 0]}
                >
                  {["N ↑", "E →", "S ↓", "W ←"][lenses[i.index!]]}
                </Text>
              </group>
            ) : (
              <Text
                font="/assets/world-font.ttf"
                position={[0, 0.48, 0.345]}
                fontSize={0.3}
                color="#254d50"
              >
                ≋
              </Text>
            )}
          </group>
        ))}
    </>
  );
}
function Collectibles() {
  const collected = useGame((s) => s.shards),
    wind = useGame((s) => s.wind);
  return (
    <>
      {shards.map((p, i) =>
        collected.includes(i) || (i >= 13 && !wind) ? null : (
          <Float
            key={i}
            position={p}
            speed={2.5}
            rotationIntensity={0.4}
            floatIntensity={0.4}
          >
            <mesh castShadow>
              <octahedronGeometry args={[0.32]} />
              <meshStandardMaterial
                color="#b3fff0"
                emissive="#58d8c9"
                emissiveIntensity={0.8}
                metalness={0.35}
                roughness={0.14}
              />
            </mesh>
            <Sparkles
              count={5}
              scale={1.5}
              size={2}
              speed={0.5}
              color="#e3fff1"
            />
          </Float>
        ),
      )}
    </>
  );
}
function Camp() {
  const flame = useRef<T.Mesh>(null!);
  useFrame(({ clock }) => {
    flame.current.scale.y = 1 + Math.sin(clock.elapsedTime * 8) * 0.15;
  });
  return (
    <group position={[-3, 0, 9]}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0, 0.12, 0]}
          rotation={[0, (i * Math.PI) / 3, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.12, 0.12, 1.1, 6]} />
          <meshStandardMaterial color="#735c43" />
        </mesh>
      ))}
      <mesh ref={flame} position={[0, 0.5, 0]}>
        <coneGeometry args={[0.3, 0.85, 7]} />
        <meshBasicMaterial color="#ffc56b" />
      </mesh>
      <pointLight color="#ffc56b" intensity={2} distance={6} />
      <Sparkles
        count={9}
        scale={[1, 2, 1]}
        position={[0, 1, 0]}
        speed={1}
        size={2}
        color="#ffd391"
      />
    </group>
  );
}
export function World() {
  const wind = useGame((s) => s.wind);
  const trees = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const forest = i < 25;
        const a = i * 2.399,
          r = forest ? 6 + (i % 4) : 11 + (i % 5);
        return {
          x: (forest ? -25 : 0) + Math.cos(a) * r,
          z: (forest ? -10 : 4) + Math.sin(a) * r,
          size: 0.75 + (i % 4) * 0.16,
        };
      }).filter((t) => Math.hypot(t.x - 12, t.z - 12) > 5 && Math.abs(t.x) > 2),
    [],
  );
  return (
    <>
      <color attach="background" args={["#badedb"]} />
      <fog attach="fog" args={["#badedb", 65, 170]} />
      <Sky
        distance={400000}
        sunPosition={[-30, 60, 30]}
        turbidity={5}
        rayleigh={0.8}
        mieCoefficient={0.008}
        mieDirectionalG={0.8}
      />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#e6fff7", "#66837b", 1.5]} />
      <directionalLight
        position={[-30, 60, 30]}
        intensity={2.8}
        color="#fff0cc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-normalBias={0.06}
      />
      {islands.map((a, i) => (
        <Island key={i} {...a} />
      ))}
      <Bridge a={[-13, -2]} b={[-18, -6]} />
      <Bridge a={[13, -4]} b={[17, -10]} />
      <Bridge a={[0, -13]} b={[0, -28]} />
      {wind && <Bridge a={[33, -20]} b={[40, -22]} magical />}
      {trees.map((t, i) => (
        <Tree key={i} {...t} autumn={i % 9 === 0} />
      ))}
      <Tree x={44} z={-25} size={1.1} autumn />
      <Vegetation />
      <Clouds />
      <Waterfall />
      <Ruins />
      <Shrine />
      <Symbols />
      <Collectibles />
      <Camp />
      {/* Walk-through cave behind the waterfall, with a real opening. */}
      <group position={[12, 0, 12]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[-2, 1.5, 0]} castShadow>
            <boxGeometry args={[1.4, 3, 4]} />
            <meshStandardMaterial color="#6d8580" />
          </mesh>
          <mesh position={[2, 1.5, 0]} castShadow>
            <boxGeometry args={[1.4, 3, 4]} />
            <meshStandardMaterial color="#6d8580" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow>
            <boxGeometry args={[5.4, 1.2, 4.2]} />
            <meshStandardMaterial color="#738e82" />
          </mesh>
        </RigidBody>
        <pointLight
          position={[0, 1.4, 0]}
          color="#82dfdc"
          intensity={4}
          distance={7}
        />
        <Sparkles count={24} scale={[3, 2, 3]} color="#9befff" size={3} />
      </group>
      <Sparkles
        count={70}
        scale={[65, 8, 60]}
        position={[0, 3, -13]}
        size={2}
        speed={0.15}
        color="#fff7bd"
      />
      {Array.from({ length: 7 }, (_, i) => (
        <group
          key={i}
          position={[Math.sin(i * 2) * 90, -15 - i * 2, -90 - i * 8]}
          scale={0.5 + i * 0.12}
        >
          <mesh>
            <coneGeometry args={[12, 18, 6]} />
            <meshStandardMaterial color="#8fb6b4" />
          </mesh>
        </group>
      ))}
    </>
  );
}
