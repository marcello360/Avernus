const SUPABASE_URL = 'https://hhattfmstvpkcsquywpd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXR0Zm1zdHZwa2NzcXV5d3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODUyOTEsImV4cCI6MjA2NTc2MTI5MX0.oUHaqgRpM8RPiOE-Y_LeGkohdhUCkBvpaNojWJofbZw';

const hexSelect = document.getElementById('hexSelect');
const weatherSelect = document.getElementById('weatherSelect');
const watchSelect = document.getElementById('watchSelect');
const rollButton = document.getElementById('rollButton');

// Fetch es from Supabase
async function populatees() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/hexes?select=hexname`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  const hexes = await res.json();

  hexes.forEach(hex => {
    const option = document.createElement('option');
    option.value = hex.hexname;
    option.textContent = hex.hexname;
    hexSelect.appendChild(option);
  });
}

// Enable button only when all selects are filled
function checkSelections() {
  const weather = weatherSelect.value;
  const watch = watchSelect.value;
  const hex = hexSelect.value;

  rollButton.disabled = !(weather && watch && hex);
}

// Event listeners
weatherSelect.addEventListener('change', checkSelections);
watchSelect.addEventListener('change', checkSelections);
hexSelect.addEventListener('change', checkSelections);

rollButton.addEventListener('click', () => {
  // Placeholder for logic to come
  const weather = weatherSelect.value;
  const watch = watchSelect.value;
  const hex = hexSelect.value;

  document.getElementById('outputArea').innerHTML = `
    <h2>Watch Roll Input</h2>
    <p><strong>Weather:</strong> ${weather}</p>
    <p><strong>Watch Type:</strong> ${watch}</p>
    <p><strong>:</strong> ${hex}</p>
    <p><em>Rolling functionality coming soon...</em></p>
  `;
});

populatees();
