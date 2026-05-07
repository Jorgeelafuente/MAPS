let map = L.map('map').setView([39.5, -0.4], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

let markers = [];

// Convertir coordenadas Google Maps → decimal
function convertCoords(coord) {
    let regex = /(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/;
    let match = coord.match(regex);

    if (!match) return null;

    let lat = (+match[1]) + (+match[2]/60) + (+match[3]/3600);
    let lng = (+match[5]) + (+match[6]/60) + (+match[7]/3600);

    if (match[4] === "S") lat = -lat;
    if (match[8] === "W") lng = -lng;

    return [lat, lng];
}

// Leer CSV (detecta ; o , automáticamente)
document.getElementById("fileInput").addEventListener("change", function(e) {

    let file = e.target.files[0];
    let reader = new FileReader();

    reader.onload = function(e) {

        let text = e.target.result;

        // Detectar separador automáticamente
        let separator = text.includes(";") ? ";" : ",";

        let rows = text.split("\n").slice(1);

        rows.forEach(row => {

            if (!row.trim()) return;

            let cols = row.split(separator);

            let cliente = cols[0]?.trim();
            let coordsRaw = cols[3]?.trim();

            if (!coordsRaw) return;

            let coords = convertCoords(coordsRaw);

            if (!coords) {
                console.log("Error coordenadas:", coordsRaw);
                return;
            }

            createMarker(cliente, coords);
        });
    };

    reader.readAsText(file);
});

// Crear marcador
function createMarker(cliente, coords) {

    let savedData = JSON.parse(localStorage.getItem(cliente)) || {
        congelado: 0,
        refrigerado: 0
    };

    let color = getColor(savedData);

    let icon = L.divIcon({
        className: 'custom-icon',
        html: `<div style="background:${color};width:15px;height:15px;border-radius:50%"></div>`
    });

    let marker = L.marker(coords, { icon }).addTo(map);

    marker.on("click", function() {

        let popupContent = `
            <b>${cliente}</b><br><br>
            Congelado: <input id="c${cliente}" type="number" value="${savedData.congelado}"><br>
            Refrigerado: <input id="r${cliente}" type="number" value="${savedData.refrigerado}"><br>
            <button onclick="saveData('${cliente}')">Guardar</button>
        `;

        marker.bindPopup(popupContent).openPopup();
    });

    markers.push(marker);
}

// Guardar datos
function saveData(cliente) {

    let congelado = document.getElementById("c"+cliente).value;
    let refrigerado = document.getElementById("r"+cliente).value;

    let data = {
        congelado: parseInt(congelado) || 0,
        refrigerado: parseInt(refrigerado) || 0
    };

    localStorage.setItem(cliente, JSON.stringify(data));

    location.reload();
}

// Color según pallets
function getColor(data) {
    if (data.congelado > 0 && data.refrigerado > 0) return "purple";
    if (data.congelado > 0) return "red";
    if (data.refrigerado > 0) return "blue";
    return "gray";
}
