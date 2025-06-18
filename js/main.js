import { populateHexes, fetchTerrain, fetchMountainHexes, fetchVolcanoHexes } from './supabase.js';
import { getNeighborHexes } from './hexmath.js';
import { renderTerrain, renderFeatureHexes } from './ui.js';

const hexSelect = document.getElementById('hexSelect');
const weatherSelect = document.getElementById('weatherSelect');
const weatherRollButton = document.getElementById('weatherRollButton');
const watchSelect = document.getElementById('watchSelect');
const rollButton = document.getElementById('rollButton');

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
  
  // Save card states before updating
  const savedCardStates = saveCardStates();

  if (hexId) {
    const terrainData = await fetchTerrain(hexId);
    renderTerrain(terrainData);
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

export async function initializeApp() {
  await populateHexes();

  // Add event listener for the maintain condition checkbox
  document.getElementById('maintainConditionCheck').addEventListener('change', () => {
    // Re-trigger hex change to apply/remove restrictions based on checkbox
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
  
  // Weather roll button event listener
  weatherRollButton.addEventListener('click', rollWeather);

  // Roll for Watch button event listener
  rollButton.addEventListener('click', rollForCondition);
  
  // Function to update condition status in UI and localStorage
  function updateConditionStatus(hasCondition) {
    // Store condition status in localStorage
    localStorage.setItem('hasCondition', hasCondition);
    
    // Update checkbox state
    const maintainConditionCheck = document.getElementById('maintainConditionCheck');
    maintainConditionCheck.checked = hasCondition;
    
    // If there's terrain loaded and output area has content, update the condition bar
    const outputArea = document.getElementById('outputArea');
    if (outputArea && outputArea.innerHTML && outputArea.innerHTML.trim() !== '') {
      const conditionBar = outputArea.querySelector('.condition-reference-bar');
      if (conditionBar) {
        // Update condition bar class
        if (hasCondition) {
          conditionBar.classList.add('active');
        } else {
          conditionBar.classList.remove('active');
        }
        
        // Update condition text
        const conditionText = conditionBar.querySelector('.condition-ref-item');
        if (conditionText) {
          conditionText.textContent = hasCondition ? 'Oppressive condition' : 'No condition';
        }
      }
    }
  }
  
  // Function to handle condition rolls
  function rollForCondition() {
    // Check if maintain condition is selected
    const maintainCondition = document.getElementById('maintainConditionCheck').checked;
    
    // Add rolling animation to the button
    rollButton.classList.add('rolling');
    
    // Roll 1d6 (1-6)
    const roll = Math.floor(Math.random() * 6) + 1;
    
    setTimeout(() => {
      // Remove animation class
      rollButton.classList.remove('rolling');
      
      if (maintainCondition) {
        // Rolling to end the condition (1 in 6 chance)
        const conditionEnded = roll === 1;
        
        if (conditionEnded) {
          // Condition has ended
          showToast(`Rolled ${roll} - Condition ended`);
          updateConditionStatus(false);
        } else {
          // Condition maintained
          showToast(`Rolled ${roll} - Condition maintained`);
        }
      } else {
        // Rolling to check for a condition (1 in 6 chance)
        const hasCondition = roll === 1;
        
        if (hasCondition) {
          // Condition triggered
          showToast(`Rolled ${roll} - Condition triggered!`);
          updateConditionStatus(true);
        } else {
          // No condition
          showToast(`Rolled ${roll} - No condition`);
          updateConditionStatus(false);
        }
      }
    }, 300); // Match animation duration
  }
  
  // Trigger initial UI updates
  checkSelections();
  if (hexSelect.value) {
    onHexChange();
  }
}
