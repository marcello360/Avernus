function offsetToCube(col, row) {
  const x = col - ((row & 1) === 1 ? 0 : Math.floor(row / 2));
  const z = row;
  const y = -x - z;
  return { x, y, z };
}

function cubeToOffset(x, y, z) {
  const row = z;
  const col = x + ((row & 1) === 1 ? 0 : Math.floor(row / 2));
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

      if (dx === 0 && dy === 0) continue;

      const nx = centerCube.x + dx;
      const ny = centerCube.y + dy;
      const nz = centerCube.z + dz;

      const { col: newCol, row: newRow } = cubeToOffset(nx, ny, nz);

      if (newCol < 0 || newRow < 1) continue;

      const colChar = String.fromCharCode('A'.charCodeAt(0) + newCol);
      neighbors.push(`${colChar}${newRow}`);
    }
  }

  return neighbors;
}
