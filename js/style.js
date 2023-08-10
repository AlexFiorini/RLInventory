document.getElementById('toggle-theme').addEventListener('click', function() {
    const body = document.body;
    const lightThemeLink = document.getElementById('light-theme');
    const darkThemeLink = document.getElementById('dark-theme');
    
    if (lightThemeLink.disabled) {
        lightThemeLink.disabled = false;
        darkThemeLink.disabled = true;
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
    } else {
        lightThemeLink.disabled = true;
        darkThemeLink.disabled = false;
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
    }
});