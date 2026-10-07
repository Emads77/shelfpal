export const MAX_SHELVES = 50;

//Suggests names like "L1", "L2" for a bookcase called "Living Room".
// Numbering continues after the highest number already used with that letter.
export function suggestShelfNames(bookcaseName, takenNames, howMany) {
  const prefix = (bookcaseName.trim().charAt(0) || "S").toUpperCase();
  const taken = new Set(takenNames.map((name) => name.trim().toLowerCase()));

  let highest = 0;
  for (const name of takenNames) {
    const trimmed = name.trim();
    const rest = trimmed.slice(prefix.length);
    if (trimmed.toUpperCase().startsWith(prefix) && /^\d+$/.test(rest)) {
      highest = Math.max(highest, Number(rest));
    }
  }

  const suggestions = [];
  let next = highest + 1;
  while (suggestions.length < howMany) {
    const candidate = `${prefix}${next}`;
    next += 1;
    if (!taken.has(candidate.toLowerCase())) suggestions.push(candidate);
  }
  return suggestions;
}
