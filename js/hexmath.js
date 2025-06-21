export function getNeighborHexes(hexname, terrainVisibility) {
    const colLetter = hexname[0].toUpperCase();
    const row = parseInt(hexname.slice(1), 10);
    const col = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);
    
    const isOddCol = col % 2 === 0; // A=0, C=2, E=4, etc.
    
    let directNeighborsWithDirections = [];
    
    if (isOddCol) {
      directNeighborsWithDirections = [
        { coords: [col-1, row-1], direction: 'NW' }, // Northwest
        { coords: [col, row-1], direction: 'N' },    // North
        { coords: [col+1, row-1], direction: 'NE' }, // Northeast
        { coords: [col+1, row], direction: 'SE' },   // Southeast
        { coords: [col, row+1], direction: 'S' },    // South
        { coords: [col-1, row], direction: 'SW' },   // Southwest
      ];
    } else {
      directNeighborsWithDirections = [
        { coords: [col-1, row], direction: 'NW' },   // Northwest
        { coords: [col, row-1], direction: 'N' },    // North
        { coords: [col+1, row], direction: 'NE' },   // Northeast
        { coords: [col+1, row+1], direction: 'SE' }, // Southeast
        { coords: [col, row+1], direction: 'S' },    // South
        { coords: [col-1, row+1], direction: 'SW' }, // Southwest
      ];
    }
    
    const neighborsWithDirections = [];
    const radius = terrainVisibility === "clear" ? 2 : 1;
    const visited = new Set([`${colLetter}${row}`]);
    
    // For radius 1, get direct neighbors
    for (const neighbor of directNeighborsWithDirections) {
      const [ncol, nrow] = neighbor.coords;
      if (ncol >= 0 && ncol <= 9 && nrow >= 1 && nrow <= 6) {
        const colChar = String.fromCharCode('A'.charCodeAt(0) + ncol);
        const newHex = `${colChar}${nrow}`;
        neighborsWithDirections.push({
          hex: newHex,
          direction: neighbor.direction,
          distance: "near"
        });
        visited.add(newHex);
      }
    }
    
    // For radius 2, get neighbors of neighbors
    if (radius >= 2) {
      const secondLevelDirections = {
        'N': { 'N': 'N', 'NE': 'NNE', 'NW': 'NNW' },
        'NE': { 'N': 'NNE', 'NE': 'NE', 'SE': 'E' },
        'SE': { 'NE': 'E', 'SE': 'SE', 'S': 'SSE' },
        'S': { 'SE': 'SSE', 'S': 'S', 'SW': 'SSW' },
        'SW': { 'S': 'SSW', 'SW': 'SW', 'NW': 'W' },
        'NW': { 'SW': 'W', 'NW': 'NW', 'N': 'NNW' }
      };
      
      const additionalNeighborsWithDirections = [];
    
      for (const firstNeighbor of neighborsWithDirections) {
        const nColLetter = firstNeighbor.hex[0];
        const nRow = parseInt(firstNeighbor.hex.slice(1), 10);
        const nCol = nColLetter.charCodeAt(0) - 'A'.charCodeAt(0);
        const firstDirection = firstNeighbor.direction;
        
        const isNOddCol = nCol % 2 === 0;
        let secondaryNeighborsWithDirections = [];
        
        if (isNOddCol) {
          secondaryNeighborsWithDirections = [
            { coords: [nCol-1, nRow-1], direction: 'NW' }, // Northwest
            { coords: [nCol, nRow-1], direction: 'N' },    // North
            { coords: [nCol+1, nRow-1], direction: 'NE' }, // Northeast
            { coords: [nCol+1, nRow], direction: 'SE' },   // Southeast
            { coords: [nCol, nRow+1], direction: 'S' },    // South
            { coords: [nCol-1, nRow], direction: 'SW' },   // Southwest
          ];
        } else {
          secondaryNeighborsWithDirections = [
            { coords: [nCol-1, nRow], direction: 'NW' },   // Northwest
            { coords: [nCol, nRow-1], direction: 'N' },    // North
            { coords: [nCol+1, nRow], direction: 'NE' },   // Northeast
            { coords: [nCol+1, nRow+1], direction: 'SE' }, // Southeast
            { coords: [nCol, nRow+1], direction: 'S' },    // South
            { coords: [nCol-1, nRow+1], direction: 'SW' }, // Southwest
          ];
        }
        
        for (const secondNeighbor of secondaryNeighborsWithDirections) {
          const [scol, srow] = secondNeighbor.coords;
          if (scol >= 0 && scol <= 9 && srow >= 1 && srow <= 6) {
            const newHex = `${String.fromCharCode('A'.charCodeAt(0) + scol)}${srow}`;
            if (!visited.has(newHex)) {
              visited.add(newHex);
              
              // Determine the compound direction
              let compositeDirection = secondNeighbor.direction;
              if (secondLevelDirections[firstDirection] && 
                  secondLevelDirections[firstDirection][secondNeighbor.direction]) {
                compositeDirection = secondLevelDirections[firstDirection][secondNeighbor.direction];
              }
              
              additionalNeighborsWithDirections.push({
                hex: newHex,
                direction: compositeDirection,
                distance: "far"
              });
            }
          }
        }
      }
      
      neighborsWithDirections.push(...additionalNeighborsWithDirections);
    }
    
    // Sort by hex name
    neighborsWithDirections.sort((a, b) => a.hex.localeCompare(b.hex));
    
    return {
      hexList: neighborsWithDirections.map(n => n.hex),
      hexWithDirections: neighborsWithDirections
    };
  }
