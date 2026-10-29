<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LittleTec Web — orientações vigentes em 29/10/2026

- Web 0.2.0 e Studio desktop 1.1.0 funcionam em uso real para mapeamento,
  cores e aplicação, conforme o usuário. Não retomar a integração como pendente.
- Começar por `docs/ESTADO_ATUAL.md` e `docs/README.md`.
- USB usa ponte Python Windows; Pages/HTML estático oferecem edição de perfis.
- Preservar protocolo, perfis v1/v2, opacos, reservados e evidências locais.
- Manter I/O na ponte, operações seriais e revisão de snapshot entre abas.
- LED não tem readback; distinguir último envio de seleção local.
- Monitor MI_01 é passivo e associa eventos ao snapshot; preservar ambiguidades.
- Não repetir ensaios físicos nem iniciar monitor/USB em testes ou build por rotina.
- Cópia interna e repositório Web independente não se sincronizam automaticamente.
- Documentar em português. Não criar commits, releases ou publicar sem pedido específico.
