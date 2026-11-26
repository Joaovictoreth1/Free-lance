import './styles/main.css';
import { buildWhatsAppUrl, loadSiteConfig } from './config/site';
import { initEffects } from './modules/effects';
import { initLegalModals } from './modules/modals';
import { initNavigation } from './modules/navigation';
import { initQuoteForm } from './modules/quoteForm';

function hydrateDynamicLinks(): void {
  const config = loadSiteConfig();
  const defaultMessage = 'Olá, Tecsafe! Gostaria de solicitar um orçamento de segurança eletrônica.';
  const whatsappHref = buildWhatsAppUrl(config.whatsappNumber, defaultMessage);

  document.querySelectorAll<HTMLAnchorElement>('[data-whatsapp-link]').forEach((anchor) => {
    anchor.href = whatsappHref;
  });

  document.querySelectorAll<HTMLElement>('[data-whatsapp-display]').forEach((el) => {
    el.textContent = config.whatsappDisplay;
  });

  document.querySelectorAll<HTMLAnchorElement>('[data-instagram-link]').forEach((anchor) => {
    anchor.href = config.instagramUrl;
  });

  const yearEl = document.getElementById('copyright-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  initNavigation();
  initEffects();
  initQuoteForm(config);
  initLegalModals();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateDynamicLinks);
} else {
  hydrateDynamicLinks();
}
