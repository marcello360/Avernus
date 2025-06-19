export function getNeighborHexes(hexname, terrainVisibility) {
    const colLetter = hexname[0].toUpperCase();
    const row = parseInt(hexname.slice(1), 10);
    const col = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);
    
    const isOddCol = col % 2 === 0; // A=0, C=2, E=4, etc.
    
    let directNeighbors = [];
    
    if (isOddCol) {
      directNeighbors = [
        [col-1, row-1], // Northwest
        [col, row-1],   // North
        [col+1, row-1], // Northeast
        [col+1, row],   // Southeast
        [col, row+1],   // South
        [col-1, row],   // Southwest
      ];
    } else {
      directNeighbors = [
        [col-1, row],   // Northwest
        [col, row-1],   // North
        [col+1, row],   // Northeast
        [col+1, row+1], // Southeast
        [col, row+1],   // South
        [col-1, row+1], // Southwest
      ];
    }
    
    const neighbors = [];
    const radius = terrainVisibility === "clear" ? 2 : 1;
    const visited = new Set([`${colLetter}${row}`]);
    
    // For radius 1, get direct neighbors
    for (const [ncol, nrow] of directNeighbors) {
      if (ncol >= 0 && ncol <= 9 && nrow >= 1 && nrow <= 6) {
        const colChar = String.fromCharCode('A'.charCodeAt(0) + ncol);
        const newHex = `${colChar}${nrow}`;
        neighbors.push(newHex);
        visited.add(newHex);
      }
    }
    
    // For radius 2, get neighbors of neighbors
    if (radius >= 2) {
      const additionalNeighbors = [];
    
      for (const neighbor of neighbors) {
        const nColLetter = neighbor[0];
        const nRow = parseInt(neighbor.slice(1), 10);
        const nCol = nColLetter.charCodeAt(0) - 'A'.charCodeAt(0);
        
        const isNOddCol = nCol % 2 === 0;
        let secondaryNeighbors = [];
        
        if (isNOddCol) {
          secondaryNeighbors = [
            [nCol-1, nRow-1], // Northwest
            [nCol, nRow-1],   // North
            [nCol+1, nRow-1], // Northeast
            [nCol+1, nRow],   // Southeast
            [nCol, nRow+1],   // South
            [nCol-1, nRow],   // Southwest
          ];
        } else {
          secondaryNeighbors = [
            [nCol-1, nRow],   // Northwest
            [nCol, nRow-1],   // North
            [nCol+1, nRow],   // Northeast
            [nCol+1, nRow+1], // Southeast
            [nCol, nRow+1],   // South
            [nCol-1, nRow+1], // Southwest
          ];
        }
        
        for (const [scol, srow] of secondaryNeighbors) {
          if (scol >= 0 && scol <= 9 && srow >= 1 && srow <= 6) {
            const newHex = `${String.fromCharCode('A'.charCodeAt(0) + scol)}${srow}`;
            if (!visited.has(newHex)) {
              visited.add(newHex);
              additionalNeighbors.push(newHex);
            }
          }
        }
      }
      
      neighbors.push(...additionalNeighbors);
    }
    
    return neighbors.sort();
  }
