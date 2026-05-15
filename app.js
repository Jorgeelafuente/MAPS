// ===============================
// MAPA
// ===============================

const map = L.map('map').setView([39.5, -0.4], 8);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: 'OpenStreetMap'
    }
).addTo(map);

let markers = [];
let clientesData = [];

let selectedDriver = null;
let routeMode = false;

let routeLines = [];

const driverColors = [
    "#1E88E5",
    "#43A047",
    "#E53935",
    "#8E24AA",
    "#FB8C00",
    "#00ACC1",
    "#3949AB"
];

// ===============================
// CONDUCTORES
// ===============================

let drivers =
    JSON.parse(localStorage.getItem("drivers"))
    || [];

let driversData = [];

let routesData =
    JSON.parse(localStorage.getItem("routesData"))
    || {};

// ===============================
// MODAL CONDUCTORES
// ===============================

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

// ===============================
// EXCEL CONDUCTORES
// ===============================

document
.getElementById("driversFile")
.addEventListener("change", function(e){

    let file = e.target.files[0];

    if(!file) return;

    document
    .getElementById("driversCheck")
    .innerHTML = "✓";

    let reader = new FileReader();

    reader.onload = function(event){

        let data =
            new Uint8Array(event.target.result);

        let workbook =
            XLSX.read(data, {
                type:'array'
            });

        let sheetName =
            workbook.SheetNames[0];

        let sheet =
            workbook.Sheets[sheetName];

        driversData =
            XLSX.utils.sheet_to_json(sheet,{
                header:1
            });
    };

    reader.readAsArrayBuffer(file);
});

// ===============================
// AÑADIR CONDUCTOR
// ===============================

document
.getElementById("addDriverBtn")
.addEventListener("click", () => {

    let input =
        document.getElementById("driverName");

    let name =
        input.value.trim().toUpperCase();

    if(!name) return;

    if(drivers.includes(name)) return;

    drivers.push(name);

    drivers.sort();

    localStorage.setItem(
        "drivers",
        JSON.stringify(drivers)
    );

    input.value = "";

    renderDrivers();
});

// ===============================
// RENDER CONDUCTORES
// ===============================

