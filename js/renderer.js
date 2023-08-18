const { ipcRenderer } = require('electron');
// const slotMapping = {
//     'Animated Decal': 'decals',
//     'Antenna': 'antennas',
//     'Avatar Border': 'avatar_borders',
//     'Body': 'cars',
//     'Decal': 'decals',
//     'Engine audio': 'engine_sounds',
//     'Goal Explosion': 'goal_explosions',
//     'Paint Finish': 'paint_finishes',
//     'Player Banner': 'banners',
//     'Rocket Boost': 'boosts',
//     'Topper': 'toppers',
//     'Trail': 'trails',
//     'Wheels': 'wheels'
// };

let inventory;

// Carica il file JSON
ipcRenderer.on('json-data', (event, jsonData) => {
    if (Array.isArray(jsonData)) {
        inventory = jsonData.filter(item => item.tradeable === 'true');

        // Creazione della tabella solo dopo aver filtrato i dati
        createTable();
    } else {
        console.error('Invalid JSON data received:', jsonData);
    }
});

// Richiedi il file JSON al processo principale
ipcRenderer.send('get-json-data');


function createTable() {
    const table = new Tabulator("#inventory-table", {
        layout: "fitDataStretch",
        responsiveLayout: "collapse",
        columns: [
            { title: "Name", field: "name", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Slot", field: "slot", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Paint", field: "paint", headerFilter: "input", sorter: "string", formatter: paintFormatter, resizable: false},
            { title: "Certification", field: "rank_label", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Quality", field: "quality", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Special Edition", field: "special_edition", headerFilter: "input", sorter: "string", resizable: false}
        ],
    });

    table.on("tableBuilt", async function(){
        const itemsToAdd = [];
        for (const item of inventory) {
            if (item.quality !== '' && item.quality !== 'Common') {
                itemsToAdd.push(item);
            }
        }
        table.setData(itemsToAdd);
    });
}

function paintFormatter(cell, formatterParams, onRendered) {
    const color = cell.getValue();
    const backgroundStyle = getBackgroundStyleForColor(color);
    return `<div style="background: ${backgroundStyle}; padding: 5px; border-radius: 3px;">${handleNonePainted(color)}</div>`;
}

function handleNonePainted(value) {
    return value === 'none' ? 'Unpainted' : value;
}

function getBackgroundStyleForColor(color) {
    return colorBackgrounds[color] || '';
}

const colorBackgrounds = {
    'Black': 'linear-gradient(135deg,#5e5e5e,#000 80%)',
    'Titanium White': 'linear-gradient(135deg,#fff,#e5e5e5 80%)',
    'Grey': 'linear-gradient(135deg,#c4c4c4,#5d5d5d 80%)',
    'Crimson': 'linear-gradient(135deg,#ff4d4d,#b00 80%)',
    'Pink': 'linear-gradient(135deg,#ff8dce,#e52667 80%)',
    'Cobalt': 'linear-gradient(135deg,#8c9eff,#25379b 80%)',
    'Sky Blue': 'linear-gradient(135deg,#50f6ff,#008fda 80%)',
    'Burnt Sienna': 'linear-gradient(135deg,#995e4d,#320000 80%)',
    'Saffron': 'linear-gradient(135deg,#ff8,#e5d121 80%)',
    'Lime': 'linear-gradient(135deg,#ccff4d,#65e500 80%)',
    'Forest Green': 'linear-gradient(135deg,#99fc9d,#329536 80%)',
    'Orange': 'linear-gradient(135deg,#ffff4d,#da9a00 80%)',
    'Purple': 'linear-gradient(135deg,#e974fd,#820d96 80%)',
    'Gold': 'linear-gradient(135deg,#EAF0A3,#9BA25F 80%)',
    'Unpainted': ''
}