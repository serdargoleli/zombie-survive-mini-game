import * as THREE from 'three';

export class Zombie {
    constructor(scene, position, type = 'standard') {
        this.scene = scene;
        this.type = type;
        this.mesh = new THREE.Group();
        this.isDead = false;

        // Stats based on type
        switch (type) {
            case 'dog':
                this.speed = 8 + Math.random() * 2;
                this.health = 1;
                break;
            case 'crawler':
                this.speed = 3 + Math.random();
                this.health = 1;
                break;
            case 'big':
                this.speed = 2 + Math.random();
                this.health = 5;
                break;
            default: // standard
                this.speed = 4 + Math.random() * 2;
                this.health = 1;
                break;
        }

        this.createModel();

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    createModel() {
        // Colors
        let skinColor = 0x558855; // Greenish
        let clothesColor = 0x444444;
        let scale = 1;

        if (this.type === 'dog') {
            skinColor = 0x8B4513; // Brown
            scale = 0.6;
        } else if (this.type === 'crawler') {
            skinColor = 0x2F4F4F; // Dark Slate
        } else if (this.type === 'big') {
            skinColor = 0x556B2F; // Olive
            scale = 1.5;
        }

        // Body Group
        const bodyGroup = new THREE.Group();

        if (this.type === 'dog') {
            // Dog Model
            const bodyGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4);
            const bodyMat = new THREE.MeshStandardMaterial({ color: skinColor });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.5;
            body.castShadow = true;
            bodyGroup.add(body);

            const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const head = new THREE.Mesh(headGeo, bodyMat);
            head.position.set(0, 0.8, 0.3);
            bodyGroup.add(head);
        } else {
            // Humanoid Model
            // Torso
            const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
            const torsoMat = new THREE.MeshStandardMaterial({ color: clothesColor });
            const torso = new THREE.Mesh(torsoGeo, torsoMat);
            torso.position.y = 1.4;
            if (this.type === 'crawler') {
                torso.position.y = 0.4;
                torso.rotation.x = -Math.PI / 2;
            }
            torso.castShadow = true;
            bodyGroup.add(torso);

            // Head
            const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
            const headMat = new THREE.MeshStandardMaterial({ color: skinColor });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 2.1;
            if (this.type === 'crawler') {
                head.position.y = 0.4;
                head.position.z = 0.6;
            }
            head.castShadow = true;
            bodyGroup.add(head);

            // Arms
            const armGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
            const armMat = new THREE.MeshStandardMaterial({ color: skinColor });

            const leftArm = new THREE.Mesh(armGeo, armMat);
            leftArm.position.set(-0.4, 1.5, 0.3);
            leftArm.rotation.x = -Math.PI / 2;
            if (this.type === 'crawler') {
                leftArm.position.set(-0.4, 0.2, 0.4);
                leftArm.rotation.x = 0;
            }
            leftArm.castShadow = true;
            bodyGroup.add(leftArm);

            const rightArm = new THREE.Mesh(armGeo, armMat);
            rightArm.position.set(0.4, 1.5, 0.3);
            rightArm.rotation.x = -Math.PI / 2;
            if (this.type === 'crawler') {
                rightArm.position.set(0.4, 0.2, 0.4);
                rightArm.rotation.x = 0;
            }
            rightArm.castShadow = true;
            bodyGroup.add(rightArm);
        }

        // Glowing Eyes (Common)
        const eyeGeo = new THREE.BoxGeometry(0.1, 0.05, 0.05);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // Adjust eye position based on type
        let eyeY = 2.15;
        let eyeZ = 0.23;
        if (this.type === 'dog') { eyeY = 0.85; eyeZ = 0.45; }
        if (this.type === 'crawler') { eyeY = 0.45; eyeZ = 0.8; }

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.1, eyeY, eyeZ);
        bodyGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.1, eyeY, eyeZ);
        bodyGroup.add(rightEye);

        this.mesh.add(bodyGroup);
        this.mesh.scale.set(scale, scale, scale);
    }

    update(delta, playerPosition) {
        if (this.isDead) return;

        // Move towards player
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.mesh.position)
            .normalize();

        // Ignore Y difference
        direction.y = 0;

        this.mesh.position.add(direction.multiplyScalar(this.speed * delta));
        this.mesh.lookAt(playerPosition);
    }
}
