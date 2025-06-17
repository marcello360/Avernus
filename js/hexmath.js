export function getNeighborHexes(hexname, terrainVisibility) {
  const colLetter = hexname[0].toUpperCase();
  const row = parseInt(hexname.slice(1), 10);
  const colIndex = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);
  const isEvenCol = colIndex % 2 === 0;

  const offsets = isEvenCol
    ? [[+1, 0], [0, +1], [-1, 0], [-1, -1], [0, -1], [+1, -1]]
    : [[+1, +1], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, 0]];

  const extended = terrainVisibility === "clear"
    ? [...offsets, [-2, 0], [+2, 0]]
    : offsets;

  const neighbors = extended.map(([dx, dy]) => {
    const newColIndex = colIndex + dx;
    const newRow = row + dy;
    if (newColIndex < 0 || newRow < 1) return null;
    const newColLetter = String.fromCharCode('A'.charCodeAt(0) + newColIndex);
    return `${newColLetter}${newRow}`;
  }).filter(Boolean);

  return neighbors;
}
