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

watchSelect.addEventListener('change', checkSelections);
hexSelect.addEventListener('change', () => {
  checkSelections();
  const hexId = hexSelect.value;
  const hexName = hexSelect.options[hexSelect.selectedIndex].textContent;

  if (hexId) {
    loadTerrainForHex(hexId);
  }

  if (hexId && weatherSelect.value) {
    loadMountainHexes(hexName, weatherSelect.value);
  }
});

weatherSelect.addEventListener('change', () => {
  checkSelections();
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
  const weather = weatherSelect.value;

  if (hexName && weather) {
    loadMountainHexes(hexName, weather);
  }
});

// Handle "Roll for Watch" click
rollButton.addEventListener('click', () => {
  // Placeholder: no action on click
});

async function loadTerrainForHex(hexId) {
  const outputArea = document.getElementById('outputArea');
  outputArea.innerHTML = `<p>Loading terrain information...</p>`;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/hexterrains?select=terrain:terrains(terrainname,terraindescription)&hexid=eq.${hexId}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await res.json();

  const terrainHTML = Array.isArray(data) && data.length > 0
    ? data.map(entry => `
        <div class="terrain-block">
          <h2>${entry.terrain.terrainname}</h2>
          <p>${entry.terrain.terraindescription}</p>
        </div>
      `).join("")
    : `<p>No terrain found for this hex.</p>`;

  // Keep terrain visible and clear mountains (if needed)
  outputArea.innerHTML = `
    <div class="terrain-container">
      ${terrainHTML}
    </div>
    <div class="mountains-block" id="mountains-block"></div>
  `;
}

async function loadMountainHexes(hexName, weather) {
  if (!hexName || !weather) return;

  const radius = weather === "clear" ? 2 : 1;
  const nearbyNames = getNeighborHexNames(hexName, radius);
  if (nearbyNames.length === 0) return;

  const nameFilter = nearbyNames.map(n => `hexname.eq.${n}`).join(',');
  const queryURL = `${SUPABASE_URL}/rest/v1/hexes?or=(${nameFilter})&hasmountains=eq.true`;

  const mountainRes = await fetch(queryURL, {
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

  // Inject only into the mountain block
  const mountEl = document.getElementById('mountains-block');
  if (mountEl) {
    mountEl.innerHTML = mountainHTML;
  }
}

// Initial population
populateHexes();
