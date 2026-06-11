'use strict';

/*
 * Interactive 3D tilt — cards rotate in 3D space toward the pointer.
 * Skipped on touch-only devices and when reduced motion is preferred.
 */

(function () {

  if (window.matchMedia("(hover: none)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const MAX_TILT = 8; /* degrees */

  const cards = document.querySelectorAll(
    ".project-item, .service-item, .content-card, .blog-post-item, .skills-list, .avatar-box"
  );

  cards.forEach(function (card) {

    card.classList.add("tilt-card");

    card.addEventListener("pointermove", function (event) {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.transform =
        "perspective(800px)" +
        " rotateX(" + (-y * MAX_TILT).toFixed(2) + "deg)" +
        " rotateY(" + (x * MAX_TILT).toFixed(2) + "deg)" +
        " translateZ(6px)";
    });

    card.addEventListener("pointerleave", function () {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    });

  });

})();
