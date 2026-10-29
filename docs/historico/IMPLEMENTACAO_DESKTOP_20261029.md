# Novo Desktop — implementação local de 29/10/2026

O desenvolvimento ativo passa ao repositório Web por pedido do usuário.
Interface React, estilos, funcionalidades e serviços Python são compartilhados;
Electron acrescenta a janela Windows e a integração de arquivos. O Qt anterior
e o original permanecem no repositório `littletec`, sem alterações nesta sessão.

## Entrega local

- Identificação do novo desktop: `0.3.0-dev.1`, sem release publicada.
- Executável: `release/win-unpacked/LittleTec-Desktop.exe`.
- Pacote: `release/LittleTec-Desktop-0.3.0-dev.1-win-x64.zip` (cerca de 155 MiB).
- SHA-256: `96521b9ecb36c30c48a8c183c95a42647434814d97b3b8cbf425c0a890d04a92`.
- Entrada no checkout: `Abrir-Desktop.cmd`. No WSL/UNC, prepara cópia local
  Windows por hash do build; não reduz o sandbox Chromium.
- Guia e arquitetura: [DESKTOP.md](../DESKTOP.md).

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Testes TypeScript | 18 passaram |
| Testes Python da ponte | 30 passaram |
| Tipagem TypeScript | Sem erros |
| Playwright Web | 9 passaram, com transporte simulado quando necessário |
| Playwright Electron | 1 passou: edição, undo/redo, persistência, navegação, biblioteca, exportação/importação JSON, IPC e isolamento |
| Build GitHub Pages | Concluído localmente; nenhuma publicação |
| Build desktop / ponte Windows / ZIP | Concluídos |
| Smoke do executável Windows real | Interface e ponte carregadas, sem Node no renderer e sem conexão ao teclado |
| ZIP e SHA-256 | Conteúdo e hash conferidos |
| Preservação anterior | 3.141 arquivos íntegros, incluindo original e distribuição Qt; árvore Git antiga limpa |

O teste Windows foi executado com `tools/smoke-windows.ps1` e o lançador real,
a partir de uma cópia local Windows da distribuição do checkout WSL.
O relatório e a captura ficam em `.runtime/windows-smoke.json` e
`.runtime/windows-smoke.json.png`, fora do Git. O carregamento direto pelo UNC
falhou ao iniciar subprocessos gráficos; o lançamento local resolveu o caso
sem desativar o sandbox.

Não foram feitas leitura/escrita USB, aplicação de LED, monitoramento físico,
mudança de firmware ou driver. A confirmação anterior de funcionamento físico
do Web e Qt permanece válida para aquelas versões; não é laudo deste novo
executável. A integração usa os mesmos serviços, preservando revisão do
snapshot, serialização, cópia/releitura, tentativa de retorno e dados opacos.

Nenhum commit, push, tag, release ou publicação foi realizado. O workflow de
CI foi ampliado para verificar as duas entregas, mas não foi executado no
GitHub nesta sessão. Executáveis não têm atualização automática nem assinatura
Authenticode nesta entrega inicial.
