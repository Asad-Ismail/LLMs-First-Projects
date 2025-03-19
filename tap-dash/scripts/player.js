/**
 * Player class for Tap Dash
 */
class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = { x: 0, y: 0.5, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.size = { x: 0.5, y: 0.5, z: 0.5 };
        this.isJumping = false;
        this.gravity = 0.015;
        this.jumpForce = 0.35;
        
        // Create the player mesh
        const geometry = new THREE.SphereGeometry(this.size.x, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
        
        // Add glow effect
        this.addGlow();
    }
    
    addGlow() {
        // Simple glow effect using point light
        this.light = new THREE.PointLight(0xffffff, 1, 3);
        this.light.position.copy(this.mesh.position);
        this.scene.add(this.light);
    }
    
    jump() {
        if (!this.isJumping) {
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
            return true; // Successfully jumped
        }
        return false; // Already jumping
    }
    
    update() {
        // Apply gravity
        this.velocity.y -= this.gravity;
        
        // Update position
        this.position.y += this.velocity.y;
        
        // Ground collision
        if (this.position.y <= this.size.y) {
            this.position.y = this.size.y;
            this.velocity.y = 0;
            this.isJumping = false;
        }
        
        // Update mesh position
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Update light position
        this.light.position.copy(this.mesh.position);
    }
    
    reset() {
        this.position = { x: 0, y: 0.5, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.isJumping = false;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    }
}