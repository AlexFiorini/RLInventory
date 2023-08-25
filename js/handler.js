function handleNotPainted(value) {
    return value === 'none' ? 'Unpainted' : value;
}

function handleNotCertificated(value) {
    return value === 'none' ? 'Uncertified' : value;
}

function handleNotSE(value) {
    return value === 'none' ? 'Default' : value;
}

function handleDecal (value) {
    return value === 'Animated Decal' ? 'Decal' : value;
}

function specialEditionFormatter(cell, formatterParams, onRendered) {
    const specialEdition = cell.getValue();
    const parts = specialEdition.split('_');
    const displayValue = parts.length > 1 ? parts[1] : specialEdition;
    return displayValue;
}

function customQualitySorter(a, b) {
    const qualityOrder = {
        'Common': 0,
        'Uncommon': 1,
        'Rare': 2,
        'Very rare': 3,
        'Import': 4,
        'Exotic': 5,
        'Black market': 6,
        'Premium': 7,
        'Limited': 8,
        'Legacy': 9
    };

    const qualityA = a;
    const qualityB = b;

    return qualityOrder[qualityA] - qualityOrder[qualityB];
}

function customPriceSorter(a, b, aRow, bRow, column, dir, sorterParams) {
    if (a === "-" && b === "-") {
        return 0;
    } else if (a === "-") {
        return -1;
    } else if (b === "-") {
        return 1;
    } else {
        const numA = parseFloat(a);
        const numB = parseFloat(b);

        if (isNaN(numA) && isNaN(numB)) {
            return 0;
        } else if (isNaN(numA)) {
            return dir === "asc" ? 1 : -1;
        } else if (isNaN(numB)) {
            return dir === "asc" ? -1 : 1;
        } else {
            return numA - numB;
        }
    }
}
