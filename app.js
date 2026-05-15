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
let clientesData = [];

// =============================
// CONDUCTORES
// =============================

let drivers = JSON.parse(
    localStorage.getItem("drivers")
) || [];

let driversData = [];

let routesData = JSON.parse(
    localStorage.getItem("routesData")
) || {};

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

    document
    .getElementById("driversCheck")
    .innerHTML = "✓";

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

        let route =
            routesData[driver];

        card.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
            ">

                <div class="driver-name">
                    ${driver}
                </div>

                <div class="driver-actions">

                    <button
                        class="info-btn"
                        onclick="toggleDriverInfo('${driver}')"
                    >
                        i
                    </button>

                    <button
                        class="add-btn"
                        onclick="toggleRoute('${driver}')"
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

            </div>

            <div id="info-${driver}"></div>

            <div id="route-${driver}"></div>

            ${
                route
                ?
                `
                <div class="saved-route">

                    <div class="saved-route-title">
                        🚛 ${route.routeName}
                    </div>

                    ${route.clients.map(client => `
                        <div class="saved-client">

                            <span>
                                ${client.cliente}
                            </span>

                            <span>
                                C:${client.congelado}
                                |
                                R:${client.refrigerado}
                            </span>

                        </div>
                    `).join('')}

                    <div class="saved-total">

                        TOTAL:
                        ${route.total}
                        /
                        ${route.capacity}

                        ${
                            route.total > route.capacity
                            ?
                            `<span class="warning">⚠️</span>`
                            :
                            ''
                        }

                    </div>

                </div>
                `
                :
                ''
            }
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

    delete routesData[driver];

    localStorage.setItem(
        "drivers",
        JSON.stringify(drivers)
    );

    localStorage.setItem(
        "routesData",
        JSON.stringify(routesData)
    );

    renderDrivers();
}

// =============================
// INFO CONDUCTOR
// =============================

