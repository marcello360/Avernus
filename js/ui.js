function decimalToFraction(decimal) {
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
  
  const roundedDecimal = Math.round(decimal * 100) / 100;
  const decimalStr = roundedDecimal.toString();
  
  return fractions[decimalStr] || `${roundedDecimal}`;
}

export function updateConditionCard() {
  const hasCondition = localStorage.getItem('hasCondition') === 'true';
  let conditionName = localStorage.getItem('conditionName') || '';
  let conditionDescription = localStorage.getItem('conditionDescription') || '';
  
  let conditionRefHTML = '';
  
  if (hasCondition && conditionName) {
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

  let conditionContainer = document.getElementById('condition-container');
  if (!conditionContainer) {
    const quickRefBar = document.querySelector('.quick-reference-bar');
    if (quickRefBar) {
      conditionContainer = document.createElement('div');
      conditionContainer.id = 'condition-container';
      quickRefBar.parentNode.insertBefore(conditionContainer, quickRefBar.nextSibling);
    }
  }
  
  if (conditionContainer) {
    conditionContainer.innerHTML = conditionRefHTML;
  }
}

export function renderTerrain(data) {
    const outputArea = document.getElementById('outputArea');
  
    if (!Array.isArray(data) || data.length === 0) {
      outputArea.innerHTML = `<p>No terrain found for this hex.</p>`;
      return;
    }
  
    // For multiple terrains, use:
    // - Largest DC values for foragedc and navigationdc
    // - Smallest speed values for tracklessspeed and roadspeed
    let maxForageDC = 0;
    let maxNavigationDC = 0;
    let minRoadSpeed = 1;
    let minTracklessSpeed = 1;
    let hasValidData = false;
    
    data.forEach(entry => {
      const terrain = entry.terrain;
      if (!terrain) return;
      
      hasValidData = true;
      
      if (terrain.foragedc) {
        maxForageDC = Math.max(maxForageDC, terrain.foragedc);
      }
      
      if (terrain.navigationdc) {
        maxNavigationDC = Math.max(maxNavigationDC, terrain.navigationdc);
      }
      
      if (terrain.roadspeed) {
        minRoadSpeed = Math.min(minRoadSpeed, terrain.roadspeed);
      }
      
      if (terrain.tracklessspeed) {
        minTracklessSpeed = Math.min(minTracklessSpeed, terrain.tracklessspeed);
      }
    });
    
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
    
    updateConditionCard();
  }
  
  export function renderLocations(locationsData) {
    const locationsEl = document.getElementById('locations-block');
    if (!locationsEl) return;
    
    const previousCards = locationsEl.querySelectorAll('.card');
    const expandedStates = Array.from(previousCards).map(card => card.classList.contains('expanded'));

    const hexSelect = document.getElementById('hexSelect');
    const currentHex = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    
    const visibilityExceptions = ['C4', 'F4', 'J6'];
    const isExceptionHex = visibilityExceptions.includes(currentHex);
    
    let visibleLocationIds = [];
    try {
      const storedIds = localStorage.getItem(`visibleLocations_${currentHex}`);
      if (storedIds) {
        visibleLocationIds = JSON.parse(storedIds);
      }
    } catch (e) {
      console.error('Error parsing visible locations:', e);
    }
    
    if (isExceptionHex) {
      visibleLocationIds = locationsData.map(loc => loc.id);
    }
    
    let html = '';
    
    if (Array.isArray(locationsData) && locationsData.length > 0) {
      const locationsToShow = isExceptionHex ? locationsData : 
        locationsData.filter(location => visibleLocationIds.includes(location.id));
      
      if (locationsToShow.length > 0) {
        html = locationsToShow.map((location) => {
          const isException = isExceptionHex;
          
          return `
          <div class="card" data-location-id="${location.id}">
            <div class="card-header" onclick="this.parentElement.classList.toggle('expanded')" ontouchend="event.preventDefault(); this.parentElement.classList.toggle('expanded')">
              <div class="header-content">
                <h3>${location.locationname}</h3>
                <button class="hide-location-btn" ${isException ? 'disabled' : ''} 
                  onclick="event.stopPropagation(); window.hideLocation(${location.id}, '${currentHex}')">
                  Hide Location
                </button>
              </div>
              <span class="toggle-icon">+</span>
            </div>
            <div class="card-body">
              <p>${location.locationdescription}</p>
            </div>
          </div>
        `;
        }).join('');
      } else {
        html = '<p class="no-locations">No visible locations in this hex.</p>';
      }
    }
    
    locationsEl.innerHTML = html;
    
    const newCards = locationsEl.querySelectorAll('.card');
    newCards.forEach((card, index) => {
      if (index < expandedStates.length && expandedStates[index]) {
        card.classList.add('expanded');
      }
    });
  }

export function renderFeatureHexes(allNearbyHexes, mountainHexes, volcanoHexes, visibility) {
    const radius = visibility === "clear" ? 2 : 1;
    
    const hexSelect = document.getElementById('hexSelect');
    const currentHex = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    
    const hexFeatures = {};
    
    allNearbyHexes.forEach(hex => {
      hexFeatures[hex] = [];
    });
    
    if (currentHex && !hexFeatures[currentHex]) {
      hexFeatures[currentHex] = [];
    }
    
    mountainHexes.forEach(hex => {
      if (hexFeatures[hex.hexname]) {
        hexFeatures[hex.hexname].push("Mountains");
      }
    });
    
    volcanoHexes.forEach(hex => {
      if (hex.hexname === currentHex) {
        hexFeatures[hex.hexname] = hexFeatures[hex.hexname] || [];
        hexFeatures[hex.hexname].push("Volcano");
      } else if (hexFeatures[hex.hexname]) {
        hexFeatures[hex.hexname].push("Volcano");
      }
    });
    
    // Special case for C4: Pillar of Skulls
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
      const previousCard = mountEl.querySelector('.card');
      const wasExpanded = previousCard ? previousCard.classList.contains('expanded') : false;
      
      mountEl.innerHTML = html;
      
      if (wasExpanded) {
        const newCard = mountEl.querySelector('.card');
        if (newCard) {
          newCard.classList.add('expanded');
        }
      }
    }
  }
