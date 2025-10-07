import type { Exercise, SortDir } from "./types";

export function sortByName(a: Exercise, b: Exercise, dir: SortDir) {
  return dir === "asc"
    ? a.name.localeCompare(b.name)
    : b.name.localeCompare(a.name);
}
