import { populateHexes, fetchTerrain, fetchMountainHexes, fetchVolcanoHexes, fetchCondition, fetchLocations } from './supabase.js';
import { getNeighborHexes } from './hexmath.js';
import { renderTerrain, renderFeatureHexes, updateConditionCard, renderLocations } from './ui.js';

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

async function onHexChange() {
  const hexId = hexSelect.value;
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
  localStorage.setItem('selectedHexId', hexId);
  const savedCardStates = saveCardStates();

  if (hexId) {
    const [terrainData, locationsData] = await Promise.all([
      fetchTerrain(hexId),
      fetchLocations(hexId)
    ]);
    
    currentTerrainData = terrainData;
    localStorage.setItem('currentTerrainData', JSON.stringify(terrainData));
    
    renderTerrain(terrainData);
    renderLocations(locationsData);
  }
  
  const restrictedHexes = ['D5', 'E5', 'F5'];
  const maintainCondition = document.getElementById('maintainConditionCheck').checked;
  
  if (!maintainCondition && hexName && restrictedHexes.includes(hexName)) {
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

  if (hexName && weather) {
    const nearby = getNeighborHexes(hexName, weather);
    
    const mountainData = await fetchMountainHexes(nearby);
    const volcanoData = await fetchVolcanoHexes(nearby);
    
    renderFeatureHexes(nearby, mountainData, volcanoData, weather);
  }
}

function showToast(message) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
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
  
  const savedTerrainData = localStorage.getItem('currentTerrainData');
  if (savedTerrainData) {
    try {
      currentTerrainData = JSON.parse(savedTerrainData);
    } catch (error) {
      console.error('Error parsing saved terrain data:', error);
      currentTerrainData = [];
    }
  }
}

export async function initializeApp() {
  await populateHexes();
  
  document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

  function handleMaintainConditionChange() {
    const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    const maintainCondition = document.getElementById('maintainConditionCheck').checked;
    
    localStorage.setItem('maintainConditionChecked', maintainCondition);
     
    if (!maintainCondition && hexName && restrictedHexes.includes(hexName)) {
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
  
  document.getElementById('maintainConditionCheck').addEventListener('change', handleMaintainConditionChange);

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
      
      if (maintainCondition) {
        const conditionEnded = roll === 1;
        
        if (conditionEnded) {
          showToast(`Rolled ${roll} - Condition ended`);
          await updateConditionStatus(false);
        } else {
          showToast(`Rolled ${roll} - Condition maintained`);
        }
      } else {
        const hasCondition = roll === 1;
        
        if (hasCondition) {
          showToast(`Rolled ${roll} - New Condition triggered`);
          await rollForSpecificCondition();
        } else {
          showToast(`Rolled ${roll} - No condition`);
          await updateConditionStatus(false);
        }
      }
    }, 300); // Match animation duration
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
  
  restoreUIState();
  
  checkSelections();
  if (hexSelect.value) {
    onHexChange();
  }
}
