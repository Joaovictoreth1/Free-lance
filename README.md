# Tecsafe — página de apresentação

Página estática de serviços de segurança eletrônica. Os links de WhatsApp apontam para o contato informado na própria página; fotos e vídeos que não estão no repositório são sinalizados como indisponíveis. A interface usa recursos externos.

## Rodar localmente

Na raiz do repositório, execute:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra <http://localhost:8000/>.

## Estrutura

`tecsafe_ultra_premium (3).html`: página original. `index.html`: entrada que preserva a URL anterior.

A CI valida o HTML e verifica arquivos e âncoras locais. Links e serviços externos não são consultados pela CI.
