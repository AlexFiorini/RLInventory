const { ipcRenderer } = require('electron');
const fs = require('fs');
const URL = "https://op.market/ref/thedevilofgames";

let inventory;

// Carica il file JSON
ipcRenderer.on('json-data', (event, jsonData) => {
    if (Array.isArray(jsonData)) {
        inventory = jsonData.filter(item => item.tradeable === 'true');
        console.log(inventory);
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
            { title: "Quality", field: "quality", headerFilter: "input", sorter: customQualitySorter, resizable: false},
            { title: "Special Edition", field: "special_edition", headerFilter: "input", sorter: "string", formatter: specialEditionFormatter, resizable: false}
        ],
    });

    table.on("tableBuilt", async function(){
        const itemsToAdd = [];
        for (const item of inventory) {
            if (item.quality !== '' && item.quality !== 'Common') {
                item.slot = handleDecal(item.slot);
                item.paint = handleNotPainted(item.paint);
                item.rank_label = handleNotCertificated(item.rank_label);
                item.special_edition = handleNotSE(item.special_edition);
                itemsToAdd.push(item);
            }
        }
        table.setData(itemsToAdd);
    });
}

function createTablefile(data) {
    const table = new Tabulator("#inventory-table", {
        layout: "fitDataStretch",
        responsiveLayout: "collapse",
        columns: [
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
        for (const item of data) {
            if (item.quality !== '' && item.quality !== 'Common') {
                item.slot = handleDecal(item.slot);
                item.paint = handleNotPainted(item.paint);
                item.rank_label = handleNotCertificated(item.rank_label);
                item.special_edition = handleNotSE(item.special_edition);
                itemsToAdd.push(item);
            }
        }
        table.setData(itemsToAdd);
    });
};

document.getElementById('support').addEventListener('click', function() {
    require('electron').shell.openExternal(URL);
});

document.getElementById('fileInput').addEventListener('change', async (event) => {
    const selectedFile = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const fileContent = e.target.result;
            const parsedData = JSON.parse(fileContent);
            const parsedDataArray = Object.values(parsedData.inventory);
            console.log(parsedDataArray);
            if (Array.isArray(parsedDataArray)) {
                ipcRenderer.send('json-data', parsedDataArray);
                let table = document.getElementById('inventory-table');
                table.remove();
                var newtable = document.createElement("div");
                newtable.setAttribute("id", "inventory-table");
                document.body.appendChild(newtable);
                var inventory2 = parsedDataArray.filter(item => item.tradeable === 'true');
                console.log(inventory2);
                createTablefile(inventory2);
            } else {
                console.error('JSON data is not in the expected format.');
            }
        } catch (jsonParseError) {
            console.error('Error parsing JSON data:', jsonParseError);
        }
    };

    reader.readAsText(selectedFile);
});

document.getElementById('prices').addEventListener('click', function() {
    console.log('Prezzario in fase di download');
    fetchPricesOP();
});

async function fetchPricesOP() {
    try {
        const response = await fetch("https://op.market/en/prices/pc");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const htmlContent = await response.text();

        // Fix image URLs by adding the domain "https://op.market" before "/_next"
        const fixedHtmlContent = htmlContent.replace(/\/_next/g, 'https://op.market/_next');

        //console.log(fixedHtmlContent);
        searchAndDisplay('3-Lobe', fixedHtmlContent);
    } catch (error) {
        console.error('Error fetching HTML:', error);
    }
}

function searchAndDisplay(nameToSearch, htmlContent) {
    try {
        // Create a temporary div element to parse the HTML string
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Select all elements with the specified class
        const containers = tempDiv.querySelectorAll('.w-full.h-auto.bg-\\[\\#151423\\].rounded-lg.flex.flex-col.p-4.gap-2.items-start.justify-items-center.grow');
        
        // Iterate through the containers
        containers.forEach((container) => {
            // Select all child elements with the specified class
            const childElements = container.querySelectorAll('.text-xl');
            
            if (childElements) {
                // Iterate through the child elements
                childElements.forEach((nameElement) => {
                    // Check if the name matches the one you're looking for
                    if (nameElement.textContent.trim() === nameToSearch) {
                        console.log(nameToSearch);
                        // // Select elements with background color
                        // const backgroundColorElements = nameElement.parentElement.querySelectorAll('[style^="background-color: rgb("]');
                        
                        // // Iterate through the background color elements
                        // backgroundColorElements.forEach((bgColorElement) => {
                        //     // Get the background color and number
                        //     const backgroundColor = bgColorElement.style.backgroundColor;
                        //     const number = bgColorElement.textContent.trim();
                            
                        //     // Log or display the information as needed
                        //     console.log(`Name: ${nameToSearch}, Background Color: ${backgroundColor}, Number: ${number}`);
                        // });
                    }
                });
            } else {
                console.log('Child container element not found in the DOM.');
            }
        });
    } catch (error) {
        console.error('Error parsing and searching HTML:', error);
    }
}