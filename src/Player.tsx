import { useEffect, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, useTexture } from "@react-three/drei";
import {
  RigidBody,
  CapsuleCollider,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as T from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { input, position, useGame } from "./store";
import { interactions, shards, islands } from "./worldData";
import { tone } from "./audio";
const temp = new T.Vector3(),
  target = new T.Vector3(),
  desired = new T.Vector3();
export function Player() {
  const body = useRef<RapierRigidBody>(null!);
  const visual = useRef<T.Group>(null!);
  const asset = useGLTF("/assets/explorer.glb");
  const fabric = useTexture("/assets/fabric.jpg");
  const model = useMemo(() => {
    const c = clone(asset.scene);
    c.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = true;
        o.material = o.material.clone();
        o.material.map = fabric;
      }
    });
    return c;
  }, [asset.scene, fabric]);
  const { actions } = useAnimations(asset.animations, visual);
  const { camera, gl } = useThree();
  const { world, rapier } = useRapier();
  const keys = useRef(new Set<string>());
  const cameraState = useRef({ yaw: 0, pitch: 0.34, distance: 8 });
  const state = useRef({
    ground: 0,
    jump: 0,
    animation: "",
    land: 0,
    wasGround: false,
    near: "",
    elapsed: 0,
    saveAt: 0,
    drag: false,
    px: 0,
    py: 0,
    interactAt: 0,
  });
  const teleport = useGame((s) => s.teleport);
  const mode = useGame((s) => s.mode);
  useEffect(() => {
    body.current?.setTranslation(
      {
        x: useGame.getState().checkpoint[0],
        y: useGame.getState().checkpoint[1],
        z: useGame.getState().checkpoint[2],
      },
      true,
    );
    body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
  }, [teleport]);
  useEffect(() => {
    useGame.getState().setReady();
    const down = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      if (e.code === "Escape") {
        const s = useGame.getState();
        if (s.mode === "playing") {
          s.setMode("paused");
          document.exitPointerLock?.();
        } else if (s.mode === "paused") s.setMode("playing");
        return;
      }
      if (useGame.getState().mode !== "playing") return;
      keys.current.add(e.code);
      if (!e.repeat && e.code === "Space") input.jump = true;
      if (!e.repeat && e.code === "KeyE") input.interact = true;
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => {
      keys.current.clear();
      input.x = 0;
      input.y = 0;
      input.sprint = false;
      input.jump = false;
      input.interact = false;
      state.current.drag = false;
    };
    const visibility = () => {
      clear();
      if (document.hidden && useGame.getState().mode === "playing")
        useGame.getState().setMode("paused");
    };
    const move = (e: MouseEvent) => {
      if (useGame.getState().mode !== "playing") return;
      if (document.pointerLockElement === gl.domElement || state.current.drag) {
        cameraState.current.yaw -=
          (document.pointerLockElement
            ? e.movementX
            : e.clientX - state.current.px) * 0.003;
        cameraState.current.pitch = T.MathUtils.clamp(
          cameraState.current.pitch +
            (document.pointerLockElement
              ? e.movementY
              : e.clientY - state.current.py) *
              0.003,
          0.05,
          1.05,
        );
      }
      state.current.px = e.clientX;
      state.current.py = e.clientY;
    };
    const pointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || useGame.getState().mode !== "playing")
        return;
      state.current.drag = true;
      state.current.px = e.clientX;
      state.current.py = e.clientY;
    };
    const pointerUp = () => {
      state.current.drag = false;
    };
    const dbl = () => {
      if (useGame.getState().mode === "playing")
        gl.domElement.requestPointerLock?.();
    };
    const wheel = (e: WheelEvent) => {
      cameraState.current.distance = T.MathUtils.clamp(
        cameraState.current.distance + e.deltaY * 0.006,
        4,
        12,
      );
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("mousemove", move);
    window.addEventListener("pointerup", pointerUp);
    gl.domElement.addEventListener("pointerdown", pointerDown);
    gl.domElement.addEventListener("dblclick", dbl);
    gl.domElement.addEventListener("wheel", wheel);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("pointerup", pointerUp);
      gl.domElement.removeEventListener("pointerdown", pointerDown);
      gl.domElement.removeEventListener("dblclick", dbl);
      gl.domElement.removeEventListener("wheel", wheel);
    };
  }, [gl]);
  useEffect(() => {
    if (mode !== "playing") {
      keys.current.clear();
      input.x = 0;
      input.y = 0;
      input.sprint = false;
      input.jump = false;
      input.interact = false;
      body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [mode]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05),
      s = useGame.getState(),
      st = state.current,
      cam = cameraState.current;
    if (!body.current) return;
    const p = body.current.translation();
    position.x = p.x;
    position.y = p.y;
    position.z = p.z;
    position.yaw = cam.yaw;
    if (s.mode === "title") {
      const time = performance.now() * 0.00004;
      desired.set(
        52 * Math.sin(time + 0.65),
        34,
        35 + 40 * Math.cos(time + 0.65),
      );
      camera.position.lerp(desired, 1 - Math.exp(-dt * 2));
      camera.lookAt(0, 0, -14);
      return;
    }
    cam.yaw -= input.lookX * 0.004;
    cam.pitch = T.MathUtils.clamp(cam.pitch + input.lookY * 0.004, 0.05, 1.05);
    input.lookX = input.lookY = 0;
    if (s.mode === "playing") {
      st.elapsed += dt;
      const vel = body.current.linvel();
      const hit = world.castRay(
        new rapier.Ray({ x: p.x, y: p.y - 0.1, z: p.z }, { x: 0, y: -1, z: 0 }),
        0.87,
        true,
        undefined,
        undefined,
        undefined,
        body.current,
      );
      const grounded = !!hit && vel.y <= 0.6;
      if (grounded) st.ground = 0.13;
      else st.ground -= dt;
      if (input.jump) {
        st.jump = 0.15;
        input.jump = false;
      } else st.jump -= dt;
      let mx =
        (keys.current.has("KeyD") || keys.current.has("ArrowRight") ? 1 : 0) -
        (keys.current.has("KeyA") || keys.current.has("ArrowLeft") ? 1 : 0) +
        input.x;
      let mz =
        (keys.current.has("KeyS") || keys.current.has("ArrowDown") ? 1 : 0) -
        (keys.current.has("KeyW") || keys.current.has("ArrowUp") ? 1 : 0) +
        input.y;
      const len = Math.hypot(mx, mz);
      if (len > 1) {
        mx /= len;
        mz /= len;
      }
      const moving = len > 0.08;
      const sprint =
        keys.current.has("ShiftLeft") ||
        keys.current.has("ShiftRight") ||
        input.sprint;
      const speed = sprint ? 7 : 4.2;
      const dx = (mx * Math.cos(cam.yaw) + mz * Math.sin(cam.yaw)) * speed,
        dz = (-mx * Math.sin(cam.yaw) + mz * Math.cos(cam.yaw)) * speed;
      const damping = 1 - Math.exp(-dt * (grounded ? 13 : 5));
      let vy = vel.y;
      if (st.jump > 0 && st.ground > 0) {
        vy = 7.2;
        st.jump = 0;
        st.ground = 0;
        tone(260, 0.14);
      }
      body.current.setLinvel(
        {
          x: T.MathUtils.lerp(vel.x, dx, damping),
          y: vy,
          z: T.MathUtils.lerp(vel.z, dz, damping),
        },
        true,
      );
      if (moving) {
        const angle = Math.atan2(dx, dz);
        visual.current.rotation.y +=
          Math.atan2(
            Math.sin(angle - visual.current.rotation.y),
            Math.cos(angle - visual.current.rotation.y),
          ) *
          (1 - Math.exp(-dt * 13));
      }
      if (grounded && !st.wasGround) st.land = 0.18;
      st.land -= dt;
      st.wasGround = grounded;
      let animation = !grounded
        ? vy > 0
          ? "Jump"
          : "Fall"
        : moving
          ? sprint
            ? "Run"
            : "Walk"
          : st.land > 0
            ? "Land"
            : st.interactAt > st.elapsed
              ? "Interact"
              : "Idle";
      if (animation !== st.animation) {
        actions[st.animation]?.fadeOut(0.16);
        actions[animation]?.reset().fadeIn(0.16).play();
        st.animation = animation;
      }
      if (p.y < -15) {
        const cp = s.checkpoint;
        body.current.setTranslation({ x: cp[0], y: cp[1], z: cp[2] }, true);
        body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        s.notify("The wind carries you back to your last resting place.");
      }
      shards.forEach((v, i) => {
        if (
          !s.shards.includes(i) &&
          (i < 13 || s.wind) &&
          Math.hypot(p.x - v[0], p.y - v[1], p.z - v[2]) < 1.1
        ) {
          s.collect(i);
          tone(700 + i * 25, 0.65);
          st.interactAt = st.elapsed + 0.4;
        }
      });
      if (Math.hypot(p.x - 12, p.z - 12) < 1.65) s.discover("cave");
      if (p.x > 40 && p.z < -15 && s.wind) s.discover("garden");
      const near = interactions
        .filter(
          (i) =>
            Math.hypot(p.x - i.x, p.z - i.z) < 2.35 && Math.abs(p.y - 0.9) < 2,
        )
        .sort(
          (a, b) =>
            Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(p.x - b.x, p.z - b.z),
        )[0];
      const prompt = near?.label || "";
      if (prompt !== s.prompt) useGame.setState({ prompt });
      if (input.interact) {
        input.interact = false;
        if (near) {
          st.interactAt = st.elapsed + 0.65;
          tone(near.kind === "note" ? [523, 392, 659][near.index!] : 440, 0.6);
          if (near.kind === "clue") s.notify(near.text!);
          if (near.kind === "note") s.note(near.index!);
          if (near.kind === "lens") s.lens(near.index!);
          if (near.kind === "heart") s.heart();
          if (near.kind === "checkpoint") {
            s.setting({ checkpoint: [-3, 2, 10.8] });
            s.notify("Journey saved · the campfire is your resting place.");
          }
        }
      }
      const zone =
        p.x > 39
          ? "The Lost Garden"
          : Math.hypot(p.x - 12, p.z - 12) < 3
            ? "Whispering Grotto"
            : islands.find((i) => Math.hypot(p.x - i.x, p.z - i.z) < i.r)
                ?.name || "Between the Clouds";
      if (zone !== s.zone) {
        useGame.setState({ zone });
        if (
          grounded &&
          zone !== "Between the Clouds" &&
          st.elapsed - st.saveAt > 5
        ) {
          st.saveAt = st.elapsed;
          s.setting({ checkpoint: [p.x, 2, p.z] });
        }
      }
    }
    target.set(p.x, p.y + 0.75, p.z);
    desired.set(
      p.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.distance,
      p.y + 0.75 + Math.sin(cam.pitch) * cam.distance,
      p.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.distance,
    );
    temp.copy(desired).sub(target);
    const length = temp.length();
    temp.normalize();
    const cameraHit = world.castRay(
      new rapier.Ray(
        { x: target.x, y: target.y, z: target.z },
        { x: temp.x, y: temp.y, z: temp.z },
      ),
      length,
      true,
      undefined,
      undefined,
      undefined,
      body.current,
    );
    if (cameraHit)
      desired
        .copy(target)
        .addScaledVector(temp, Math.max(1, cameraHit.timeOfImpact - 0.35));
    camera.position.lerp(desired, 1 - Math.exp(-dt * 7));
    camera.lookAt(target);
  });
  return (
    <RigidBody
      ref={body}
      position={useGame.getState().checkpoint}
      colliders={false}
      enabledRotations={[false, false, false]}
      lockRotations
      friction={0}
      linearDamping={0.2}
      ccd
      gravityScale={1.6}
    >
      <CapsuleCollider args={[0.45, 0.32]} />
      <group ref={visual} position={[0, -0.78, 0]} rotation={[0, Math.PI, 0]}>
        <primitive object={model} />
      </group>
    </RigidBody>
  );
}
useGLTF.preload("/assets/explorer.glb");
