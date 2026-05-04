// Graphics renderer for the flight simulator

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    render(aircraft) {
        // Clear canvas with sky gradient
        this.drawBackground(aircraft);

        // Draw horizon
        this.drawHorizon(aircraft);

        // Draw terrain
        this.drawTerrain(aircraft);

        // Draw aircraft (in center of screen)
        this.drawAircraft();

        // Draw HUD elements
        this.drawHUD(aircraft);
    }

    drawBackground(aircraft) {
        const ctx = this.ctx;
        
        // Sky color based on altitude
        let skyColor, groundColor;
        
        if (aircraft.position.y > 5000) {
            // High altitude - deep blue
            const t = Math.min(1, aircraft.position.y / 35000);
            const r = Math.floor(100 * (1 - t * 0.8));
            const g = Math.floor(150 * (1 - t * 0.7));
            const b = Math.floor(255 * (1 - t * 0.2));
            skyColor = `rgb(${r}, ${g}, ${b})`;
        } else {
            // Lower altitude - lighter blue
            skyColor = `rgb(${100 + aircraft.position.y / 100}, ${150 + aircraft.position.y / 100}, 255)`;
        }

        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, skyColor);
        gradient.addColorStop(0.5, 'rgb(135, 206, 250)');
        gradient.addColorStop(1, 'rgb(100, 140, 80)');  // Ground color at horizon

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawHorizon(aircraft) {
        const ctx = this.ctx;
        
        // Camera follows aircraft
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Apply pitch and roll transformations
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Rotate for aircraft roll
        const rollRad = aircraft.rotation.roll * Math.PI / 180;
        ctx.rotate(rollRad);
        
        // Create artificial horizon
        const horizonY = -aircraft.rotation.pitch * 5;  // Pitch affects horizon position
        
        // Sky side
        ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.fillRect(-this.width, -this.height, this.width * 2, this.height + horizonY);
        
        // Ground side
        ctx.fillStyle = 'rgba(100, 140, 80, 0.3)';
        ctx.fillRect(-this.width, horizonY, this.width * 2, this.height);
        
        // Horizon line
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.width, horizonY);
        ctx.lineTo(this.width, horizonY);
        ctx.stroke();
        
        // Pitch lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        for (let i = -8; i <= 8; i += 2) {
            const y = horizonY + i * 20;
            if (i === 0) continue;
            if (i % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(-80, y);
                ctx.lineTo(80, y);
                ctx.stroke();
            }
        }
        
        // Aircraft symbol (dot in center)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-10, 0);
        ctx.moveTo(10, 0);
        ctx.lineTo(30, 0);
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -10);
        ctx.moveTo(0, 10);
        ctx.lineTo(0, 30);
        ctx.stroke();
        
        ctx.restore();
    }

    drawTerrain(aircraft) {
        const ctx = this.ctx;
        
        // Simple terrain grid
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        const rollRad = aircraft.rotation.roll * Math.PI / 180;
        ctx.rotate(rollRad);
        
        const horizonY = -aircraft.rotation.pitch * 5;
        
        // Terrain pattern
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
        ctx.lineWidth = 1;
        
        const gridSize = 100;
        const gridCount = 10;
        
        for (let i = 0; i < gridCount; i++) {
            const offset = (i - gridCount / 2) * gridSize;
            
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(offset, horizonY);
            ctx.lineTo(offset, this.height / 2 + 100);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, horizonY + offset);
            ctx.lineTo(this.width / 2, horizonY + offset);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    drawAircraft() {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        ctx.save();
        
        // Draw aircraft silhouette (simplified)
        ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        
        // Fuselage
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 20, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Wings
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 50, 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(centerX - 5, centerY + 40);
        ctx.lineTo(centerX + 5, centerY + 40);
        ctx.lineTo(centerX, centerY + 50);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }

    drawHUD(aircraft) {
        const ctx = this.ctx;
        const margin = 20;
        
        // Altitude warning
        if (aircraft.position.y < 5000) {
            ctx.fillStyle = aircraft.position.y < 1000 ? 'red' : 'orange';
            ctx.font = 'bold 16px Courier';
            ctx.fillText(`⚠ ALTITUDE WARNING: ${Math.floor(aircraft.position.y)} ft`, this.width - 350, 50);
        }
        
        // Crash indicator
        if (aircraft.crashed) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 32px Courier';
            ctx.textAlign = 'center';
            ctx.fillText('CRASHED!', this.width / 2, this.height / 2 + 100);
            ctx.font = 'bold 16px Courier';
            ctx.fillText('Press R to reset', this.width / 2, this.height / 2 + 140);
            ctx.textAlign = 'left';
        }
        
        // Stall warning
        if (aircraft.getAirspeed() < 30 && !aircraft.onGround) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 16px Courier';
            ctx.fillText('⚠ STALL WARNING', this.width - 250, this.height - 50);
        }
        
        // Compass (top right)
        this.drawCompass(aircraft);
        
        // Vertical speed indicator (right side)
        this.drawVerticalSpeedIndicator(aircraft);
    }

    drawCompass(aircraft) {
        const ctx = this.ctx;
        const x = this.width - 80;
        const y = 80;
        const radius = 50;
        
        // Background circle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Cardinal directions
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-aircraft.rotation.yaw * Math.PI / 180);
        
        ctx.fillText('N', 0, -radius - 10);
        ctx.fillText('S', 0, radius + 10);
        ctx.fillText('E', radius + 10, 0);
        ctx.fillText('W', -radius - 10, 0);
        
        ctx.restore();
        
        // Heading indicator
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 12px Courier';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(aircraft.rotation.yaw) + '°', x, y + 25);
    }

    drawVerticalSpeedIndicator(aircraft) {
        const ctx = this.ctx;
        const x = this.width - 30;
        const y = this.height / 2;
        const height = 100;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - 15, y - height / 2, 30, height);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 15, y - height / 2, 30, height);
        
        // Vertical speed indicator
        const verticalSpeed = aircraft.velocity.y / 1.688; // Convert to feet/sec (approximate)
        const clampedSpeed = Math.max(-height / 4, Math.min(height / 4, verticalSpeed * 0.1));
        
        ctx.fillStyle = verticalSpeed > 0 ? 'green' : 'red';
        ctx.fillRect(x - 10, y - clampedSpeed, 20, clampedSpeed);
        
        // Center line
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.lineTo(x + 15, y);
        ctx.stroke();
    }
}
