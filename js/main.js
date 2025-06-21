import { populateHexes, fetchTerrain, fetchMountainHexes, fetchVolcanoHexes, fetchCondition, fetchLocations, fetchEncountersByType, fetchEncounterById, fetchEncounterByRange, fetchFactions, fetchFactionByRange, fetchHexInfo, fetchTerrainInfo } from './supabase.js';
import { getNeighborHexes } from './hexmath.js';
import { renderTerrain, renderFeatureHexes, updateConditionCard, renderLocations, renderEncounterCard, clearEncounterCards } from './ui.js';

const hexSelect = document.getElementById('hexSelect');
const restrictedHexes = ['D5', 'E5', 'F5'];
const weatherSelect = document.getElementById('weatherSelect');
const weatherRollButton = document.getElementById('weatherRollButton');
const watchSelect = document.getElementById('watchSelect');
const rollButton = document.getElementById('rollButton');

let currentTerrainData = [];

function checkSelections() {
  const filled = weatherSelect.value && watchSelect.value && hexSelect.value;
  rollButton.disabled = !filled;
}

let originalWeatherValue = null;

function saveCardStates() {
  const cardStates = {};
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card, index) => {
    cardStates[`card-${index}`] = card.classList.contains('expanded');
  });
  
  return cardStates;
}

function restoreCardStates(savedStates) {
  if (!savedStates) return;
  
  const cards = document.querySelectorAll('.card');

  cards.forEach((card, index) => {
    const identifier = `card-${index}`;
    if (savedStates[identifier]) {
      card.classList.add('expanded');
    }
  });
}

let lastSelectedHexId = null;

async function onHexChange() {
  const hexId = hexSelect.value;
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
  const previousHexId = lastSelectedHexId;
  
  lastSelectedHexId = hexId;
  localStorage.setItem('selectedHexId', hexId);
  const savedCardStates = saveCardStates();
  
  const revealAllLocationsButton = document.getElementById('revealAllLocationsButton');
  revealAllLocationsButton.disabled = !hexId;

  if (previousHexId !== null && previousHexId !== hexId) {
    clearEncounterCards();
    clearSavedEncounters(); // Also clear saved encounters from localStorage
  }

  if (hexId) {
    const [terrainData, locationsData, hexResponse] = await Promise.all([
      fetchTerrain(hexId),
      fetchLocations(hexId),
      fetchHexInfo(hexId)
    ]);
    
    const hexInfo = hexResponse && hexResponse.length > 0 ? hexResponse[0] : null;
    if (hexInfo && hexInfo.hasstyx === false) {
      const followingStyxCheck = document.getElementById('followingStyxCheck');
      followingStyxCheck.checked = false;
      localStorage.setItem('followingStyxChecked', false);
    }
    
    currentTerrainData = terrainData;
    localStorage.setItem('currentTerrainData', JSON.stringify(terrainData));
    
    renderTerrain(terrainData);
    renderLocations(locationsData);
  }
  
  const restrictedHexes = ['D5', 'E5', 'F5'];
  const maintainCondition = document.getElementById('maintainConditionCheck').checked;
  
  if (hexName && restrictedHexes.includes(hexName)) {
    if (originalWeatherValue === null) {
      originalWeatherValue = weatherSelect.value;
    }
    
    weatherSelect.value = 'typical';
    weatherSelect.disabled = true;
    weatherRollButton.disabled = true;
  } else if (originalWeatherValue !== null && !restrictedHexes.includes(hexName)) {
    weatherSelect.value = originalWeatherValue;
    weatherSelect.disabled = false;
    weatherRollButton.disabled = false;
    originalWeatherValue = null;
  }

  if (hexId && weatherSelect.value) {
    const nearby = getNeighborHexes(hexName, weatherSelect.value);
    const mountainData = await fetchMountainHexes(nearby);
    const volcanoData = await fetchVolcanoHexes(nearby);
    
    renderFeatureHexes(nearby, mountainData, volcanoData, weatherSelect.value);
    setTimeout(() => restoreCardStates(savedCardStates), 0);
  }
}

