import { populateHexes, fetchTerrain, fetchMountainHexes, fetchVolcanoHexes } from './supabase.js';
import { getNeighborHexes } from './hexmath.js';
import { renderTerrain, renderFeatureHexes } from './ui.js';

const hexSelect = document.getElementById('hexSelect');
const weatherSelect = document.getElementById('weatherSelect');
const watchSelect = document.getElementById('watchSelect');
const rollButton = document.getElementById('rollButton');

function checkSelections() {
  const filled = weatherSelect.value && watchSelect.value && hexSelect.value;
  rollButton.disabled = !filled;
}

let originalWeatherValue = null;

async function onHexChange() {
  const hexId = hexSelect.value;
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;

  if (hexId) {
    const terrainData = await fetchTerrain(hexId);
    renderTerrain(terrainData);
  }
  
  const restrictedHexes = ['D5', 'E5', 'F5'];
  const maintainCondition = document.getElementById('maintainConditionCheck').checked;
  
  if (!maintainCondition && hexName && restrictedHexes.includes(hexName)) {
    if (originalWeatherValue === null) {
      originalWeatherValue = weatherSelect.value;
    }
    
    weatherSelect.value = 'typical';
    weatherSelect.disabled = true;
  } else if (originalWeatherValue !== null && !restrictedHexes.includes(hexName)) {
    weatherSelect.value = originalWeatherValue;
    weatherSelect.disabled = false;
    originalWeatherValue = null;
  }

  if (hexId && weatherSelect.value) {
    const nearby = getNeighborHexes(hexName, weatherSelect.value);
    
    const mountainData = await fetchMountainHexes(nearby);
    const volcanoData = await fetchVolcanoHexes(nearby);
    
    renderFeatureHexes(nearby, mountainData, volcanoData, weatherSelect.value);
  }
}

async function onWeatherChange() {
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
  const weather = weatherSelect.value;

  if (hexName && weather) {
    const nearby = getNeighborHexes(hexName, weather);
    
    const mountainData = await fetchMountainHexes(nearby);
    const volcanoData = await fetchVolcanoHexes(nearby);
    
    renderFeatureHexes(nearby, mountainData, volcanoData, weather);
  }
}

export async function initializeApp() {
  await populateHexes();

  document.getElementById('maintainConditionCheck').addEventListener('change', () => {
    if (hexSelect.value) {
      onHexChange();
    }
  });

  watchSelect.addEventListener('change', checkSelections);
  hexSelect.addEventListener('change', () => {
    checkSelections();
    onHexChange();
  });

  weatherSelect.addEventListener('change', () => {
    checkSelections();
    onWeatherChange();
  });

  rollButton.addEventListener('click', () => {
  });
  
  checkSelections();
  if (hexSelect.value) {
    onHexChange();
  }
}
