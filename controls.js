// Input handling for flight controls

class Controls {
    constructor(aircraft) {
        this.aircraft = aircraft;
        this.keys = {};
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        
        // Special actions
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            this.levelFlight();
        }
        if (e.key.toLowerCase() === 'r') {
            this.aircraft.reset();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }

    update() {
        // Pitch control (W/S)
        let pitch = 0;
        if (this.keys['w']) pitch += 1;
        if (this.keys['s']) pitch -= 1;
        this.aircraft.controls.pitch = Math.max(-1, Math.min(1, pitch));

        // Roll control (A/D)
        let roll = 0;
        if (this.keys['a']) roll -= 1;
        if (this.keys['d']) roll += 1;
        this.aircraft.controls.roll = Math.max(-1, Math.min(1, roll));

        // Yaw control (Q/E)
        let yaw = 0;
        if (this.keys['q']) yaw -= 1;
        if (this.keys['e']) yaw += 1;
        this.aircraft.controls.yaw = Math.max(-1, Math.min(1, yaw));

        // Throttle control (Arrow Up/Down)
        if (this.keys['arrowup']) {
            this.aircraft.controls.throttle = Math.min(1, this.aircraft.controls.throttle + 0.02);
        }
        if (this.keys['arrowdown']) {
            this.aircraft.controls.throttle = Math.max(0, this.aircraft.controls.throttle - 0.02);
        }
    }

    levelFlight() {
        // Automatically level the aircraft
        const rollDamping = 0.1;
        const pitchDamping = 0.1;
        
        this.aircraft.rotation.roll *= (1 - rollDamping);
        this.aircraft.rotation.pitch *= (1 - pitchDamping);
        this.aircraft.angularVelocity.roll *= (1 - rollDamping);
        this.aircraft.angularVelocity.pitch *= (1 - pitchDamping);
    }
}
