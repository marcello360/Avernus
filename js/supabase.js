const SUPABASE_URL = 'https://hhattfmstvpkcsquywpd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXR0Zm1zdHZwa2NzcXV5d3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODUyOTEsImV4cCI6MjA2NTc2MTI5MX0.oUHaqgRpM8RPiOE-Y_LeGkohdhUCkBvpaNojWJofbZw'; 

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export async function populateHexes() {
  const hexSelect = document.getElementById('hexSelect');
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/hexes?select=id,hexname`, { headers });
  const hexes = await res.json();
  
  if (!hexes || !Array.isArray(hexes)) {
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/hexterrains?select=terrain:terrains(terrainname,terraindescription,foragedc,navigationdc,tracklessspeed,roadspeed,conditionid)&hexid=eq.${hexId}`, { headers });
  return await res.json();
}

export async function fetchCondition(conditionId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/conditions?select=*&id=eq.${conditionId}`, { headers });
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

  const hexFilters = hexNames.map(name => `hexname.eq.${name}`).join(',');
  const hexUrl = `${SUPABASE_URL}/rest/v1/hexes?select=id,hexname&or=(${hexFilters})`;
  
  const hexRes = await fetch(hexUrl, { headers });
  const hexes = await hexRes.json();
  
  if (!hexes || hexes.length === 0) return [];
  
  const hexIds = hexes.map(h => h.id);
  const idFilters = hexIds.map(id => `hexid.eq.${id}`).join(',');
  const terrainUrl = `${SUPABASE_URL}/rest/v1/hexterrains?select=hexid,terrainid&or=(${idFilters})`;
  
  const terrainRes = await fetch(terrainUrl, { headers });
  const terrains = await terrainRes.json();
  
  const volcanoHexIds = terrains
    .filter(t => t.terrainid === 9)
    .map(t => t.hexid);
  
  const result = hexes.filter(h => volcanoHexIds.includes(h.id));
  
  return result;
}

export async function fetchLocations(hexId) {
  if (!hexId) return [];
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=id,locationname,locationdescription&hexid=eq.${hexId}`, { headers });
  return await res.json();
}
