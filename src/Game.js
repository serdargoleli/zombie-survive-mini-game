import * as THREE from 'three';
import { Environment } from './world/Environment.js';
import { InputManager } from './systems/InputManager.js';
import { AudioManager } from './systems/AudioManager.js';
import { Player } from './entities/Player.js';
import { Zombie } from './entities/Zombie.js';

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111); // Dark background
        this.scene.fog = new THREE.FogExp2(0x111111, 0.02); // Post-apocalyptic fog

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 20, 20);
        this.camera.lookAt(0, 0, 0);

        // Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Game State
        this.clock = new THREE.Clock();
        this.isRunning = false;

        // Systems
        this.environment = new Environment(this.scene);
        this.inputManager = new InputManager(this.camera);
        this.audioManager = new AudioManager();

        // Event Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // UI Buttons
        document.getElementById('select-male').addEventListener('click', () => this.startGame('male'));
        document.getElementById('select-female').addEventListener('click', () => this.startGame('female'));
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());

        // Start Loop
        this.animate();
    }

    setupUI() {
        // This method is now empty as its contents have been moved directly into the constructor
        // to align with the provided change.
    }

    startGame(characterType) {
        this.isRunning = true;
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');

        // Initialize Player
        if (this.player && this.player.mesh) {
            this.scene.remove(this.player.mesh);
        }
        this.player = new Player(this.scene, characterType);
        this.player.mesh.position.set(0, 0, 0);

        // Start Audio
        this.audioManager.playAmbience();

        // Camera follow setup (simple offset)
        this.cameraOffset = new THREE.Vector3(0, 20, 20);

        // Zombie Setup
        this.zombies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2; // Seconds

        // Projectiles
        this.projectiles = [];

        // Weapon Drops
        this.weaponDrops = [];
        this.dropTimer = 0;
        this.dropInterval = 15; // Seconds

        // Cleanup existing entities
        this.cleanup();

        // Score
        this.score = 0;
        this.highScore = localStorage.getItem('zombieHighScore') || 0;
        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('score').innerText = this.score;
        document.getElementById('highscore').innerText = this.highScore;
        if (this.player) document.getElementById('current-weapon').innerText = this.player.weapon;
    }

    resetGame() {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        this.isRunning = false;
        this.cleanup();
    }

    cleanup() {
        // Remove Zombies
        this.zombies.forEach(z => this.scene.remove(z.mesh));
        this.zombies = [];

        // Remove Projectiles
        this.projectiles.forEach(p => p.destroy());
        this.projectiles = [];

        // Remove Drops
        this.weaponDrops.forEach(d => this.scene.remove(d));
        this.weaponDrops = [];
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();

        if (!this.isRunning) {
            // Rotate camera around the city for a nice view
            const time = Date.now() * 0.0005;
            this.camera.position.x = Math.sin(time) * 40;
            this.camera.position.z = Math.cos(time) * 40;
            this.camera.position.y = 20;
            this.camera.lookAt(0, 0, 0);
            this.renderer.render(this.scene, this.camera);
            return;
        }

        this.player.update(delta, this.inputManager, this.environment.obstacles);

        // Camera Follow
        this.camera.position.copy(this.player.mesh.position).add(this.cameraOffset);
        this.camera.lookAt(this.player.mesh.position);

        // Update Transparency
        this.environment.updateTransparency(this.player.mesh.position, this.camera.position);

        // Zombie Spawning
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnZombie();
            this.spawnTimer = 0;
            // Decrease interval slightly to increase difficulty
            if (this.spawnInterval > 0.5) this.spawnInterval -= 0.05;
        }

        // Update Zombies
        this.zombies.forEach(zombie => {
            zombie.update(delta, this.player.mesh.position);

            // Check Player Collision (Game Over)
            if (zombie.mesh.position.distanceTo(this.player.mesh.position) < 1.0) {
                this.gameOver();
            }
        });

        // Weapon Drops
        this.dropTimer += delta;
        if (this.dropTimer > this.dropInterval) {
            this.spawnWeaponDrop();
            this.dropTimer = 0;
        }

        this.weaponDrops.forEach((drop, index) => {
            drop.rotation.y += delta;
            if (drop.position.distanceTo(this.player.mesh.position) < 1.5) {
                // Pickup
                this.player.setWeapon(drop.userData.type);
                this.updateHUD();
                this.scene.remove(drop);
                this.weaponDrops.splice(index, 1);
            }
        });

        // Shooting Input
        // We need to check mouse click from InputManager or just check keys
        // Let's assume InputManager has a isMouseDown property or similar
        // For now, let's use Spacebar for shooting as well or add mouse check
        if (this.inputManager.keys.space) { // Or mouse click
            const projectile = this.player.shoot(this.clock.getElapsedTime());
            if (projectile) {
                this.projectiles.push(projectile);
                this.audioManager.playShoot(this.player.weapon);
            }
        }

        // Update Projectiles & Collision
        this.projectiles.forEach((proj, pIndex) => {
            proj.update(delta);

            // Bomb Logic
            if (proj.isBomb && proj.remove) {
                // Explode on removal (timeout or hit)
                this.createExplosion(proj.mesh.position);
                proj.destroy();
                this.projectiles.splice(pIndex, 1);
                return;
            }

            // Check Zombie Collision
            for (let zIndex = this.zombies.length - 1; zIndex >= 0; zIndex--) {
                const zombie = this.zombies[zIndex];
                const hitDist = proj.isMelee ? 1.5 : 0.8;

                const dx = proj.mesh.position.x - zombie.mesh.position.x;
                const dz = proj.mesh.position.z - zombie.mesh.position.z;
                const distSq = dx * dx + dz * dz;
                const hitDistSq = hitDist * hitDist;

                if (distSq < hitDistSq) {
                    // Hit!
                    if (proj.isBomb) {
                        proj.destroy();
                        this.createExplosion(proj.mesh.position);
                        this.projectiles.splice(pIndex, 1); // Remove from array immediately
                    } else {
                        // Damage Logic
                        zombie.health -= proj.damage;

                        if (zombie.health <= 0) {
                            this.score++;
                            this.updateHUD();
                            this.createBloodEffect(zombie.mesh.position);
                            this.scene.remove(zombie.mesh);
                            this.zombies.splice(zIndex, 1);
                            zombie.isDead = true;
                        } else {
                            // Hit effect (flash red?)
                            // For now just blood
                            this.createBloodEffect(zombie.mesh.position);
                        }

                        if (!proj.isMelee) {
                            proj.destroy();
                            this.projectiles.splice(pIndex, 1);
                        }
                    }
                    break;
                }
            }

            if (proj.remove) {
                if (!proj.mesh.parent) {
                    this.projectiles.splice(pIndex, 1);
                } else {
                    proj.destroy();
                    this.projectiles.splice(pIndex, 1);
                }
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    gameOver() {
        this.isRunning = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('zombieHighScore', this.highScore);
        }
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    spawnZombie() {
        // Spawn at random position around player (outside view)
        const angle = Math.random() * Math.PI * 2;
        const radius = 30; // Distance from player
        const x = this.player.mesh.position.x + Math.cos(angle) * radius;
        const z = this.player.mesh.position.z + Math.sin(angle) * radius;

        // Random Type
        const types = ['standard', 'standard', 'standard', 'dog'];
        const type = types[Math.floor(Math.random() * types.length)];

        const zombie = new Zombie(this.scene, new THREE.Vector3(x, 0, z), type);
        this.zombies.push(zombie);
    }

    spawnWeaponDrop() {
        const types = ['Rifle', 'Bomb', 'Katana'].filter(t => t !== this.player.weapon);
        const type = types[Math.floor(Math.random() * types.length)];

        const angle = Math.random() * Math.PI * 2;
        const radius = 10; // Closer to player
        const x = this.player.mesh.position.x + Math.cos(angle) * radius;
        const z = this.player.mesh.position.z + Math.sin(angle) * radius;

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x004444 });
        const drop = new THREE.Mesh(geometry, material);
        drop.position.set(x, 1, z);
        drop.userData = { type: type };

        this.scene.add(drop);
        this.weaponDrops.push(drop);
    }

    createExplosion(position) {
        this.audioManager.playBombSound();
        // Visual
        const geometry = new THREE.SphereGeometry(5, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
        const explosion = new THREE.Mesh(geometry, material);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Remove after short time
        setTimeout(() => this.scene.remove(explosion), 200);

        // Damage
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            if (zombie.mesh.position.distanceTo(position) < 5) {
                this.score++;
                this.scene.remove(zombie.mesh);
                this.zombies.splice(i, 1);
                zombie.isDead = true;
            }
        }
        this.updateHUD();
    }

    createBloodEffect(position) {
        const particleCount = 10;
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: 0xaa0000 });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.z += (Math.random() - 0.5) * 0.5;
            particle.position.y += 1 + (Math.random() - 0.5) * 0.5;

            this.scene.add(particle);

            // Animate and remove
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5,
                (Math.random() - 0.5) * 5
            );

            const startTime = Date.now();

            const animateParticle = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed > 0.5) {
                    this.scene.remove(particle);
                    return;
                }

                velocity.y -= 9.8 * 0.016; // Gravity
                particle.position.add(velocity.clone().multiplyScalar(0.016));
                requestAnimationFrame(animateParticle);
            };
            animateParticle();
        }
    }
}
