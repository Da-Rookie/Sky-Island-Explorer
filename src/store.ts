import { create } from "zustand";
import { advanceMelody, lensesAligned, canOpenHeart } from "./progression";
export type Mode = "title" | "playing" | "paused" | "ending";
export const SAVE_KEY = "sky-island-explorer:v1";
type Saved = {
  shards: number[];
  wind: boolean;
  light: boolean;
  hidden: string[];
  secret: boolean;
  lenses: number[];
  sound: boolean;
  quality: "low" | "high";
  checkpoint: [number, number, number];
};
const defaults: Saved = {
  shards: [],
  wind: false,
  light: false,
  hidden: [],
  secret: false,
  lenses: [0, 0, 0],
  sound: true,
  quality: matchMedia("(pointer:coarse)").matches ? "low" : "high",
  checkpoint: [0, 2, 10],
};
function read(): Saved {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!d || d.version !== 1) return defaults;
    return {
      ...defaults,
      shards: Array.isArray(d.shards)
        ? [
            ...new Set<number>(
              d.shards.filter(
                (n: unknown) =>
                  Number.isInteger(n) && Number(n) >= 0 && Number(n) < 15,
              ),
            ),
          ]
        : [],
      wind: d.wind === true,
      light: d.light === true,
      hidden: Array.isArray(d.hidden)
        ? d.hidden.filter((s: string) => ["cave", "garden"].includes(s))
        : [],
      secret: d.secret === true,
      lenses:
        Array.isArray(d.lenses) && d.lenses.length === 3
          ? d.lenses.map((n: number) =>
              Number.isInteger(n) ? ((n % 4) + 4) % 4 : 0,
            )
          : [0, 0, 0],
      sound: d.sound !== false,
      quality: d.quality === "low" ? "low" : "high",
      checkpoint:
        Array.isArray(d.checkpoint) &&
        d.checkpoint.length === 3 &&
        d.checkpoint.every(Number.isFinite)
          ? d.checkpoint
          : defaults.checkpoint,
    };
  } catch {
    return defaults;
  }
}
type Game = Saved & {
  mode: Mode;
  ready: boolean;
  notice: string;
  zone: string;
  prompt: string;
  sequence: number[];
  storageOK: boolean;
  teleport: number;
  setMode: (m: Mode) => void;
  setReady: () => void;
  notify: (s: string) => void;
  collect: (id: number) => void;
  discover: (id: string) => void;
  note: (id: number) => void;
  lens: (id: number) => void;
  heart: () => void;
  save: () => void;
  reset: () => void;
  setting: (s: Partial<Saved>) => void;
};
export const useGame = create<Game>((set, get) => ({
  ...read(),
  mode: "title",
  ready: false,
  notice: "",
  zone: "The Arrival",
  prompt: "",
  sequence: [],
  storageOK: true,
  teleport: 0,
  setMode: (mode) => set({ mode }),
  setReady: () => set({ ready: true }),
  notify: (notice) => set({ notice }),
  collect: (id) => {
    if (get().shards.includes(id)) return;
    set({
      shards: [...get().shards, id],
      notice: "Sky Shard found · a little piece of the sky",
    });
    get().save();
  },
  discover: (id) => {
    if (get().hidden.includes(id)) return;
    set({
      hidden: [...get().hidden, id],
      notice:
        id === "cave"
          ? "Hidden area discovered · Whispering Grotto"
          : "Hidden area discovered · The Lost Garden",
    });
    get().save();
  },
  note: (id) => {
    if (get().wind) return;
    const sequence = advanceMelody(get().sequence, id);
    const wind = sequence.length === 3;
    set({
      sequence,
      wind,
      notice: wind
        ? "The wind remembers. A bridge to the Lost Garden awakens."
        : sequence.length
          ? `${sequence.length} / 3 tones resonate`
          : "The melody fades. Read the stone for a clue.",
    });
    get().save();
  },
  lens: (id) => {
    if (get().light) return;
    const lenses = [...get().lenses];
    lenses[id] = (lenses[id] + 1) % 4;
    const light = lensesAligned(lenses);
    set({
      lenses,
      light,
      notice: light
        ? "The observatory is alight. Return to the Heart Shrine."
        : "The lens turns toward a new star.",
    });
    get().save();
  },
  heart: () => {
    const s = get();
    if (canOpenHeart(s.shards.length, s.wind, s.light)) {
      set({
        secret: true,
        mode: "ending",
        notice: "The Heart of the Sky is awake.",
      });
      get().save();
    } else
      set({
        notice: `The heart needs both shrines and 12 Sky Shards. You have ${s.shards.length}.`,
      });
  },
  save: () => {
    const s = get();
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          version: 1,
          shards: s.shards,
          wind: s.wind,
          light: s.light,
          hidden: s.hidden,
          secret: s.secret,
          lenses: s.lenses,
          sound: s.sound,
          quality: s.quality,
          checkpoint: s.checkpoint,
        }),
      );
      set({ storageOK: true });
    } catch {
      set({ storageOK: false });
    }
  },
  reset: () => {
    set({
      ...defaults,
      sound: get().sound,
      quality: get().quality,
      mode: "playing",
      sequence: [],
      teleport: get().teleport + 1,
      notice: "A new journey begins.",
    });
    get().save();
  },
  setting: (s) => {
    set(s);
    get().save();
  },
}));
export const input = {
  x: 0,
  y: 0,
  lookX: 0,
  lookY: 0,
  jump: false,
  sprint: false,
  interact: false,
};
export const position = { x: 0, y: 2, z: 10, yaw: 0 };
