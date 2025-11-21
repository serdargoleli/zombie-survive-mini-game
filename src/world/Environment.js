import * as THREE from 'three';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = []; // Store bounding boxes
        this.setupLighting();
        this.createGround();
        this.createObstacles();
    }

    setupLighting() {
        // Ambient Light (Soft general light)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
        this.scene.add(ambientLight);

        // Directional Light (Sun/Moon)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        this.scene.add(dirLight);

        // Point Lights (Street lamps, fires)
        // We can add these dynamically later or place a few static ones

        // Fog for atmosphere
        this.scene.fog = new THREE.FogExp2(0x111111, 0.02);
    }

    createGround() {
        // Simple asphalt ground
        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createObstacles() {
        // City Generation Settings
        const gridSize = 10;
        const citySize = 100; // Expanded map

        // Create Buildings
        for (let x = -citySize; x <= citySize; x += gridSize) {
            for (let z = -citySize; z <= citySize; z += gridSize) {
                if (Math.random() > 0.7) { // 30% chance of a building
                    this.createBuilding(x, z);
                } else if (Math.random() > 0.9) { // 10% chance of a regular car
                    this.createCar(x, z);
                } else if (Math.random() > 0.8) { // 10% chance of debris
                    this.createDebris(x, 0, z);
                }
            }
        }
    }

    createBuilding(x, z) {
        const w = 5 + Math.random() * 5;
        const h = 10 + Math.random() * 15;
        const d = 5 + Math.random() * 5;

        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9,
            transparent: true,
            opacity: 1
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, h / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);

        // Add to obstacles
        const box = new THREE.Box3().setFromObject(building);
        this.obstacles.push(box);

        // Store reference for transparency check
        building.userData.isBuilding = true;
        building.userData.originalOpacity = 1;

        // Neon Lights Removed
    }

    createCar(x, y, z) {
        const carGroup = new THREE.Group();

        // Body
        const bodyGeo = new THREE.BoxGeometry(4, 1.5, 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1;
        carGroup.add(body);

        // Top
        const topGeo = new THREE.BoxGeometry(2.5, 1, 1.8);
        const topMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark glass/roof
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 2.25;
        carGroup.add(top);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        const positions = [
            [-1.5, 0.5, 1], [1.5, 0.5, 1],
            [-1.5, 0.5, -1], [1.5, 0.5, -1]
        ];

        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(...pos);
            carGroup.add(wheel);
        });

        carGroup.position.set(x, y, z);
        carGroup.rotation.y = Math.random() * Math.PI;
        carGroup.castShadow = true;
        this.scene.add(carGroup);

        // Add to obstacles (Approximate box)
        const box = new THREE.Box3().setFromObject(carGroup);
        this.obstacles.push(box);
    }

    createDebris(x, y, z) {
        const debrisCount = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < debrisCount; i++) {
            const size = 0.5 + Math.random() * 1;
            const geometry = new THREE.BoxGeometry(size, size, size);
            const material = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const debris = new THREE.Mesh(geometry, material);

            debris.position.set(
                x + (Math.random() - 0.5) * 4,
                size / 2,
                z + (Math.random() - 0.5) * 4
            );
            debris.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            debris.castShadow = true;
            debris.receiveShadow = true;
            this.scene.add(debris);
        }
    }

    updateTransparency(playerPos, cameraPos) {
        const raycaster = new THREE.Raycaster();
        const direction = playerPos.clone().sub(cameraPos).normalize();
        raycaster.set(cameraPos, direction);

        const distance = cameraPos.distanceTo(playerPos);
        const intersects = raycaster.intersectObjects(this.scene.children);

        // Reset all buildings opacity first (inefficient but simple)
        this.scene.children.forEach(child => {
            if (child.userData.isBuilding) {
                child.material.opacity = 1;
            }
        });

        for (const intersect of intersects) {
            if (intersect.distance < distance && intersect.object.userData.isBuilding) {
                intersect.object.material.opacity = 0.3;
            }
        }
    }
}
