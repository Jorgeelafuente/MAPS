// =============================
// MAPA
// =============================

let map = L.map('map').setView([39.5, -0.4], 8);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: 'OpenStreetMap'
    }
).addTo(map);

let markers = [];

// =============================
// CONDUCTORES
// =============================

let drivers = JSON.parse(
    localStorage.getItem("drivers")
) || [];

let driversData = [];

// =============================
// MODAL
// =============================

const driversModal =
    document.getElementById("driversModal");

document
.getElementById("driversBtn")
.addEventListener("click", () => {

    driversModal.classList.remove("hidden");

    renderDrivers();
});

document
.getElementById("closeModal")
.addEventListener("click", () => {

    driversModal.classList.add("hidden");
});

// =============================
// SUBIR EXCEL CONDUCTORES
// =============================

document
.getElementById("driversFile")
.addEventListener("change", function(e) {

    let file = e.target.files[0];

    if (!file) return;

    let reader = new FileReader();

    reader.onload = function(event) {

        let data =
            new Uint8Array(event.target.result);

        let workbook = XLSX.read(data, {
            type: 'array'
        });

        let sheetName =
            workbook.SheetNames[0];

        let sheet =
            workbook.Sheets[sheetName];

        driversData =
            XLSX.utils.sheet_to_json(sheet, {
                header: 1
            });

        alert("Excel conductores cargado");
    };

    reader.readAsArrayBuffer(file);
});

// =============================
// AÑADIR CONDUCTOR
// =============================

document
.getElementById("addDriverBtn")
.addEventListener("click", () => {

    let input =
        document.getElementById("driverName");

    let name =
        input.value.trim().toUpperCase();

    if (!name) return;

    if (drivers.includes(name)) {

        alert("El conductor ya existe");

        return;
    }

    drivers.push(name);

    drivers.sort();

    localStorage.setItem(
        "drivers",
        JSON.stringify(drivers)
    );

    input.value = "";

    renderDrivers();
});

// =============================
// RENDER CONDUCTORES
// =============================

function renderDrivers() {

    let container =
        document.getElementById("driversList");

    container.innerHTML = "";

    drivers.forEach(driver => {

        let card =
            document.createElement("div");

        card.className = "driver-card";

        card.innerHTML = `
            <div class="driver-name">
                ${driver}
            </div>

            <div class="driver-actions">

                <button
                    class="info-btn"
                    onclick="showDriverInfo('${driver}')"
                >
                    i
                </button>

                <button
                    class="add-btn"
                >
                    +
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteDriver('${driver}')"
                >
                    🗑
                </button>

            </div>
        `;

        container.appendChild(card);
    });
}

// =============================
// ELIMINAR CONDUCTOR
// =============================

function deleteDriver(driver) {

    let confirmDelete =
        confirm(
            `¿Eliminar conductor ${driver}?`
        );

    if (!confirmDelete) return;

    drivers =
        drivers.filter(d => d !== driver);

    localStorage.setItem(
        "drivers",
        JSON.stringify(drivers)
    );

    renderDrivers();
}

// =============================
// INFO CONDUCTOR
// =============================

function showDriverInfo(driver) {

    if (driversData.length === 0) {

        alert(
            "Primero sube el Excel conductores"
        );

        return;
    }

    let found = null;

    for (let i = 1; i < driversData.length; i++) {

        let row = driversData[i];

        if (!row) continue;

        let name =
            String(row[0] || "")
            .trim()
            .toUpperCase();

        if (name === driver) {

            found = row;

            break;
        }
    }

    if (!found) {

        alert(
            "No se encontró información"
        );

        return;
    }

    alert(`
Nombre: ${found[0] || "-"}

Matrícula: ${found[1] || "-"}

Teléfono: ${found[2] || "-"}

Tipo: ${found[3] || "-"}

Capacidad: ${found[4] || "-"}

Zona: ${found[5] || "-"}

Observaciones: ${found[6] || "-"}
    `);
}

// =============================
// COORDENADAS
// =============================

function convertCoords(coord) {

    coord = String(coord).trim();

    let regex =
        /(\d+)°(\d+)'([\d.]+)"([NS])\s*(\d+)°(\d+)'([\d.]+)"([EW])/;

    let match = coord.match(regex);

    if (!match) return null;

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

// =============================
// CLIENTES
// =============================

document
.getElementById('fileInput')
.addEventListener('change', function(e) {

    let file = e.target.files[0];

    if (!file) return;

    let reader = new FileReader();

    reader.onload = function(event) {

        let data =
            new Uint8Array(event.target.result);

        let workbook =
            XLSX.read(data, {
                type: 'array'
            });

        let sheetName =
            workbook.SheetNames[0];

        let sheet =
            workbook.Sheets[sheetName];

        let rows =
            XLSX.utils.sheet_to_json(sheet, {
                header: 1
            });

        markers.forEach(marker => {
            map.removeLayer(marker);
        });

        markers = [];

        for (let i = 1; i < rows.length; i++) {

            let row = rows[i];

            if (!row) continue;

            let cliente = row[0];
            let municipio = row[1];
            let localidad = row[2];
            let coordsRaw = row[3];

            let congelado =
                parseInt(row[5]) || 0;

            let refrigerado =
                parseInt(row[6]) || 0;

            if (!cliente || !coordsRaw)
                continue;

            let coords =
                convertCoords(coordsRaw);

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

// =============================
// MARCADORES
// =============================

function createMarker(
    cliente,
    municipio,
    localidad,
    coords,
    congelado,
    refrigerado
) {

    let color =
        getColor(
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
                box-shadow:0 0 8px rgba(0,0,0,0.4);
            "></div>
        `
    });

    let marker =
        L.marker(coords, {
            icon
        }).addTo(map);

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
            ${congelado}

            <br><br>

            <b>Refrigerado:</b>
            ${refrigerado}

        </div>
    `);

    markers.push(marker);
}

// =============================
// COLORES
// =============================

function getColor(
    congelado,
    refrigerado
) {

    if (
        congelado > 0 &&
        refrigerado > 0
    ) {
        return "#7b1fa2";
    }

    if (congelado > 0) {
        return "#e53935";
    }

    if (refrigerado > 0) {
        return "#1e88e5";
    }

    return "#9e9e9e";
}

// =============================
// SIDEBAR
// =============================

function updateSidebar() {

    document
    .getElementById("totalClientes")
    .innerText =
        markers.length + " clientes";

    let totalCongelado = 0;

    let totalRefrigerado = 0;

    markers.forEach(marker => {

        totalCongelado +=
            marker.congelado;

        totalRefrigerado +=
            marker.refrigerado;
    });

    document
    .getElementById("totalCongelado")
    .innerText =
        totalCongelado + " pallets";

    document
    .getElementById("totalRefrigerado")
    .innerText =
        totalRefrigerado + " pallets";
}
