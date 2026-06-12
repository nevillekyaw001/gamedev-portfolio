/*
 * A floating low-poly game controller, built from primitives.
 * Lives in the Work tab header. Drifts, bobs, and leans toward the
 * cursor. Charcoal body, gold/jade/lacquer buttons - same palette,
 * one more dimension.
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

(function () {
  'use strict';

  var canvas = document.getElementById('pad3d-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.remove();
    return;
  }

  var renderer, scene, camera, pad;
  var tx = 0, ty = 0;

  function material(hex, rough) {
    return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.25 });
  }

  function build() {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.6, 7.5);

    scene.add(new THREE.AmbientLight(0xede6d4, 0.55));
    var key = new THREE.DirectionalLight(0xffe9b8, 1.5);
    key.position.set(3, 5, 4);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x6cc6a1, 0.5);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    pad = new THREE.Group();

    var charcoal = material(0x232019, 0.55);

    // body
    var body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.3, 0.55), charcoal);
    pad.add(body);

    // grips
    [-1, 1].forEach(function (side) {
      var grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 6, 14), charcoal);
      grip.position.set(side * 1.55, -0.55, 0.05);
      grip.rotation.z = side * -0.45;
      pad.add(grip);
    });

    // d-pad (gold cross)
    var gold = material(0xe3b34c, 0.35);
    var dp1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.16), gold);
    var dp2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 0.16), gold);
    dp1.position.set(-0.95, 0.12, 0.32);
    dp2.position.set(-0.95, 0.12, 0.32);
    pad.add(dp1); pad.add(dp2);

    // face buttons (jade, lacquer, stone, gold)
    var cols = [0x6cc6a1, 0xd4604f, 0xede6d4, 0xe3b34c];
    var spots = [[0.75, 0.32], [1.15, 0.12], [0.75, -0.08], [0.95, 0.12]];
    spots.forEach(function (p, i) {
      var b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 18), material(cols[i], 0.3));
      b.rotation.x = Math.PI / 2;
      b.position.set(p[0], p[1], 0.32);
      pad.add(b);
    });

    // sticks
    [-0.4, 0.35].forEach(function (x) {
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12), charcoal);
      stem.rotation.x = Math.PI / 2;
      stem.position.set(x, -0.22, 0.36);
      var cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), material(0x3a352b, 0.5));
      cap.position.set(x, -0.22, 0.5);
      pad.add(stem); pad.add(cap);
    });

    pad.rotation.x = 0.35;
    scene.add(pad);
  }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / innerWidth - 0.5) * 0.5;
    ty = (e.clientY / innerHeight - 0.5) * 0.35;
  }, { passive: true });

  var t = 0;
  function loop() {
    requestAnimationFrame(loop);
    if (!canvas.isConnected || canvas.clientWidth === 0) return;  // hidden tab
    resize();
    t += 0.008;
    pad.position.y = Math.sin(t * 1.4) * 0.12;
    pad.rotation.y += ((t * 0 + tx * 1.6 + Math.sin(t * 0.7) * 0.25) - pad.rotation.y) * 0.04;
    pad.rotation.x += ((0.35 + ty) - pad.rotation.x) * 0.05;
    renderer.render(scene, camera);
  }

  try {
    build();
    loop();
  } catch (e) {
    canvas.remove();  // WebGL unavailable - the page stands on its own
  }
})();
