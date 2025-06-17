const SUPABASE_URL = 'https://hhattfmstvpkcsquywpd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXR0Zm1zdHZwa2NzcXV5d3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODUyOTEsImV4cCI6MjA2NTc2MTI5MX0.oUHaqgRpM8RPiOE-Y_LeGkohdhUCkBvpaNojWJofbZw';

const hexSelect = document.getElementById('hexSelect');
const weatherSelect = document.getElementById('weatherSelect');
const watchSelect = document.getElementById('watchSelect');
const rollButton = document.getElementById('rollButton');

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

  document.getElementById('outputArea').innerHTML = `<p>Loading terrain information...</p>`;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/hexterrains?select=terrain:terrains(terrainname,terraindescription)&hexid=eq.${hexId}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    document.getElementById('outputArea').innerHTML = `<p>No terrain found for this hex.</p>`;
    return;
  }

  const terrainHTML = data.map(entry => {
    const terrain = entry.terrain;
    return `
      <div class="terrain-block">
        <h2>${terrain.terrainname}</h2>
        <p>${terrain.terraindescription}</p>
      </div>
    `;
  }).join("");

  document.getElementById('outputArea').innerHTML = `
    <div class="terrain-container">
      ${terrainHTML}
    </div>
  `;
});

// Initial population
populateHexes();
