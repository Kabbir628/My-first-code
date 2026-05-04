// Physics engine for realistic flight simulation

class Aircraft {
    constructor() {
        // Position (in feet)
        this.position = {
            x: 0,
            y: 10000,  // Start at 10,000 feet
            z: 0
        };

        // Velocity (feet per second)
        this.velocity = {
            x: 0,
            y: 0,
            z: 0
        };

        // Rotation (degrees)
        this.rotation = {
            pitch: 0,    // Up/down rotation
            roll: 0,     // Left/right rotation
            yaw: 0       // Heading
        };

        // Angular velocity (degrees per second)
        this.angularVelocity = {
            pitch: 0,
            roll: 0,
            yaw: 0
        };

        // Control inputs (-1 to 1)
        this.controls = {
            pitch: 0,      // Elevator
            roll: 0,       // Ailerons
            yaw: 0,        // Rudder
            throttle: 0    // Engine thrust (0 to 1)
        };

        // Aircraft parameters
        this.mass = 50000;  // pounds
        this.wingArea = 1500;  // square feet
        this.dragCoefficient = 0.025;
        this.liftCoefficient = 0.15;
        this.thrust = 50000;  // pounds max
        this.maxG = 9;  // maximum G-force
        this.fuel = 100000;  // pounds
        this.fuelConsumption = 100;  // pounds per second at full throttle

        // State
        this.onGround = true;
        this.crashed = false;
    }

    update(deltaTime) {
        if (this.crashed) return;

        // Update fuel
        this.fuel -= this.fuelConsumption * this.controls.throttle * deltaTime;
        if (this.fuel < 0) {
            this.fuel = 0;
            this.controls.throttle = 0;
        }

        // Apply aerodynamic forces
        this.updateAerodynamics(deltaTime);

        // Apply gravity
        this.velocity.y -= 32.174 * deltaTime;  // 32.174 ft/s² gravity

        // Update velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // Clamp altitude (ground level is 0)
        if (this.position.y <= 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.onGround = true;

            // Check for crash speed
            const speed = this.getAirspeed();
            if (speed > 100) {  // Landing speed should be slow
                this.crashed = true;
            }
        } else {
            this.onGround = false;
        }

        // Update rotation
        this.updateRotation(deltaTime);

        // Clamp pitch
        this.rotation.pitch = Math.max(-90, Math.min(90, this.rotation.pitch));

        // Wrap yaw
        this.rotation.yaw = this.rotation.yaw % 360;
        if (this.rotation.yaw < 0) this.rotation.yaw += 360;
    }

    updateAerodynamics(deltaTime) {
        const airspeed = this.getAirspeed();

        // Convert rotation angles to radians
        const pitchRad = this.rotation.pitch * Math.PI / 180;
        const rollRad = this.rotation.roll * Math.PI / 180;
        const yawRad = this.rotation.yaw * Math.PI / 180;

        // Air density model (decreases with altitude)
        const altitudeKft = this.position.y / 1000;
        const airDensity = 0.002377 * Math.exp(-altitudeKft / 22.2);

        // Calculate dynamic pressure
        const dynamicPressure = 0.5 * airDensity * airspeed * airspeed;

        // Lift force (perpendicular to velocity direction)
        const liftForce = dynamicPressure * this.wingArea * this.liftCoefficient;

        // Drag force (parallel to velocity)
        const dragForce = dynamicPressure * this.wingArea * this.dragCoefficient;

        // Engine thrust
        const thrustForce = this.thrust * this.controls.throttle;

        // Apply forces in body frame, then convert to world frame
        if (airspeed > 0) {
            // Lift opposes gravity partly
            const liftDirection = Math.cos(pitchRad);
            const liftUp = liftForce * liftDirection;

            // Drag opposes motion
            const dragX = -dragForce * Math.cos(yawRad) * Math.cos(pitchRad);
            const dragZ = -dragForce * Math.sin(yawRad) * Math.cos(pitchRad);
            const dragY = -dragForce * Math.sin(pitchRad);

            // Thrust in forward direction
            const thrustX = thrustForce * Math.cos(yawRad) * Math.cos(pitchRad);
            const thrustZ = thrustForce * Math.sin(yawRad) * Math.cos(pitchRad);
            const thrustY = thrustForce * Math.sin(pitchRad);

            // Total acceleration
            const ax = (dragX + thrustX) / this.mass;
            const ay = (liftUp + dragY + thrustY - this.mass * 32.174) / this.mass;
            const az = (dragZ + thrustZ) / this.mass;

            // Update velocity
            this.velocity.x += ax * deltaTime;
            this.velocity.y += ay * deltaTime;
            this.velocity.z += az * deltaTime;

            // Max speed limiter
            if (airspeed > 500) {
                const scale = 500 / airspeed;
                this.velocity.x *= scale;
                this.velocity.y *= scale;
                this.velocity.z *= scale;
            }
        } else {
            // Just thrust when barely moving
            this.velocity.x += (thrustForce / this.mass) * Math.cos(yawRad) * deltaTime;
            this.velocity.z += (thrustForce / this.mass) * Math.sin(yawRad) * deltaTime;
        }
    }

    updateRotation(deltaTime) {
        // Angular acceleration from control inputs
        const pitchRate = this.controls.pitch * 45;  // degrees/second
        const rollRate = this.controls.roll * 60;    // degrees/second
        const yawRate = this.controls.yaw * 30;      // degrees/second

        // Add damping
        const damping = 0.05;
        this.angularVelocity.pitch += (pitchRate - this.angularVelocity.pitch * damping) * deltaTime;
        this.angularVelocity.roll += (rollRate - this.angularVelocity.roll * damping) * deltaTime;
        this.angularVelocity.yaw += (yawRate - this.angularVelocity.yaw * damping) * deltaTime;

        // Update rotation
        this.rotation.pitch += this.angularVelocity.pitch * deltaTime;
        this.rotation.roll += this.angularVelocity.roll * deltaTime;
        this.rotation.yaw += this.angularVelocity.yaw * deltaTime;

        // Clamp roll
        this.rotation.roll = Math.max(-180, Math.min(180, this.rotation.roll));
    }

    getAirspeed() {
        // Convert from feet/sec to knots (1 knot = 1.688 ft/sec)
        const speedFtSec = Math.sqrt(
            this.velocity.x * this.velocity.x +
            this.velocity.y * this.velocity.y +
            this.velocity.z * this.velocity.z
        );
        return speedFtSec / 1.688;
    }

    getGroundSpeed() {
        return Math.sqrt(
            this.velocity.x * this.velocity.x +
            this.velocity.z * this.velocity.z
        ) / 1.688;
    }

    reset() {
        this.position = { x: 0, y: 10000, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { pitch: 0, roll: 0, yaw: 0 };
        this.angularVelocity = { pitch: 0, roll: 0, yaw: 0 };
        this.controls = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
        this.crashed = false;
        this.fuel = 100000;
    }
}
