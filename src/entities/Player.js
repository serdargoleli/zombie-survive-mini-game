import * as THREE from 'three';
import { Projectile } from './Projectile.js';

export class Player {
    constructor(scene, type = 'male') {
        this.scene = scene;
        this.type = type;

        this.mesh = new THREE.Group();

        this.speed = 10;
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;

        // Weapon System
        this.weapon = 'Pistol'; // Fix: Initialize weapon
        this.weapons = ['Pistol'];
        this.currentWeaponIndex = 0;
        this.lastShotTime = 0;
        this.fireRate = 0.5;
        this.ammo = Infinity;

        if (this.type === 'male') {
            this.createMaleModel();
        } else {
            this.createFemaleModel();
        }

        this.scene.add(this.mesh);
        this.mesh.position.y = 0;
    }

    createMaleModel() {
        // Max: Tactical vest, darker colors, rugged look
        const skinColor = 0xffccaa;
        const shirtColor = 0x222222; // Dark shirt
        const vestColor = 0x334433; // Olive tactical vest
        const pantsColor = 0x1a1a1a; // Black pants

        const bodyGroup = new THREE.Group();

        // Torso (Shirt)
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.4),
            new THREE.MeshStandardMaterial({ color: shirtColor })
        );
        torso.position.y = 1.4;
        torso.castShadow = true;
        bodyGroup.add(torso);

        // Tactical Vest
        const vest = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.5, 0.45),
            new THREE.MeshStandardMaterial({ color: vestColor })
        );
        vest.position.y = 1.5;
        vest.castShadow = true;
        bodyGroup.add(vest);

        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.45, 0.45),
            new THREE.MeshStandardMaterial({ color: skinColor })
        );
        head.position.y = 2.1;
        head.castShadow = true;
        bodyGroup.add(head);

        // Hair/Cap
        const cap = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.15, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        cap.position.set(0, 2.35, 0.05);
        bodyGroup.add(cap);

        // Legs
        const legsGeo = new THREE.BoxGeometry(0.5, 0.9, 0.35);
        const legsMat = new THREE.MeshStandardMaterial({ color: pantsColor });
        const legs = new THREE.Mesh(legsGeo, legsMat);
        legs.position.y = 0.5;
        legs.castShadow = true;
        bodyGroup.add(legs);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
        const armMat = new THREE.MeshStandardMaterial({ color: skinColor });

        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.4, 1.5, 0.3);
        leftArm.rotation.x = -Math.PI / 2;
        leftArm.castShadow = true;
        bodyGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.4, 1.5, 0.3);
        rightArm.rotation.x = -Math.PI / 2;
        rightArm.castShadow = true;
        bodyGroup.add(rightArm);

        this.mesh.add(bodyGroup);
    }

    createFemaleModel() {
        // Alex: Tank top, ponytail, combat boots
        const skinColor = 0xffccaa;
        const shirtColor = 0x445566; // Blue-grey tank top
        const pantsColor = 0x2a2a2a; // Dark pants

        const bodyGroup = new THREE.Group();

        // Torso
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.7, 0.35),
            new THREE.MeshStandardMaterial({ color: shirtColor })
        );
        torso.position.y = 1.35;
        torso.castShadow = true;
        bodyGroup.add(torso);

        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.35, 0.35),
            new THREE.MeshStandardMaterial({ color: skinColor })
        );
        head.position.y = 2.0;
        head.castShadow = true;
        bodyGroup.add(head);

        // Hair (Ponytail)
        const hair = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x332211 })
        );
        hair.position.set(0, 2.0, -0.2);
        hair.castShadow = true;
        bodyGroup.add(hair);

        // Legs
        const legsGeo = new THREE.BoxGeometry(0.45, 0.8, 0.3);
        const legsMat = new THREE.MeshStandardMaterial({ color: pantsColor });
        const legs = new THREE.Mesh(legsGeo, legsMat);
        legs.position.y = 0.5;
        legs.castShadow = true;
        bodyGroup.add(legs);

        // Arms (Sleeveless)
        const armGeo = new THREE.BoxGeometry(0.12, 0.65, 0.12);
        const armMat = new THREE.MeshStandardMaterial({ color: skinColor });

        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.35, 1.45, 0.3);
        leftArm.rotation.x = -Math.PI / 2;
        leftArm.castShadow = true;
        bodyGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.35, 1.45, 0.3);
        rightArm.rotation.x = -Math.PI / 2;
        rightArm.castShadow = true;
        bodyGroup.add(rightArm);

        this.mesh.add(bodyGroup);
    }

    update(delta, inputManager, obstacles) {
        if (this.isDead) return;

        // Movement
        const moveDir = inputManager.getMovementVector();
        if (moveDir.length() > 0) {
            const moveStep = moveDir.multiplyScalar(this.speed * delta);
            const newPos = this.mesh.position.clone().add(moveStep);

            // Collision Check
            const playerBox = new THREE.Box3().setFromCenterAndSize(
                newPos.clone().add(new THREE.Vector3(0, 1, 0)),
                new THREE.Vector3(0.6, 2, 0.6)
            );

            let collided = false;
            if (obstacles) {
                for (const obstacle of obstacles) {
                    if (playerBox.intersectsBox(obstacle)) {
                        collided = true;
                        break;
                    }
                }
            }

            if (!collided) {
                this.mesh.position.add(moveStep);
            }
        }

        // Rotation (Face Mouse)
        const lookTarget = inputManager.mouseWorldPosition.clone();
        lookTarget.y = this.mesh.position.y; // Keep looking horizontal
        this.mesh.lookAt(lookTarget);

        // Shooting
        if (inputManager.keys.space || (inputManager.mouse && inputManager.mouse.buttons === 1)) { // Check for click later, for now space
            // We'll handle shooting in Game.js via input or here?
            // Let's handle it here if we pass the projectile list or return it
        }
    }

    setWeapon(type) {
        this.weapon = type;
        console.log('Equipped:', type);
        switch (type) {
            case 'Pistol':
                this.fireRate = 0.5;
                this.ammo = Infinity;
                break;
            case 'Rifle':
                this.fireRate = 0.1;
                this.ammo = 30;
                break;
            case 'Bomb':
                this.fireRate = 1.0;
                this.ammo = 5;
                break;
            case 'Katana':
                this.fireRate = 0.4;
                this.ammo = 50; // Durability
                break;
        }
    }

    shoot(time) {
        if (time - this.lastShotTime < this.fireRate) return null;
        if (this.ammo <= 0 && this.weapon !== 'Pistol') {
            this.setWeapon('Pistol'); // Revert to pistol if out of ammo
            return null;
        }

        this.lastShotTime = time;
        if (this.weapon !== 'Pistol') this.ammo--;

        // Calculate spawn position (end of gun)
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        const position = this.mesh.position.clone().add(new THREE.Vector3(0, 1.4, 0)).add(direction.multiplyScalar(0.8));

        const proj = new Projectile(this.scene, position, direction);

        // Customize Projectile based on weapon
        if (this.weapon === 'Rifle') {
            proj.speed = 60;
            proj.damage = 1;
        } else if (this.weapon === 'Bomb') {
            proj.speed = 15;
            proj.isBomb = true;
            proj.mesh.scale.set(2, 2, 2);
            proj.mesh.material.color.setHex(0x000000);
        } else if (this.weapon === 'Katana') {
            proj.speed = 20; // Short range "slash"
            proj.isMelee = true;
            proj.mesh.scale.set(3, 0.2, 1); // Wide slash
            proj.mesh.material.color.setHex(0xcccccc);
            setTimeout(() => proj.destroy(), 200); // Disappear quickly
        }

        return proj;
    }
}
