export const SHARD_COUNT = 15;
export const melody = [1, 0, 2];
export const lensTarget = [1, 3, 2];
export function advanceMelody(sequence: number[], note: number) {
  const next = [...sequence, note];
  return next.every((n, i) => n === melody[i])
    ? next
    : note === melody[0]
      ? [note]
      : [];
}
export function lensesAligned(lenses: number[]) {
  return lenses.length === 3 && lenses.every((v, i) => v === lensTarget[i]);
}
export function canOpenHeart(count: number, wind: boolean, light: boolean) {
  return count >= 12 && wind && light;
}
export function completion(
  count: number,
  wind: boolean,
  light: boolean,
  hidden: number,
  secret: boolean,
) {
  return Math.round(
    ((count +
      Number(wind) * 2 +
      Number(light) * 2 +
      hidden * 2 +
      Number(secret) * 4) /
      27) *
      100,
  );
}
