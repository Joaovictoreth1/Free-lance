import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadSiteConfig } from '../src/config/site';
import {
  formatBrazilianPhone,
  formatQuoteWhatsAppMessage,
  initQuoteForm,
  validateQuoteInput,
  type QuoteFormController,
} from '../src/modules/quoteForm';

describe('quote form helpers', () => {
  it('formats Brazilian landline and mobile numbers progressively', () => {
    expect(formatBrazilianPhone('11')).toBe('11');
    expect(formatBrazilianPhone('119818')).toBe('(11) 9818');
    expect(formatBrazilianPhone('1133445566')).toBe('(11) 3344-5566');
    expect(formatBrazilianPhone('11981846322')).toBe('(11) 98184-6322');
    expect(formatBrazilianPhone('11981846322999')).toBe('(11) 98184-6322');
  });

  it('validates required fields and rejects unknown enum values', () => {
    const invalid = validateQuoteInput({
      name: ' A ',
      phone: '12345',
      service: 'Injected Service',
      propertyType: 'Unknown',
      details: '',
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.name).toBeDefined();
    expect(invalid.errors.phone).toBeDefined();
    expect(invalid.errors.service).toBeDefined();
    expect(invalid.errors.propertyType).toBeDefined();
  });

  it('accepts valid quote payloads and builds a clean WhatsApp message', () => {
    const payload = {
      name: '  Maria   Oliveira ',
      phone: '11981846322',
      service: 'CFTV & Monitoramento',
      propertyType: 'Condomínio',
      details: ' 12 câmeras IP   com gravação 30 dias ',
    };

    const result = validateQuoteInput(payload);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});

    const msg = formatQuoteWhatsAppMessage(payload);
    expect(msg).toContain('- Nome: Maria Oliveira');
    expect(msg).toContain('- Telefone: (11) 98184-6322');
    expect(msg).toContain('- Serviço: CFTV & Monitoramento');
    expect(msg).toContain('- Tipo de imóvel: Condomínio');
    expect(msg).toContain('- Detalhes: 12 câmeras IP com gravação 30 dias');
  });
});

describe('quote form DOM integration', () => {
  let controller: QuoteFormController;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="quote-form" novalidate>
        <input id="quote-name" name="name" value="" />
        <p data-error-for="name" class="hidden"></p>
        <input id="quote-phone" name="phone" value="" />
        <p data-error-for="phone" class="hidden"></p>
        <select id="quote-service" name="service">
          <option value="">Selecione</option>
          <option value="CFTV & Monitoramento">CFTV & Monitoramento</option>
        </select>
        <p data-error-for="service" class="hidden"></p>
        <select id="quote-property" name="propertyType">
          <option value="">Selecione</option>
          <option value="Condomínio">Condomínio</option>
        </select>
        <p data-error-for="propertyType" class="hidden"></p>
        <textarea id="quote-details" name="details"></textarea>
        <p data-error-for="details" class="hidden"></p>
        <button type="submit">Enviar</button>
        <div id="quote-feedback" tabindex="-1" class="hidden">
          <a id="quote-whatsapp-handoff" href="#">Abrir</a>
        </div>
      </form>
    `;
    controller = initQuoteForm(loadSiteConfig({}), document);
  });

  afterEach(() => {
    controller.destroy();
    document.body.innerHTML = '';
  });

  it('shows accessible field errors and focuses the first invalid field on empty submit', () => {
    const form = document.getElementById('quote-form') as HTMLFormElement;
    const nameInput = document.getElementById('quote-name') as HTMLInputElement;
    const nameError = form.querySelector<HTMLElement>('[data-error-for="name"]');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(nameInput.getAttribute('aria-invalid')).toBe('true');
    expect(nameError?.classList.contains('hidden')).toBe(false);
    expect(nameError?.textContent).toContain('Informe seu nome');
    expect(document.activeElement).toBe(nameInput);
  });

  it('masks phone input on typing and reveals validated WhatsApp handoff on submit', () => {
    const form = document.getElementById('quote-form') as HTMLFormElement;
    const nameInput = document.getElementById('quote-name') as HTMLInputElement;
    const phoneInput = document.getElementById('quote-phone') as HTMLInputElement;
    const serviceSelect = document.getElementById('quote-service') as HTMLSelectElement;
    const propertySelect = document.getElementById('quote-property') as HTMLSelectElement;
    const feedback = document.getElementById('quote-feedback') as HTMLElement;
    const handoff = document.getElementById('quote-whatsapp-handoff') as HTMLAnchorElement;

    nameInput.value = 'João Silva';
    phoneInput.value = '11981846322';
    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(phoneInput.value).toBe('(11) 98184-6322');

    serviceSelect.value = 'CFTV & Monitoramento';
    propertySelect.value = 'Condomínio';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(feedback.classList.contains('hidden')).toBe(false);
    expect(handoff.href).toContain('https://wa.me/5511981846322?text=');
    expect(decodeURIComponent(handoff.href)).toContain('João Silva');
  });

  it('handles missing quote form gracefully and formats messages without optional details', () => {
    const msgNoDetails = formatQuoteWhatsAppMessage({
      name: 'Ana',
      phone: '11981846322',
      service: 'Alarmes Inteligentes',
      propertyType: 'Residência',
      details: '   ',
    });
    expect(msgNoDetails).not.toContain('Detalhes:');

    document.body.innerHTML = '';
    const emptyFormController = initQuoteForm(loadSiteConfig({}), document);
    emptyFormController.destroy();
  });
});
