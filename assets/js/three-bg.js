'use strict';

/*
 * 3D animated background — floating low-poly shapes + starfield
 * Rendered on a fixed canvas behind the page content.
 */

(function () {

  if (typeof THREE === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x130f24, 0.025);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 16);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  /* floating low-poly wireframe shapes */
  const ACCENT = 0x32ffbb;
  const PURPLE = 0x8a7bff;
  const CYAN = 0x55e0ff;

  const geometries = [
    new THREE.IcosahedronGeometry(1.5, 0),
    new THREE.OctahedronGeometry(1.4, 0),
    new THREE.TorusGeometry(1.1, 0.38, 8, 14),
    new THREE.TetrahedronGeometry(1.5, 0),
    new THREE.BoxGeometry(1.6, 1.6, 1.6)
  ];

  const shapes = [];
  const shapeColors = [ACCENT, PURPLE, CYAN];

  for (let i = 0; i < 16; i++) {
    const geometry = geometries[i % geometries.length];
    const material = new THREE.MeshBasicMaterial({
      color: shapeColors[i % shapeColors.length],
      wireframe: true,
      transparent: true,
      opacity: 0.16 + Math.random() * 0.18
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (Math.random() - 0.5) * 36,
      (Math.random() - 0.5) * 22,
      -4 - Math.random() * 18
    );

    const scale = 0.5 + Math.random() * 1.1;
    mesh.scale.setScalar(scale);

    mesh.userData = {
      rotSpeedX: (Math.random() - 0.5) * 0.4,
      rotSpeedY: (Math.random() - 0.5) * 0.4,
      floatSpeed: 0.3 + Math.random() * 0.5,
      floatRange: 0.6 + Math.random() * 1.2,
      baseY: mesh.position.y,
      phase: Math.random() * Math.PI * 2
    };

    scene.add(mesh);
    shapes.push(mesh);
  }

  /* starfield particles */
  const starCount = 350;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 60;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    starPositions[i * 3 + 2] = -5 - Math.random() * 30;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
    color: 0xaef7ff,
    size: 0.09,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  scene.add(stars);

  /* mouse parallax */
  let targetX = 0;
  let targetY = 0;

  window.addEventListener("pointermove", function (event) {
    targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    targetY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    for (let i = 0; i < shapes.length; i++) {
      const mesh = shapes[i];
      const data = mesh.userData;
      mesh.rotation.x += data.rotSpeedX * delta;
      mesh.rotation.y += data.rotSpeedY * delta;
      mesh.position.y = data.baseY + Math.sin(elapsed * data.floatSpeed + data.phase) * data.floatRange;
    }

    stars.rotation.y = elapsed * 0.012;

    /* ease the camera toward the pointer for a parallax feel */
    camera.position.x += (targetX * 1.6 - camera.position.x) * 2 * delta;
    camera.position.y += (-targetY * 1.0 - camera.position.y) * 2 * delta;
    camera.lookAt(0, 0, -6);

    renderer.render(scene, camera);
  }

  animate();

})();
