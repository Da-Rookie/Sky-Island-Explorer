import * as T from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import fs from "node:fs";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = b;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result =
        "data:application/octet-stream;base64," +
        Buffer.from(b).toString("base64");
      this.onloadend?.();
    });
  }
};
const root = new T.Group();
root.name = "Explorer";
const bones = [];
function bone(name, p, parent) {
  const b = new T.Bone();
  b.name = name;
  b.position.set(...p);
  (parent || root).add(b);
  bones.push(b);
  return b;
}
const hips = bone("Hips", [0, 0.8, 0]);
const torso = bone("Torso", [0, 0.27, 0], hips);
const head = bone("Head", [0, 0.4, 0], torso);
const la = bone("LeftArm", [-0.3, 0.28, 0], torso),
  ra = bone("RightArm", [0.3, 0.28, 0], torso);
const ll = bone("LeftLeg", [-0.14, -0.04, 0], hips),
  rl = bone("RightLeg", [0.14, -0.04, 0], hips);
root.updateMatrixWorld(true);
const parts = [];
const mats = [
  "#ddab80",
  "#387e7b",
  "#d8b579",
  "#3b464b",
  "#af6548",
  "#e9c785",
  "#604835",
].map((c) => new T.MeshStandardMaterial({ color: c, roughness: 0.85 }));
function part(geo, b, offset, material) {
  geo.translate(...offset);
  geo.applyMatrix4(b.matrixWorld);
  const count = geo.attributes.position.count,
    skin = [],
    weight = [];
  for (let i = 0; i < count; i++) {
    skin.push(bones.indexOf(b), 0, 0, 0);
    weight.push(1, 0, 0, 0);
  }
  geo.setAttribute("skinIndex", new T.Uint16BufferAttribute(skin, 4));
  geo.setAttribute("skinWeight", new T.Float32BufferAttribute(weight, 4));
  const mesh = new T.SkinnedMesh(geo, mats[material]);
  root.add(mesh);
  parts.push(mesh);
}
part(new T.BoxGeometry(0.48, 0.53, 0.3), torso, [0, 0, 0], 1);
part(new T.BoxGeometry(0.42, 0.42, 0.2), torso, [0, 0, -0.25], 4);
part(new T.BoxGeometry(0.46, 0.09, 0.25), torso, [0, 0.24, -0.23], 5);
part(new T.SphereGeometry(0.24, 12, 8), head, [0, 0.03, 0], 0);
part(
  new T.SphereGeometry(0.245, 12, 8, 0, Math.PI * 2, 0, 1.5),
  head,
  [0, 0.09, -0.03],
  6,
);
part(new T.CylinderGeometry(0.22, 0.27, 0.17, 12), head, [0, 0.24, 0], 2);
part(new T.CylinderGeometry(0.38, 0.38, 0.04, 12), head, [0, 0.17, 0], 2);
part(new T.BoxGeometry(0.53, 0.11, 0.34), torso, [0, 0.25, 0], 5);
part(new T.BoxGeometry(0.12, 0.4, 0.035), torso, [-0.12, 0.02, 0.18], 5);
for (const [b, side] of [
  [la, -1],
  [ra, 1],
]) {
  part(new T.BoxGeometry(0.18, 0.32, 0.22), b, [side * 0.01, -0.13, 0], 1);
  part(new T.BoxGeometry(0.13, 0.24, 0.16), b, [side * 0.01, -0.39, 0], 0);
  part(new T.BoxGeometry(0.16, 0.12, 0.19), b, [side * 0.01, -0.49, 0], 3);
}
for (const b of [ll, rl]) {
  part(new T.BoxGeometry(0.2, 0.3, 0.25), b, [0, -0.13, 0], 2);
  part(new T.BoxGeometry(0.14, 0.23, 0.15), b, [0, -0.36, 0], 0);
  part(new T.BoxGeometry(0.21, 0.24, 0.31), b, [0, -0.57, 0.055], 3);
}
part(new T.BoxGeometry(0.05, 0.035, 0.03), head, [-0.08, 0.035, 0.222], 3);
part(new T.BoxGeometry(0.05, 0.035, 0.03), head, [0.08, 0.035, 0.222], 3);
root.updateMatrixWorld(true);
const skeleton = new T.Skeleton(bones);
parts.forEach((m) => m.bind(skeleton));
const clips = [];
function clip(name, duration, amplitude, air = false) {
  const tracks = [];
  for (const [b, phase] of [
    [ll, 0],
    [rl, Math.PI],
    [la, Math.PI],
    [ra, 0],
  ]) {
    const times = [],
      values = [];
    for (let j = 0; j <= 16; j++) {
      const t = j / 16;
      times.push(t * duration);
      const angle = air
        ? b === la || b === ra
          ? -0.9
          : 0.35
        : Math.sin(t * Math.PI * 2 + phase) * amplitude;
      const q = new T.Quaternion().setFromEuler(new T.Euler(angle, 0, 0));
      values.push(...q.toArray());
    }
    tracks.push(
      new T.QuaternionKeyframeTrack(b.name + ".quaternion", times, values),
    );
  }
  const times = [0, duration / 2, duration];
  tracks.push(
    new T.VectorKeyframeTrack("Torso.position", times, [
      0,
      0.27,
      0,
      0,
      0.27 + (name === "Idle" ? 0.022 : 0.045),
      0,
      0,
      0.27,
      0,
    ]),
  );
  clips.push(new T.AnimationClip(name, duration, tracks));
}
clip("Idle", 3, 0.03);
clip("Walk", 1, 0.5);
clip("Run", 0.65, 0.9);
clip("Jump", 0.65, 0.2, true);
clip("Fall", 1, 0.2, true);
clip("Land", 0.28, 0.15);
clip("Interact", 0.7, 0.4, true);
clip("Collect", 0.65, 0.4, true);
clip("LookAround", 3, 0.08);
new GLTFExporter().parse(
  root,
  (result) => {
    fs.writeFileSync("public/assets/explorer.glb", Buffer.from(result));
    console.log("Rigged explorer GLB generated", result.byteLength);
  },
  console.error,
  { binary: true, animations: clips },
);
