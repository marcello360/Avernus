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

export function renderMountains(hexes, visibility) {
  const radius = visibility === "clear" ? 2 : 1;
  const names = hexes.map(h => h.hexname).sort();

  const html = names.length > 0
    ? `<h3>Nearby Mountain Hexes (${radius} hex away):</h3><ul>${names.map(name => `<li>${name}</li>`).join('')}</ul>`
    : `<p>No mountain hexes found within ${radius} hex(es).</p>`;

  const mountEl = document.getElementById('mountains-block');
  if (mountEl) mountEl.innerHTML = html;
}