async function onWeatherChange() {
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
  const weather = weatherSelect.value;
  
  localStorage.setItem('selectedWeather', weather);
  const savedCardStates = saveCardStates();

  if (hexName && weather) {
    const nearby = getNeighborHexes(hexName, weather);
    
    const mountainData = await fetchMountainHexes(nearby);
    const volcanoData = await fetchVolcanoHexes(nearby);
    
    renderFeatureHexes(nearby, mountainData, volcanoData, weather);
    
    const encounterContainer = document.getElementById('encounter-container');
    if (encounterContainer) {
      setTimeout(() => restoreCardStates(savedCardStates), 0);
    }
  }
}

function showToast(message) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000); // 3 seconds to match animation duration
}

function rollWeather() {
  if (weatherSelect.disabled) return;  

  weatherRollButton.classList.add('rolling');  
  const roll = Math.floor(Math.random() * 6) + 1;  
  const newWeather = roll === 1 ? 'clear' : 'typical';
  
  setTimeout(() => {
    weatherSelect.value = newWeather;
    
    const event = new Event('change');
    weatherSelect.dispatchEvent(event);
    weatherRollButton.classList.remove('rolling');
    
    showToast(`Rolled ${roll} (${newWeather} weather)`);
  }, 300);
}

function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  const darkModeIcon = document.getElementById('darkModeIcon');
  
  darkModeIcon.textContent = isDarkMode ? '☀️' : '🌙';
  
  localStorage.setItem('darkModeEnabled', isDarkMode);
}

function saveEncounterToLocalStorage(encounter) {
  try {
    let savedEncounters = [];
    const savedEncountersStr = localStorage.getItem('savedEncounters');
    
    if (savedEncountersStr) {
      savedEncounters = JSON.parse(savedEncountersStr);
    }
    
    const existingIndex = savedEncounters.findIndex(e => e.id === encounter.id);
    if (existingIndex >= 0) {
      savedEncounters[existingIndex] = encounter;
    } else {
      savedEncounters.push(encounter);
    }
    
    localStorage.setItem('savedEncounters', JSON.stringify(savedEncounters));
  } catch (error) {
    console.error('Error saving encounter to localStorage:', error);
  }
}

function restoreSavedEncounters() {
  try {
    const savedEncountersStr = localStorage.getItem('savedEncounters');
    
    if (savedEncountersStr) {
      const savedEncounters = JSON.parse(savedEncountersStr);
      
      if (Array.isArray(savedEncounters) && savedEncounters.length > 0) {
        setTimeout(() => {
          renderEncounterCard(savedEncounters);
          
          const encounterContainer = document.getElementById('encounter-container');
          if (encounterContainer) {
            encounterContainer.style.display = 'block';
            
            const visibilityCard = document.querySelector('.visibility-card');
            
            if (visibilityCard) {
              encounterContainer.remove();
              visibilityCard.after(encounterContainer);
            }
          }
        }, 300);
      }
    }
  } catch (error) {
    console.error('Error restoring encounters from localStorage:', error);
  }
}

function clearSavedEncounters() {
  localStorage.removeItem('savedEncounters');
  clearEncounterCards();
}

async function restoreUIState() {
  const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
  if (darkModeEnabled) {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeIcon').textContent = '☀️';
  }
  
  const savedHexId = localStorage.getItem('selectedHexId');
  if (savedHexId && hexSelect.querySelector(`option[value="${savedHexId}"]`)) {
    hexSelect.value = savedHexId;
  }
  
  const savedWeather = localStorage.getItem('selectedWeather');
  if (savedWeather && (savedWeather === 'typical' || savedWeather === 'clear')) {
    weatherSelect.value = savedWeather;
  }
  
  const savedWatchType = localStorage.getItem('selectedWatchType');
  if (savedWatchType && watchSelect.querySelector(`option[value="${savedWatchType}"]`)) {
    watchSelect.value = savedWatchType;
  }
  
  const maintainConditionChecked = localStorage.getItem('maintainConditionChecked');
  if (maintainConditionChecked !== null) {
    document.getElementById('maintainConditionCheck').checked = maintainConditionChecked === 'true';
  }
  
  const followingStyxChecked = localStorage.getItem('followingStyxChecked');
  if (followingStyxChecked !== null) {
    document.getElementById('followingStyxCheck').checked = followingStyxChecked === 'true';
  }
  
  const explorationModeChecked = localStorage.getItem('explorationModeChecked');
  if (explorationModeChecked !== null) {
    document.getElementById('explorationModeCheck').checked = explorationModeChecked === 'true';
  } else {
    document.getElementById('explorationModeCheck').checked = false;
  }
  
  const savedTerrainData = localStorage.getItem('currentTerrainData');
  if (savedTerrainData) {
    try {
      currentTerrainData = JSON.parse(savedTerrainData);
    } catch (error) {
      console.error('Error parsing saved terrain data:', error);
      currentTerrainData = [];
    }
  }
  
  restoreSavedEncounters();
}