function toggleDriverInfo(driver) {

    let container =
        document.getElementById(`info-${driver}`);

    if (container.innerHTML !== "") {

        container.innerHTML = "";

        return;
    }

    if (driversData.length === 0) {

        container.innerHTML = `
            <div class="driver-info">
                No se ha cargado Excel conductores
            </div>
        `;

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

        container.innerHTML = `
            <div class="driver-info">
                No encontrado
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="driver-info">

            <div class="driver-info-grid">

                <div class="driver-info-item">
                    <span>Matrícula</span>
                    <p>${found[1] || "-"}</p>
                </div>

                <div class="driver-info-item">
                    <span>Teléfono</span>
                    <p>${found[2] || "-"}</p>
                </div>

                <div class="driver-info-item">
                    <span>Tipo</span>
                    <p>${found[3] || "-"}</p>
                </div>

                <div class="driver-info-item">
                    <span>Capacidad</span>
                    <p>${found[4] || "-"}</p>
                </div>

                <div class="driver-info-item">
                    <span>Zona</span>
                    <p>${found[5] || "-"}</p>
                </div>

                <div class="driver-info-item">
                    <span>Observaciones</span>
                    <p>${found[6] || "-"}</p>
                </div>

            </div>

        </div>
    `;
}

// =============================
// RUTAS
// =============================

function toggleRoute(driver) {

    let container =
        document.getElementById(`route-${driver}`);

    if (container.innerHTML !== "") {

        container.innerHTML = "";

        return;
    }

    let capacity =
        getDriverCapacity(driver);

    let availableClients =
        getAvailableClients(driver);

    container.innerHTML = `
        <div class="route-box">

            <input
                type="text"
                id="routeName-${driver}"
                placeholder="Nombre ruta"
                class="route-input"
            >

            <div class="clients-selector">

                ${
                    availableClients.map(client => `
                        <label class="client-option">

                            <input
                                type="checkbox"
                                value="${client.cliente}"
                                onchange="updateRouteTotals('${driver}')"
                            >

                            <span>
                                ${client.cliente}
                            </span>

                            <small>
                                C:${client.congelado}
                                |
                                R:${client.refrigerado}
                            </small>

                        </label>
                    `).join('')
                }

            </div>

            <div
                id="totals-${driver}"
                class="route-totals"
            >
                Total: 0 / ${capacity}
            </div>

            <button
                class="save-route-btn"
                onclick="saveRoute('${driver}')"
            >
                Guardar Ruta
            </button>

        </div>
    `;
}

// =============================
// CLIENTES DISPONIBLES
// =============================

function getAvailableClients(currentDriver) {

    let usedClients = [];

    Object.keys(routesData).forEach(driver => {

        if (driver === currentDriver) return;

        routesData[driver].clients.forEach(client => {

            usedClients.push(client.cliente);
        });
    });

    return clientesData.filter(client => {

        return !usedClients.includes(
            client.cliente
        );
    });
}

// =============================
// CAPACIDAD
// =============================

function getDriverCapacity(driver) {

    for (let i = 1; i < driversData.length; i++) {

        let row = driversData[i];

        if (!row) continue;

        let name =
            String(row[0] || "")
            .trim()
            .toUpperCase();

        if (name === driver) {

            return parseInt(row[4]) || 0;
        }
    }

    return 0;
}

// =============================
// TOTALES
// =============================

function updateRouteTotals(driver) {

    let checkboxes =
        document.querySelectorAll(
            `#route-${driver} input[type="checkbox"]:checked`
        );

    let total = 0;

    checkboxes.forEach(box => {

        let client =
            clientesData.find(c =>
                c.cliente === box.value
            );

        total +=
            client.congelado +
            client.refrigerado;
    });

    let capacity =
        getDriverCapacity(driver);

    let html = `
        ${total} / ${capacity}
    `;

    if (total > capacity) {

        html += `
            <span class="warning">
                ⚠️
            </span>
        `;
    }

    document
    .getElementById(`totals-${driver}`)
    .innerHTML = html;
}

// =============================
// GUARDAR RUTA
// =============================

function saveRoute(driver) {

    let routeName =
        document
        .getElementById(
            `routeName-${driver}`
        )
        .value
        .trim();

    if (!routeName) {

        alert("Pon nombre ruta");

        return;
    }

    let selected =
        document.querySelectorAll(
            `#route-${driver} input[type="checkbox"]:checked`
        );

    let clients = [];

    let total = 0;

    selected.forEach(box => {

        let client =
            clientesData.find(c =>
                c.cliente === box.value
            );

        clients.push(client);

        total +=
            client.congelado +
            client.refrigerado;
    });

    routesData[driver] = {

        routeName,

        clients,

        total,

        capacity:
            getDriverCapacity(driver)
    };

    localStorage.setItem(
        "routesData",
        JSON.stringify(routesData)
    );

    renderDrivers();
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

    document
    .getElementById("clientsCheck")
    .innerHTML = "✓";

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

        clientesData = [];

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

            let clientData = {

                cliente,
                municipio,
                localidad,
                congelado,
                refrigerado,
                coords
            };

            clientesData.push(clientData);

            createMarker(clientData);
        }

        updateSidebar();
    };

    reader.readAsArrayBuffer(file);
});

// =============================
// MARCADORES
// =============================

function createMarker(client) {

    let color =
        getColor(
            client.congelado,
            client.refrigerado
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
        L.marker(client.coords, {
            icon
        }).addTo(map);

    marker.bindPopup(`
        <div style="min-width:220px">

            <h3 style="
                color:#1464c4;
                margin-bottom:10px;
            ">
                ${client.cliente}
            </h3>

            <b>Municipio:</b>
            ${client.municipio}

            <br><br>

            <b>Localidad:</b>
            ${client.localidad}

            <br><br>

            <b>Congelado:</b>
            ${client.congelado}

            <br><br>

            <b>Refrigerado:</b>
            ${client.refrigerado}

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
            marker.congelado || 0;

        totalRefrigerado +=
            marker.refrigerado || 0;
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
