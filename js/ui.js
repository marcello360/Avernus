export function renderTerrain(data) {
  const outputArea = document.getElementById('outputArea');

  const terrainHTML = Array.isArray(data) && data.length > 0
    ? data.map(entry => `
      <div class="terrain-block">
        <h2>${entry.terrain.terrainname}</h2>
        <p>${entry.terrain.terraindescription}</p>
      </div>
    `).join("")
    : `<p>No terrain found for this hex.</p>`;

  outputArea.innerHTML = `
    <div class="terrain-container">
      ${terrainHTML}
    </div>
    <div class="mountains-block" id="mountains-block"></div>
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
  
  const html = hexesWithFeatures.length > 0
    ? `<h3>Nearby Feature Hexes (${radius} hex away):</h3>
      <ul>${hexesWithFeatures.map(h => 
        `<li>${h.name}: ${h.features.join(", ")}</li>`).join('')}
      </ul>`
    : `<p>No feature hexes found within ${radius} hex(es).</p>`;

  const mountEl = document.getElementById('mountains-block');
  if (mountEl) mountEl.innerHTML = html;
}
