<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LittleTec Studio — orientações vigentes em 29/10/2026

- Repositório ativo: `thegodKoDDa/littletecstudio`, pasta `littletec-studio`.
- Ler `RETOMAR.md`, `docs/ESTADO_ATUAL.md` e `docs/README.md`.
- Web e Desktop Electron compartilham a interface `src/` e o núcleo Python `bridge/core/`.
- `../littletec-og` é arquivo Qt 1.1.0 preservado, sem desenvolvimento. Não alterar seus binários.
- A cópia Web anterior e evidências estão em `.local/legado/web-interno-20261029/`.
- Executável público: `LittleTec-Studio.exe`, com pacote embutido; fontes e build em `desktop/` e `tools/`.
- Preservar protocolo, perfis v1/v2, opacos, reservados e evidências locais.
- Nenhum protocolo USB em React; I/O serial na ponte e revisão de snapshot entre sessões.
- LED não tem readback: distinguir seleção local e último envio. Monitor MI_01 é passivo e preserva ambiguidades.
- Python Windows próprio em `.venv-windows`, relay para Web no WSL; não depender do OG.
- Não iniciar USB ou monitor em build/smoke. Testes físicos são opt-in, sem repetições de rotina.
- Manter as chaves e caminhos de perfis anteriores; mudança de nome não pode apagar rascunhos.
- `.local/`, `.runtime/`, ambientes e capturas não são material público. Nunca publicar tokens.
- Conversar e documentar em português. Commits/publicações exigem pedido específico;
  a reorganização e publicação de 29/10/2026 foram explicitamente autorizadas pelo usuário.
- Não copiar mudanças manualmente entre duas interfaces. Gerar Web e Desktop da mesma base.

## Abertura e identidade — Studio 0.4.0

- `desktop/icon.png` é a fonte do símbolo; gerar variantes com `npm run icons:sync`.
- Desktop e Web local leem automaticamente ao abrir, por pedido do usuário;
  isso não autoriza aplicação de teclas/LED na inicialização.
- Preservar rascunhos e edições durante a leitura automática; manter botão manual.
- Smokes usam `--smoke`/`--offline` e testes simulam a conexão. Não fazer ensaios
  físicos por rotina nem iniciar o monitor em build/teste.
- O lançador portátil está em `desktop/launcher.cs`, com ZIP embutido e cache
  por versão. Não reintroduzir extração de Python/payload em cada abertura.
- Saídas separadas: `build/desktop-ui`, `build/web-portable`, `out` para Pages.
