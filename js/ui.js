export function renderTerrain(data) {
    const outputArea = document.getElementById('outputArea');
  
    const terrainHTML = Array.isArray(data) && data.length > 0
      ? data.map(entry => `
        <div class="card">
          <div class="card-header" onclick="this.parentElement.classList.toggle('expanded')">
            <h2>${entry.terrain.terrainname}</h2>
            <span class="toggle-icon">+</span>
          </div>
          <div class="card-body">
            <p>${entry.terrain.terraindescription}</p>
          </div>
        </div>
      `).join("")
      : `<p>No terrain found for this hex.</p>`;
  
    outputArea.innerHTML = `
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
            <h3>Nearby Feature Hexes (${radius} hex away)</h3>
            <span class="toggle-icon">+</span>
          </div>
          <div class="card-body">
            <ul class="features-list">
              ${featuresList}
            </ul>
          </div>
        </div>
      `;
    } else {
      html = `<p>No feature hexes found within ${radius} hex(es).</p>`;
    }
  
    const mountEl = document.getElementById('mountains-block');
    if (mountEl) mountEl.innerHTML = html;
  }
