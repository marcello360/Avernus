import { populateHexes, fetchTerrain, fetchMountainHexes, fetchVolcanoHexes, fetchCondition, fetchLocations } from './supabase.js';
import { getNeighborHexes } from './hexmath.js';
import { renderTerrain, renderFeatureHexes, updateConditionCard, renderLocations } from './ui.js';

const hexSelect = document.getElementById('hexSelect');
const weatherSelect = document.getElementById('weatherSelect');
const weatherRollButton = document.getElementById('weatherRollButton');
const watchSelect = document.getElementById('watchSelect');
const rollButton = document.getElementById('rollButton');

// Store the current hex's terrain data
let currentTerrainData = [];

function checkSelections() {
  const filled = weatherSelect.value && watchSelect.value && hexSelect.value;
  rollButton.disabled = !filled;
}

// Store the original weather value when we temporarily change it
let originalWeatherValue = null;

// Helper function to save card expanded states
function saveCardStates() {
  const cardStates = {};
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card, index) => {
    // Use an index as the identifier
    cardStates[`card-${index}`] = card.classList.contains('expanded');
  });
  
  return cardStates;
}

// Helper function to restore card expanded states
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
  
  // Save hex selection to localStorage
  localStorage.setItem('selectedHexId', hexId);
  
  // Save card states before updating
  const savedCardStates = saveCardStates();

  if (hexId) {
    // Fetch both terrain and locations data for the selected hex
    const [terrainData, locationsData] = await Promise.all([
      fetchTerrain(hexId),
      fetchLocations(hexId)
    ]);
    
    // Store the terrain data for condition rolls
    currentTerrainData = terrainData;
    // Save terrain data to localStorage
    localStorage.setItem('currentTerrainData', JSON.stringify(terrainData));
    
    // Render terrain cards
    renderTerrain(terrainData);
    
    // Render location cards
    renderLocations(locationsData);
  }
  
  // Handle special hexes (D5, E5, F5)
  const restrictedHexes = ['D5', 'E5', 'F5'];
  const maintainCondition = document.getElementById('maintainConditionCheck').checked;
  
  if (!maintainCondition && hexName && restrictedHexes.includes(hexName)) {
    // Save current weather if not already saved
    if (originalWeatherValue === null) {
      originalWeatherValue = weatherSelect.value;
    }
    
    // Force typical and disable both weather select and roll button
    weatherSelect.value = 'typical';
    weatherSelect.disabled = true;
    weatherRollButton.disabled = true;
  } else if (originalWeatherValue !== null && !restrictedHexes.includes(hexName)) {
    // Restore original weather when moving away from restricted hexes
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
    
    // Restore card states after all rendering is complete
    setTimeout(() => restoreCardStates(savedCardStates), 0);
  }
}

async function onWeatherChange() {
  const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
  const weather = weatherSelect.value;
  
  // Save weather selection to localStorage
  localStorage.setItem('selectedWeather', weather);

  if (hexName && weather) {
    const nearby = getNeighborHexes(hexName, weather);
    
    const mountainData = await fetchMountainHexes(nearby);
    const volcanoData = await fetchVolcanoHexes(nearby);
    
    renderFeatureHexes(nearby, mountainData, volcanoData, weather);
  }
}

// Toast notification function
function showToast(message) {
  const toastContainer = document.getElementById('toastContainer');
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Remove after animation completes
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000); // 3 seconds to match animation duration
}

// Weather roll button functionality
function rollWeather() {
  if (weatherSelect.disabled) return;
  
  // Add rolling animation (more subtle now)
  weatherRollButton.classList.add('rolling');
  
  // Roll 1d6 (1-6)
  const roll = Math.floor(Math.random() * 6) + 1;
  
  // Set weather based on roll (1 = clear, 2-6 = typical)
  const newWeather = roll === 1 ? 'clear' : 'typical';
  
  // Update weather after a slight delay to allow animation to play
  setTimeout(() => {
    weatherSelect.value = newWeather;
    
    // Trigger weather change event to update the UI
    const event = new Event('change');
    weatherSelect.dispatchEvent(event);
    
    // Remove animation class
    weatherRollButton.classList.remove('rolling');
    
    // Show toast notification with roll result
    showToast(`Rolled ${roll} (${newWeather} weather)`);
  }, 300); // Shorter animation duration
}

