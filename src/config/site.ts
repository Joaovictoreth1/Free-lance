export interface SiteConfig {
  readonly siteUrl: string;
  readonly companyName: string;
  readonly whatsappNumber: string;
  readonly whatsappDisplay: string;
  readonly instagramUrl: string;
  readonly contactEmail: string;
}

export interface LegalDocument {
  readonly title: string;
  readonly updatedAt: string;
  readonly paragraphs: readonly string[];
}

export type LegalDocKey = 'privacy' | 'terms';

const DEFAULT_CONFIG: SiteConfig = {
  siteUrl: 'https://tecsafe.com.br',
  companyName: 'Tecsafe Segurança Eletrônica',
  whatsappNumber: '5511981846322',
  whatsappDisplay: '(11) 98184-6322',
  instagramUrl: 'https://instagram.com/tecsafeseguranca',
  contactEmail: 'contato@tecsafe.com.br',
};

function sanitizePhoneDigits(raw: string | undefined, fallback: string): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 ? digits : fallback;
}

function sanitizeHttpUrl(raw: string | undefined, fallback: string): string {
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString().replace(/\/$/, '');
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function loadSiteConfig(
  env: Record<string, string | undefined> = import.meta.env,
): SiteConfig {
  const companyName = env.VITE_COMPANY_NAME?.trim() || DEFAULT_CONFIG.companyName;
  const whatsappDisplay = env.VITE_WHATSAPP_DISPLAY?.trim() || DEFAULT_CONFIG.whatsappDisplay;
  const contactEmail = env.VITE_CONTACT_EMAIL?.trim() || DEFAULT_CONFIG.contactEmail;

  return {
    siteUrl: sanitizeHttpUrl(env.VITE_SITE_URL, DEFAULT_CONFIG.siteUrl),
    companyName,
    whatsappNumber: sanitizePhoneDigits(env.VITE_WHATSAPP_NUMBER, DEFAULT_CONFIG.whatsappNumber),
    whatsappDisplay,
    instagramUrl: sanitizeHttpUrl(env.VITE_INSTAGRAM_URL, DEFAULT_CONFIG.instagramUrl),
    contactEmail,
  };
}

export function buildWhatsAppUrl(phoneNumber: string, message?: string): string {
  const digits = sanitizePhoneDigits(phoneNumber, DEFAULT_CONFIG.whatsappNumber);
  const base = `https://wa.me/${digits}`;
  const trimmed = message?.trim();
  if (!trimmed) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(trimmed)}`;
}

export const LEGAL_DOCUMENTS: Readonly<Record<LegalDocKey, LegalDocument>> = {
  privacy: {
    title: 'Política de Privacidade (LGPD)',
    updatedAt: 'Atualizado em 2026',
    paragraphs: [
      'A Tecsafe Segurança Eletrônica trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).',
      'As informações preenchidas no formulário de orçamento (nome, telefone, tipo de imóvel e serviço desejado) são utilizadas exclusivamente para atendimento comercial e elaboração de proposta técnica.',
      'Nenhum dado do formulário é armazenado em servidores de terceiros ou compartilhado com anunciantes: o envio redireciona diretamente para o canal oficial de atendimento via WhatsApp.',
      'Você pode solicitar confirmação, correção ou exclusão de seus dados a qualquer momento pelo canal oficial de contato informado no rodapé.',
    ],
  },
  terms: {
    title: 'Termos de Serviço',
    updatedAt: 'Atualizado em 2026',
    paragraphs: [
      'Este site apresenta o portfólio institucional e os canais oficiais de orçamento da Tecsafe Segurança Eletrônica.',
      'Orçamentos, prazos de execução, especificações de equipamentos e garantias contratuais são formalizados exclusivamente mediante vistoria técnica e proposta comercial assinada.',
      'Todo o conteúdo visual, textos e marcas exibidos nesta página pertencem à Tecsafe Segurança Eletrônica e não podem ser reproduzidos sem autorização prévia.',
    ],
  },
};
