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
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=id,locationname,locationdescription,onpit,onriver&hexid=eq.${hexId}`, { headers });
  return await res.json();
}

export async function fetchEncountersByType(encounterId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/encounters?select=*&encountertypeid=eq.${encounterId}`, { headers });
  return await res.json();
}

export async function fetchEncounterById(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/encounters?select=*&id=eq.${id}`, { headers });
  return await res.json();
}

export async function fetchEncounterByRange(min, max, encounterTypeId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/encounters?select=*&encountertypeid=eq.${encounterTypeId}&minroll=lte.${max}&maxroll=gte.${min}`, { headers });
  const data = await res.json();
  return data;
}

export async function fetchFactions(factionTypeId, minRoll) {
  if (minRoll) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/factions?select=*&factiontypeid=eq.${factionTypeId}&minroll=eq.${minRoll}`, { headers });
    return await res.json();
  } else {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/factions?select=*&factiontypeid=eq.${factionTypeId}`, { headers });
    return await res.json();
  }
}

export async function fetchFactionByRange(min, max, factionTypeId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/factions?select=*&factiontypeid=eq.${factionTypeId}&minroll=lte.${max}&maxroll=gte.${min}`, { headers });
  return await res.json();
}

export async function fetchHexInfo(hexId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/hexes?select=*&id=eq.${hexId}`, { headers });
    const hexData = await res.json();
    
    if (hexData && hexData.length > 0) {
      hexData[0].terrains = [];
      
      try {
        const terrainRelRes = await fetch(`${SUPABASE_URL}/rest/v1/hexterrains?select=terrainid&hexid=eq.${hexId}`, { headers });
        
        if (terrainRelRes.ok) {
          const terrainRelations = await terrainRelRes.json();
          
          if (Array.isArray(terrainRelations) && terrainRelations.length > 0) {
            const terrainIds = terrainRelations.map(relation => relation.terrainid);
            hexData[0].terrains = terrainIds;
          }
        }
      } catch (terrainError) {
        console.error(`Error fetching terrain relations for hex ${hexId}:`, terrainError);
      }
    } else {
      console.warn(`No hex found with ID ${hexId}`);
    }
    
    return hexData;
  } catch (error) {
    console.error(`Error in fetchHexInfo for hex ${hexId}:`, error);
    return [];
  }
}

export async function fetchTerrainInfo(terrainId) {
  if (terrainId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/terrains?select=*&id=eq.${terrainId}`, { headers });
    return await res.json();
  } else {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/terrains?select=*`, { headers });
    return await res.json();
  }
}

export async function rollForAllegiance() {
  const roll = Math.floor(Math.random() * 20) + 1;
  let allegiance = '';
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/factions`, { headers });
    
    const factions = await response.json();
    
    if (roll >= 1 && roll <= 5) {
      const warlordRoll = Math.floor(Math.random() * 7) + 1;
      const warlordFaction = factions.find(f => f.factiontypeid === 2 && f.minroll === warlordRoll);
      
      if (warlordFaction) {
        allegiance = `Warlord: ${warlordFaction.factionname}`;
      }
    } else {
      const allegianceFaction = factions.find(f => f.factiontypeid === 3 && roll >= f.minroll && roll <= f.maxroll);
      
      if (allegianceFaction) {
        allegiance = allegianceFaction.factionname;
      }
    }
  } catch (error) {
    console.error('Error rolling for allegiance:', error);
  }
  
  return allegiance;
}
