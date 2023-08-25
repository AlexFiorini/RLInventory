const { ipcRenderer } = require('electron');
const fs = require('fs');
const URL = "https://op.market/ref/thedevilofgames";

let inventory;
let htmlitems = {
    htmlWheels: {
      term: 'Wheels',
      data: ''
    },
    htmlDecal: {
      term: 'Decal',
      data: ''
    },
    htmlTopper: {
      term: 'Topper',
      data: ''
    },
    htmlBoost: {
      term: 'Rocket Boost',
      data: ''
    },
    htmlBanner: {
      term: 'Player Banner',
      data: ''
    },
    htmlAntenna: {
      term: 'Antenna',
      data: ''
    },
    htmlBody: {
      term: 'Body',
      data: ''
    },
    htmlGE: {
      term: 'Goal Explosion',
      data: ''
    },
    htmlTrail: {
      term: 'Trail',
      data: ''
    },
    htmlPaintFinish: {
      term: 'Paint Finish',
      data: ''
    },
    htmlGift: {
      term: 'Gift Pack',
      data: ''
    },
    htmlBorder: {
      term: 'Avatar Border',
      data: ''
    },
    htmlEngine: {
      term: 'Engine Audio',
      data: ''
    }
  };

const colors = [
    "Unpainted",
    "Black",
    "Purple",
    "Titanium White",
    "Grey",
    "Pink",
    "Forest Green",
    "Sky Blue",
    "Cobalt",
    "Lime",
    "Saffron",
    "Crimson",
    "Burnt Sienna",
    "Orange",
    "Gold"
];

// Carica il file JSON
ipcRenderer.on('json-data', (event, jsonData) => {
    if (Array.isArray(jsonData)) {
        inventory = jsonData.filter(item => item.tradeable === 'true');
        fetchPricesOP()
            .then(() => createTable())
            .catch(error => console.error('Error loading htmlContent:', error));
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
            { title: "Special Edition", field: "special_edition", headerFilter: "input", sorter: "string", formatter: specialEditionFormatter, resizable: false},
            { title: "Price", field: "price", headerFilter: "input", sorter: customPriceSorter, resizable: false}
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
                //0.14sec * item
                const itemPrice = searchAndDisplay(item.name, item.paint, item.slot);
                item.price = itemPrice;          
                itemsToAdd.push(item);
            }
        }
        console.log(itemsToAdd);
        table.setData(itemsToAdd);
    });
}

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
            if (Array.isArray(parsedDataArray)) {
                ipcRenderer.send('json-data', parsedDataArray);
                let table = document.getElementById('inventory-table');
                table.remove();
                var newtable = document.createElement("div");
                newtable.setAttribute("id", "inventory-table");
                document.body.appendChild(newtable);
                inventory = parsedDataArray.filter(item => item.tradeable === 'true');
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

async function fetchPricesOP() {
    try {
        // Fetch the HTML content
        const response = await fetch("https://op.market/en/prices/pc");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        htmlContent = await response.text();
        // Fix image URLs by adding the domain "https://op.market" before "/_next"
        htmlContent = htmlContent.replace(/\/_next/g, 'https://op.market/_next');
        setGlobalSearchable(htmlContent);
        return htmlContent;
    } catch (error) {
        console.error('Error fetching HTML:', error);
        // Reject the promise in case of an error
        throw error;
    }
}

function setGlobalSearchable(htmlContent) {
    // Create a temporary div element to parse the HTML string
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    // Select all elements with the specified class
    htmlitems.htmlWheels.data = tempDiv.querySelector('div[id="Wheels"]');
    htmlitems.htmlDecal.data = tempDiv.querySelector('div[id="Decal"]');
    htmlitems.htmlTopper.data = tempDiv.querySelector('div[id="Topper"]');
    htmlitems.htmlBoost.data = tempDiv.querySelector('div[id="Rocket Boost]"');
    htmlitems.htmlBanner.data = tempDiv.querySelector('div[id="Player Banner"]');
    htmlitems.htmlAntenna.data = tempDiv.querySelector('div[id="Antenna"]');
    htmlitems.htmlBody.data = tempDiv.querySelector('div[id="Body"]');
    htmlitems.htmlGE.data = tempDiv.querySelector('div[id="Goal Explosion"]');
    htmlitems.htmlTrail.data = tempDiv.querySelector('div[id="Trail"]');
    htmlitems.htmlPaintFinish.data = tempDiv.querySelector('div[id="Paint Finish"]');
    htmlitems.htmlGift.data = tempDiv.querySelector('div[id="Gift Pack"]');
    htmlitems.htmlBorder.data = tempDiv.querySelector('div[id="Avatar Border"]');
    htmlitems.htmlEngine.data = tempDiv.querySelector('div[id="Engine Audio"]');
}

function searchAndDisplay(nameToSearch, colortoSearch, slottoSearch) {
    let price = "-";
    try {
        for(let key in htmlitems) {
            if(htmlitems[key].term === slottoSearch) {
                let serachcontainer = htmlitems[key].data.querySelectorAll('.w-full.h-auto.bg-\\[\\#151423\\].rounded-lg.flex.flex-col.p-4.gap-2.items-start.justify-items-center.grow');
                // Iterate through the containers
                serachcontainer.forEach((container) => {
                    // Select all child elements with the specified class
                    const childElements = container.querySelectorAll('.text-xl');
                    if (childElements) {
                        // Iterate through the child elements
                        childElements.forEach((nameElement) => {
                            // Check if the name matches the one you're looking for
                            if (nameElement.textContent.trim() === nameToSearch) {
                                // Select elements with the specified style attribute
                                const styleElements = container.querySelectorAll('.w-full.grid.grid-rows-5.grid-cols-3.gap-0.h-full.text-sm.font-medium.text-black');                        
                                if(styleElements) {
                                    styleElements.forEach((styleElement) => {
                                        // Select all divs inside styleElement
                                        const divprices = styleElement.querySelectorAll('div');
                                        divprices.forEach((divprice, index) => {
                                            if(colors[index] === colortoSearch) {
                                                const priceText = divprice.textContent.trim();
                                                const priceParts = priceText.split('-');
                                                price = priceParts.length > 0 ? priceParts[0].trim() : "Unknown";
                                                return price;
                                            } 
                                        });
                                    });                 
                                } else {
                                    console.log('Style container element not found in the DOM');
                                }
                            }
                        });
                    } else {
                        console.log('Child container element not found in the DOM.');
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error parsing and searching HTML:', error);
    }
    return price;
}