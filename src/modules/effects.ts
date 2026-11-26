export interface TiltAngles {
  readonly rotateX: number;
  readonly rotateY: number;
}

export function computeTiltAngles(
  pointerX: number,
  pointerY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  maxDegrees = 8,
): TiltAngles {
  if (rect.width <= 0 || rect.height <= 0) {
    return { rotateX: 0, rotateY: 0 };
  }
  const x = pointerX - rect.left;
  const y = pointerY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const clampedX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
  const clampedY = Math.max(-1, Math.min(1, (y - centerY) / centerY));

  return {
    rotateX: Number((clampedY * -maxDegrees).toFixed(2)) + 0,
    rotateY: Number((clampedX * maxDegrees).toFixed(2)) + 0,
  };
}

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function hasFinePointer(): boolean {
  if (typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(pointer: fine)').matches;
}

export interface EffectsController {
  destroy: () => void;
}

export function initEffects(root: Document = document): EffectsController {
  const cleanups: Array<() => void> = [];
  const reducedMotion = prefersReducedMotion();
  const finePointer = hasFinePointer();

  // 1. Scroll Reveal with IntersectionObserver + graceful fallback
  const revealElements = Array.from(root.querySelectorAll<HTMLElement>('.reveal-up'));
  if (reducedMotion || typeof IntersectionObserver === 'undefined') {
    revealElements.forEach((el) => {
      el.classList.add('active');
    });
  } else if (revealElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    revealElements.forEach((el) => {
      observer.observe(el);
    });
    cleanups.push(() => {
      observer.disconnect();
    });
  }

  // 2. rAF-driven Custom Cursor (only on fine pointers when motion is allowed)
  const cursorDot = root.querySelector<HTMLElement>('.cursor-dot');
  const cursorOutline = root.querySelector<HTMLElement>('.cursor-outline');
  if (finePointer && !reducedMotion && cursorDot && cursorOutline) {
    root.body.classList.add('has-custom-cursor');
    let targetX = 0;
    let targetY = 0;
    let outlineX = 0;
    let outlineY = 0;
    let visible = false;
    let rafId = 0;

    const tick = (): void => {
      outlineX += (targetX - outlineX) * 0.18;
      outlineY += (targetY - outlineY) * 0.18;
      cursorOutline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0)`;

      const dx = Math.abs(targetX - outlineX);
      const dy = Math.abs(targetY - outlineY);
      if (dx > 0.25 || dy > 0.25) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const onMouseMove = (event: MouseEvent): void => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursorDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

      if (!visible) {
        visible = true;
        outlineX = targetX;
        outlineY = targetY;
        cursorOutline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0)`;
        root.body.classList.add('cursor-visible');
      }

      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }

      const isInteractive =
        event.target instanceof Element &&
        Boolean(event.target.closest('a, button, input, select, textarea, .hover-target'));
      root.body.classList.toggle('cursor-hover', isInteractive);
    };

    const onMouseLeave = (): void => {
      visible = false;
      root.body.classList.remove('cursor-visible', 'cursor-hover');
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    root.addEventListener('mouseleave', onMouseLeave);
    cleanups.push(() => {
      window.removeEventListener('mousemove', onMouseMove);
      root.removeEventListener('mouseleave', onMouseLeave);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      root.body.classList.remove('has-custom-cursor', 'cursor-visible', 'cursor-hover');
    });
  }

  // 3. 3D Tilt Cards (only on fine pointers when motion is allowed)
  if (finePointer && !reducedMotion) {
    const tiltCards = Array.from(root.querySelectorAll<HTMLElement>('.tilt-card'));
    tiltCards.forEach((card) => {
      const onMove = (event: MouseEvent): void => {
        const { rotateX, rotateY } = computeTiltAngles(
          event.clientX,
          event.clientY,
          card.getBoundingClientRect(),
        );
        card.style.transition = 'none';
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
      };

      const onLeave = (): void => {
        card.style.transition = 'transform 0.45s ease';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      };

      card.addEventListener('mousemove', onMove, { passive: true });
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });
  }

  return {
    destroy: () => {
      cleanups.forEach((fn) => {
        fn();
      });
    },
  };
}
