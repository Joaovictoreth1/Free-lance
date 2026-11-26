import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initLegalModals, type LegalModalController } from '../src/modules/modals';

describe('legal modal controller', () => {
  let controller: LegalModalController;

  beforeEach(() => {
    document.body.innerHTML = `
      <button type="button" id="btn-privacy" data-legal-modal="privacy">Privacidade</button>
      <button type="button" id="btn-terms" data-legal-modal="terms">Termos</button>
      <dialog id="legal-modal">
        <h2 id="legal-modal-title"></h2>
        <p id="legal-modal-updated"></p>
        <button type="button" id="legal-modal-close">Fechar</button>
        <div id="legal-modal-body"></div>
      </dialog>
    `;
    controller = initLegalModals(document);
  });

  afterEach(() => {
    controller.destroy();
    document.body.innerHTML = '';
  });

  it('opens the LGPD privacy modal with rendered paragraphs and closes via button', () => {
    const privacyBtn = document.getElementById('btn-privacy') as HTMLButtonElement;
    const dialog = document.getElementById('legal-modal') as HTMLDialogElement;
    const title = document.getElementById('legal-modal-title') as HTMLElement;
    const body = document.getElementById('legal-modal-body') as HTMLElement;
    const closeBtn = document.getElementById('legal-modal-close') as HTMLButtonElement;

    privacyBtn.click();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(title.textContent).toContain('LGPD');
    expect(body.querySelectorAll('p').length).toBeGreaterThanOrEqual(3);

    closeBtn.click();
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(privacyBtn);
  });

  it('opens terms modal and closes on Escape key and backdrop click', () => {
    const termsBtn = document.getElementById('btn-terms') as HTMLButtonElement;
    const dialog = document.getElementById('legal-modal') as HTMLDialogElement;
    const title = document.getElementById('legal-modal-title') as HTMLElement;

    termsBtn.click();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(title.textContent).toContain('Termos');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dialog.hasAttribute('open')).toBe(false);

    termsBtn.click();
    expect(dialog.hasAttribute('open')).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('uses native showModal and close when available and handles missing dialog gracefully', () => {
    const dialog = document.getElementById('legal-modal') as HTMLDialogElement;
    let isOpen = false;
    dialog.showModal = () => {
      isOpen = true;
      dialog.setAttribute('open', '');
    };
    dialog.close = () => {
      isOpen = false;
      dialog.removeAttribute('open');
    };
    Object.defineProperty(dialog, 'open', {
      get: () => isOpen,
      configurable: true,
    });

    controller.open('privacy');
    expect(isOpen).toBe(true);
    controller.close();
    expect(isOpen).toBe(false);

    document.body.innerHTML = '';
    const emptyController = initLegalModals(document);
    emptyController.open('terms');
    emptyController.close();
    emptyController.destroy();
  });
});
