const SUPABASE_URL = 'https://hhattfmstvpkcsquywpd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXR0Zm1zdHZwa2NzcXV5d3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODUyOTEsImV4cCI6MjA2NTc2MTI5MX0.oUHaqgRpM8RPiOE-Y_LeGkohdhUCkBvpaNojWJofbZw';

const hexSelect = document.getElementById('hexSelect');
const weatherSelect = document.getElementById('weatherSelect');
const watchSelect = document.getElementById('watchSelect');
const rollButton = document.getElementById('rollButton');

function getHexCoords(hexname) {
  const letter = hexname[0].toUpperCase();
  const number = parseInt(hexname.slice(1), 10);
  return { row: letter, col: number };
}

function getNeighborHexNames(hexname, radius = 1) {
  const directionsEven = [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
  const directionsOdd = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]];

  const { row, col } = getHexCoords(hexname);
  const rowIndex = row.charCodeAt(0) - 'A'.charCodeAt(0);

  const results = new Set();

  function addNeighbor(r, c) {
    if (r < 0 || c < 1) return;
    const letter = String.fromCharCode('A'.charCodeAt(0) + r);
    results.add(`${letter}${c}`);
  }

  function getDirections(x) {
    return x % 2 === 0 ? directionsEven : directionsOdd;
  }

  function recurse(r, c, depth, visited = new Set()) {
    const key = `${r},${c}`;
    if (visited.has(key) || depth > radius) return;
    visited.add(key);

    addNeighbor(r, c);

    const directions = getDirections(c);
    for (const [dr, dc] of directions) {
      recurse(r + dr, c + dc, depth + 1, visited);
    }
  }

  recurse(rowIndex, col, 0);
  results.delete(hexname); // exclude origin
  return [...results];
}

// Populate the Hex dropdown with HexName (display) and ID (value)
async function populateHexes() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/hexes?select=id,hexname`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  const hexes = await res.json();

  if (!Array.isArray(hexes)) {
    console.error("Hex fetch failed:", hexes);
    return;
  }

  hexes.forEach(hex => {
    const option = document.createElement('option');
    option.value = hex.id; // Use ID for lookup
    option.textContent = hex.hexname;
    hexSelect.appendChild(option);
  });
}

// Enable button only when all selects are chosen
function checkSelections() {
  const filled = weatherSelect.value && watchSelect.value && hexSelect.value;
  rollButton.disabled = !filled;
}

weatherSelect.addEventListener('change', checkSelections);
watchSelect.addEventListener('change', checkSelections);
hexSelect.addEventListener('change', checkSelections);

// Handle "Roll for Watch" click
rollButton.addEventListener('click', async () => {
  const weather = weatherSelect.value;
  const watch = watchSelect.value;
  const hexId = hexSelect.value;
  const selectedHexName = hexSelect.options[hexSelect.selectedIndex].textContent;
  const weatherIsClear = weather === "clear";
  const radius = weatherIsClear ? 2 : 1;

  const outputArea = document.getElementById('outputArea');
  outputArea.innerHTML = `<p>Loading...</p>`;

  // 1. Fetch terrain(s) for selected hex
  const terrainRes = await fetch(`${SUPABASE_URL}/rest/v1/hexterrains?select=terrain:terrains(terrainname,terraindescription)&hexid=eq.${hexId}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const terrainData = await terrainRes.json();

  const terrainHTML = Array.isArray(terrainData) && terrainData.length > 0
    ? terrainData.map(entry => `
        <div class="terrain-block">
          <h2>${entry.terrain.terrainname}</h2>
          <p>${entry.terrain.terraindescription}</p>
        </div>
      `).join("")
    : `<p>No terrain found for this hex.</p>`;

  // 2. Get nearby hexes with mountains
  const nearbyNames = getNeighborHexNames(selectedHexName, radius);

  // Supabase doesn't support IN clause for strings, so we use OR
  const nameFilter = nearbyNames.map(n => `hexname.eq.${n}`).join(',');
  const mountainQuery = `${SUPABASE_URL}/rest/v1/hexes?or=(${nameFilter})&hasmountains=eq.true`;

  const mountainRes = await fetch(mountainQuery, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const mountainHexes = await mountainRes.json();
  const mountainNames = mountainHexes.map(h => h.hexname).sort();

  const mountainHTML = mountainNames.length > 0
    ? `<h3>Nearby Mountain Hexes (${radius} hex away):</h3><ul>${mountainNames.map(name => `<li>${name}</li>`).join('')}</ul>`
    : `<p>No mountain hexes found within ${radius} hex(es).</p>`;

  // 3. Final output
  outputArea.innerHTML = `
    <div class="terrain-container">
      ${terrainHTML}
    </div>
    <div class="mountains-block">
      ${mountainHTML}
    </div>
  `;
});

// Initial population
populateHexes();
