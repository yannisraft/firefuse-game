class FireworksGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.gl = this.canvas.getContext('webgl');
        
        if (!this.gl) {
            alert('WebGL not supported, falling back on experimental-webgl');
            this.gl = this.canvas.getContext('experimental-webgl');
        }

        this.setupCanvas();
        this.initWebGL();
        this.initGame();
        this.setupEventListeners();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        console.log('Canvas setup - width:', this.canvas.width, 'height:', this.canvas.height);
    }

    initWebGL() {
        // Compile shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, document.getElementById('vertexShader').textContent);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, document.getElementById('fragmentShader').textContent);

        // Create program
        this.program = this.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);

        // Get attribute and uniform locations
        this.attributes = {
            position: this.gl.getAttribLocation(this.program, 'a_position'),
            size: this.gl.getAttribLocation(this.program, 'a_size'),
            color: this.gl.getAttribLocation(this.program, 'a_color'),
            alpha: this.gl.getAttribLocation(this.program, 'a_alpha')
        };

        this.uniforms = {
            transform: this.gl.getUniformLocation(this.program, 'u_transform')
        };

        // Setup buffers
        this.positionBuffer = this.gl.createBuffer();
        this.sizeBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
        this.alphaBuffer = this.gl.createBuffer();

        // Enable blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);

        // Set transform matrix (convert screen coordinates to clip space)
        const transform = [
            2 / this.canvas.width, 0, -1,
            0, -2 / this.canvas.height, 1,
            0, 0, 1
        ];
        this.gl.uniformMatrix3fv(this.uniforms.transform, false, transform);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Error compiling shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Error linking program:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    initGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.gameRunning = false;
        this.rockets = [];
        this.particles = [];
        this.lastTime = 0;
        this.fuseTime = 1.6; // Default fuse time in seconds

        // Bubble shooter aiming system (separate from existing fireworks)
        this.launcher = {
            x: 0, // Will be set to center
            y: 0, // Will be set to bottom
            angle: -Math.PI / 2, // Start pointing up
            length: 40 // Visual length of launcher
        };
        this.aimingLine = {
            length: 200,
            dotCount: 15,
            visible: true
        };

        // Colors for different firework types
        this.fireworkColors = [
            [1.0, 0.0, 0.0],    // Red
            [0.0, 1.0, 0.0],    // Green  
            [0.0, 0.0, 1.0],    // Blue
            [1.0, 1.0, 0.0],    // Yellow
            [1.0, 0.0, 1.0],    // Magenta
            [0.0, 1.0, 1.0],    // Cyan
            [1.0, 0.5, 0.0],    // Orange
            [0.5, 0.0, 1.0]     // Purple
        ];
    }

    updateLauncherPosition() {
        this.launcher.x = this.canvas.width / 2;
        this.launcher.y = this.canvas.height - 60; // 60px from bottom
    }

    calculateSpawnArea() {
        // Calculate spawn area (square with sides = screen height, centered)
        this.spawnAreaSize = this.canvas.height;
        this.spawnAreaLeft = (this.canvas.width - this.spawnAreaSize) / 2;
        this.spawnAreaRight = this.spawnAreaLeft + this.spawnAreaSize;
        
        // Debug logging
        console.log('=== Spawn Area Calculation ===');
        console.log('Canvas width:', this.canvas.width, 'height:', this.canvas.height);
        console.log('Spawn area size:', this.spawnAreaSize);
        console.log('Spawn area left:', this.spawnAreaLeft, 'right:', this.spawnAreaRight);
        console.log('==============================');
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.calculateSpawnArea(); // Recalculate spawn area for new screen size
            this.updateLauncherPosition(); // Update launcher position for new screen size
            
            const transform = [
                2 / this.canvas.width, 0, -1,
                0, -2 / this.canvas.height, 1,
                0, 0, 1
            ];
            this.gl.uniformMatrix3fv(this.uniforms.transform, false, transform);
            this.updateSpawnAreaIndicator();
        });

        // Mouse tracking for bubble shooter aiming (separate system)
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameRunning) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Calculate angle from launcher to mouse
                const deltaX = mouseX - this.launcher.x;
                const deltaY = mouseY - this.launcher.y;
                
                let angle = Math.atan2(deltaY, deltaX);
                
                // Constrain to upward directions only (like bubble shooter)
                if (angle > 0) {
                    angle = angle > Math.PI / 2 ? Math.PI - 0.1 : 0.1;
                }
                
                // Limit aiming range (roughly 20-160 degrees)
                const minAngle = -Math.PI * 0.9; 
                const maxAngle = -Math.PI * 0.1;
                this.launcher.angle = Math.max(minAngle, Math.min(maxAngle, angle));
            }
        });

        // Click to launch firework
        this.canvas.addEventListener('click', (e) => {
            if (this.gameRunning) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                console.log('🖱️ CLICK EVENT - clientX:', e.clientX, 'rect.left:', rect.left, 'calculated x:', x);
                console.log('   Canvas rect:', rect);
                this.launchFirework(x);
            }
        });
    }

    launchFirework(targetX = null) {
        if (!this.gameRunning) return;

        // Safety check: ensure spawn area is calculated
        if (this.spawnAreaLeft === undefined || this.spawnAreaRight === undefined) {
            console.warn('Spawn area not calculated, calculating now...');
            this.calculateSpawnArea();
        }

        // Constrain spawning to square area (height x height, centered)
        let startX;
        let targetXConstrained;
        
        /* if (targetX !== null) {
            // If clicking, constrain click to spawn area (don't allow exactly at right edge)
            startX = Math.max(this.spawnAreaLeft, Math.min(this.spawnAreaRight - 1, targetX));
            targetXConstrained = startX; // Target is where we clicked (constrained)
            console.log('🖱️ Click launch - Original targetX:', targetX, 'constrained to startX:', startX);
            console.log('   Bounds check: left=', this.spawnAreaLeft, 'right=', this.spawnAreaRight);
        } else {
            // Random spawn within square area (ensure we stay within bounds)
            startX = this.spawnAreaLeft + Math.random() * (this.spawnAreaSize - 1);
            // Target also within square area (small variation from start)
            const targetOffset = (Math.random() - 0.5) * 100;
            targetXConstrained = Math.max(this.spawnAreaLeft, 
                Math.min(this.spawnAreaRight - 1, startX + targetOffset));
            console.log('🎲 Auto launch - startX:', startX, 'targetX:', targetXConstrained);
            console.log('   Spawn bounds - left:', this.spawnAreaLeft, 'right:', this.spawnAreaRight);
            console.log('   Area size:', this.spawnAreaSize, 'Canvas width:', this.canvas.width);
        } */

        startX = -this.spawnAreaSize/2 + Math.random() * (this.spawnAreaSize - 1);
        //startX = this.spawnAreaLeft + Math.random() * (this.spawnAreaSize - 1);
        
        const startY = this.canvas.height;
        const targetY = Math.random() * (this.canvas.height * 0.3) + (this.canvas.height * 0.1);
        
        // Calculate trajectory based on desired height (separate from fuse time)
        const gravity = 980; // pixels/second²
        const flightTime = 2.4 + Math.random() * 0.3; // Flight time determines height (1.5-2.5s)

        targetXConstrained = startX;
        
        const deltaX = targetXConstrained - startX;
        const deltaY = targetY - startY;
        
        const velocityX = deltaX / flightTime;
        const velocityY = (deltaY - 0.5 * gravity * flightTime * flightTime) / flightTime;

        const rocket = {
            x: startX,
            y: startY,
            vx: velocityX,
            vy: velocityY,
            life: 0,
            flightTime: flightTime, // How long the trajectory takes
            fuseTime: this.fuseTime + (Math.random() - 0.5) * 0.2, // When it explodes (± 0.1s)
            color: this.fireworkColors[Math.floor(Math.random() * this.fireworkColors.length)],
            trail: []
        };

        // Final verification
        console.log('🚀 ROCKET CREATED - X:', startX, 'Y:', startY, 'Within bounds:', 
                   (startX >= this.spawnAreaLeft && startX <= this.spawnAreaRight));

        this.rockets.push(rocket);
    }

    explodeFirework(rocket) {
        const particleCount = 120 + Math.random() * 60; // More particles for bigger explosions
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const speed = 150 + Math.random() * 200; // Faster particles for bigger spread
            const size = 12 + Math.random() * 16; // MUCH bigger particles (8-24 pixels)
            
            const particle = {
                x: rocket.x,
                y: rocket.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 2.0 + Math.random() * 2.0, // Longer lasting particles
                size: size,
                color: [...rocket.color],
                alpha: 1
            };

            this.particles.push(particle);
        }

        // Award points
        this.score += 200;
        document.getElementById('score').textContent = this.score;
    }

    update(deltaTime) {
        if (!this.gameRunning) return;

        // Update timer
        this.timeLeft -= deltaTime;
        document.getElementById('timer').textContent = Math.ceil(this.timeLeft);

        if (this.timeLeft <= 0) {
            this.endGame();
            return;
        }

        // Update rockets
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const rocket = this.rockets[i];
            
            rocket.life += deltaTime;
            
            // Explode when fuse time is reached (regardless of trajectory)
            if (rocket.life >= rocket.fuseTime) {
                this.explodeFirework(rocket);
                this.rockets.splice(i, 1);
                continue;
            }

            // Apply physics
            rocket.x += rocket.vx * deltaTime;
            rocket.y += rocket.vy * deltaTime;
            rocket.vy += 980 * deltaTime; // gravity

            // Add to trail
            rocket.trail.push({ x: rocket.x, y: rocket.y });
            if (rocket.trail.length > 10) {
                rocket.trail.shift();
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.life += deltaTime;
            
            if (particle.life >= particle.maxLife) {
                this.particles.splice(i, 1);
                continue;
            }

            // Apply physics
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 200 * deltaTime; // gravity for particles
            
            // Apply air resistance
            particle.vx *= Math.pow(0.98, deltaTime * 60);
            particle.vy *= Math.pow(0.98, deltaTime * 60);
            
            // Fade out
            particle.alpha = 1 - (particle.life / particle.maxLife);
            particle.size *= Math.pow(0.98, deltaTime * 60); // Slower shrinking to keep particles bigger longer
        }
    }

    render() {
        // Clear canvas
        this.gl.clearColor(0.0, 0.0, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);



        // Prepare data arrays
        const positions = [];
        const sizes = [];
        const colors = [];
        const alphas = [];

        // Bubble shooter aiming system (now with correct coordinates!)
        if (this.gameRunning && this.launcher) {
            // Launcher at bottom center (0,0 is screen center, so positive Y = down)
            const launcherY = this.canvas.height / 2 - 80; // 80 pixels up from bottom
            
            // Launcher base
            positions.push(0, launcherY);
            sizes.push(25);
            colors.push(0.8, 0.2, 0.2); // Dark red launcher
            alphas.push(1.0);
            
            // Aiming line - 8 white dots going from launcher toward mouse direction
            const aimLength = 250;
            const dotSpacing = aimLength / 8;
            
            for (let i = 1; i <= 8; i++) {
                const distance = i * dotSpacing;
                const aimX = Math.cos(this.launcher.angle) * distance;
                const aimY = launcherY + Math.sin(this.launcher.angle) * distance;
                
                positions.push(aimX, aimY);
                sizes.push(12 - i * 0.8); // Gradually smaller
                colors.push(1.0, 1.0, 1.0); // White
                alphas.push(1.0 - i * 0.1); // Gradually fade
            }
        }

        // Add rocket trails
        this.rockets.forEach(rocket => {
            rocket.trail.forEach((point, index) => {
                positions.push(point.x, point.y);
                sizes.push(8 + index * 2); // Much bigger trail particles (8-28 pixels)
                colors.push(...rocket.color);
                alphas.push(0.9 * (index / rocket.trail.length)); // Brighter trails
            });
        });

        // Add particles
        this.particles.forEach(particle => {
            positions.push(particle.x, particle.y);
            sizes.push(particle.size);
            colors.push(...particle.color);
            alphas.push(particle.alpha);
        });

        console.log('🎨 About to render. Total particles:', positions.length / 2);
        if (positions.length === 0) {
            console.log('❌ No particles to render, returning early');
            return;
        }

        // Upload data to GPU
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.vertexAttribPointer(this.attributes.position, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(this.attributes.size);
        this.gl.vertexAttribPointer(this.attributes.size, 1, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(this.attributes.color);
        this.gl.vertexAttribPointer(this.attributes.color, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.alphaBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(alphas), this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(this.attributes.alpha);
        this.gl.vertexAttribPointer(this.attributes.alpha, 1, this.gl.FLOAT, false, 0, 0);

        // Draw particles
        this.gl.drawArrays(this.gl.POINTS, 0, positions.length / 2);
    }

    updateSpawnAreaIndicator() {
        const indicator = document.getElementById('spawnAreaIndicator');
        if (indicator) {
            const height = this.canvas.height * 1; // Show full height indicator
            indicator.style.left = this.spawnAreaLeft + 'px';
            indicator.style.width = this.spawnAreaSize + 'px';
            indicator.style.height = height + 'px';
            indicator.style.display = this.gameRunning ? 'block' : 'none';
            
            console.log('📏 Spawn Area Indicator Updated:');
            console.log('   Left:', this.spawnAreaLeft, 'Width:', this.spawnAreaSize);
            console.log('   Right edge at:', this.spawnAreaLeft + this.spawnAreaSize);
            console.log('   Canvas width:', this.canvas.width);
        }
    }

    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    startGame() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameUI').style.display = 'block';
        //document.getElementById('controls').style.display = 'flex';

        this.initGame();
        this.calculateSpawnArea(); // Calculate spawn area when game starts
        this.updateLauncherPosition(); // Set up bubble shooter launcher
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.updateSpawnAreaIndicator();
        
        // Auto-launch fireworks occasionally
        /* this.autoLaunchInterval = setInterval(() => {
            if (this.gameRunning && Math.random() < 0.3) {
                this.launchFirework();
            }
        }, 2000); */

        this.gameLoop(this.lastTime);
    }

    endGame() {
        this.gameRunning = false;
        clearInterval(this.autoLaunchInterval);
        this.updateSpawnAreaIndicator(); // Hide spawn area indicator
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').style.display = 'block';
    }

    restartGame() {
        document.getElementById('gameOverScreen').style.display = 'none';
        this.startGame();
    }
}

// Global functions for UI
function startGame() {
    if (window.game) {
        window.game.startGame();
    }
}

function launchFirework() {
    if (window.game) {
        window.game.launchFirework();
    }
}

function restartGame() {
    if (window.game) {
        window.game.restartGame();
    }
}

function updateFuseTime(value) {
    if (window.game) {
        window.game.fuseTime = parseFloat(value);
        document.getElementById('fuseTimeValue').textContent = value;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.game = new FireworksGame();
}); 