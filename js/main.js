import { populateHexes, fetchTerrain, fetchMountainHexes } from './supabase.js';
import { getNeighborHexes } from './hexmath.js';
import { renderTerrain, renderMountains } from './ui.js';

const hexSelect = document.getElementById('hexSelect');
const weatherSelect = document.getElementById('weatherSelect');
const watchSelect = document.getElementById('watchSelect');
const rollButton = document.getElementById('rollButton');

function checkSelections() {
  const filled = weatherSelect.value && watchSelect.value && hexSelect.value;
  rollButton.disabled = !filled;
}

async function onHexChange() {
  const hexId = hexSelect.value;
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;

  if (hexId) {
    const terrainData = await fetchTerrain(hexId);
    renderTerrain(terrainData);
  }

  if (hexId && weatherSelect.value) {
    const nearby = getNeighborHexes(hexName, weatherSelect.value);
    const mountainData = await fetchMountainHexes(nearby);
    renderMountains(mountainData, weatherSelect.value);
  }
}

async function onWeatherChange() {
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
  const weather = weatherSelect.value;

  if (hexName && weather) {
    const nearby = getNeighborHexes(hexName, weather);
    const mountainData = await fetchMountainHexes(nearby);
    renderMountains(mountainData, weather);
  }
}

export async function initializeApp() {
  await populateHexes();

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
    // Placeholder for future encounter logic
  });
}
