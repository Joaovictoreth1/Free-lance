import { LEGAL_DOCUMENTS, type LegalDocKey } from '../config/site';

export interface LegalModalController {
  open: (docKey: LegalDocKey) => void;
  close: () => void;
  destroy: () => void;
}

function isLegalDocKey(value: string | undefined): value is LegalDocKey {
  return value === 'privacy' || value === 'terms';
}

export function initLegalModals(root: Document = document): LegalModalController {
  const dialog = root.getElementById('legal-modal') as HTMLDialogElement | null;
  const titleEl = root.getElementById('legal-modal-title');
  const updatedEl = root.getElementById('legal-modal-updated');
  const bodyEl = root.getElementById('legal-modal-body');
  const closeBtn = root.getElementById('legal-modal-close');
  const triggers = Array.from(root.querySelectorAll<HTMLElement>('[data-legal-modal]'));

  let lastTrigger: HTMLElement | null = null;

  const open = (docKey: LegalDocKey): void => {
    if (!dialog || !titleEl || !updatedEl || !bodyEl) {
      return;
    }
    const doc = LEGAL_DOCUMENTS[docKey];
    titleEl.textContent = doc.title;
    updatedEl.textContent = doc.updatedAt;
    bodyEl.replaceChildren(
      ...doc.paragraphs.map((text) => {
        const p = root.createElement('p');
        p.className = 'text-gray-300 text-sm leading-relaxed';
        p.textContent = text;
        return p;
      }),
    );

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.setAttribute('open', '');
    }
  };

  const close = (): void => {
    if (!dialog) {
      return;
    }
    if (typeof dialog.close === 'function' && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    lastTrigger?.focus();
  };

  const triggerHandlers: Array<{ el: HTMLElement; handler: (e: Event) => void }> = [];
  triggers.forEach((trigger) => {
    const handler = (event: Event): void => {
      event.preventDefault();
      const key = trigger.dataset.legalModal;
      if (isLegalDocKey(key)) {
        lastTrigger = trigger;
        open(key);
      }
    };
    trigger.addEventListener('click', handler);
    triggerHandlers.push({ el: trigger, handler });
  });

  const onCloseClick = (): void => {
    close();
  };

  const onDialogClick = (event: MouseEvent): void => {
    if (event.target === dialog) {
      close();
    }
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && dialog?.hasAttribute('open')) {
      event.preventDefault();
      close();
    }
  };

  closeBtn?.addEventListener('click', onCloseClick);
  dialog?.addEventListener('click', onDialogClick);
  root.addEventListener('keydown', onKeyDown);

  return {
    open,
    close,
    destroy: () => {
      triggerHandlers.forEach(({ el, handler }) => {
        el.removeEventListener('click', handler);
      });
      closeBtn?.removeEventListener('click', onCloseClick);
      dialog?.removeEventListener('click', onDialogClick);
      root.removeEventListener('keydown', onKeyDown);
    },
  };
}
