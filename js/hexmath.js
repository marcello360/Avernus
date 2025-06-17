function offsetToCube(col, row) {
  // Odd-q vertical layout for flat-top hexes
  const x = col;
  const z = row - ((col & 1) === 1 ? (col + 1) >> 1 : col >> 1);
  const y = -x - z;
  return { x, y, z };
}

function cubeToOffset(x, y, z) {
  const col = x;
  const row = z + ((x & 1) === 1 ? (x + 1) >> 1 : x >> 1);
  return { col, row };
}

export function getNeighborHexes(hexname, terrainVisibility) {
  const colLetter = hexname[0].toUpperCase();
  const row = parseInt(hexname.slice(1), 10);
  const col = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);

  const centerCube = offsetToCube(col, row);
  const radius = terrainVisibility === "clear" ? 2 : 1;

  const neighbors = [];

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = Math.max(-radius, -dx - radius); dy <= Math.min(radius, -dx + radius); dy++) {
      const dz = -dx - dy;

      // Skip center
      if (dx === 0 && dy === 0 && dz === 0) continue;

      const nx = centerCube.x + dx;
      const ny = centerCube.y + dy;
      const nz = centerCube.z + dz;

      const { col: nCol, row: nRow } = cubeToOffset(nx, ny, nz);

      if (nCol < 0 || nRow < 1) continue;

      const colChar = String.fromCharCode('A'.charCodeAt(0) + nCol);
      neighbors.push(`${colChar}${nRow}`);
    }
  }

  return neighbors;
}
