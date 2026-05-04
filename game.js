// Main game loop and initialization

let aircraft;
let renderer;
let controls;
let lastTime = Date.now();
let gameRunning = true;

function init() {
    // Create aircraft
    aircraft = new Aircraft();

    // Get canvas and initialize renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new Renderer(canvas);

    // Initialize controls
    controls = new Controls(aircraft);

    // Start game loop
    gameLoop();
}

function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;  // Convert to seconds
    lastTime = currentTime;

    // Cap delta time to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 0.016);  // Max ~60 FPS

    // Update game state
    if (gameRunning) {
        controls.update();
        aircraft.update(cappedDeltaTime);
        updateHUD();
    }

    // Render
    renderer.render(aircraft);

    // Continue loop
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    // Update instrument displays
    document.getElementById('altitudeValue').textContent = Math.floor(aircraft.position.y).toLocaleString();
    document.getElementById('speedValue').textContent = Math.floor(aircraft.getAirspeed());
    document.getElementById('headingValue').textContent = Math.floor(aircraft.rotation.yaw);
    document.getElementById('pitchValue').textContent = Math.floor(aircraft.rotation.pitch);
    document.getElementById('rollValue').textContent = Math.floor(aircraft.rotation.roll);
    document.getElementById('throttleValue').textContent = Math.floor(aircraft.controls.throttle * 100);

    // Update status
    const statusEl = document.getElementById('status');
    if (aircraft.crashed) {
        statusEl.textContent = '⚠ CRASHED - Press R to reset';
        statusEl.style.color = '#ff0000';
    } else if (aircraft.onGround) {
        statusEl.textContent = '✓ On Ground - Increase throttle to takeoff (Arrow Up)';
        statusEl.style.color = '#00ff00';
    } else {
        const fuelPercent = Math.floor((aircraft.fuel / 100000) * 100);
        statusEl.textContent = `✓ Flying - Fuel: ${fuelPercent}% | Speed: ${Math.floor(aircraft.getAirspeed())} knots | Alt: ${Math.floor(aircraft.position.y)} ft`;
        statusEl.style.color = '#00ff00';
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', init);

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        gameRunning = false;
        lastTime = Date.now();
    } else {
        gameRunning = true;
        lastTime = Date.now();
    }
});
