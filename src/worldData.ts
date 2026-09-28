export const islands = [
  { x: 0, z: 4, r: 18, y: 0, name: "The Arrival" },
  { x: -25, z: -10, r: 12, y: 0, name: "Whisperwood" },
  { x: 23, z: -17, r: 12, y: 0, name: "Sunken Observatory" },
  { x: 0, z: -36, r: 10, y: 0, name: "Heart Shrine" },
  { x: 45, z: -22, r: 7, y: 0, name: "The Lost Garden" },
];
export const shards: [number, number, number][] = [
  [0, 1.1, 5],
  [-8, 1.1, 10],
  [9, 1.1, 1],
  [-12, 1.1, -3],
  [-26, 1.1, -5],
  [-30, 1.1, -15],
  [-19, 1.1, -16],
  [20, 1.1, -12],
  [27, 1.1, -21],
  [30, 1.1, -13],
  [3, 1.1, -34],
  [-5, 1.1, -40],
  [12, 1.1, 12],
  [44, 1.1, -20],
  [48, 1.1, -25],
];
export type Interaction = {
  id: string;
  x: number;
  z: number;
  label: string;
  kind: "clue" | "note" | "lens" | "heart" | "checkpoint";
  index?: number;
  text?: string;
};
export const interactions: Interaction[] = [
  {
    id: "arrival",
    x: 0,
    z: 12,
    label: "Read the explorer’s stone",
    kind: "clue",
    text: "Find the Wind Shrine in the western forest and the light puzzle in the eastern ruins. Bring 12 Sky Shards to the northern Heart Shrine.",
  },
  {
    id: "wind-clue",
    x: -25,
    z: -7,
    label: "Read the wind inscription",
    kind: "clue",
    text: "“When night gives way to day, the stars remember.” Ring MOON, then SUN, then STAR. The symbols are on the three stones.",
  },
  ...[0, 1, 2].map((index) => ({
    id: `note-${index}`,
    x: -29 + index * 4,
    z: -11,
    label: `Ring ${["Sun", "Moon", "Star"][index]} stone`,
    kind: "note" as const,
    index,
  })),
  {
    id: "light-clue",
    x: 22,
    z: -12,
    label: "Read the observatory inscription",
    kind: "clue",
    text: "“First, face dawn. Second, face dusk. Third, face the earth below.” Turn the lenses to EAST, WEST, SOUTH (→, ←, ↓).",
  },
  ...[0, 1, 2].map((index) => ({
    id: `lens-${index}`,
    x: 19 + index * 4,
    z: -19,
    label: `Rotate lens ${index + 1}`,
    kind: "lens" as const,
    index,
  })),
  {
    id: "heart",
    x: 0,
    z: -38,
    label: "Awaken the Heart of the Sky",
    kind: "heart",
  },
  {
    id: "camp",
    x: -3,
    z: 9,
    label: "Rest at the campfire",
    kind: "checkpoint",
  },
];
