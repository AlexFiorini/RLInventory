function paintFormatter(cell, formatterParams, onRendered) {
    const color = cell.getValue();
    const backgroundStyle = getBackgroundStyleForColor(color);
    const displayValue = handleNotPainted(color);
    return `<div style="background: ${backgroundStyle}; padding: 5px; border-radius: 3px;">${displayValue}</div>`;
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