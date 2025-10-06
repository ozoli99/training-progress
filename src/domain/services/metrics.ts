export function estimateOneRepMax(reps?: number, weight?: number) {
  if (!reps || !weight) return null;
  return +(weight * (1 + reps / 30)).toFixed(2);
}

export function setVolume(reps?: number, weight?: number) {
  if (!reps || !weight) return 0;
  return reps * weight;
}
