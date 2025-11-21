import * as THREE from 'three';

export class Projectile {
    constructor(scene, position, direction) {
        this.scene = scene;
        this.speed = 40;
        this.damage = 1;
        this.remove = false;

        // Create Mesh
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);

        this.direction = direction.normalize();

        // Cleanup timer
        setTimeout(() => {
            this.remove = true;
        }, 800); // Remove after 0.8 seconds (shorter range)
    }

    update(delta) {
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * delta));
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.remove = true;
    }
}
