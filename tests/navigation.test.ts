import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initNavigation, type NavigationController } from '../src/modules/navigation';

describe('navigation controller', () => {
  let controller: NavigationController;

  beforeEach(() => {
    document.body.innerHTML = `
      <nav id="navbar">
        <button id="mobile-menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu">
          <svg id="mobile-menu-icon-open"></svg>
          <svg id="mobile-menu-icon-close" class="hidden"></svg>
        </button>
        <div id="mobile-menu" hidden class="hidden">
          <a href="#solucoes">Soluções</a>
          <a href="#orcamento">Orçamento</a>
        </div>
      </nav>
    `;
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    controller = initNavigation(document);
  });

  afterEach(() => {
    controller.destroy();
    document.body.innerHTML = '';
  });

  it('toggles mobile drawer state, icons, ARIA attributes, and body scroll lock', () => {
    const btn = document.getElementById('mobile-menu-btn') as HTMLButtonElement;
    const menu = document.getElementById('mobile-menu') as HTMLElement;
    const iconOpen = document.getElementById('mobile-menu-icon-open') as HTMLElement;
    const iconClose = document.getElementById('mobile-menu-icon-close') as HTMLElement;

    expect(controller.isOpen()).toBe(false);
    btn.click();

    expect(controller.isOpen()).toBe(true);
    expect(menu.hidden).toBe(false);
    expect(menu.classList.contains('hidden')).toBe(false);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(iconOpen.classList.contains('hidden')).toBe(true);
    expect(iconClose.classList.contains('hidden')).toBe(false);
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    btn.click();
    expect(controller.isOpen()).toBe(false);
    expect(menu.hidden).toBe(true);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('closes the mobile menu when Escape is pressed and restores focus to toggle button', () => {
    const btn = document.getElementById('mobile-menu-btn') as HTMLButtonElement;
    controller.openMobileMenu();
    expect(controller.isOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(controller.isOpen()).toBe(false);
    expect(document.activeElement).toBe(btn);
  });

  it('closes the mobile menu when a drawer navigation link is clicked', () => {
    controller.openMobileMenu();
    const link = document.querySelector<HTMLAnchorElement>('#mobile-menu a');
    link?.click();

    expect(controller.isOpen()).toBe(false);
  });

  it('applies sticky shadow classes when window scrolls past threshold', () => {
    const navbar = document.getElementById('navbar') as HTMLElement;
    expect(navbar.classList.contains('shadow-lg')).toBe(false);

    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(navbar.classList.contains('shadow-lg')).toBe(true);

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(navbar.classList.contains('shadow-lg')).toBe(false);
  });

  it('handles close when already closed and missing DOM elements gracefully', () => {
    controller.closeMobileMenu();
    expect(controller.isOpen()).toBe(false);

    document.body.innerHTML = '';
    const bareController = initNavigation(document);
    bareController.openMobileMenu();
    bareController.closeMobileMenu();
    window.dispatchEvent(new Event('scroll'));
    bareController.destroy();
  });
});
