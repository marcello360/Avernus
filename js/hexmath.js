export function getNeighborHexes(hexname, terrainVisibility) {
  const colLetter = hexname[0].toUpperCase();
  const row = parseInt(hexname.slice(1), 10);
  const colIndex = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);

  const isEvenCol = colIndex % 2 === 0;

  // Even-q offset layout
  const baseOffsets = isEvenCol
    ? [ [0, -1], [+1, -1], [+1, 0], [0, +1], [-1, 0], [-1, -1] ]
    : [ [0, -1], [+1, 0], [+1, +1], [0, +1], [-1, +1], [-1, 0] ];

  const extendedOffsets = [
    ...baseOffsets,
    [-2, 0], [+2, 0] // straight-line extension for “clear”
  ];

  const offsets = terrainVisibility === "clear" ? extendedOffsets : baseOffsets;

  const neighbors = offsets.map(([dx, dy]) => {
    const newCol = colIndex + dx;
    const newRow = row + dy;

    if (newCol < 0 || newRow < 1 || newCol > 25) return null; // safety

    const newColLetter = String.fromCharCode('A'.charCodeAt(0) + newCol);
    return `${newColLetter}${newRow}`;
  }).filter(Boolean);

  return neighbors;
}
