import { rollForAllegiance } from './supabase.js';

export function clearEncounterCards() {
  const encounterCards = document.querySelectorAll('.encounter-card');
  encounterCards.forEach(card => {
    card.parentNode.removeChild(card);
  });
}

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
      quickRefBar.appendChild(conditionContainer);
    }
  }
  
  if (conditionContainer) {
    conditionContainer.innerHTML = conditionRefHTML;
  }
}

export function renderEncounterCard(encounters) {
  const outputArea = document.getElementById('outputArea');
  if (!outputArea) return;
  
  const mountEl = document.getElementById('mountains-block');
  let encounterContainer = document.getElementById('encounter-container');
  if (encounterContainer) {
    encounterContainer.remove();
  } else {
    encounterContainer = document.createElement('div');
    encounterContainer.id = 'encounter-container';
    encounterContainer.className = 'encounter-container';
  }
  
  setTimeout(() => {
    const visibilityCard = document.querySelector('.visibility-card');
    
    if (visibilityCard) {
      visibilityCard.after(encounterContainer);
    } else if (mountEl) {
      mountEl.after(encounterContainer);
    } else {
      outputArea.appendChild(encounterContainer);
    }
    
    populateEncounterCards(encounterContainer, encounters);
  }, 0);
  
  return encounterContainer;
}

