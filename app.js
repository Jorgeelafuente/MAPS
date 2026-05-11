// INICIAR MAPA
let map = L.map('map').setView([39.5, -0.4], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
}).addTo(map);

// ARRAY MARCADORES
let markers = [];

// CONVERTIR COORDENADAS GOOGLE MAPS
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

// CARGAR EXCEL
document.getElementById('fileInput').addEventListener('change', function(e) {

    let file = e.target.files[0];

    if (!file) return;

    console.log("Archivo cargado:", file.name);

    let reader = new FileReader();

    reader.onload = function(event) {

        let data = new Uint8Array(event.target.result);

        let workbook = XLSX.read(data, {
            type: 'array'
        });

        let sheetName = workbook.SheetNames[0];

        let sheet = workbook.Sheets[sheetName];

        // LEER COMO ARRAY
        let rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1
        });

        console.log("ROWS:", rows);

        // LIMPIAR MAPA
        markers.forEach(marker => {
            map.removeLayer(marker);
        });

        markers = [];

        // RECORRER FILAS
        for (let i = 1; i < rows.length; i++) {

            let row = rows[i];

            if (!row) continue;

            // COLUMNA A = CLIENTE
            let cliente = row[0];

            // COLUMNA D = COORDENADAS
            let coordsRaw = row[3];

            console.log("Cliente:", cliente);
            console.log("Coords:", coordsRaw);

            if (!cliente || !coordsRaw) continue;

            let coords = convertCoords(coordsRaw);

            if (!coords) continue;

            createMarker(cliente, coords);
        }

        updateSidebar();
    };

    reader.readAsArrayBuffer(file);
});

// CREAR MARCADOR
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

    let marker = L.marker(coords, {
        icon
    }).addTo(map);

    marker.on('click', function() {

        let popup = `
            <b>${cliente}</b>

            <br><br>

            Congelado:

            <br>

            <input
                type="number"
                id="c${cliente}"
                value="${savedData.congelado}"
            >

            <br><br>

            Refrigerado:

            <br>

            <input
                type="number"
                id="r${cliente}"
                value="${savedData.refrigerado}"
            >

            <br><br>

            <button onclick="saveData('${cliente}')">
                Guardar
            </button>
        `;

        marker.bindPopup(popup).openPopup();
    });

    marker.cliente = cliente;

    markers.push(marker);
}

// GUARDAR PALLETS
function saveData(cliente) {

    let congelado =
        parseInt(
            document.getElementById("c" + cliente).value
        ) || 0;

    let refrigerado =
        parseInt(
            document.getElementById("r" + cliente).value
        ) || 0;

    let data = {
        congelado,
        refrigerado
    };

    localStorage.setItem(
        cliente,
        JSON.stringify(data)
    );

    location.reload();
}

// COLOR MARCADOR
function getColor(data) {

    // MORADO = AMBOS
    if (
        data.congelado > 0 &&
        data.refrigerado > 0
    ) {
        return "purple";
    }

    // ROJO = CONGELADO
    if (data.congelado > 0) {
        return "red";
    }

    // AZUL = REFRIGERADO
    if (data.refrigerado > 0) {
        return "blue";
    }

    // GRIS = SIN DATOS
    return "gray";
}

// ACTUALIZAR PANEL LATERAL
function updateSidebar() {

    document.getElementById("totalClientes").innerText =
        markers.length + " clientes";

    let totalCongelado = 0;

    let totalRefrigerado = 0;

    markers.forEach(marker => {

        let cliente = marker.cliente;

        let data =
            JSON.parse(localStorage.getItem(cliente)) || {
                congelado: 0,
                refrigerado: 0
            };

        totalCongelado += data.congelado;

        totalRefrigerado += data.refrigerado;
    });

    document.getElementById("totalCongelado").innerText =
        totalCongelado + " pallets";

    document.getElementById("totalRefrigerado").innerText =
        totalRefrigerado + " pallets";
}