window.hideLocation = function(locationId, hexName) {
  let visibleLocationIds = [];
  try {
    const storedIds = localStorage.getItem(`visibleLocations_${hexName}`);
    if (storedIds) {
      visibleLocationIds = JSON.parse(storedIds);
    }
  } catch (e) {
    console.error('Error parsing visible locations:', e);
  }
  
  visibleLocationIds = visibleLocationIds.filter(id => id !== locationId);
  localStorage.setItem(
    `visibleLocations_${hexName}`,
    JSON.stringify(visibleLocationIds)
  );
  
  const hexSelect = document.getElementById('hexSelect');
  const currentHexId = hexSelect.value;
  fetchLocations(currentHexId).then(locations => {
    renderLocations(locations);
  });
};

export async function initializeApp() {
  await populateHexes();
  
  document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

  function handleMaintainConditionChange() {
    const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    const maintainCondition = document.getElementById('maintainConditionCheck').checked;
    
    localStorage.setItem('maintainConditionChecked', maintainCondition);
     
    if (hexName && restrictedHexes.includes(hexName)) {
      if (originalWeatherValue === null) {
        originalWeatherValue = weatherSelect.value;
      }
      
      weatherSelect.value = 'typical';
      weatherSelect.disabled = true;
      weatherRollButton.disabled = true;
      
      onWeatherChange();
    } else if (originalWeatherValue !== null) {
      weatherSelect.value = originalWeatherValue;
      weatherSelect.disabled = false;
      weatherRollButton.disabled = false;
      originalWeatherValue = null;
      
      onWeatherChange();
    }
    
    updateConditionCard();
  }
  
  function handleFollowingStyxChange() {
    const followingStyx = document.getElementById('followingStyxCheck').checked;
    localStorage.setItem('followingStyxChecked', followingStyx);
  }
  
  function handleExplorationModeChange() {
    const explorationMode = document.getElementById('explorationModeCheck').checked;
    localStorage.setItem('explorationModeChecked', explorationMode);
  }
  
  document.getElementById('maintainConditionCheck').addEventListener('change', handleMaintainConditionChange);
  document.getElementById('followingStyxCheck').addEventListener('change', handleFollowingStyxChange);
  document.getElementById('explorationModeCheck').addEventListener('change', handleExplorationModeChange);

  const revealAllLocationsButton = document.getElementById('revealAllLocationsButton');
  revealAllLocationsButton.addEventListener('click', async function() {
    const hexId = hexSelect.value;
    const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    
    if (!hexId || !hexName) return;
    
    const locationsData = await fetchLocations(hexId);
    
    if (Array.isArray(locationsData) && locationsData.length > 0) {
      const visibleLocationIds = locationsData.map(loc => loc.id);
      localStorage.setItem(
        `visibleLocations_${hexName}`,
        JSON.stringify(visibleLocationIds)
      );
      
      renderLocations(locationsData);
      showToast(`All locations in ${hexName} revealed`);
    } else {
      showToast('No locations found in this hex');
    }
  });

  watchSelect.addEventListener('change', () => {
    checkSelections();
    localStorage.setItem('selectedWatchType', watchSelect.value);
  });
  hexSelect.addEventListener('change', () => {
    checkSelections();
    onHexChange();
  });

  weatherSelect.addEventListener('change', () => {
    checkSelections();
    onWeatherChange();
  });
  
  weatherRollButton.addEventListener('click', rollWeather);

  rollButton.addEventListener('click', rollForCondition);
  
  async function updateConditionStatus(hasCondition, conditionId = null) {
    localStorage.setItem('hasCondition', hasCondition);
    
    const maintainConditionCheck = document.getElementById('maintainConditionCheck');
    if (hasCondition && conditionId !== null) {
      maintainConditionCheck.checked = !(conditionId === 6 || conditionId === 10);
    } else {
      maintainConditionCheck.checked = hasCondition;
    }
    
    if (!hasCondition) {
      localStorage.removeItem('conditionName');
      localStorage.removeItem('conditionDescription');
      localStorage.removeItem('conditionId');
      
      updateConditionCard();
      return;
    }
    
    if (!conditionId) {
      return;
    }
    
    try {
      const conditionData = await fetchCondition(conditionId);
      
      if (conditionData && conditionData.length > 0) {
        const condition = conditionData[0];
        
        localStorage.setItem('conditionName', condition.conditionname);
        localStorage.setItem('conditionDescription', condition.conditiondescription);
        localStorage.setItem('conditionId', condition.id);
        
        updateConditionCard();
      }
    } catch (error) {
      console.error('Error fetching condition:', error);
    }
  }
  
  async function rollForCondition() {
    const maintainCondition = document.getElementById('maintainConditionCheck').checked;
    rollButton.classList.add('rolling');
    const roll = Math.floor(Math.random() * 6) + 1;
    
    setTimeout(async () => {
      rollButton.classList.remove('rolling');
      let toastMessage = '';
      
      // Handle condition roll
      if (maintainCondition) {
        const conditionEnded = roll === 1;
        
        if (conditionEnded) {
          toastMessage = `Condition ended`;
          await updateConditionStatus(false);
        } else {
          toastMessage = `Condition Roll: ${roll} - Maintained`;
        }
      } else {
        const hasCondition = roll === 1;
        
        if (hasCondition) {
          toastMessage = `New Condition triggered`;
          await rollForSpecificCondition();
        } else {
          toastMessage = `Condition Roll: ${roll}`;
          await updateConditionStatus(false);
        }
      }
      
      // Handle location roll
      const locationRoll = await rollForLocation();
      if (locationRoll.message) {
        toastMessage += `<br>${locationRoll.message}`;
      }
      
      // Roll for encounters
      const encounterResult = await rollForEncounter();
      if (encounterResult.message) {
        toastMessage += `<br>${encounterResult.message}`;
      }
      
      // Render encounter cards if encounters were generated
      if (encounterResult.hasEncounter && encounterResult.encounters && encounterResult.encounters.length > 0) {
        // Use renderEncounterCard to render the encounters
        renderEncounterCard(encounterResult.encounters);
      }
      
      showToast(toastMessage);
    }, 300); // Match animation duration
  }
  
  async function rollForLocation() {
    const hexSelect = document.getElementById('hexSelect');
    const currentHexId = hexSelect.value;
    const currentHex = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    const explorationMode = document.getElementById('explorationModeCheck').checked;
    
    const visibilityExceptions = ['C2', 'F4', 'J6']; //Locations always visible
    const isExceptionHex = visibilityExceptions.includes(currentHex);
    
    if (isExceptionHex) {
      return { revealed: false, message: '' };
    }
    
    const locations = await fetchLocations(currentHexId);
    if (!locations || locations.length === 0) {
      return { revealed: false, message: '' };
    }
    
    let visibleLocationIds = [];
    try {
      const storedIds = localStorage.getItem(`visibleLocations_${currentHex}`);
      if (storedIds) {
        visibleLocationIds = JSON.parse(storedIds);
      }
    } catch (e) {
      console.error('Error parsing visible locations:', e);
    }
    
    const hiddenLocations = locations.filter(loc => !visibleLocationIds.includes(loc.id));
    
    if (hiddenLocations.length === 0) {
      return { revealed: false, message: '' };
    }
    
    const dieMax = explorationMode ? 6 : 12;
    const roll = Math.floor(Math.random() * dieMax) + 1;
    let message = ``;
    
    if (roll === 1 && hiddenLocations.length > 0) {
      const randomIndex = Math.floor(Math.random() * hiddenLocations.length);
      const locationToReveal = hiddenLocations[randomIndex];
      
      visibleLocationIds.push(locationToReveal.id);
      localStorage.setItem(
        `visibleLocations_${currentHex}`,
        JSON.stringify(visibleLocationIds)
      );
      
      message = `Location revealed: ${locationToReveal.locationname}`;
      
      renderLocations(locations);
      
      return { revealed: true, message };
    }
    
    message = `Location roll: ${roll}`;
    return { revealed: false, message };
  }
  
  async function rollForSpecificCondition() {
    const d12Roll = Math.floor(Math.random() * 12) + 1;
    let conditionId;
    
    if (d12Roll >= 1 && d12Roll <= 3) {
      conditionId = 1;
    } else if (d12Roll >= 4 && d12Roll <= 6) {
      conditionId = 2;
    } else if (d12Roll >= 7 && d12Roll <= 9) {
      conditionId = 3;
    } else if (d12Roll === 10) {
      conditionId = 4;
    } else if (d12Roll === 11) {
      conditionId = 5;
    } else if (d12Roll === 12) {
      conditionId = await getTerrainConditionId();
    }
    
    await updateConditionStatus(true, conditionId);
  }
  
  async function getTerrainConditionId() {
    let conditionId = 1;
    
    const hexId = hexSelect.value;
    
    if (hexId && currentTerrainData && currentTerrainData.length > 0) {
      const terrainsWithConditions = currentTerrainData
        .filter(entry => entry.terrain && entry.terrain.conditionid);
      
      if (terrainsWithConditions.length > 0) {
        // Pick a random terrain from the available options
        const randomTerrainIndex = Math.floor(Math.random() * terrainsWithConditions.length);
        const randomTerrain = terrainsWithConditions[randomTerrainIndex];
        
        conditionId = randomTerrain.terrain.conditionid;
      }
    }
    
    return conditionId;
  }
  
  async function rollForEncounter() {
    clearEncounterCards();
    clearSavedEncounters();
    
    const hexId = hexSelect.value;
    const selectedIndex = hexSelect.selectedIndex;
    const hexName = hexSelect.options[selectedIndex]?.textContent || '';
    const followingStyx = document.getElementById('followingStyxCheck').checked;
    const watchType = document.getElementById('watchSelect').value;
    const explorationMode = document.getElementById('explorationModeCheck').checked;
    
    let roll1, roll2, message;
    
    if (explorationMode) {
      // Use 2d5 for exploration mode
      roll1 = Math.floor(Math.random() * 5) + 1; // 1d5
      roll2 = Math.floor(Math.random() * 5) + 1; // 1d5
      message = `Encounter Roll: ${roll1}, ${roll2}`;
      
      if (roll1 === 1 && roll2 === 1) {
        message = "New Encounter triggered (Double 1s)";
        const encounter1 = await resolveNormalEncounter(hexId, hexName, followingStyx, watchType);
        const encounter2 = await resolveNormalEncounter(hexId, hexName, followingStyx, watchType);
        if (encounter1 && encounter2) {
          return { hasEncounter: true, message, encounters: [encounter1, encounter2] };
        }
      } else if (roll1 === 1 || roll2 === 1) {
        message = "New Encounter triggered";
        const encounter = await resolveNormalEncounter(hexId, hexName, followingStyx, watchType);
        if (encounter) {
          return { hasEncounter: true, message, encounters: [encounter] };
        }
      } else if (roll1 === roll2) {
        message = "New Encounter triggered";
        const encounter = await resolveSpecialEncounter();
        if (encounter) {
          return { hasEncounter: true, message, encounters: [encounter] };
        }
      }
    } else {
      // Use 2d10 for normal mode (non-exploration)
      roll1 = Math.floor(Math.random() * 10) + 1;
      roll2 = Math.floor(Math.random() * 10) + 1;
      message = `Encounter Roll: ${roll1}, ${roll2}`;
      
      if (roll1 === 1 && roll2 === 1) {
        message = "New Encounter triggered";
        const encounter1 = await resolveNormalEncounter(hexId, hexName, followingStyx, watchType);
        const encounter2 = await resolveNormalEncounter(hexId, hexName, followingStyx, watchType);
        if (encounter1 && encounter2) {
          return { hasEncounter: true, message, encounters: [encounter1, encounter2] };
        }
      } else if (roll1 === 1 || roll2 === 1) {
        message = "New Encounter triggered";
        const encounter = await resolveNormalEncounter(hexId, hexName, followingStyx, watchType);
        if (encounter) {
          return { hasEncounter: true, message, encounters: [encounter] };
        }
      } else if (roll1 === roll2) {
        message = "New Encounter triggered";
        const encounter = await resolveSpecialEncounter();
        if (encounter) {
          return { hasEncounter: true, message, encounters: [encounter] };
        }
      }
    }
    
    return { hasEncounter: false, message };
  }
  
  async function resolveSpecialEncounter() {
    const d30Roll = Math.floor(Math.random() * 30) + 1;
    let encounter = await fetchEncounterById(d30Roll, 1); // Type 1 = special encounters
    
    if (encounter) {
      // Special case for roll of Elturians - attach a faction
      if (d30Roll === 30) {
        const d8Roll = Math.floor(Math.random() * 8) + 1;
        const faction = await fetchFactionByRange(d8Roll, d8Roll, 1); // Type 1 = factions
        
        if (faction) {
          encounter = {
            ...encounter,
            title: `${encounter.title} (${faction.title})`,
            description: `${encounter.description}\n\nFaction: ${faction.description}`
          };
        }
      }
      
      return processEncounterDetails(encounter, null, null);
    }
    
    return null;
  }
  
  async function resolveNormalEncounter(hexId, hexName, followingStyx, watchType) {
    try {
      const hexResponse = await fetchHexInfo(hexId);
      const hexInfo = hexResponse && hexResponse.length > 0 ? hexResponse[0] : null;
      
      if (hexInfo && hexInfo.hasstyx && followingStyx) {
        const riverRoll = Math.floor(Math.random() * 2) + 1;
        
        if (riverRoll === 1) {
          const styxRoll = Math.floor(Math.random() * 20) + 1;
          const encounter = await fetchEncounterByRange(styxRoll, styxRoll, 3); // Type 3 = Styx encounters
          
          if (encounter) {
            return processEncounterDetails(encounter, hexInfo, watchType);
          }
        }
      }
      
      const mainRoll = Math.floor(Math.random() * 100) + 1;
      
      if (mainRoll >= 1 && mainRoll <= 5) {
        const environmentRoll = Math.floor(Math.random() * 12) + 1;
        
        if (environmentRoll >= 10 && environmentRoll <= 12) {
          await rollForSpecificCondition();
          return;
        }
        
        const encounter = await fetchEncounterByRange(environmentRoll, environmentRoll, 4); // Type 4 = environment encounters
        if (encounter) {
          return processEncounterDetails(encounter, hexInfo, watchType);
        }
      }
      else if (mainRoll >= 73 && mainRoll <= 87) {
        return await resolveWarlordEncounter(hexInfo, watchType);
      }
      else if (mainRoll >= 96 && mainRoll <= 100) {
        const devilRoll = Math.floor(Math.random() * 12) + 1;
        const encounter = await fetchEncounterByRange(devilRoll, devilRoll, 5); // Type 5 = devil encounters
        
        if (encounter) {
          return processEncounterDetails(encounter, hexInfo, watchType);
        }
      }
      else {
        const encounter = await fetchEncounterByRange(mainRoll, mainRoll, 2); // Type 2 = normal encounters
        
        if (encounter) {
          return processEncounterDetails(encounter, hexInfo, watchType);
        }
      }
    } catch (error) {
      console.error("Error resolving normal encounter:", error);
    }
    
    return null;
  }
  
  async function resolveWarlordEncounter(hexInfo, watchType) {
    const warlordRoll = Math.floor(Math.random() * 8) + 1;
    
    let factions = [];
    
    if (warlordRoll === 8) {
      
      const firstRoll = Math.floor(Math.random() * 7) + 1; // 1-7
      const secondRoll = Math.floor(Math.random() * 7) + 1; // 1-7
            
      const faction1 = await fetchFactionByRange(firstRoll, firstRoll, 2); // Type 2 = warlord factions
      const faction2 = await fetchFactionByRange(secondRoll, secondRoll, 2); 
      
      if (faction1 && faction1[0]) factions.push(faction1[0]);
      if (faction2 && faction2[0]) factions.push(faction2[0]);
    } else {
      const faction = await fetchFactionByRange(warlordRoll, warlordRoll, 2); // Type 2 = warlord factions
      if (faction && faction[0]) factions.push(faction[0]);
    }
    
    if (factions.length > 0) {
      let description = '';
      let name = '';
      
      const hasWarlord1 = Math.random() < 0.25;
      const hasWarlord2 = Math.random() < 0.25;
            
      if (factions.length === 1) {
        name = `Warlord Faction: ${factions[0].factionname || 'Unknown Faction'}${hasWarlord1 ? ' (Warlord present)' : ''}`;
      } else if (factions.length === 2) {
        name = `Warlord Faction: ${factions[0].factionname || 'Unknown Faction'}${hasWarlord1 ? ' (Warlord present)' : ''} and Warlord Faction: ${factions[1].factionname || 'Unknown Faction'}${hasWarlord2 ? ' (Warlord present)' : ''}`;
      }
      
      const encounter = {
        encountername: name,
        encounterdescription: description,
        isSpecialEncounter: true, // Mark as special encounter so it's treated differently in the UI
        isWarlord: true
      };
      
      return processEncounterDetails(encounter, hexInfo, watchType);
    }
    
    return null;
  }
  
  async function processEncounterDetails(encounter, hexInfo, watchType) {
    const baseEncounter = Array.isArray(encounter) && encounter[0] ? encounter[0] : encounter;
    const tracksRoll = Math.floor(Math.random() * 100) + 1;
    const lairRoll = Math.floor(Math.random() * 100) + 1;
    
    let encounterClass = "Wandering";
    let tracksAge = null;
    let reaction = null;
    let deceptiveReaction = false;
    let encounterId = baseEncounter.id || Date.now().toString();
    
    if (baseEncounter.trackspercentage && (tracksRoll / 100) <= baseEncounter.trackspercentage) {
      encounterClass = "Tracks";
      tracksAge = Math.floor(Math.random() * 10) + 1;
    } 
    else if (baseEncounter.lairpercentage && (lairRoll / 100) <= baseEncounter.lairpercentage) {
      encounterClass = "Lair";
    }
    
    if (watchType === "rest" && (encounterClass === "Tracks" || encounterClass === "Lair")) {
      return null;
    }
    
    {
      const reactionRoll1 = Math.floor(Math.random() * 6) + 1;
      const reactionRoll2 = Math.floor(Math.random() * 6) + 1;
      const reactionTotal = reactionRoll1 + reactionRoll2;
      
      if (reactionRoll1 === reactionRoll2) {
        deceptiveReaction = true;
      }
      
      if (reactionTotal >= 2 && reactionTotal <= 3) {
        reaction = "Immediate Attack";
      } else if (reactionTotal >= 4 && reactionTotal <= 5) {
        reaction = "Hostile";
      } else if (reactionTotal >= 6 && reactionTotal <= 8) {
        reaction = "Cautious/Threatening";
      } else if (reactionTotal >= 9 && reactionTotal <= 10) {
        reaction = "Neutral";
      } else if (reactionTotal >= 11 && reactionTotal <= 12) {
        reaction = "Amiable";
      }
      
      if (deceptiveReaction) {
        reaction += " (Deceptive)";
      }
    }
    
    let distance = 0;
    
    if (hexInfo) {
      const terrainResponse = await fetchTerrainInfo();
      const terrainInfo = Array.isArray(terrainResponse) ? terrainResponse : null;
      
      if (terrainInfo && terrainInfo.length > 0) {
        let hexTerrains = [];
        const possibleTerrainProps = ['terrains', 'terrain', 'terrainids', 'terrainid', 'terrain_ids'];
        const terrainNumberProps = Object.keys(hexInfo).filter(key => key.match(/^terrain\d+$/));
        
        if (terrainNumberProps.length > 0) {
          hexTerrains = terrainNumberProps.map(prop => hexInfo[prop]).filter(id => id !== null && id !== undefined);
        } 
        else {
          for (const prop of possibleTerrainProps) {
            if (hexInfo[prop] && Array.isArray(hexInfo[prop]) && hexInfo[prop].length > 0) {
              hexTerrains = hexInfo[prop];
              break;
            }
          }
        }
        
        if (hexTerrains.length === 0) {
          for (const prop of ['terrain', 'terrainid', 'terrain_id']) {
            if (hexInfo[prop] !== undefined && hexInfo[prop] !== null) {
              hexTerrains = [hexInfo[prop]];
              break;
            }
          }
        }
        
        if (hexTerrains.length === 0) {
          console.warn('No terrain data found for this hex. Distance calculation may not be accurate.');
        }
        
        const distances = [];
        
        for (const terrainId of hexTerrains) {
          const terrain = terrainInfo.find(t => t.id === terrainId);
          
          if (!terrain) {
            console.error(`No terrain found with id ${terrainId}`);
            continue;
          }
          
          if (terrain.encounterdistancedie && terrain.encounterdistancemultiplier && terrain.encounterdistancefeet) {
            let rollSum = 0;
            const rolls = [];
            
            for (let i = 0; i < terrain.encounterdistancemultiplier; i++) {
              const dieRoll = Math.floor(Math.random() * terrain.encounterdistancedie) + 1;
              rolls.push(dieRoll);
              rollSum += dieRoll;
            }
            
            let terrainDistance = rollSum * terrain.encounterdistancefeet;
            const weatherSelect = document.getElementById('weatherSelect');
            const currentWeather = weatherSelect.value;
            const doubleDistanceTerrains = [1, 7, 9]; // Ashlands, Wastelands, Volcanic Plains
            if (currentWeather === "clear" && doubleDistanceTerrains.includes(terrain.id)) {
              terrainDistance = terrainDistance * 2;
            }
            
            distances.push(terrainDistance);
          } else {
            console.warn(`Terrain ${terrainId} missing distance data:`, terrain);
          }
        }
        
        if (distances.length > 0) {
          distance = Math.min(...distances);
        } else {
          console.warn('No valid terrain distance data found for calculation');
        }
      } else {
        console.error('Failed to fetch terrain info');
      }
    } else {
      console.error('No hex info available for distance calculation');
    }
    
    const amountDie = baseEncounter.amountdie || 1;
    const amountMultiplier = baseEncounter.amountmultiplier || 1;
    const amountBonus = baseEncounter.amountbonus || 0;
    let amount = 0;
    const rolls = [];
    
    for (let i = 0; i < amountMultiplier; i++) {
      const roll = Math.floor(Math.random() * amountDie) + 1;
      rolls.push(roll);
      amount += roll;
    }

    amount += amountBonus;
    const baseEncounterData = encounter[0] || {};
    const processedEncounter = {
      ...baseEncounterData,  // Include all base properties (encountername, encounterdescription, etc.)
      ...encounter,         // Include any top-level properties
      id: encounterId,     // Ensure we have a unique ID
      encounterClass,      // Ensure calculated properties are included and take precedence
      tracksAge,
      reaction,
      deceptiveReaction,
      distance,
      amount
    };
      
    saveEncounterToLocalStorage(processedEncounter);
    return processedEncounter;
  }
  
  async function rollForAllegiance(encounterId) {
    try {
      const allegiance = document.getElementById(`allegiance-${encounterId}`);
      if (!allegiance) return null;
      
      const d20Roll = Math.floor(Math.random() * 20) + 1;
      let result = null;
      
      if (d20Roll >= 1 && d20Roll <= 5) {
        const d7Roll = Math.floor(Math.random() * 7) + 1;
        const faction = await fetchFactionByRange(d7Roll, d7Roll, 2); // Type 2 = warlord factions
        
        if (faction) {
          result = `${faction.title}: ${faction.description}`;
        }
      } 
      else {
        const faction = await fetchFactionByRange(d20Roll, d20Roll, 3); // Type 3 = allegiance factions
        
        if (faction) {
          result = `${faction.title}: ${faction.description}`;
        }
      }
      
      if (result) {
        allegiance.textContent = result;
        allegiance.style.display = 'block';
      }
      
      return result;
    } catch (error) {
      console.error("Error rolling for allegiance:", error);
      return null;
    }
  }
  
  restoreUIState();
  
  checkSelections();
  if (hexSelect.value) {
    onHexChange();
  }
}
