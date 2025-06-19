/**
 * Converts a decimal to a formatted fraction string.
 * @param {number} decimal - The decimal value to convert (e.g., 0.75, 0.5, etc.)
 * @return {string} A formatted fraction (e.g., '¾', '½', etc.) or the original decimal if no common fraction.
 */
function decimalToFraction(decimal) {
  // Handle common fractions
  const fractions = {
    '0.25': '¼',
    '0.5': '½',
    '0.75': '¾',
    '0.33': '⅓',
    '0.67': '⅔',
    '0.2': '⅕',
    '0.4': '⅖',
    '0.6': '⅗',
    '0.8': '⅘'
  };
  
  // Convert to precision of 2 digits for comparison
  const roundedDecimal = Math.round(decimal * 100) / 100;
  const decimalStr = roundedDecimal.toString();
  
  // Return the fraction symbol if it exists in our mapping
  return fractions[decimalStr] || `${roundedDecimal}`;
}

// Function to update just the condition card separately
export function updateConditionCard() {
  // Get current condition status and details from localStorage
  const hasCondition = localStorage.getItem('hasCondition') === 'true';
  let conditionName = localStorage.getItem('conditionName') || '';
  let conditionDescription = localStorage.getItem('conditionDescription') || '';
  
  // Create the collapsible condition reference bar
  let conditionRefHTML = '';
  
  if (hasCondition && conditionName) {
    // Show condition with name and description in collapsible section
    conditionRefHTML = `
      <div class="condition-card card">
        <div class="card-header" onclick="this.parentElement.classList.toggle('expanded')">
          <div class="header-content">
            <h3>${conditionName}</h3>
          </div>
          <span class="toggle-icon">+</span>
        </div>
        <div class="card-body">
          <p>${conditionDescription}</p>
        </div>
      </div>
    `;
  }

  // Find or create condition container
  let conditionContainer = document.getElementById('condition-container');
  if (!conditionContainer) {
    // If container doesn't exist, create it after quick-reference-bar
    const quickRefBar = document.querySelector('.quick-reference-bar');
    if (quickRefBar) {
      conditionContainer = document.createElement('div');
      conditionContainer.id = 'condition-container';
      quickRefBar.parentNode.insertBefore(conditionContainer, quickRefBar.nextSibling);
    }
  }
  
  // Update condition container if it exists
  if (conditionContainer) {
    conditionContainer.innerHTML = conditionRefHTML;
  }
}

export function renderTerrain(data) {
    const outputArea = document.getElementById('outputArea');
  
    // Check if we have terrain data
    if (!Array.isArray(data) || data.length === 0) {
      outputArea.innerHTML = `<p>No terrain found for this hex.</p>`;
      return;
    }
  
    // For multiple terrains, use:
    // - Largest DC values (worst/hardest) for foragedc and navigationdc
    // - Smallest speed values (worst/slowest) for tracklessspeed and roadspeed
    let maxForageDC = 0;
    let maxNavigationDC = 0;
    let minRoadSpeed = 1;
    let minTracklessSpeed = 1;
    let hasValidData = false;
    
    // Process all terrain entries to find min/max values
    data.forEach(entry => {
      const terrain = entry.terrain;
      if (!terrain) return;
      
      hasValidData = true;
      
      // Find largest DC values
      if (terrain.foragedc) {
        maxForageDC = Math.max(maxForageDC, terrain.foragedc);
      }
      
      if (terrain.navigationdc) {
        maxNavigationDC = Math.max(maxNavigationDC, terrain.navigationdc);
      }
      
      // Find smallest speed values
      if (terrain.roadspeed) {
        minRoadSpeed = Math.min(minRoadSpeed, terrain.roadspeed);
      }
      
      if (terrain.tracklessspeed) {
        minTracklessSpeed = Math.min(minTracklessSpeed, terrain.tracklessspeed);
      }
    });
    
    // Create quick reference bar
    let quickRefHTML = '';
    if (hasValidData) {
      quickRefHTML = `
        <div class="quick-reference-bar">
          <div class="ref-item">Forage: DC ${maxForageDC > 0 ? maxForageDC : '?'}</div>
          <div class="ref-item">Navigation: DC ${maxNavigationDC > 0 ? maxNavigationDC : '?'}</div>
          <div class="ref-item">Road/Trail Speed: x ${minRoadSpeed < 1 ? decimalToFraction(minRoadSpeed) : '1'}</div>
          <div class="ref-item">Trackless Speed: x ${minTracklessSpeed < 1 ? decimalToFraction(minTracklessSpeed) : '1'}</div>
        </div>
      `;
    }
  
    // Create terrain cards with both click and touch handling
    const terrainHTML = data.map(entry => `
      <div class="card">
        <div class="card-header" onclick="this.parentElement.classList.toggle('expanded')" ontouchend="event.preventDefault(); this.parentElement.classList.toggle('expanded')">
          <div class="header-content">
            <h2>${entry.terrain.terrainname}</h2>
          </div>
          <span class="toggle-icon">+</span>
        </div>
        <div class="card-body">
          <p>${entry.terrain.terraindescription}</p>
        </div>
      </div>
    `).join("");
  
    outputArea.innerHTML = `
      ${quickRefHTML}
      <div id="condition-container"></div>
      <div class="terrain-container">
        ${terrainHTML}
      </div>
      <div id="mountains-block"></div>
      <div id="locations-block"></div>
    `;
    
    // Update the condition card separately
    updateConditionCard();
  }
  
  export function renderLocations(locationsData) {
    // Get the container element for locations
    const locationsEl = document.getElementById('locations-block');
    if (!locationsEl) return;
    
    // Check if there's currently a card that is expanded
    const previousCards = locationsEl.querySelectorAll('.card');
    // Store the expanded state of each card
    const expandedStates = Array.from(previousCards).map(card => card.classList.contains('expanded'));
    
    let html = '';
    
    // Generate location cards if we have location data
    if (Array.isArray(locationsData) && locationsData.length > 0) {
      html = locationsData.map((location, index) => `
        <div class="card" data-location-id="${location.id}">
          <div class="card-header" onclick="this.parentElement.classList.toggle('expanded')" ontouchend="event.preventDefault(); this.parentElement.classList.toggle('expanded')">
            <div class="header-content">
              <h3>${location.locationname}</h3>
            </div>
            <span class="toggle-icon">+</span>
          </div>
          <div class="card-body">
            <p>${location.locationdescription}</p>
          </div>
        </div>
      `).join('');
    }
    
    // Update the HTML
    locationsEl.innerHTML = html;
    
    // Restore expanded state for cards that existed before
    const newCards = locationsEl.querySelectorAll('.card');
    newCards.forEach((card, index) => {
      if (index < expandedStates.length && expandedStates[index]) {
        card.classList.add('expanded');
      }
    });
  }

