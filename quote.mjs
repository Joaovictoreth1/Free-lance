const messages = {
    cameras: 'Gostaria de ajuda para planejar um sistema de câmeras (CFTV).',
    alarms: 'Gostaria de ajuda para planejar um sistema de alarme.',
    access: 'Gostaria de ajuda para planejar o controle de acesso.',
    gates: 'Gostaria de orientação sobre interfone ou portão.',
};

export function quoteLink(service) {
    const subject = Object.hasOwn(messages, service) ? messages[service] : 'Gostaria de orientação sobre um projeto.';
    const url = new URL('https://wa.me/5511981846322');
    url.searchParams.set('text', `Olá, Tecsafe! ${subject} Quais informações preciso enviar para solicitar um orçamento?`);
    return url.href;
}

if (typeof document !== 'undefined') {
    const form = document.getElementById('quote-form');
    const select = document.getElementById('quote-service');
    const link = document.getElementById('quote-link');
    function refresh() {
        link.href = quoteLink(select.value);
    }
    select.addEventListener('change', refresh);
    form.addEventListener('submit', event => event.preventDefault());
    refresh();
    form.hidden = false;
}
