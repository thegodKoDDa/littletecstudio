# Correção do encerramento — 29/10/2026

Novo pacote local: **0.3.0-dev.2**, sem publicação.

Ao fechar pelo X, `BrowserWindow` já estava destruída quando
`window-all-closed` chamava `app.quit`. O handler `before-quit` tentava
executar `hide()` nessa janela. A exceção interrompia a limpeza da ponte e
deixava o processo principal segurando o bloqueio de instância única. Uma
segunda tentativa de abrir também tentava restaurar a janela destruída.

A janela agora é descartada na referência ao receber `closed`, e as ações de
ocultar, restaurar e focar conferem se ela ainda existe. O encerramento da ponte
continua aguardando as operações aceitas; não foram alterados protocolo ou I/O.
O processo antigo sem janela foi encerrado para liberar a abertura, sem remover
perfis, biblioteca ou capturas.

Verificações desta correção:

- Falha anterior reproduzida ao fechar a janela: o processo não terminava.
- Dois testes Playwright Electron passaram, incluindo dois ciclos de fechar a
  janela e reabrir com o mesmo perfil, além dos fluxos de edição e arquivos.
- Tipagem TypeScript sem erros.
- Pacote Windows corrigido executou dois ciclos com `tools/smoke-windows.ps1
  -CloseWindow`, passando pelo fechamento de `BrowserWindow` em vez de apenas
  `app.quit`. Ambos encerraram com código zero.
- Após os ciclos, nenhum processo do novo desktop ou de sua ponte permaneceu
  em execução.
- 3.141 arquivos do projeto anterior conferidos íntegros.

Nenhum acesso físico ao teclado foi realizado. O lançador
`Abrir-Desktop.cmd` escolhe a cópia local Windows correspondente ao build novo.
O ZIP anterior permanece como artefato histórico local; o pacote atual é
`release/LittleTec-Desktop-0.3.0-dev.2-win-x64.zip`.

## Entrada direta por executável

Foi acrescentado `LittleTec-Desktop.exe` na raiz, com o ZIP da dev.2 embutido.
Esse arquivo prepara o pacote em disco local e inicia o Electron; pode ser
aberto diretamente da pasta WSL, sem `.cmd`, Python ou arquivos acompanhantes.
O `.exe` interno do Electron continua sendo um artefato para empacotamento.

O executável único foi testado pelo caminho UNC real em dois ciclos de abrir
e fechar a janela. Ambos terminaram com sucesso. Em seguida foi aberto no modo
normal pelo mesmo arquivo da raiz, com a janela confirmada no Windows.
Os perfis e os 3.141 arquivos preservados do projeto anterior permaneceram
intactos. O SHA-256 da entrada única está em `release/SHA256SUMS-desktop.txt`.
