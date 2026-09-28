let ctx: AudioContext | undefined,
  master: GainNode | undefined,
  timer: ReturnType<typeof setInterval> | undefined;
let enabled = true;
export function tone(f = 660, d = 0.35) {
  if (!ctx || !enabled) return;
  const o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = f;
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
  o.connect(g).connect(master!);
  o.start();
  o.stop(ctx.currentTime + d);
}
export function audioStart(on: boolean) {
  enabled = on;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.34;
    master.connect(ctx.destination);
    let index = 0;
    const notes = [196, 246.94, 293.66, 392, 329.63, 293.66, 246.94, 220];
    timer = setInterval(() => {
      tone(notes[index++ % notes.length], 3.5);
    }, 2300);
  }
  void ctx.resume();
  master!.gain.setTargetAtTime(on ? 0.34 : 0, ctx.currentTime, 0.15);
}
export function audioEnabled(on: boolean) {
  enabled = on;
  if (ctx && master)
    master.gain.setTargetAtTime(on ? 0.34 : 0, ctx.currentTime, 0.15);
}
window.addEventListener("pagehide", () => {
  if (timer) clearInterval(timer);
  void ctx?.close();
});
