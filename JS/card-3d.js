/**
 * 3D Interactive Card with Three.js
 * Vytváří 3D model karty s texturami z obrázků a plynulou kontinuální rotací
 */

class Card3D {
  constructor(containerId, textureUrls) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.textureUrls = textureUrls; // { front: 'url1', back: 'url2' }

    // Scene setup
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.card = null;

    // Animation state
    this.clock = new THREE.Clock(); // Mnohem lepší pro řízení času než Date.now()
    this.rotationSpeed = 0.4; // Rychlost rotace (radiány za sekundu)

    // Responsive setup
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.init();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Průhledné pozadí

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45, // Menší FOV (z 75 na 45) zmenší zkreslení okrajů karty, působí to profesionálněji
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.z = 10; // Oddálíme kameru kvůli menšímu FOV

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Lighting (lehce upraveno pro lepší hloubku)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 8);
    this.scene.add(directionalLight);

    // Jemné protisvětlo pro zvýraznění hran z druhé strany
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-5, -5, -8);
    this.scene.add(backLight);

    // Create card
    this.createCard();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  createCard() {
    const textureLoader = new THREE.TextureLoader();

    // Load textures
    const frontTexture = textureLoader.load(this.textureUrls.front);
    const backTexture = textureLoader.load(this.textureUrls.back);

    // Nastavení filtrů pro ostrost a správný barevný prostor
    [frontTexture, backTexture].forEach(texture => {
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
    });

    // Geometry - vizitka formát (85×55 mm = poměr 1.545:1)
    const cardWidth = 7.38;
    const cardHeight = 4.77;
    const cardThickness = 0.05; // Nepatrně zesíleno, aby hrany vypadaly reálněji při rotaci

    const geometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness);

    // Základní materiál pro hrany
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.2,
      roughness: 0.8
    });

    // Materials - přední strana, zadní strana a boky
    const materials = [
      edgeMaterial, // Right side
      edgeMaterial, // Left side
      edgeMaterial, // Top side
      edgeMaterial, // Bottom side
      new THREE.MeshStandardMaterial({ // Front side
        map: frontTexture,
        metalness: 0.1,
        roughness: 0.4 // Nižší roughness = mírně lesklejší povrch
      }),
      new THREE.MeshStandardMaterial({ // Back side
        map: backTexture,
        metalness: 0.1,
        roughness: 0.4
      })
    ];

    this.card = new THREE.Mesh(geometry, materials);
    this.scene.add(this.card);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Čas od spuštění v sekundách - garantuje plynulost bez ohledu na FPS
    const elapsedTime = this.clock.getElapsedTime();

    if (this.card) {
      // 1. Kontinuální rotace kolem osy Y
      this.card.rotation.y = elapsedTime * this.rotationSpeed;

      // 2. Jemný levitační efekt (nahoru a dolů)
      this.card.position.y = Math.sin(elapsedTime * 1.5) * 0.15;

      // 3. Velmi jemné přirozené naklánění (wobble) pro 3D pocit
      this.card.rotation.z = Math.sin(elapsedTime * 1.2) * 0.05;
      this.card.rotation.x = Math.cos(elapsedTime * 1.2) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const newWidth = this.container.clientWidth;
    const newHeight = this.container.clientHeight;

    if (newWidth !== this.width || newHeight !== this.height) {
      this.width = newWidth;
      this.height = newHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.width, this.height);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('card-3d-container');
  if (container) {
    setTimeout(() => {
      new Card3D('card-3d-container', {
        front: 'galerie/karta1.webp', // Používáme moderní formát pro lepší kvalitu a menší velikost
        back: 'galerie/karta2.webp', // Používáme moderní formát pro lepší kvalitu a menší velikost
      });
    }, 100);
  }
});
