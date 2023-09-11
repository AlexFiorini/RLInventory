const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const supportURL = "https://op.market/ref/thedevilofgames";

let inventory;

// Carica il file JSON
ipcRenderer.on('json-data', (event, jsonData) => {
    if (Array.isArray(jsonData)) {
        inventory = jsonData.filter(item => item.tradeable === 'true');
        createTable()
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
            { title: "Image", field: "image", headerSort:false, formatter: imageFormatter, resizable: false},
            { title: "Name", field: "name", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Slot", field: "slot", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Paint", field: "paint", headerFilter: "input", sorter: "string", formatter: paintFormatter, resizable: false},
            { title: "Certification", field: "rank_label", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Quality", field: "quality", headerFilter: "input", sorter: customQualitySorter, resizable: false},
            { title: "Special Edition", field: "special_edition", headerFilter: "input", sorter: "string", formatter: specialEditionFormatter, resizable: false}
        ],
    });

    table.on("tableBuilt", async function(){
        const itemsToAdd = [];
        const totalItems = inventory.length;
        let loadedItems = 0;
        for (const item of inventory) {
            if (item.quality !== '' && item.quality !== 'Common') {
                item.slot = handleDecal(item.slot);
                item.paint = handleNotPainted(item.paint);
                item.rank_label = handleNotCertificated(item.rank_label);
                item.special_edition = handleNotSE(item.special_edition);
                try {
                    item.image = await searchImage(item.product_id);
                } catch (error) {
                    item.image = "https://op.market/_next/static/media/FallbackItemImage.89e7bb87.svg";
                }
                itemsToAdd.push(item);
            }
            loadedItems++;
            const progress = (loadedItems / totalItems) * 100;
            updateLoadingProgress(progress);
        }
        table.setData(itemsToAdd);
        ipcRenderer.send('show-div2');
    });
}


document.getElementById('support').addEventListener('click', function() {
    require('electron').shell.openExternal(supportURL);
});

document.getElementById('fileInput').addEventListener('change', async (event) => {
    const selectedFile = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const fileContent = e.target.result;
            const parsedData = JSON.parse(fileContent);
            const parsedDataArray = Object.values(parsedData.inventory);
            if (Array.isArray(parsedDataArray)) {
                ipcRenderer.send('json-data', parsedDataArray);
                let table = document.getElementById('inventory-table');
                table.remove();
                var newtable = document.createElement("div");
                newtable.setAttribute("id", "inventory-table");
                document.getElementById("table").appendChild(newtable);
                inventory = parsedDataArray.filter(item => item.tradeable === 'true');
                ipcRenderer.send('show-div1');
                createTable();
            } else {
                console.error('JSON data is not in the expected format.');
            }
        } catch (jsonParseError) {
            console.error('Error parsing JSON data:', jsonParseError);
        }
    };

    reader.readAsText(selectedFile);
});

async function searchImage(item_id) {
    // Construct the URL for the image based on item_id
    const imageUrl = `https://ik.imagekit.io/2vhnpgodm/Rocket%20League/${item_id}.png`;

    try {
        // Attempt to fetch the image
        const response = await fetch(imageUrl);

        // Check if the response status is 200 (OK)
        if (response.status === 200) {
            return imageUrl; // Return the URL of the found image
        }
    } catch (error) {}

    // Return the fallback image URL if the image is not found or if there was an error
    return "https://op.market/_next/static/media/FallbackItemImage.89e7bb87.svg";
}

function updateLoadingProgress(progress) {
    const loadingProgress = document.getElementById("loading-progress");
    loadingProgress.style.width = `${progress}%`;
}