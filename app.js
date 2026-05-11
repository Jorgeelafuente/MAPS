// INICIAR MAPA
let map = L.map('map').setView([39.5, -0.4], 8);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: 'OpenStreetMap'
    }
).addTo(map);

// ARRAY MARCADORES
let markers = [];

// CONVERTIR COORDENADAS
function convertCoords(coord) {

    coord = String(coord).trim();

    let regex =
        /(\d+)°(\d+)'([\d.]+)"([NS])\s*(\d+)°(\d+)'([\d.]+)"([EW])/;

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
document.getElementById('fileInput')
.addEventListener('change', function(e) {

    let file = e.target.files[0];

    if (!file) return;

    let reader = new FileReader();

    reader.onload = function(event) {

        let data = new Uint8Array(event.target.result);

        let workbook = XLSX.read(data, {
            type: 'array'
        });

        let sheetName = workbook.SheetNames[0];

        let sheet = workbook.Sheets[sheetName];

        let rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1
        });

        // LIMPIAR MAPA
        markers.forEach(marker => {
            map.removeLayer(marker);
        });

        markers = [];

        // RECORRER FILAS
        for (let i = 1; i < rows.length; i++) {

            let row = rows[i];

            if (!row) continue;

            // COLUMNAS
            let cliente = row[0];
            let municipio = row[1];
            let localidad = row[2];
            let coordsRaw = row[3];

            // NUEVAS COLUMNAS
            let congelado = parseInt(row[8]) || 0;
            let refrigerado = parseInt(row[9]) || 0;

            if (!cliente || !coordsRaw) continue;

            let coords = convertCoords(coordsRaw);

            if (!coords) continue;

            createMarker(
                cliente,
                municipio,
                localidad,
                coords,
                congelado,
                refrigerado
            );
        }

        updateSidebar();
    };

    reader.readAsArrayBuffer(file);
});

// CREAR MARCADOR
function createMarker(
    cliente,
    municipio,
    localidad,
    coords,
    congelado,
    refrigerado
) {

    let color = getColor(
        congelado,
        refrigerado
    );

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

    marker.cliente = cliente;

    marker.congelado = congelado;

    marker.refrigerado = refrigerado;

    marker.bindPopup(`
        <div style="min-width:220px">

            <h3 style="
                color:#1464c4;
                margin-bottom:10px;
            ">
                ${cliente}
            </h3>

            <b>Municipio:</b>
            ${municipio}
            <br><br>

            <b>Localidad:</b>
            ${localidad}
            <br><br>

            <b>Congelado:</b>
            ${congelado} pallets
            <br><br>

            <b>Refrigerado:</b>
            ${refrigerado} pallets

        </div>
    `);

    markers.push(marker);
}

// COLORES
function getColor(congelado, refrigerado) {

    // MORADO
    if (
        congelado > 0 &&
        refrigerado > 0
    ) {
        return "#7b1fa2";
    }

    // ROJO
    if (congelado > 0) {
        return "#e53935";
    }

    // AZUL
    if (refrigerado > 0) {
        return "#1e88e5";
    }

    // GRIS
    return "#9e9e9e";
}

// ACTUALIZAR SIDEBAR
function updateSidebar() {

    document.getElementById("totalClientes").innerText =
        markers.length + " clientes";

    let totalCongelado = 0;

    let totalRefrigerado = 0;

    markers.forEach(marker => {

        totalCongelado += marker.congelado;

        totalRefrigerado += marker.refrigerado;
    });

    document.getElementById("totalCongelado").innerText =
        totalCongelado + " pallets";

    document.getElementById("totalRefrigerado").innerText =
        totalRefrigerado + " pallets";
}