function populateEncounterCards(container, encounters) {
  if (!container) return;
  
  container.innerHTML = '';
  
  const encounterArray = Array.isArray(encounters) ? encounters : (encounters ? [encounters] : []);
  
  if (encounterArray.length === 0) {
    return;
  }
  
  encounterArray.forEach(encounter => {
    const normalizedEncounter = encounter;
    
    const encounterCard = document.createElement('div');
    encounterCard.className = 'encounter-card card';
    encounterCard.style.borderColor = '#FFCC00'; // Yellow stroke
    
    const header = document.createElement('div');
    header.className = 'card-header';
    header.onclick = function() { this.parentElement.classList.toggle('expanded'); };
    
    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';

    const title = document.createElement('h3');
    
    let titleText = 'Encounter';
    if (normalizedEncounter.encountertypeid === 1) {
      titleText = 'Designed Encounter';
    } else if (normalizedEncounter.isWarlord) {
      titleText = 'Warlord Encounter';
    } else if (normalizedEncounter.encountertypeid === 4) {
      titleText = 'Environmental Encounter';
    } else if (normalizedEncounter.encountertypeid === 3) {
      titleText = 'Styx Encounter';
    } else if (normalizedEncounter.encountertypeid === 5) {
      titleText = 'Dangerous Devil Encounter';
    } else {
      titleText = 'Normal Encounter';
    }
    
    title.textContent = titleText;
    headerContent.appendChild(title);
    
    const subtitle = document.createElement('h4');
    subtitle.className = 'encounter-subtitle';
    
    let subtitleText = '';
    
    if (normalizedEncounter.isSpecialEncounter || 
        normalizedEncounter.isWarlord ||
        (normalizedEncounter.encountersource && normalizedEncounter.encountersource.includes('Encounters')) ||
        normalizedEncounter.encounterdescription) {
      subtitleText = normalizedEncounter.encountername || '';
    } else {
      let classPrefix = '';
      if (normalizedEncounter.encounterClass === 'Lair') {
        classPrefix = 'the Lair of ';
      } else if (normalizedEncounter.encounterClass === 'Tracks') {
        classPrefix = `${normalizedEncounter.tracksAge}-day-old Tracks of `;
      }
      
      subtitleText = `Encountered ${classPrefix}${normalizedEncounter.amount} ${normalizedEncounter.encountername || 'creatures'}`;
    }
    
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'toggle-icon';
    toggleIcon.textContent = '+';
    
    header.appendChild(headerContent);
    header.appendChild(toggleIcon);
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    if (subtitleText) {
      const subtitleElement = document.createElement('h3');
      subtitleElement.className = 'encounter-subtitle';
      subtitleElement.textContent = subtitleText;
      cardBody.appendChild(subtitleElement);
    }
    
    const isEnvironmentEncounter = normalizedEncounter.encountertypeid === 4; // Environment type is 4
    const isTracksEncounter = normalizedEncounter.encounterClass === 'Tracks';
    const hasEncounterSource = normalizedEncounter.encountersource && normalizedEncounter.encountersource.includes('Encounters');
    
    if (normalizedEncounter.reaction && !isEnvironmentEncounter && (isTracksEncounter || !hasEncounterSource)) {
      const reactionSection = document.createElement('p');
      let reactionText = normalizedEncounter.reaction;
      
      reactionSection.innerHTML = `<strong>Reaction:</strong> ${reactionText}`;
      cardBody.appendChild(reactionSection);
    }
    
    if (normalizedEncounter.distance) {
      const distanceSection = document.createElement('p');
      distanceSection.innerHTML = `<strong>Distance:</strong> ${normalizedEncounter.distance} feet`;
      cardBody.appendChild(distanceSection);
    }
    
    if (normalizedEncounter.encounterdescription) {
      const descriptionSection = document.createElement('p');
      descriptionSection.innerHTML = normalizedEncounter.encounterdescription;
      cardBody.appendChild(descriptionSection);
    }
    
    if (normalizedEncounter.encountersource) {
      const sourceSection = document.createElement('p');
      sourceSection.innerHTML = `<em>Source: ${normalizedEncounter.encountersource}</em>`;
      sourceSection.className = 'encounter-source';
      cardBody.appendChild(sourceSection);
    }
    
    const allegianceButton = document.createElement('button');
    allegianceButton.textContent = 'Roll for Allegiance';
    allegianceButton.className = 'small-button';
    allegianceButton.id = `allegiance-${encounter.id}`; // Set ID based on encounter ID
    allegianceButton.onclick = async function() {
      allegianceButton.disabled = true;
      try {
        const result = await rollForAllegiance(encounter.id);
        if (result) {
          const allegianceSection = document.createElement('p');
          allegianceSection.innerHTML = `<strong>Allegiance:</strong> ${result}`;
          allegianceSection.className = 'allegiance-result';
          cardBody.appendChild(allegianceSection);
          allegianceButton.style.display = 'none';
          
          const rerollButton = document.createElement('button');
          rerollButton.textContent = 'Reroll Allegiance';
          rerollButton.className = 'small-button';
          rerollButton.onclick = async function() {
            rerollButton.disabled = true;
            try {
              const newResult = await rollForAllegiance(encounter.id);
              if (newResult) {
                allegianceSection.innerHTML = `<strong>Allegiance:</strong> ${newResult}`;
                showToast(`Allegiance rerolled: ${newResult}`);
              }
            } catch (error) {
              console.error('Error rerolling allegiance:', error);
            } finally {
              rerollButton.disabled = false;
            }
          };
          cardBody.appendChild(rerollButton);
        }
      } catch (error) {
        console.error('Error rolling for allegiance:', error);
      } finally {
        allegianceButton.disabled = false;
      }
    };
    
    cardBody.appendChild(allegianceButton);
    
    encounterCard.appendChild(header);
    encounterCard.appendChild(cardBody);
    
    container.appendChild(encounterCard);
  });
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
  
    const encounterContainer = document.getElementById('encounter-container');
    let savedEncounterHTML = '';
    if (encounterContainer) {
      savedEncounterHTML = encounterContainer.outerHTML;
    }
    
    outputArea.innerHTML = `
      ${quickRefHTML}
      <div id="condition-container"></div>
      <div class="terrain-container">
        ${terrainHTML}
      </div>
      <div id="mountains-block"></div>
      <div id="locations-block"></div>
    `;
    
    if (savedEncounterHTML) {
      const mountainsBlock = document.getElementById('mountains-block');
      if (mountainsBlock) {
        mountainsBlock.insertAdjacentHTML('afterend', savedEncounterHTML);
      } else {
        outputArea.insertAdjacentHTML('beforeend', savedEncounterHTML);
      }
    }
    
    updateConditionCard();
  }
  
  export function renderLocations(locationsData) {
    const locationsEl = document.getElementById('locations-block');
    if (!locationsEl) return;
    
    const previousCards = locationsEl.querySelectorAll('.card');
    const expandedStates = Array.from(previousCards).map(card => card.classList.contains('expanded'));

    const hexSelect = document.getElementById('hexSelect');
    const currentHex = hexSelect.options[hexSelect.selectedIndex]?.textContent;
    
    const visibilityExceptions = ['C2', 'F4', 'J6', 'H3'];
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
                  onclick="event.stopPropagation(); window.hideLocation(${location.id}, '${currentHex}')" 
                  ontouchend="event.preventDefault(); event.stopPropagation(); window.hideLocation(${location.id}, '${currentHex}')">
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
    const volcanoHexNames = ['H2', 'H6', 'I5'];
    
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
      hexFeatures[hex.hexname] = hexFeatures[hex.hexname] || [];
      hexFeatures[hex.hexname].push("Volcano");
    });
    
    if (currentHex && volcanoHexNames.includes(currentHex)) {
      hexFeatures[currentHex] = hexFeatures[currentHex] || [];
      if (!hexFeatures[currentHex].includes("Volcano")) {
        hexFeatures[currentHex].push("Volcano");
      }
    }
    
    // Special case for C2: Pillar of Skulls
    if (allNearbyHexes.includes('C2') || currentHex === 'C2') {
      hexFeatures['C2'] = hexFeatures['C2'] || [];
      if (!hexFeatures['C2'].includes('Pillar of Skulls')) {
        hexFeatures['C2'].push('Pillar of Skulls');
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
      
      const encounterContainer = document.getElementById('encounter-container');
      let savedEncounterContainer = null;
      if (encounterContainer) {
        encounterContainer.remove();
        savedEncounterContainer = encounterContainer;
      }
      
      mountEl.innerHTML = html;
      
      if (wasExpanded) {
        const newCard = mountEl.querySelector('.card');
        if (newCard) {
          newCard.classList.add('expanded');
        }
      }
      
      if (savedEncounterContainer) {
        const visibilityCard = mountEl.querySelector('.visibility-card');
        if (visibilityCard) {
          visibilityCard.after(savedEncounterContainer);
        } else {
          mountEl.after(savedEncounterContainer);
        }
      }
    }
  }
