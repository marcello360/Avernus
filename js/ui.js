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
          <div class="ref-item">Forage: DC${maxForageDC > 0 ? maxForageDC : '?'}</div>
          <div class="ref-item">Navigation: DC${maxNavigationDC > 0 ? maxNavigationDC : '?'}</div>
          <div class="ref-item">Road/Trail Speed: x${minRoadSpeed < 1 ? decimalToFraction(minRoadSpeed) : '1'}</div>
          <div class="ref-item">Trackless Speed: x${minTracklessSpeed < 1 ? decimalToFraction(minTracklessSpeed) : '1'}</div>
        </div>
      `;
    }
    
    // Create condition reference bar
    // Get current condition status from localStorage or default to "No condition"
    const hasCondition = localStorage.getItem('hasCondition') === 'true';
    const conditionRefHTML = `
      <div class="condition-reference-bar ${hasCondition ? 'active' : ''}">
        <div class="condition-ref-item">${hasCondition ? 'Oppressive condition' : 'No condition'}</div>
      </div>
    `;
  
    // Create terrain cards
    const terrainHTML = data.map(entry => `
      <div class="card">
        <div class="card-header" onclick="this.parentElement.classList.toggle('expanded')">
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
      ${conditionRefHTML}
      <div class="terrain-container">
        ${terrainHTML}
      </div>
      <div id="mountains-block"></div>
    `;
  }
  
  export function renderFeatureHexes(allNearbyHexes, mountainHexes, volcanoHexes, visibility) {
    const radius = visibility === "clear" ? 2 : 1;
    
    const hexFeatures = {};
    
    allNearbyHexes.forEach(hex => {
      hexFeatures[hex] = [];
    });
    
    mountainHexes.forEach(hex => {
      if (hexFeatures[hex.hexname]) {
        hexFeatures[hex.hexname].push("Mountain");
      }
    });
    
    volcanoHexes.forEach(hex => {
      if (hexFeatures[hex.hexname]) {
        hexFeatures[hex.hexname].push("Volcano");
      }
    });
    
    const hexesWithFeatures = Object.keys(hexFeatures)
      .filter(hex => hexFeatures[hex].length > 0)
      .map(hex => ({
        name: hex,
        features: hexFeatures[hex]
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    let html = '';
    if (hexesWithFeatures.length > 0) {
      const featuresList = hexesWithFeatures.map(h => 
        `<li>${h.name}: ${h.features.join(", ")}</li>`).join('');
        
      html = `
        <div class="card">
          <div class="card-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="header-content">
              <h3>Visible Mountains/Volcanoes</h3>
            </div>
            <span class="toggle-icon">+</span>
          </div>
          <div class="card-body">
            <ul class="features-list">
              ${featuresList}
            </ul>
          </div>
        </div>
      `;
    }
  
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
