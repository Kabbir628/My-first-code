// Graphics renderer for the flight simulator

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight;
        this.focalLength = 450;
        this.terrainDepth = 1800;
        this.terrainWidth = 1200;

        window.addEventListener('resize', () => this.handleResize()); // keep canvas sized correctly
    }

    handleResize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    render(aircraft) {
        this.drawBackground(aircraft);
        this.drawScene(aircraft);
        this.drawCockpit();
        this.drawHUD(aircraft);
    }

    drawBackground(aircraft) {
        const ctx = this.ctx;
        const altitude = Math.max(0, Math.min(aircraft.position.y, 40000));
        const t = altitude / 40000;
        const topColor = `rgb(${35 + t * 55}, ${80 + t * 80}, ${150 + t * 80})`;
        const midColor = `rgb(${120 + t * 40}, ${170 + t * 30}, 255)`;

        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(0.4, midColor);
        gradient.addColorStop(1, 'rgb(100, 140, 80)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawScene(aircraft) {
        const ctx = this.ctx;
        ctx.save();

        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const camHeight = Math.max(40, Math.min(aircraft.position.y * 0.08, 350));
        const pitchRad = aircraft.rotation.pitch * Math.PI / 180;
        const rollRad = aircraft.rotation.roll * Math.PI / 180;
        const yawRad = aircraft.rotation.yaw * Math.PI / 180;

        const project = (point) => {
            const rotated = this.applyViewTransform(point, yawRad, pitchRad, rollRad);
            if (rotated.z <= 1) return null;
            const scale = this.focalLength / rotated.z;
            return {
                x: centerX + rotated.x * scale,
                y: centerY - rotated.y * scale,
                z: rotated.z
            };
        };

        const terrainColor = ctx.createLinearGradient(0, centerY, 0, this.height);
        terrainColor.addColorStop(0, 'rgba(60, 90, 40, 0.0)');
        terrainColor.addColorStop(1, 'rgba(40, 80, 30, 0.8)');
        ctx.fillStyle = terrainColor;

        const groundPolygon = [];
        const rows = 18;
        for (let i = 0; i <= rows; i++) {
            const z = 200 + (i / rows) * this.terrainDepth;
            const left = project({ x: -this.terrainWidth, y: -camHeight, z });
            const right = project({ x: this.terrainWidth, y: -camHeight, z });
            if (left && right) groundPolygon.push(left, right);
        }

        if (groundPolygon.length >= 4) {
            ctx.beginPath();
            ctx.moveTo(groundPolygon[0].x, groundPolygon[0].y);
            for (let i = 1; i < groundPolygon.length; i += 2) {
                ctx.lineTo(groundPolygon[i].x, groundPolygon[i].y);
            }
            ctx.lineTo(groundPolygon[groundPolygon.length - 1].x, this.height + 100);
            ctx.lineTo(groundPolygon[0].x, this.height + 100);
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        for (let i = 0; i <= rows; i++) {
            const z = 200 + (i / rows) * this.terrainDepth;
            const left = project({ x: -this.terrainWidth, y: -camHeight, z });
            const right = project({ x: this.terrainWidth, y: -camHeight, z });
            if (!left || !right) continue;
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
        }

        for (let i = -12; i <= 12; i++) {
            const x = i * 150;
            const near = project({ x, y: -camHeight, z: 200 });
            const far = project({ x, y: -camHeight, z: this.terrainDepth + 200 });
            if (!near || !far) continue;
            ctx.beginPath();
            ctx.moveTo(near.x, near.y);
            ctx.lineTo(far.x, far.y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        const horizon = project({ x: 0, y: 0, z: 1200 });
        if (horizon) {
            ctx.beginPath();
            ctx.moveTo(0, horizon.y);
            ctx.lineTo(this.width, horizon.y);
            ctx.stroke();
        }

        ctx.restore();
    }

    applyViewTransform(point, yaw, pitch, roll) {
        let p = { ...point };
        p = this.rotateY(p, -yaw);
        p = this.rotateX(p, pitch);
        p = this.rotateZ(p, roll);
        return p;
    }

    rotateX(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: point.x,
            y: point.y * cos - point.z * sin,
            z: point.y * sin + point.z * cos
        };
    }

    rotateY(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: point.x * cos + point.z * sin,
            y: point.y,
            z: -point.x * sin + point.z * cos
        };
    }

    rotateZ(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: point.x * cos - point.y * sin,
            y: point.x * sin + point.y * cos,
            z: point.z
        };
    }

    drawCockpit() {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const bottom = this.height - 60;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 15, 15, 0.75)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 240, bottom);
        ctx.lineTo(centerX - 190, this.height / 2 + 50);
        ctx.lineTo(centerX + 190, this.height / 2 + 50);
        ctx.lineTo(centerX + 240, bottom);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.fillRect(centerX - 100, bottom - 14, 200, 12);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 20, this.height / 2 - 100);
        ctx.lineTo(centerX + 20, this.height / 2 - 100);
        ctx.moveTo(centerX, this.height / 2 - 100);
        ctx.lineTo(centerX, this.height / 2 + 100);
        ctx.stroke();
        ctx.restore();
    }

    drawHUD(aircraft) {
        const ctx = this.ctx;

        if (aircraft.position.y < 5000) {
            ctx.fillStyle = aircraft.position.y < 1000 ? 'red' : 'orange';
            ctx.font = 'bold 16px Courier';
            ctx.fillText(`⚠ ALTITUDE WARNING: ${Math.floor(aircraft.position.y)} ft`, this.width - 350, 50);
        }

        if (aircraft.crashed) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 32px Courier';
            ctx.textAlign = 'center';
            ctx.fillText('CRASHED!', this.width / 2, this.height / 2 + 100);
            ctx.font = 'bold 16px Courier';
            ctx.fillText('Press R to reset', this.width / 2, this.height / 2 + 140);
            ctx.textAlign = 'left';
        }

        if (aircraft.getAirspeed() < 30 && !aircraft.onGround) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 16px Courier';
            ctx.fillText('⚠ STALL WARNING', this.width - 250, this.height - 50);
        }

        this.drawCompass(aircraft);
        this.drawVerticalSpeedIndicator(aircraft);
    }

    drawCompass(aircraft) {
        const ctx = this.ctx;
        const x = this.width - 80;
        const y = 80;
        const radius = 50;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - 15, y - height / 2, 30, height);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 15, y - height / 2, 30, height);

        const verticalSpeed = aircraft.velocity.y / 1.688;
        const clampedSpeed = Math.max(-height / 4, Math.min(height / 4, verticalSpeed * 0.1));

        ctx.fillStyle = verticalSpeed > 0 ? 'green' : 'red';
        ctx.fillRect(x - 10, y - clampedSpeed, 20, clampedSpeed);

        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.lineTo(x + 15, y);
        ctx.stroke();
    }
}
