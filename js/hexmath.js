function offsetToCube(col, row) {
  const isEvenCol = col % 2 === 1;
  const x = col;
  const z = row - (isEvenCol ? 0.5 : 0);
  const y = -x - z;
  return { x, y, z };
}

function cubeToOffset(x, y, z) {
  const col = x;
  const isEvenCol = col % 2 === 1;
  let row = z + (isEvenCol ? 0.5 : 0);
  row = Math.round(row);
  return { col, row };
}

export function getNeighborHexes(hexname, terrainVisibility) {
  const colLetter = hexname[0].toUpperCase();
  const row = parseInt(hexname.slice(1), 10);
  const col = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);
  
  const directions = [];
  const isEvenCol = col % 2 === 1;
  
  if (!isEvenCol) {
    directions.push(
      [-1, -1], // Northwest
      [0, -1],  // Northeast
      [1, -1],  // East
      [1, 0],   // Southeast
      [0, 1],   // Southwest
      [-1, 0]   // West
    );
  } else {
    directions.push(
      [-1, 0],  // Northwest
      [0, -1],  // Northeast
      [1, 0],   // East
      [1, 1],   // Southeast
      [0, 1],   // Southwest
      [-1, 1]   // West
    );
  }
  
  const neighbors = [];
  const radius = terrainVisibility === "clear" ? 2 : 1;
  
  // Use BFS to find all hexes within the radius
  const visited = new Set([`${col},${row}`]);
  const queue = [{ col, row, dist: 0 }];
  
  while (queue.length > 0) {
    const { col: c, row: r, dist } = queue.shift();
    
    if (!(c === col && r === row)) {
      if (c >= 0 && r >= 1 && c <= 9 && r <= 6) { // Valid grid bounds (A-J, 1-6)
        const newColChar = String.fromCharCode('A'.charCodeAt(0) + c);
        neighbors.push(`${newColChar}${r}`);
      }
    }
    
    if (dist < radius) {
      const currentIsEvenCol = c % 2 === 1;
      
      for (let i = 0; i < 6; i++) {
        let dir;
        if (currentIsEvenCol) {
          dir = directions[i];
        } else {
          dir = directions[i];
        }
        const newCol = c + dir[0];
        const newRow = r + dir[1];
        
        if (newCol >= 0 && newRow >= 1 && newCol <= 9 && newRow <= 6) {
          const key = `${newCol},${newRow}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ col: newCol, row: newRow, dist: dist + 1 });
          }
        }
      }
    }
  }
  
  return neighbors.sort();
}