// Function to toggle dark mode
function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  const darkModeIcon = document.getElementById('darkModeIcon');
  
  // Update icon based on current mode
  darkModeIcon.textContent = isDarkMode ? '☀️' : '🌙';
  
  // Save preference to localStorage
  localStorage.setItem('darkModeEnabled', isDarkMode);
}

// Function to restore UI elements from localStorage
async function restoreUIState() {
  // Restore dark mode preference if available
  const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
  if (darkModeEnabled) {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeIcon').textContent = '☀️';
  }
  
  // Restore hex selection
  const savedHexId = localStorage.getItem('selectedHexId');
  if (savedHexId && hexSelect.querySelector(`option[value="${savedHexId}"]`)) {
    hexSelect.value = savedHexId;
  }
  
  // Restore weather selection
  const savedWeather = localStorage.getItem('selectedWeather');
  if (savedWeather && (savedWeather === 'typical' || savedWeather === 'clear')) {
    weatherSelect.value = savedWeather;
  }
  
  // Restore watch type
  const savedWatchType = localStorage.getItem('selectedWatchType');
  if (savedWatchType && watchSelect.querySelector(`option[value="${savedWatchType}"]`)) {
    watchSelect.value = savedWatchType;
  }
  
  // Restore maintain condition checkbox
  const maintainConditionChecked = localStorage.getItem('maintainConditionChecked');
  if (maintainConditionChecked !== null) {
    document.getElementById('maintainConditionCheck').checked = maintainConditionChecked === 'true';
  }
  
  // Restore terrain data if available
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
  
  // Add event listener for dark mode toggle button
  document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

  // Function to handle maintain condition checkbox changes without full re-render
  function handleMaintainConditionChange() {
    const hexName = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    const maintainCondition = document.getElementById('maintainConditionCheck').checked;
    
    // Save maintain condition state to localStorage
    localStorage.setItem('maintainConditionChecked', maintainCondition);
    
    // Only update the weather restrictions for special hexes
    const restrictedHexes = ['D5', 'E5', 'F5'];
    
    if (!maintainCondition && hexName && restrictedHexes.includes(hexName)) {
      // Save current weather if not already saved
      if (originalWeatherValue === null) {
        originalWeatherValue = weatherSelect.value;
      }
      
      // Force typical and disable both weather select and roll button
      weatherSelect.value = 'typical';
      weatherSelect.disabled = true;
      weatherRollButton.disabled = true;
      
      // Update mountain features without re-rendering terrain
      onWeatherChange();
    } else if (originalWeatherValue !== null) {
      // Restore original weather when toggling maintain on or moving away from restricted hexes
      weatherSelect.value = originalWeatherValue;
      weatherSelect.disabled = false;
      weatherRollButton.disabled = false;
      originalWeatherValue = null;
      
      // Update mountain features without re-rendering terrain
      onWeatherChange();
    }
    
    // Update condition card in case it's affected
    updateConditionCard();
  }
  
  // Add event listener for the maintain condition checkbox
  document.getElementById('maintainConditionCheck').addEventListener('change', handleMaintainConditionChange);

  watchSelect.addEventListener('change', () => {
    checkSelections();
    // Save watch type to localStorage
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
  
  // Weather roll button event listener
  weatherRollButton.addEventListener('click', rollWeather);

  // Roll for Watch button event listener
  rollButton.addEventListener('click', rollForCondition);
  
  // Function to update condition status in UI and localStorage
  async function updateConditionStatus(hasCondition, conditionId = null) {
    // Store condition status in localStorage
    localStorage.setItem('hasCondition', hasCondition);
    
    // Update checkbox state
    const maintainConditionCheck = document.getElementById('maintainConditionCheck');
    // Only check the checkbox if hasCondition is true AND the condition ID is not 6 or 10
    if (hasCondition && conditionId !== null) {
      maintainConditionCheck.checked = !(conditionId === 6 || conditionId === 10);
    } else {
      maintainConditionCheck.checked = hasCondition;
    }
    
    // Clear condition details if no condition
    if (!hasCondition) {
      localStorage.removeItem('conditionName');
      localStorage.removeItem('conditionDescription');
      localStorage.removeItem('conditionId');
      
      // Update only the condition card instead of triggering a full terrain re-render
      updateConditionCard();
      return;
    }
    
    // If we have a condition but no specific ID, don't update anything else
    if (!conditionId) {
      return;
    }
    
    // Fetch condition details from database
    try {
      const conditionData = await fetchCondition(conditionId);
      
      if (conditionData && conditionData.length > 0) {
        const condition = conditionData[0];
        
        // Store condition details in localStorage
        localStorage.setItem('conditionName', condition.conditionname);
        localStorage.setItem('conditionDescription', condition.conditiondescription);
        localStorage.setItem('conditionId', condition.id);
        
        // Update only the condition card instead of triggering a full terrain re-render
        updateConditionCard();
      }
    } catch (error) {
      console.error('Error fetching condition:', error);
    }
  }
  
  // Function to handle condition rolls
  async function rollForCondition() {
    // Check if maintain condition is selected
    const maintainCondition = document.getElementById('maintainConditionCheck').checked;
    
    // Add rolling animation to the button
    rollButton.classList.add('rolling');
    
    // Roll 1d6 (1-6)
    const roll = Math.floor(Math.random() * 6) + 1;
    
    setTimeout(async () => {
      // Remove animation class
      rollButton.classList.remove('rolling');
      
      if (maintainCondition) {
        // Rolling to end the condition (1 in 6 chance)
        const conditionEnded = roll === 1;
        
        if (conditionEnded) {
          // Condition has ended
          showToast(`Rolled ${roll} - Condition ended`);
          await updateConditionStatus(false);
        } else {
          // Condition maintained
          showToast(`Rolled ${roll} - Condition maintained`);
        }
      } else {
        // Rolling to check for a condition (1 in 6 chance)
        const hasCondition = roll === 1;
        
        if (hasCondition) {
          // Condition triggered - roll d12 to determine which condition
          showToast(`Rolled ${roll} - New Condition triggered`);
          await rollForSpecificCondition();
        } else {
          // No condition
          showToast(`Rolled ${roll} - No condition`);
          await updateConditionStatus(false);
        }
      }
    }, 300); // Match animation duration
  }
  
  // Function to roll for a specific condition using a d12
  async function rollForSpecificCondition() {
    // Roll 1d12 (1-12)
    const d12Roll = Math.floor(Math.random() * 12) + 1;
    let conditionId;
    
    // Determine condition ID based on d12 roll
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
      // Use condition from current terrain
      conditionId = await getTerrainConditionId();
    }
    
    // Update condition status with the specific condition ID
    await updateConditionStatus(true, conditionId);
  }
  
  // Function to get a condition ID from the current terrain
  async function getTerrainConditionId() {
    // Default to condition ID 1 if we can't find a terrain condition
    let conditionId = 1;
    
    // Get current hex ID
    const hexId = hexSelect.value;
    
    if (hexId && currentTerrainData && currentTerrainData.length > 0) {
      // Filter terrains that have condition IDs
      const terrainsWithConditions = currentTerrainData
        .filter(entry => entry.terrain && entry.terrain.conditionid);
      
      if (terrainsWithConditions.length > 0) {
        // Pick a random terrain from the available options
        const randomTerrainIndex = Math.floor(Math.random() * terrainsWithConditions.length);
        const randomTerrain = terrainsWithConditions[randomTerrainIndex];
        
        // Get the condition ID
        conditionId = randomTerrain.terrain.conditionid;
      }
    }
    
    return conditionId;
  }
  
  // Restore UI elements from localStorage
  restoreUIState();
  
  // Trigger initial UI updates
  checkSelections();
  if (hexSelect.value) {
    onHexChange();
  }
}
