import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl, LEGAL_DOCUMENTS, loadSiteConfig } from '../src/config/site';

describe('site configuration', () => {
  it('returns safe defaults when env vars are missing', () => {
    const config = loadSiteConfig({});
    expect(config.companyName).toBe('Tecsafe Segurança Eletrônica');
    expect(config.whatsappNumber).toBe('5511981846322');
    expect(config.whatsappDisplay).toBe('(11) 98184-6322');
    expect(config.siteUrl).toBe('https://tecsafe.com.br');
    expect(config.instagramUrl).toBe('https://instagram.com/tecsafeseguranca');
  });

  it('accepts valid custom environment overrides and strips trailing slash', () => {
    const config = loadSiteConfig({
      VITE_SITE_URL: 'https://seguranca.example.com/',
      VITE_COMPANY_NAME: '  Tecsafe Pro  ',
      VITE_WHATSAPP_NUMBER: '+55 (11) 99999-0000',
      VITE_WHATSAPP_DISPLAY: '(11) 99999-0000',
      VITE_INSTAGRAM_URL: 'https://instagram.com/tecsafepro/',
      VITE_CONTACT_EMAIL: 'vendas@example.com',
    });

    expect(config.siteUrl).toBe('https://seguranca.example.com');
    expect(config.companyName).toBe('Tecsafe Pro');
    expect(config.whatsappNumber).toBe('5511999990000');
    expect(config.instagramUrl).toBe('https://instagram.com/tecsafepro');
    expect(config.contactEmail).toBe('vendas@example.com');
  });

  it('rejects unsafe URL schemes and malformed phone numbers', () => {
    const config = loadSiteConfig({
      VITE_SITE_URL: 'javascript:alert(1)',
      VITE_INSTAGRAM_URL: 'not-a-valid-url',
      VITE_WHATSAPP_NUMBER: '123',
    });

    expect(config.siteUrl).toBe('https://tecsafe.com.br');
    expect(config.instagramUrl).toBe('https://instagram.com/tecsafeseguranca');
    expect(config.whatsappNumber).toBe('5511981846322');
  });

  it('builds sanitized WhatsApp URLs with and without encoded messages', () => {
    expect(buildWhatsAppUrl('+55 (11) 98184-6322')).toBe('https://wa.me/5511981846322');
    expect(buildWhatsAppUrl('5511981846322', '   ')).toBe('https://wa.me/5511981846322');
    expect(buildWhatsAppUrl('5511981846322', 'Olá & orçamento #1')).toBe(
      'https://wa.me/5511981846322?text=Ol%C3%A1%20%26%20or%C3%A7amento%20%231',
    );
  });

  it('exposes LGPD privacy and terms legal documents', () => {
    expect(LEGAL_DOCUMENTS.privacy.title).toContain('LGPD');
    expect(LEGAL_DOCUMENTS.privacy.paragraphs.length).toBeGreaterThanOrEqual(3);
    expect(LEGAL_DOCUMENTS.terms.title).toContain('Termos');
    expect(LEGAL_DOCUMENTS.terms.paragraphs.length).toBeGreaterThanOrEqual(2);
  });
});
