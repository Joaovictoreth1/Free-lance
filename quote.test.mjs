import assert from 'node:assert/strict';
import { test } from 'node:test';
import { quoteLink } from './quote.mjs';

test('creates a Portuguese draft with the selected service for the public business number', () => {
    const url = new URL(quoteLink('cameras'));
    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, '/5511981846322');
    assert.match(url.searchParams.get('text'), /^Olá, Tecsafe!.*câmeras.*orçamento\?$/);
});

test('uses a general template if the service is unknown', () => {
    const url = new URL(quoteLink('constructor'));
    assert.match(url.searchParams.get('text'), /orientação sobre um projeto/);
});
