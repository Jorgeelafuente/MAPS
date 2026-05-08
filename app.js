let map = L.map('map').setView([39.5, -0.4], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
}).addTo(map);

let markers = [];

// Convertir coordenadas Google Maps
function convertCoords(coord) {

    coord = String(coord).trim();

    console.log("Coordenada original:", coord);

    let regex = /(\d+)°(\d+)'([\d.]+)"([NS])\s*(\d+)°(\d+)'([\d.]+)"([EW])/;

    let match = coord.match(regex);

    if (!match) {
        console.log("ERROR coordenadas:", coord);
        return null;
    }

    let lat =
        (+match[1]) +
        (+match[2] / 60) +
        (+match[3] / 3600);

    let lng =
        (+match[5]) +
        (+match[6] / 60) +
        (+match[7] / 3600);

    if (match[4] === "S") lat = -lat;
    if (match[8] === "W") lng = -lng;

    return [lat, lng];
}

// Buscar columna automáticamente
function findColumn(row, possibleNames) {

    let keys = Object.keys(row);

    for (let key of keys) {

        let cleanKey =
            key.toLowerCase()
               .trim()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "");

        for (let name of possibleNames) {

            let cleanName =
                name.toLowerCase()
                    .trim()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

            if (cleanKey.includes(cleanName)) {
                return key;
            }
        }
    }

    return null;
}

// Cargar Excel
document.getElementById('fileInput').addEventListener('change', function(e) {

    let file = e.target.files[0];

    console.log("Archivo cargado:", file.name);

    let reader = new FileReader();

    reader.onload = function(event) {

        let data = new Uint8Array(event.target.result);

        let workbook = XLSX.read(data, { type: 'array' });

        let sheetName = workbook.SheetNames[0];

        let sheet = workbook.Sheets[sheetName];

        let jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log("Datos Excel:", jsonData);

        if (jsonData.length === 0) {
            alert("El Excel está vacío");
            return;
        }

        // Detectar columnas reales
        let clienteCol = findColumn(jsonData[0], [
            "cliente"
        ]);

        let coordsCol = findColumn(jsonData[0], [
            "coordenadas",
            "coord"
        ]);

        console.log("Columna cliente:", clienteCol);
        console.log("Columna coordenadas:", coordsCol);

        if (!clienteCol || !coordsCol) {
            alert("No se encontraron columnas válidas");
            return;
        }

        // Limpiar marcadores
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        jsonData.forEach(row => {

            let cliente = row[clienteCol];
            let coordsRaw = row[coordsCol];

            console.log("Cliente:", cliente);
            console.log("Coords:", coordsRaw);

            if (!cliente || !coordsRaw) return;

            let coords = convertCoords(coordsRaw);

            if (!coords) return;

            createMarker(cliente, coords);
        });
    };

    reader.readAsArrayBuffer(file);
});

// Crear marcador
function createMarker(cliente, coords) {

    let savedData = JSON.parse(localStorage.getItem(cliente)) || {
        congelado: 0,
        refrigerado: 0
    };

    let color = getColor(savedData);

    let icon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background:${color};
                width:18px;
                height:18px;
                border-radius:50%;
                border:2px solid white;
            "></div>
        `
    });

    let marker = L.marker(coords, { icon }).addTo(map);

    marker.on('click', function() {

        let popup = `
            <b>${cliente}</b><br><br>

            Congelado:
            <input type="number"
                   id="c${cliente}"
                   value="${savedData.congelado}">
            <br><br>

            Refrigerado:
            <input type="number"
                   id="r${cliente}"
                   value="${savedData.refrigerado}">
            <br><br>

            <button onclick="saveData('${cliente}')">
                Guardar
            </button>
        `;

        marker.bindPopup(popup).openPopup();
    });

    markers.push(marker);
}

// Guardar pallets
function saveData(cliente) {

    let congelado =
        parseInt(document.getElementById("c" + cliente).value) || 0;

    let refrigerado =
        parseInt(document.getElementById("r" + cliente).value) || 0;

    let data = {
        congelado,
        refrigerado
    };

    localStorage.setItem(cliente, JSON.stringify(data));

    location.reload();
}

// Colores
function getColor(data) {

    if (data.congelado > 0 && data.refrigerado > 0) {
        return "purple";
    }

    if (data.congelado > 0) {
        return "red";
    }

    if (data.refrigerado > 0) {
        return "blue";
    }

    return "gray";
}
