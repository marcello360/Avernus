const SUPABASE_URL = 'https://hhattfmstvpkcsquywpd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXR0Zm1zdHZwa2NzcXV5d3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODUyOTEsImV4cCI6MjA2NTc2MTI5MX0.oUHaqgRpM8RPiOE-Y_LeGkohdhUCkBvpaNojWJofbZw'; 

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

export async function populateHexes() {
  const hexSelect = document.getElementById('hexSelect');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/hexes?select=id,hexname`, { headers });
  const hexes = await res.json();

  if (!Array.isArray(hexes)) {
    console.error("Hex fetch failed:", hexes);
    return;
  }

  hexes.sort((a, b) => a.hexname.localeCompare(b.hexname));

  hexes.forEach(hex => {
    const option = document.createElement('option');
    option.value = hex.id;
    option.textContent = hex.hexname;
    hexSelect.appendChild(option);
  });
}

export async function fetchTerrain(hexId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/hexterrains?select=terrain:terrains(terrainname,terraindescription)&hexid=eq.${hexId}`, { headers });
  return await res.json();
}

export async function fetchMountainHexes(hexNames) {
  if (!hexNames || hexNames.length === 0) return [];

  const filters = hexNames.map(name => `hexname.eq.${name}`).join(',');
  const url = `${SUPABASE_URL}/rest/v1/hexes?or=(${filters})&hasmountains=eq.true`;

  const res = await fetch(url, { headers });
  return await res.json();
}

export async function fetchVolcanoHexes(hexNames) {
  if (!hexNames || hexNames.length === 0) return [];

  const filters = hexNames.map(name => `hexname.eq.${name}`).join(',');
  const url = `${SUPABASE_URL}/rest/v1/hexterrains?or=(${filters})&terrainid=eq.9`;
  
  const res = await fetch(url, { headers });
  return await res.json();
}