function renderDrivers(){

    let container =
        document.getElementById("driversList");

    container.innerHTML = "";

    drivers.forEach((driver,index) => {

        let route =
            routesData[driver];

        let card =
            document.createElement("div");

        card.className = "driver-card";

        let color =
            driverColors[index % driverColors.length];

        card.innerHTML = `

            <div class="driver-top">

                <div class="driver-name-box">

                    <div
                        class="driver-color"
                        style="background:${color}"
                    ></div>

                    <div class="driver-name">
                        ${driver}
                    </div>

                </div>

                <div class="driver-actions">

                    <button
                        class="driver-btn info-btn"
                        onclick="toggleDriverInfo('${driver}')"
                    >
                        i
                    </button>

                    <button
                        class="driver-btn add-btn"
                        onclick="toggleRouteCreator('${driver}')"
                    >
                        +
                    </button>

                    <button
                        class="driver-btn delete-btn"
                        onclick="deleteDriver('${driver}')"
                    >
                        🗑
                    </button>

                </div>

            </div>

            <div id="info-${driver}"></div>

            <div id="routeCreator-${driver}"></div>

            ${
                route
                ?
                `
                <div class="route-card">

                    <div class="route-header">

                        <div>

                            <div class="route-title">
                                ${route.routeName}
                            </div>

                            <div class="route-total">
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

                        <button
                            class="map-select-btn"
                            onclick="activateRouteMode('${driver}')"
                        >
                            🗺
                        </button>

                    </div>

                    <div class="route-clients">

                        ${
                            route.clients.map(client => `
                                <div class="mini-client">

                                    <span>
                                        ${client.cliente}
                                    </span>

                                    <small>
                                        C:${client.congelado}
                                        |
                                        R:${client.refrigerado}
                                    </small>

                                </div>
                            `).join('')
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

// ===============================
// CREAR RUTA
// ===============================

function toggleRouteCreator(driver){

    let container =
        document.getElementById(
            `routeCreator-${driver}`
        );

    if(container.innerHTML !== ""){

        container.innerHTML = "";

        return;
    }

    container.innerHTML = `

        <div class="route-create-box">

            <input
                type="text"
                id="routeName-${driver}"
                placeholder="Nombre ruta"
                class="route-input"
            >

            <button
                class="create-route-btn"
                onclick="createRoute('${driver}')"
            >
                Crear Ruta
            </button>

        </div>

    `;
}

// ===============================
// CREAR RUTA
// ===============================

function createRoute(driver){

    let input =
        document.getElementById(
            `routeName-${driver}`
        );

    let routeName =
        input.value.trim();

    if(!routeName){

        alert("Pon nombre ruta");

        return;
    }

    routesData[driver] = {

        routeName,

        clients:[],

        total:0,

        capacity:
            getDriverCapacity(driver)
    };

    localStorage.setItem(
        "routesData",
        JSON.stringify(routesData)
    );

    renderDrivers();
}

// ===============================
// ACTIVAR MODO RUTA
// ===============================

function activateRouteMode(driver){

    selectedDriver = driver;

    routeMode = true;

    alert(
        `Modo ruta activado para ${driver}.\n\nHaz click en clientes del mapa`
    );
}

// ===============================
// CLICK CLIENTE
// ===============================

function addClientToRoute(client){

    if(!routeMode) return;

    if(!selectedDriver) return;

    let route =
        routesData[selectedDriver];

    if(!route) return;

    let exists =
        route.clients.find(c =>
            c.cliente === client.cliente
        );

    if(exists) return;

    route.clients.push(client);

    route.total +=
        client.congelado +
        client.refrigerado;

    localStorage.setItem(
        "routesData",
        JSON.stringify(routesData)
    );

    drawRoute(selectedDriver);

    renderDrivers();
}

// ===============================
// DIBUJAR RUTA
// ===============================

function drawRoute(driver){

    routeLines.forEach(line => {
        map.removeLayer(line);
    });

    routeLines = [];

    let route =
        routesData[driver];

    if(!route) return;

    if(route.clients.length < 2) return;

    let coords =
        route.clients.map(c => c.coords);

    let color =
        getDriverColor(driver);

    let polyline =
        L.polyline(coords,{
            color,
            weight:5,
            opacity:0.8
        }).addTo(map);

    routeLines.push(polyline);
}

// ===============================
// COLOR CONDUCTOR
// ===============================

function getDriverColor(driver){

    let index =
        drivers.indexOf(driver);

    return driverColors[
        index % driverColors.length
    ];
}

// ===============================
// INFO CONDUCTOR
// ===============================

function toggleDriverInfo(driver){

    let container =
        document.getElementById(`info-${driver}`);

    if(container.innerHTML !== ""){

        container.innerHTML = "";

        return;
    }

    let found = null;

    for(let i=1;i<driversData.length;i++){

        let row = driversData[i];

        if(!row) continue;

        let name =
            String(row[0] || "")
            .trim()
            .toUpperCase();

        if(name === driver){

            found = row;

            break;
        }
    }

    if(!found){

        container.innerHTML = `
            <div class="driver-info-box">
                No encontrado
            </div>
        `;

        return;
    }

    container.innerHTML = `

        <div class="driver-info-box">

            <div class="info-grid">

                <div class="info-item">
                    <span>Matrícula</span>
                    <p>${found[1] || "-"}</p>
                </div>

                <div class="info-item">
                    <span>Teléfono</span>
                    <p>${found[2] || "-"}</p>
                </div>

                <div class="info-item">
                    <span>Tipo</span>
                    <p>${found[3] || "-"}</p>
                </div>

                <div class="info-item">
                    <span>Capacidad</span>
                    <p>${found[4] || "-"}</p>
                </div>

                <div class="info-item">
                    <span>Zona</span>
                    <p>${found[5] || "-"}</p>
                </div>

                <div class="info-item">
                    <span>Observaciones</span>
                    <p>${found[6] || "-"}</p>
                </div>

            </div>

        </div>

    `;
}

// ===============================
// ELIMINAR CONDUCTOR
// ===============================

function deleteDriver(driver){

    let confirmDelete =
        confirm(
            `¿Eliminar ${driver}?`
        );

    if(!confirmDelete) return;

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

// ===============================
// CAPACIDAD
// ===============================

function getDriverCapacity(driver){

    for(let i=1;i<driversData.length;i++){

        let row = driversData[i];

        if(!row) continue;

        let name =
            String(row[0] || "")
            .trim()
            .toUpperCase();

        if(name === driver){

            return parseInt(row[4]) || 0;
        }
    }

    return 0;
}

// ===============================
// CLIENTES
// ===============================

document
.getElementById("fileInput")
.addEventListener("change", function(e){

    let file = e.target.files[0];

    if(!file) return;

    document
    .getElementById("clientsCheck")
    .innerHTML = "✓";

    let reader = new FileReader();

    reader.onload = function(event){

        let data =
            new Uint8Array(event.target.result);

        let workbook =
            XLSX.read(data,{
                type:'array'
            });

        let sheetName =
            workbook.SheetNames[0];

        let sheet =
            workbook.Sheets[sheetName];

        let rows =
            XLSX.utils.sheet_to_json(sheet,{
                header:1
            });

        markers.forEach(marker=>{
            map.removeLayer(marker);
        });

        markers = [];

        clientesData = [];

        for(let i=1;i<rows.length;i++){

            let row = rows[i];

            if(!row) continue;

            let cliente = row[0];
            let municipio = row[1];
            let localidad = row[2];
            let coordsRaw = row[3];

            let congelado =
                parseInt(row[5]) || 0;

            let refrigerado =
                parseInt(row[6]) || 0;

            if(!cliente || !coordsRaw)
                continue;

            let coords =
                convertCoords(coordsRaw);

            if(!coords) continue;

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

// ===============================
// CREAR MARCADOR
// ===============================

function createMarker(client){

    let color =
        getColor(
            client.congelado,
            client.refrigerado
        );

    let marker =
        L.circleMarker(client.coords,{

            radius:10,

            fillColor:color,

            color:"#ffffff",

            weight:2,

            opacity:1,

            fillOpacity:0.9

        }).addTo(map);

    marker.on("click", () => {

        addClientToRoute(client);

        marker.openPopup();
    });

    marker.bindPopup(`

        <div class="popup-card">

            <div class="popup-title">
                ${client.cliente}
            </div>

            <div class="popup-row">
                ${client.localidad}
            </div>

            <div class="popup-pallets">

                <div class="badge frozen">
                    ❄ ${client.congelado}
                </div>

                <div class="badge cold">
                    🧊 ${client.refrigerado}
                </div>

            </div>

        </div>

    `);

    markers.push(marker);
}

// ===============================
// COLORES
// ===============================

function getColor(
    congelado,
    refrigerado
){

    if(
        congelado > 0 &&
        refrigerado > 0
    ){
        return "#8E24AA";
    }

    if(congelado > 0){
        return "#E53935";
    }

    if(refrigerado > 0){
        return "#1E88E5";
    }

    return "#757575";
}

// ===============================
// COORDENADAS
// ===============================

function convertCoords(coord){

    coord = String(coord).trim();

    let regex =
        /(\d+)°(\d+)'([\d.]+)"([NS])\s*(\d+)°(\d+)'([\d.]+)"([EW])/;

    let match =
        coord.match(regex);

    if(!match) return null;

    let lat =
        (+match[1]) +
        (+match[2]/60) +
        (+match[3]/3600);

    let lng =
        (+match[5]) +
        (+match[6]/60) +
        (+match[7]/3600);

    if(match[4] === "S") lat = -lat;

    if(match[8] === "W") lng = -lng;

    return [lat,lng];
}

// ===============================
// SIDEBAR
// ===============================

function updateSidebar(){

    document
    .getElementById("totalClientes")
    .innerText =
        markers.length + " clientes";

    let congelado = 0;
    let refrigerado = 0;

    clientesData.forEach(client => {

        congelado += client.congelado;
        refrigerado += client.refrigerado;
    });

    document
    .getElementById("totalCongelado")
    .innerText =
        congelado + " pallets";

    document
    .getElementById("totalRefrigerado")
    .innerText =
        refrigerado + " pallets";
}
