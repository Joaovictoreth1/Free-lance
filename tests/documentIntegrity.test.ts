import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..');
const htmlSource = readFileSync(path.join(repoRoot, 'index.html'), 'utf-8');

describe('index.html security, accessibility, and asset integrity', () => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlSource, 'text/html');

  it('has no development CDN scripts or inline executable scripts', () => {
    const scripts = Array.from(doc.querySelectorAll('script'));
    for (const script of scripts) {
      const src = script.getAttribute('src') ?? '';
      expect(src).not.toContain('cdn.tailwindcss.com');
      if (!src) {
        expect(script.getAttribute('type')).toBe('application/ld+json');
      }
    }
  });

  it('enforces rel="noopener noreferrer" on every target="_blank" link', () => {
    const externalLinks = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'));
    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      const relTokens = (link.getAttribute('rel') ?? '').split(/\s+/);
      expect(relTokens).toContain('noopener');
      expect(relTokens).toContain('noreferrer');
    }
  });

  it('contains zero dead placeholder href="#" links', () => {
    const anchors = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]'));
    for (const anchor of anchors) {
      expect(anchor.getAttribute('href')?.trim()).not.toBe('#');
    }
  });

  it('resolves every local image asset in public/', () => {
    const images = Array.from(doc.querySelectorAll<HTMLImageElement>('img[src]'));
    expect(images.length).toBeGreaterThanOrEqual(4);
    for (const img of images) {
      const src = img.getAttribute('src') ?? '';
      expect(img.getAttribute('alt')?.trim().length).toBeGreaterThan(5);
      if (src.startsWith('./')) {
        const assetPath = path.join(repoRoot, 'public', src.slice(2));
        expect(existsSync(assetPath), `Missing public asset: ${src}`).toBe(true);
      }
    }
  });

  it('defines semantic landmarks, single h1, skip link, and valid JSON-LD', () => {
    expect(doc.querySelector('header')).not.toBeNull();
    expect(doc.querySelector('nav')).not.toBeNull();
    expect(doc.querySelector('main#conteudo-principal')).not.toBeNull();
    expect(doc.querySelector('footer')).not.toBeNull();
    expect(doc.querySelectorAll('h1')).toHaveLength(1);

    const skipLink = doc.querySelector<HTMLAnchorElement>('a.skip-link');
    expect(skipLink?.getAttribute('href')).toBe('#conteudo-principal');

    const jsonLd = doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    const parsed = JSON.parse(jsonLd) as { '@type'?: string; name?: string };
    expect(parsed['@type']).toBe('LocalBusiness');
    expect(parsed.name).toContain('Tecsafe');
  });
});
