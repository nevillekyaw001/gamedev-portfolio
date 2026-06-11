'use strict';

/*
 * HYPERDRIVE DODGE — a small 3D mini game built with Three.js.
 * Steer the ship left/right (arrow keys, A/D, or drag on touch)
 * and dodge the incoming blocks. Speed ramps up over time.
 */

(function () {

  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;

  const frame = document.querySelector("[data-game-frame]");
  const gameArticle = document.querySelector('[data-page="game"]');
  const scoreEl = document.querySelector("[data-game-score]");
  const bestEl = document.querySelector("[data-game-best]");
  const overlay = document.querySelector("[data-game-overlay]");
  const overlayTitle = document.querySelector("[data-game-overlay-title]");
  const overlayText = document.querySelector("[data-game-overlay-text]");
  const startBtn = document.querySelector("[data-game-start]");
  const startBtnLabel = startBtn.querySelector("span");

  const BEST_KEY = "hyperdrive-dodge-best";
  const TRACK_HALF_WIDTH = 7;
  const PLAYER_Z = 8;

  let state = "idle"; /* idle | playing | over */
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY)) || 0;
  let speed = 0;
  let spawnTimer = 0;
  let targetX = 0;

  bestEl.textContent = best;

  /* ---------- scene setup ---------- */

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x130f24);
  scene.fog = new THREE.Fog(0x130f24, 40, 130);

  const camera = new THREE.PerspectiveCamera(65, 16 / 9, 0.1, 200);
  camera.position.set(0, 5, 16);
  camera.lookAt(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(4, 10, 8);
  scene.add(keyLight);

  const accentLight = new THREE.PointLight(0x32ffbb, 1.2, 40);
  accentLight.position.set(0, 4, PLAYER_Z);
  scene.add(accentLight);

  /* scrolling neon grid floor */
  const grid = new THREE.GridHelper(300, 60, 0x32ffbb, 0x2b2353);
  grid.position.y = 0;
  scene.add(grid);

  /* side rails marking the playable track */
  const railGeometry = new THREE.BoxGeometry(0.25, 0.25, 300);
  const railMaterial = new THREE.MeshBasicMaterial({ color: 0x8a7bff, transparent: true, opacity: 0.55 });
  const railLeft = new THREE.Mesh(railGeometry, railMaterial);
  railLeft.position.set(-TRACK_HALF_WIDTH - 1, 0.15, -120);
  scene.add(railLeft);
  const railRight = railLeft.clone();
  railRight.position.x = TRACK_HALF_WIDTH + 1;
  scene.add(railRight);

  /* ---------- player ship ---------- */

  const ship = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x32ffbb, emissive: 0x0a8f66, metalness: 0.4, roughness: 0.35
  });
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a7bff, emissive: 0x2c2475, metalness: 0.4, roughness: 0.4
  });

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.2, 6), bodyMaterial);
  nose.rotation.x = -Math.PI / 2; /* point toward -z */
  ship.add(nose);

  const wings = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.9), wingMaterial);
  wings.position.set(0, 0, 0.55);
  ship.add(wings);

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xaef7ff, emissive: 0x4dc4d6, roughness: 0.2 })
  );
  cockpit.position.set(0, 0.3, 0.25);
  ship.add(cockpit);

  ship.position.set(0, 0.7, PLAYER_Z);
  scene.add(ship);

  /* ---------- obstacles ---------- */

  const obstacles = [];
  const obstacleMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xff5577, emissive: 0x701c30, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0x6e3c0a, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: 0x8a7bff, emissive: 0x2c2475, roughness: 0.5 })
  ];

  function spawnObstacle() {
    const size = 1.2 + Math.random() * 1.6;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      obstacleMaterials[Math.floor(Math.random() * obstacleMaterials.length)]
    );
    mesh.position.set(
      (Math.random() * 2 - 1) * (TRACK_HALF_WIDTH - size / 2),
      size / 2,
      -130
    );
    mesh.userData = {
      half: size / 2,
      spin: (Math.random() - 0.5) * 2,
      passed: false
    };
    scene.add(mesh);
    obstacles.push(mesh);
  }

  function clearObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
      scene.remove(obstacles[i]);
      obstacles[i].geometry.dispose();
    }
    obstacles.length = 0;
  }

  /* ---------- game state ---------- */

  function startGame() {
    clearObstacles();
    score = 0;
    speed = 34;
    spawnTimer = 0;
    targetX = 0;
    ship.position.x = 0;
    ship.rotation.z = 0;
    ship.visible = true;
    state = "playing";
    overlay.classList.remove("active");
    scoreEl.textContent = "0";
    canvas.focus();
  }

  function endGame() {
    state = "over";
    const finalScore = Math.floor(score);
    if (finalScore > best) {
      best = finalScore;
      localStorage.setItem(BEST_KEY, String(best));
      bestEl.textContent = best;
      overlayTitle.textContent = "New High Score!";
    } else {
      overlayTitle.textContent = "Game Over";
    }
    overlayText.textContent = "You scored " + finalScore + " points. Best: " + best + ".";
    startBtnLabel.textContent = "Play Again";
    overlay.classList.add("active");
  }

  /* ---------- controls ---------- */

  const keys = { left: false, right: false };

  window.addEventListener("keydown", function (event) {
    if (gameArticle && !gameArticle.classList.contains("active")) return;

    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = true;
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = true;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === " ") {
      if (state === "playing") event.preventDefault();
    }
    if ((event.key === " " || event.key === "Enter") && state !== "playing" &&
        document.activeElement !== startBtn) {
      startGame();
    }
  });

  window.addEventListener("keyup", function (event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.left = false;
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.right = false;
  });

  /* drag steering for touch / pointer */
  let dragging = false;

  function pointerToTrackX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const normalized = (clientX - rect.left) / rect.width * 2 - 1;
    return normalized * TRACK_HALF_WIDTH;
  }

  canvas.addEventListener("pointerdown", function (event) {
    if (state !== "playing") return;
    dragging = true;
    targetX = pointerToTrackX(event.clientX);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", function (event) {
    if (dragging && state === "playing") targetX = pointerToTrackX(event.clientX);
  });

  canvas.addEventListener("pointerup", function () { dragging = false; });
  canvas.addEventListener("pointercancel", function () { dragging = false; });

  startBtn.addEventListener("click", startGame);

  /* ---------- sizing ---------- */

  function resize() {
    const width = frame.clientWidth;
    if (width === 0) return;
    const height = Math.max(280, Math.min(460, Math.round(width * 0.58)));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  resize();

  /* ---------- main loop ---------- */

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    /* the game tab is hidden (display: none) — skip work, end run fairly */
    if (gameArticle && !gameArticle.classList.contains("active")) {
      if (state === "playing") endGame();
      return;
    }

    /* canvas was resized to 0 while hidden — fix on return */
    if (canvas.width === 0) resize();

    if (state === "playing") {

      /* steering */
      if (!dragging) {
        const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        targetX += steer * 22 * delta;
      }
      targetX = Math.max(-TRACK_HALF_WIDTH, Math.min(TRACK_HALF_WIDTH, targetX));

      const previousX = ship.position.x;
      ship.position.x += (targetX - ship.position.x) * 10 * delta;
      ship.rotation.z = -(ship.position.x - previousX) * 6; /* bank into turns */
      ship.position.y = 0.7 + Math.sin(clock.elapsedTime * 4) * 0.08;
      accentLight.position.x = ship.position.x;

      /* difficulty ramp */
      speed += 1.1 * delta;
      score += speed * delta * 0.6;
      scoreEl.textContent = Math.floor(score);

      /* scroll the grid to fake forward motion */
      grid.position.z = (grid.position.z + speed * delta) % 5;

      /* spawn obstacles faster as speed grows */
      spawnTimer -= delta;
      if (spawnTimer <= 0) {
        spawnObstacle();
        spawnTimer = Math.max(0.25, 38 / speed - 0.45 + Math.random() * 0.3);
      }

      /* move obstacles, detect passes and collisions */
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.position.z += speed * delta;
        obstacle.rotation.y += obstacle.userData.spin * delta;

        if (!obstacle.userData.passed && obstacle.position.z > PLAYER_Z + obstacle.userData.half + 1) {
          obstacle.userData.passed = true;
          score += 10;
        }

        if (obstacle.position.z > 25) {
          scene.remove(obstacle);
          obstacle.geometry.dispose();
          obstacles.splice(i, 1);
          continue;
        }

        const dx = Math.abs(obstacle.position.x - ship.position.x);
        const dz = Math.abs(obstacle.position.z - ship.position.z);
        if (dx < obstacle.userData.half + 0.9 && dz < obstacle.userData.half + 1.0) {
          endGame();
          break;
        }
      }

    } else {
      /* idle / game-over: slow showcase spin */
      ship.position.x += (0 - ship.position.x) * 2 * delta;
      ship.rotation.z = Math.sin(clock.elapsedTime) * 0.08;
      ship.position.y = 0.7 + Math.sin(clock.elapsedTime * 2) * 0.1;
      grid.position.z = (grid.position.z + 6 * delta) % 5;
    }

    renderer.render(scene, camera);
  }

  animate();

})();
