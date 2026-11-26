import { buildWhatsAppUrl, type SiteConfig } from '../config/site';

export interface QuoteFormInput {
  readonly name: string;
  readonly phone: string;
  readonly service: string;
  readonly propertyType: string;
  readonly details: string;
}

export interface QuoteValidationResult {
  readonly valid: boolean;
  readonly errors: Partial<Record<keyof QuoteFormInput, string>>;
}

const ALLOWED_SERVICES = new Set([
  'CFTV & Monitoramento',
  'Alarmes Inteligentes',
  'Controle de Acesso Facial',
  'Interfonia & Portões',
  'Infraestrutura & Contrato',
]);

const ALLOWED_PROPERTIES = new Set([
  'Condomínio',
  'Empresa / Comércio',
  'Residência',
  'Indústria / Galpão',
]);

export function formatBrazilianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function validateQuoteInput(input: QuoteFormInput): QuoteValidationResult {
  const errors: Partial<Record<keyof QuoteFormInput, string>> = {};
  const name = sanitizeText(input.name, 80);
  const phoneDigits = input.phone.replace(/\D/g, '');
  const details = sanitizeText(input.details, 500);

  if (name.length < 2) {
    errors.name = 'Informe seu nome completo (mínimo 2 caracteres).';
  }

  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    errors.phone = 'Informe um telefone/WhatsApp com DDD (10 ou 11 dígitos).';
  }

  if (!ALLOWED_SERVICES.has(input.service)) {
    errors.service = 'Selecione um serviço válido.';
  }

  if (!ALLOWED_PROPERTIES.has(input.propertyType)) {
    errors.propertyType = 'Selecione o tipo de imóvel.';
  }

  if (details.length > 500) {
    errors.details = 'A descrição deve ter no máximo 500 caracteres.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatQuoteWhatsAppMessage(input: QuoteFormInput): string {
  const name = sanitizeText(input.name, 80);
  const phone = formatBrazilianPhone(input.phone);
  const details = sanitizeText(input.details, 500);

  const lines = [
    'Olá, Tecsafe! Gostaria de solicitar um orçamento:',
    `- Nome: ${name}`,
    `- Telefone: ${phone}`,
    `- Serviço: ${input.service}`,
    `- Tipo de imóvel: ${input.propertyType}`,
  ];

  if (details) {
    lines.push(`- Detalhes: ${details}`);
  }

  return lines.join('\n');
}

export interface QuoteFormController {
  destroy: () => void;
}

export function initQuoteForm(
  config: SiteConfig,
  root: Document = document,
): QuoteFormController {
  const form = root.getElementById('quote-form') as HTMLFormElement | null;
  if (!form) {
    return { destroy: () => undefined };
  }

  const nameInput = form.querySelector<HTMLInputElement>('#quote-name');
  const phoneInput = form.querySelector<HTMLInputElement>('#quote-phone');
  const serviceSelect = form.querySelector<HTMLSelectElement>('#quote-service');
  const propertySelect = form.querySelector<HTMLSelectElement>('#quote-property');
  const detailsInput = form.querySelector<HTMLTextAreaElement>('#quote-details');
  const feedbackEl = root.getElementById('quote-feedback');
  const whatsappLink = root.getElementById('quote-whatsapp-handoff') as HTMLAnchorElement | null;

  const setFieldError = (field: keyof QuoteFormInput, message: string | undefined): void => {
    const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    const inputEl = form.querySelector<HTMLElement>(`[name="${field}"]`);
    if (errorEl) {
      errorEl.textContent = message ?? '';
      errorEl.classList.toggle('hidden', !message);
    }
    if (inputEl) {
      inputEl.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  };

  const clearErrors = (): void => {
    (['name', 'phone', 'service', 'propertyType', 'details'] as const).forEach((field) => {
      setFieldError(field, undefined);
    });
  };

  const onPhoneInput = (): void => {
    if (!phoneInput) {
      return;
    }
    phoneInput.value = formatBrazilianPhone(phoneInput.value);
  };

  const onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    clearErrors();

    const input: QuoteFormInput = {
      name: nameInput?.value ?? '',
      phone: phoneInput?.value ?? '',
      service: serviceSelect?.value ?? '',
      propertyType: propertySelect?.value ?? '',
      details: detailsInput?.value ?? '',
    };

    const validation = validateQuoteInput(input);
    if (!validation.valid) {
      (Object.entries(validation.errors) as Array<[keyof QuoteFormInput, string]>).forEach(
        ([field, message]) => {
          setFieldError(field, message);
        },
      );
      if (feedbackEl) {
        feedbackEl.classList.add('hidden');
      }
      const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    const message = formatQuoteWhatsAppMessage(input);
    const url = buildWhatsAppUrl(config.whatsappNumber, message);

    if (whatsappLink) {
      whatsappLink.href = url;
    }
    if (feedbackEl) {
      feedbackEl.classList.remove('hidden');
      feedbackEl.focus();
    }
  };

  phoneInput?.addEventListener('input', onPhoneInput);
  form.addEventListener('submit', onSubmit);

  return {
    destroy: () => {
      phoneInput?.removeEventListener('input', onPhoneInput);
      form.removeEventListener('submit', onSubmit);
    },
  };
}
