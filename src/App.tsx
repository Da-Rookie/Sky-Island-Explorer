import {
  Suspense,
  useEffect,
  useRef,
  useState,
  Component,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { World } from "./World";
import { Player } from "./Player";
import { input, position, useGame } from "./store";
import { completion } from "./progression";
import { audioStart, audioEnabled } from "./audio";
import { islands } from "./worldData";
import "./style.css";
class SceneBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fatal">
        <h2>The sky couldn’t load</h2>
        <p>Please use a browser with WebGL 2 enabled, then try again.</p>
        <button onClick={() => location.reload()}>Try again</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Loader() {
  const { progress } = useProgress();
  return (
    <div className="loading">
      <span className="spinner" />
      Preparing your island <span>{Math.round(progress)}%</span>
    </div>
  );
}
function Minimap({ large = false }: { large?: boolean }) {
  const ref = useRef<SVGPolygonElement>(null);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      ref.current?.setAttribute(
        "transform",
        `translate(${position.x + 55} ${position.z + 55}) rotate(${(-position.yaw * 180) / Math.PI})`,
      );
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <svg
      className={large ? "map large" : "map"}
      viewBox="0 0 115 90"
      aria-label="Island map: forest west, observatory east, heart shrine north"
    >
      <path
        d="M55 42V27 M41 52 36 49 M68 51 74 44 M88 35 97 33"
        stroke="#d3c396"
        strokeWidth="2"
      />
      {islands.map((i, n) => (
        <circle
          key={n}
          cx={i.x + 55}
          cy={i.z + 55}
          r={i.r}
          fill={n === 4 ? "#77958a" : "#6c9c85"}
          stroke="#b1c0a0"
          strokeWidth=".6"
        />
      ))}
      <text x="55" y="8">
        N
      </text>
      <text x="55" y="22">
        ✦
      </text>
      <text x="30" y="47">
        ☾
      </text>
      <text x="78" y="39">
        ☀
      </text>
      <polygon
        ref={ref}
        points="0,-3 -2,2 0,1 2,2"
        fill="#fff1c0"
        stroke="#234c49"
        strokeWidth=".5"
      />
      {large && (
        <>
          <text x="25" y="33" className="map-label">
            WHISPERWOOD
          </text>
          <text x="85" y="55" className="map-label">
            OBSERVATORY
          </text>
          <text x="55" y="78" className="map-label">
            THE ARRIVAL
          </text>
        </>
      )}
    </svg>
  );
}
function TouchControls() {
  const origin = useRef({ x: 0, y: 0, id: -1 });
  const look = useRef({ x: 0, y: 0, id: -1 });
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const reset = () => {
    origin.current.id = -1;
    input.x = input.y = 0;
    setStick({ x: 0, y: 0 });
  };
  return (
    <div className="touch-controls">
      <div
        className="look-zone"
        aria-label="Swipe to look around"
        onPointerDown={(e) => {
          look.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (look.current.id !== e.pointerId) return;
          input.lookX += e.clientX - look.current.x;
          input.lookY += e.clientY - look.current.y;
          look.current.x = e.clientX;
          look.current.y = e.clientY;
        }}
        onPointerUp={() => (look.current.id = -1)}
        onPointerCancel={() => (look.current.id = -1)}
      />
      <div
        className="joystick"
        role="group"
        aria-label="Movement joystick"
        onPointerDown={(e) => {
          origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== origin.current.id) return;
          let x = e.clientX - origin.current.x,
            y = e.clientY - origin.current.y;
          const len = Math.hypot(x, y);
          if (len > 38) {
            x = (x / len) * 38;
            y = (y / len) * 38;
          }
          input.x = x / 38;
          input.y = y / 38;
          setStick({ x, y });
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
        onLostPointerCapture={reset}
      >
        <span style={{ transform: `translate(${stick.x}px,${stick.y}px)` }} />
      </div>
      <div className="touch-actions">
        <button
          aria-label="Sprint"
          onPointerDown={(e) => {
            input.sprint = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={() => (input.sprint = false)}
          onPointerCancel={() => (input.sprint = false)}
          onLostPointerCapture={() => (input.sprint = false)}
        >
          Run
        </button>
        <button
          className="touch-jump"
          onPointerDown={() => (input.jump = true)}
        >
          Jump
        </button>
        <button onPointerDown={() => (input.interact = true)}>Interact</button>
      </div>
    </div>
  );
}
function Journal() {
  const s = useGame();
  return (
    <div className="journal">
      <p className="eyebrow">EXPLORER’S JOURNAL</p>
      <h2>A world that remembers.</h2>
      <Minimap large />
      <div className="journal-row">
        <span>Sky Shards</span>
        <strong>{s.shards.length} / 15</strong>
      </div>
      <div className="journal-row">
        <span>Whisperwood melody</span>
        <strong>{s.wind ? "Awakened" : "Listen to the stones"}</strong>
      </div>
      <div className="journal-row">
        <span>Observatory lenses</span>
        <strong>{s.light ? "Aligned" : "Follow the inscription"}</strong>
      </div>
      <div className="journal-row">
        <span>Hidden places</span>
        <strong>{s.hidden.length} / 2</strong>
      </div>
      <div className="journal-row">
        <span>Heart of the Sky</span>
        <strong>
          {s.secret ? "Awakened" : "Bring both shrines + 12 shards"}
        </strong>
      </div>
      <p className="journal-hint">
        A waterfall hides a quiet grotto. Beyond the eastern ruins, a garden
        waits for the wind.
      </p>
    </div>
  );
}
export default function App() {
  const s = useGame();
  const [tab, setTab] = useState<"journey" | "settings">("journey");
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    audioEnabled(s.sound);
  }, [s.sound]);
  useEffect(() => {
    if (!s.notice) return;
    const timer = setTimeout(() => useGame.setState({ notice: "" }), 10500);
    return () => clearTimeout(timer);
  }, [s.notice]);
  useEffect(() => {
    const ctx = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", ctx);
    return () => document.removeEventListener("contextmenu", ctx);
  }, []);
  const start = () => {
    audioStart(s.sound);
    s.setMode("playing");
  };
  const progress = completion(
    s.shards.length,
    s.wind,
    s.light,
    s.hidden.length,
    s.secret,
  );
  return (
    <main className="game">
      <SceneBoundary>
        <Canvas
          shadows={s.quality === "high"}
          dpr={s.quality === "high" ? [1, 1.6] : [1, 1]}
          camera={{ position: [38, 32, 50], fov: 52, near: 0.1, far: 240 }}
          gl={{
            antialias: s.quality === "high",
            powerPreference: "high-performance",
          }}
        >
          <Suspense fallback={null}>
            <Physics gravity={[0, -14, 0]} paused={s.mode !== "playing"}>
              <World />
              <Player />
            </Physics>
          </Suspense>
        </Canvas>
      </SceneBoundary>
      <div className="vignette" />
      {!s.ready && <Loader />}
      <AnimatePresence>
        {s.mode === "title" && (
          <motion.section
            className="title-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="title-top">
              <span className="brand-mark">✧</span>
              <span>AN EXPLORER’S TALE</span>
              <span className="edition">CHAPTER 01</span>
            </div>
            <div className="title-content">
              <p className="eyebrow">SOMEWHERE ABOVE THE CLOUDS</p>
              <h1>
                Sky Island
                <br />
                <em>Explorer</em>
                <span className="title-star">✧</span>
              </h1>
              <p className="intro">
                Follow the wind.
                <br />
                Find what the sky left behind.
              </p>
              <button className="primary" disabled={!s.ready} onClick={start}>
                {!s.ready
                  ? "Preparing the island…"
                  : s.shards.length || s.wind || s.light
                    ? "Continue journey"
                    : "Begin your journey"}
                <span>↗</span>
              </button>
              <div className="title-meta">
                <span>
                  ✦{" "}
                  {s.shards.length
                    ? `${progress}% discovered`
                    : "A small world. Many secrets."}
                </span>
                <button
                  className="sound-button"
                  onClick={() => s.setting({ sound: !s.sound })}
                >
                  {s.sound ? "♪ Sound on" : "♪ Sound off"}
                </button>
              </div>
            </div>
            <div className="title-bottom">
              <span>EXPLORE AT YOUR OWN PACE</span>
              <span className="desktop-hint">
                WASD to move · Drag to look · Headphones recommended
              </span>
              <span className="mobile-hint">
                Touch controls available · Landscape recommended
              </span>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      {s.mode === "playing" && (
        <>
          <header className="hud-top">
            <div className="location">
              <span className="small-emblem">✧</span>
              <div>
                <span className="eyebrow">THE FLOATING ISLES</span>
                <h2>{s.zone}</h2>
              </div>
            </div>
            <div className="hud-right">
              <div className="shard-count">
                <span>◈</span>
                <strong>{s.shards.length}</strong>
                <span>/ 15</span>
              </div>
              <button
                className="icon-button"
                aria-label="Pause and open journal"
                onClick={() => {
                  s.setMode("paused");
                  document.exitPointerLock?.();
                }}
              >
                Ⅱ
              </button>
            </div>
          </header>
          <aside className="quest">
            <p className="eyebrow">YOUR JOURNEY</p>
            <h3>
              {s.secret
                ? "The sky remembers you"
                : s.wind && s.light
                  ? "Awaken the heart"
                  : "Wake the sleeping island"}
            </h3>
            <p>
              {s.secret
                ? "Keep exploring. Every little secret counts."
                : s.wind && s.light
                  ? `Bring 12 shards to the northern shrine · ${Math.min(s.shards.length, 12)}/12`
                  : "Follow the forest melody and restore the observatory."}
            </p>
            <div className="quest-steps">
              <span className={s.wind ? "done" : ""}>✧ Wind</span>
              <span className={s.light ? "done" : ""}>✧ Light</span>
              <span className={s.secret ? "done" : ""}>✧ Heart</span>
            </div>
          </aside>
          <div className="minimap-panel">
            <Minimap />
            <span>FOLLOW YOUR CURIOSITY</span>
          </div>
          <div className="hud-bottom">
            <span className="save-status">
              {s.storageOK
                ? "✧ Journey saved on this device"
                : "Progress cannot be saved in this browser"}
            </span>
            <div className="controls">
              <span>
                <kbd>W A S D</kbd> Move
              </span>
              <span>
                <kbd>SPACE</kbd> Jump
              </span>
              <span>
                <kbd>SHIFT</kbd> Run
              </span>
              <span>Drag to look</span>
              <span>
                <kbd>ESC</kbd> Journal
              </span>
            </div>
          </div>
          {s.prompt && (
            <button
              className="interaction"
              onClick={() => (input.interact = true)}
            >
              <kbd>E</kbd>
              {s.prompt}
            </button>
          )}
          <TouchControls />
        </>
      )}
      <AnimatePresence>
        {s.notice && s.mode === "playing" && (
          <motion.div
            role="status"
            className="toast"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span>✦</span>
            {s.notice}
            <button
              aria-label="Dismiss message"
              onClick={() => useGame.setState({ notice: "" })}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {s.mode === "paused" && (
        <div className="modal-backdrop">
          <section className="pause-panel">
            <div className="pause-heading">
              <span className="eyebrow">TAKE A BREATH</span>
              <button
                aria-label="Close menu"
                className="icon-button"
                onClick={start}
              >
                ×
              </button>
            </div>
            <nav className="tabs">
              <button
                className={tab === "journey" ? "active" : ""}
                onClick={() => setTab("journey")}
              >
                Your journey
              </button>
              <button
                className={tab === "settings" ? "active" : ""}
                onClick={() => setTab("settings")}
              >
                Settings & controls
              </button>
            </nav>
            {tab === "journey" ? (
              <Journal />
            ) : (
              <div className="settings">
                <h2>Make yourself at home.</h2>
                <label>
                  Sound & music
                  <input
                    type="checkbox"
                    checked={s.sound}
                    onChange={(e) => s.setting({ sound: e.target.checked })}
                  />
                </label>
                <label>
                  Graphics
                  <select
                    value={s.quality}
                    onChange={(e) =>
                      s.setting({ quality: e.target.value as "low" | "high" })
                    }
                  >
                    <option value="high">High · shadows & detail</option>
                    <option value="low">Low · better performance</option>
                  </select>
                </label>
                <p>
                  WASD / arrows — move
                  <br />
                  Mouse drag — look around
                  <br />
                  Double-click world — lock mouse
                  <br />
                  Scroll — camera distance
                  <br />
                  Space — jump · Shift — sprint
                  <br />E — interact · Esc — pause
                </p>
                <p>
                  Touch: left joystick to move, swipe right to look. Use Jump,
                  Run, and Interact.
                </p>
                <p>
                  Progress saves automatically on this browser. No account
                  required.
                </p>
                <button
                  className="text-button"
                  onClick={() => setConfirm(true)}
                >
                  Start a new journey
                </button>
                {confirm && (
                  <div
                    className="confirm"
                    role="alertdialog"
                    aria-label="Reset saved journey"
                  >
                    <p>Erase your saved discoveries and start again?</p>
                    <button
                      onClick={() => {
                        s.reset();
                        setConfirm(false);
                        audioStart(s.sound);
                      }}
                    >
                      Yes, start again
                    </button>
                    <button onClick={() => setConfirm(false)}>
                      Keep my journey
                    </button>
                  </div>
                )}
              </div>
            )}
            <button className="primary" onClick={start}>
              Return to the island <span>↗</span>
            </button>
            <button
              className="text-button"
              onClick={() => {
                s.setting({ checkpoint: [0, 2, 10] });
                useGame.setState({ teleport: s.teleport + 1 });
                start();
              }}
            >
              Return to arrival camp
            </button>
          </section>
        </div>
      )}
      {s.mode === "ending" && (
        <div className="ending">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="ending-symbol">✧</span>
            <p className="eyebrow">THE ISLAND’S LAST SECRET</p>
            <h1>
              The sky
              <br />
              <em>remembers.</em>
            </h1>
            <p>
              You brought light to a forgotten world.
              <br />
              The journey was never about reaching the end.
              <br />
              It was about everything you found along the way.
            </p>
            <div className="ending-stats">
              <span>
                <strong>{s.shards.length}/15</strong>Sky Shards
              </span>
              <span>
                <strong>{s.hidden.length}/2</strong>Hidden places
              </span>
              <span>
                <strong>{progress}%</strong>Discovered
              </span>
            </div>
            <button className="primary" onClick={start}>
              Stay a little longer <span>↗</span>
            </button>
          </motion.div>
        </div>
      )}
    </main>
  );
}
