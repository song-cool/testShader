class WaveScene {
    constructor() {
        this.scene = new THREE.Scene();
        
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.left = '50%';
        canvas.style.top = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(canvas);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(size, size);
        
        this.time = 0;
        this.intensity = 1;
        
        this.targetZoom = 1;
        this.currentZoom = 1;
        this.zoomSpeed = 0.1;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;
        
        this.showBothLayers = false;
        this.clickCount = 0;
        
        this.loadShaders().then(() => {
            this.init();
            this.addEvents();
            this.animate();
        });
    }
    
    async loadShaders() {
        const vertexResponse = await fetch('shaders/greenStripes.vert');
        const fragmentResponse = await fetch('shaders/greenStripes.frag');
        
        const pingpongVertResponse = await fetch('shaders/pingpong.vert');
        const pingpongFragResponse = await fetch('shaders/pingpong.frag');
        
        this.vertexShader = await vertexResponse.text();
        this.fragmentShader = await fragmentResponse.text();
        this.pingpongVertexShader = await pingpongVertResponse.text();
        this.pingpongFragmentShader = await pingpongFragResponse.text();
    }
    
    init() {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.camera.position.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);
        
        const geometry = new THREE.PlaneGeometry(2, 2, 100, 100);
        
        const material = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                resolution: { value: new THREE.Vector2(1, 1) }
            },
            transparent: true
        });
        
        this.hiddenScene = new THREE.Scene();
        this.waveMesh = new THREE.Mesh(geometry, material);
        this.hiddenScene.add(this.waveMesh);
        
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.renderTarget = new THREE.WebGLRenderTarget(size, size, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        const pingpongMaterial = new THREE.ShaderMaterial({
            vertexShader: this.pingpongVertexShader,
            fragmentShader: this.pingpongFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                resolution: { value: new THREE.Vector2(1, 1) },
                tDiffuse: { value: this.renderTarget.texture }
            },
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.pingpongMesh = new THREE.Mesh(geometry, pingpongMaterial);
        this.scene.add(this.pingpongMesh);
    }
    
    addEvents() {
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        window.addEventListener('click', this.onClick.bind(this));
    }
    
    onClick() {
        this.clickCount++;
        this.showBothLayers = (this.clickCount % 2) === 1;
        
        console.log(`클릭 횟수: ${this.clickCount}`);
        console.log(`현재 모드: ${this.showBothLayers ? '두 레이어 모두 표시' : 'Pingpong 레이어만 표시'}`);
        
        if (this.showBothLayers) {
            const visibleWaveMesh = this.waveMesh.clone();
            visibleWaveMesh.material = this.waveMesh.material.clone();
            this.scene.add(visibleWaveMesh);
        } else {
            const meshesToRemove = [];
            this.scene.children.forEach(child => {
                if (child !== this.pingpongMesh) {
                    meshesToRemove.push(child);
                }
            });
            meshesToRemove.forEach(mesh => this.scene.remove(mesh));
        }
    }
    
    onWheel(event) {
        event.preventDefault();
        
        const delta = -Math.sign(event.deltaY) * 0.1;
        this.targetZoom = Math.max(this.minZoom, 
                                 Math.min(this.maxZoom, 
                                        this.targetZoom + delta));
    }
    
    onResize() {
        const size = Math.min(window.innerWidth, window.innerHeight);
        
        this.renderer.setSize(size, size);
        this.waveMesh.material.uniforms.resolution.value.set(1, 1);
        this.pingpongMesh.material.uniforms.resolution.value.set(1, 1);
    }
    
    updateZoom() {
        this.currentZoom += (this.targetZoom - this.currentZoom) * this.zoomSpeed;
        
        this.waveMesh.scale.set(this.currentZoom, this.currentZoom, 1);
        this.pingpongMesh.scale.set(this.currentZoom, this.currentZoom, 1);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.time += 0.01;
        this.waveMesh.material.uniforms.uTime.value = this.time;
        this.pingpongMesh.material.uniforms.uTime.value = this.time;
        
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.hiddenScene, this.camera);
        
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);
        
        this.updateZoom();
    }
}

new WaveScene();