# Reorganização — LittleTec Studio e OG

Executada por pedido do usuário em **29/10/2026**.

## Destinos

| Antes | Depois | Papel |
| --- | --- | --- |
| Pasta `littletec/`, repo `thegodKoDDa/littletec` | Pasta `littletec-og/`, repo [littletec-og](https://github.com/thegodKoDDa/littletec-og) | Arquivo do desktop Qt 1.1.0, sem desenvolvimento futuro |
| Pasta `littletec-web/`, repo `thegodKoDDa/littletec-web` | Pasta `littletec-studio/`, repo [littletecstudio](https://github.com/thegodKoDDa/littletecstudio) | Produto ativo Web + Desktop |
| Cópia `littletec/web/` | `.local/legado/web-interno-20261029/` no Studio | Histórico local, com fontes, capturas e resultados |

Os dois históricos Git e as releases anteriores foram mantidos. A renomeação
não cria um repositório novo sem histórico. O OG recebe documentação final e
fica arquivado; funcionalidades futuras entram no Studio.

## Preservação e limpeza

A cópia Web foi inventariada antes da transferência: **127 arquivos**, excluindo
caches de dependências/build. A comparação posterior confirmou zero ausentes e
zero alterações entre os arquivos preservados. O `tsconfig.tsbuildinfo` é cache
regenerável e foi removido, assim como `node_modules`, `.next` e `__pycache__`
da cópia histórica. Seus `.runtime`, capturas, testes, resultados e arquivos de
fonte foram transferidos. Tokens permanecem somente locais e ignorados no Git.

O manifesto local completo e a lista de limpeza estão em
`.runtime/reorganizacao-20261029/`. O histórico experimental de releases e o ZIP
Web 0.2 ficam em `.local/releases/`, sem duplicar entregas antigas na raiz.
`build/`, `release/`, ambientes e dependências são gerados, não versionados.

**3.110 arquivos de produto protegidos do OG** foram conferidos contra os hashes
anteriores: fontes, ferramentas, testes, originais e distribuição Qt. README e
orientações de continuidade foram atualizados conforme o pedido; o aplicativo
antigo não foi recompilado nem alterado. Os 70 originais também foram conferidos
pelo manifesto próprio. O README anterior do OG continua disponível em seus docs.

## Base e compatibilidade

- Uma interface em `src/`; Electron só integra janela/arquivos/transporte.
- Núcleo e auxiliares Windows no próprio `bridge/core/`, sem depender do OG.
- Identidade pública: **LittleTec Studio 0.3.0**, Web e Desktop na mesma release.
- Executável recomendado: `LittleTec-Studio.exe`, com pacote embutido, inclusive
  para abrir diretamente pelo WSL. O executável interno é artefato de distribuição.
- Perfis e rascunhos mantêm chaves anteriores e o diretório de dados
  `%APPDATA%/LittleTec Desktop` para preservar o uso já iniciado.
- Fontes visuais são empacotadas com caminhos compatíveis com a nova URL Pages.
- O editor portátil usa uma entrada mínima que renderiza os mesmos componentes
  React, sem servidor Next; `index.html` é testado por `file://`.

## Verificações locais

| Verificação | Resultado |
| --- | --- |
| Testes OG | 79 passaram |
| Originais do fabricante | 70 íntegros |
| Testes TypeScript Studio | 18 passaram |
| Testes Python Studio | 30 passaram |
| Tipagem Studio | Sem erros |
| Playwright Web | 9 passaram |
| Playwright Electron | 2 passaram, incluindo fechar/reabrir |
| Playwright editor portátil | 1 passou por `file://`, editando e desfazendo |
| Build Pages | Concluído com `/littletecstudio` |
| Pacotes Desktop e editor portátil | Gerados, com SHA-256 |
| Smoke Windows | Executável único abriu e fechou sem acesso USB |

Não foram repetidos ensaios físicos, iniciado monitoramento, alterado firmware
ou trocado driver. O uso confirmado das versões anteriores não é um laudo de
cada funcionalidade do pacote novo. CI e entregas publicadas podem ser
consultadas nos [Actions](https://github.com/thegodKoDDa/littletecstudio/actions)
e nas [Releases](https://github.com/thegodKoDDa/littletecstudio/releases).