export function renderFeatureHexes(allNearbyHexes, mountainHexes, volcanoHexes, visibility) {
    const radius = visibility === "clear" ? 2 : 1;
    
    // Get the currently selected hex
    const hexSelect = document.getElementById('hexSelect');
    const currentHex = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    
    const hexFeatures = {};
    
    allNearbyHexes.forEach(hex => {
      hexFeatures[hex] = [];
    });
    
    // Add volcanoes in the current hex even if not in allNearbyHexes
    if (currentHex && !hexFeatures[currentHex]) {
      hexFeatures[currentHex] = [];
    }
    
    mountainHexes.forEach(hex => {
      if (hexFeatures[hex.hexname]) {
        hexFeatures[hex.hexname].push("Mountains");
      }
    });
    
    volcanoHexes.forEach(hex => {
      // Always show volcanoes in their current hex
      if (hex.hexname === currentHex) {
        hexFeatures[hex.hexname] = hexFeatures[hex.hexname] || [];
        hexFeatures[hex.hexname].push("Volcano");
      } else if (hexFeatures[hex.hexname]) {
        hexFeatures[hex.hexname].push("Volcano");
      }
    });
    
    // Special case for C4: Pillar of Skulls - visible from anywhere including C4 itself
    if (allNearbyHexes.includes('C4') || currentHex === 'C4') {
      hexFeatures['C4'] = hexFeatures['C4'] || [];
      if (!hexFeatures['C4'].includes('Pillar of Skulls')) {
        hexFeatures['C4'].push('Pillar of Skulls');
      }
    }
    
    // Special case for F4: Bloody Cyst
    if (currentHex === 'F4') {
      hexFeatures['F4'] = hexFeatures['F4'] || [];
      if (!hexFeatures['F4'].includes('Bloody Cyst')) {
        hexFeatures['F4'].push('Bloody Cyst');
      }
    }
    
    // Special case for J6: Mesa Encampment
    if (currentHex === 'J6') {
      hexFeatures['J6'] = hexFeatures['J6'] || [];
      if (!hexFeatures['J6'].includes('Mesa Encampment')) {
        hexFeatures['J6'].push('Mesa Encampment');
      }
    }

    const hexesWithFeatures = Object.keys(hexFeatures)
      .filter(hex => hexFeatures[hex].length > 0)
      .map(hex => ({
        name: hex,
        features: hexFeatures[hex]
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    let cardContent;
    if (hexesWithFeatures.length > 0) {
      const featuresList = hexesWithFeatures.map(h => 
        `<li>${h.name}: ${h.features.join(", ")}</li>`).join('');
        
      cardContent = `
        <ul class="features-list">
          ${featuresList}
        </ul>
      `;
    } else {
      cardContent = `<p class="empty-message">No nearby hexes visible</p>`;
    }
    
    // Always render the visibility card with the appropriate content
    const html = `
      <div class="card visibility-card">
        <div class="card-header" onclick="this.parentElement.classList.toggle('expanded')">
          <div class="header-content">
            <h3>Visibility</h3>
          </div>
          <span class="toggle-icon">+</span>
        </div>
        <div class="card-body">
          ${cardContent}
        </div>
      </div>
    `;
  
    const mountEl = document.getElementById('mountains-block');
    if (mountEl) {
      // Check if there's currently a card that is expanded
      const previousCard = mountEl.querySelector('.card');
      const wasExpanded = previousCard ? previousCard.classList.contains('expanded') : false;
      
      // Update the HTML
      mountEl.innerHTML = html;
      
      // If the card was previously expanded and we have a new card, expand it
      if (wasExpanded) {
        const newCard = mountEl.querySelector('.card');
        if (newCard) {
          newCard.classList.add('expanded');
        }
      }
    }
  }
