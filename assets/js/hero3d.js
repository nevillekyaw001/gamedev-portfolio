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

    // shoulder bumpers (top edge, left + right)
    [-1, 1].forEach(function (side) {
      var bump = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.4), charcoal);
      bump.position.set(side * 1.05, 0.72, -0.12);
      bump.rotation.z = side * -0.06;
      pad.add(bump);
    });

    // d-pad: a clean plus on the left, aligned with the face cluster
    var gold = material(0xf4ba38, 0.35);
    var dpx = -0.95, dpy = 0.05;
    var dp1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.16), gold);
    var dp2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.16), gold);
    dp1.position.set(dpx, dpy, 0.32);
    dp2.position.set(dpx, dpy, 0.32);
    pad.add(dp1); pad.add(dp2);

    // face buttons: a proper ABXY diamond around (0.95, 0.05)
    var fcx = 0.95, fcy = 0.05, sp = 0.3;
    var face = [
      { col: 0x4fd6a3, dx: 0, dy: sp },       // top
      { col: 0xf2654d, dx: sp, dy: 0 },       // right
      { col: 0xf2ecdc, dx: 0, dy: -sp },      // bottom
      { col: 0xf4ba38, dx: -sp, dy: 0 }       // left
    ];
    face.forEach(function (b) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.15, 20), material(b.col, 0.28));
      m.rotation.x = Math.PI / 2;
      m.position.set(fcx + b.dx, fcy + b.dy, 0.33);
      pad.add(m);
    });

    // start / select pills in the centre
    [-0.22, 0.22].forEach(function (x) {
      var pill = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8), material(0x4a4438, 0.5));
      pill.rotation.z = Math.PI / 2;
      pill.position.set(x, 0.34, 0.3);
      pad.add(pill);
    });

    // two analog sticks, symmetric and lower
    [-0.5, 0.5].forEach(function (x) {
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.28, 14), charcoal);
      stem.rotation.x = Math.PI / 2;
      stem.position.set(x, -0.42, 0.34);
      var cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), material(0x3a352b, 0.5));
      cap.position.set(x, -0.42, 0.46);
      var stickRim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 20), gold);
      stickRim.position.set(x, -0.42, 0.5);
      pad.add(stem); pad.add(cap); pad.add(stickRim);
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
