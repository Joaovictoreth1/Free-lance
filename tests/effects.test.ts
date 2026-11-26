import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeTiltAngles, initEffects } from '../src/modules/effects';

describe('computeTiltAngles', () => {
  const rect = { left: 100, top: 100, width: 200, height: 200 };

  it('returns zero tilt at card center or for degenerate dimensions', () => {
    expect(computeTiltAngles(200, 200, rect)).toEqual({ rotateX: 0, rotateY: 0 });
    expect(computeTiltAngles(50, 50, { left: 0, top: 0, width: 0, height: 100 })).toEqual({
      rotateX: 0,
      rotateY: 0,
    });
  });

  it('clamps tilt angles to maxDegrees at and beyond card edges', () => {
    expect(computeTiltAngles(300, 100, rect, 8)).toEqual({ rotateX: 8, rotateY: 8 });
    expect(computeTiltAngles(0, 500, rect, 8)).toEqual({ rotateX: -8, rotateY: -8 });
  });
});

describe('initEffects', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    vi.restoreAllMocks();
  });

  it('immediately activates reveal elements when prefers-reduced-motion is enabled', () => {
    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    document.body.innerHTML = `
      <div class="cursor-dot"></div>
      <div class="cursor-outline"></div>
      <section class="reveal-up"></section>
    `;

    const controller = initEffects(document);
    expect(document.querySelector('.reveal-up')?.classList.contains('active')).toBe(true);
    expect(document.body.classList.contains('has-custom-cursor')).toBe(false);
    controller.destroy();
  });

  it('activates fine-pointer cursor, tilt cards, and IntersectionObserver reveals', () => {
    const observerState: { callback: IntersectionObserverCallback | null } = { callback: null };
    const unobserveSpy = vi.fn();
    const disconnectSpy = vi.fn();

    class MockIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        observerState.callback = cb;
      }
      observe = vi.fn();
      unobserve = unobserveSpy;
      disconnect = disconnectSpy;
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(16);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes('pointer: fine'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    document.body.innerHTML = `
      <div class="cursor-dot"></div>
      <div class="cursor-outline"></div>
      <div class="reveal-up"></div>
      <div class="tilt-card"><a href="#solucoes">Link</a></div>
    `;

    const card = document.querySelector<HTMLElement>('.tilt-card') as HTMLElement;
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const controller = initEffects(document);
    expect(document.body.classList.contains('has-custom-cursor')).toBe(true);

    // Trigger IntersectionObserver reveal
    const revealEl = document.querySelector<HTMLElement>('.reveal-up') as HTMLElement;
    observerState.callback?.(
      [{ isIntersecting: true, target: revealEl } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(revealEl.classList.contains('active')).toBe(true);
    expect(unobserveSpy).toHaveBeenCalledWith(revealEl);

    // Trigger cursor & tilt events (including subsequent move to exercise rAF loop & interactive hover)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 50 }));
    expect(document.body.classList.contains('cursor-visible')).toBe(true);

    const anchor = card.querySelector('a') as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 120, bubbles: true }));
    expect(document.body.classList.contains('cursor-hover')).toBe(true);

    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 50 }));
    expect(card.style.transform).toContain('rotateX');

    card.dispatchEvent(new MouseEvent('mouseleave'));
    expect(card.style.transform).toContain('rotateX(0deg)');

    document.dispatchEvent(new MouseEvent('mouseleave'));
    expect(document.body.classList.contains('cursor-visible')).toBe(false);

    controller.destroy();
    expect(disconnectSpy).toHaveBeenCalled();
    expect(document.body.classList.contains('has-custom-cursor')).toBe(false);
    vi.unstubAllGlobals();
  });

  it('falls back cleanly when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    document.body.innerHTML = '<div class="reveal-up"></div>';
    const controller = initEffects(document);
    controller.destroy();
    vi.unstubAllGlobals();
  });
});
