# Encerramento da sessão — Studio 0.4.0

Conferido em **29/10/2026**, a pedido do usuário. O Studio permanece como projeto
ativo para futuras sessões; o OG continua arquivado e preservado.

## Release conferida

[LittleTec Studio v0.4.0](https://github.com/thegodKoDDa/littletecstudio/releases/tag/v0.4.0)
é a release pública atual, sem marca de prévia ou rascunho. Sua tag resolve para
`b4e0c87191ab0f2e9971734ec706758adca46a56`.

Os cinco arquivos locais foram comparados com os SHA-256 informados pelo GitHub:

| Arquivo | SHA-256 |
| --- | --- |
| LittleTec-Studio.exe | `845703399d4d62fba105a4f1a6414c747786abfc3b67810f4615679ccfada335` |
| LittleTec-Studio-0.4.0-win-x64.zip | `488d62b5d65b655c00d7f1089fa6789411594730a124476772e14473690dd567` |
| LittleTec-Studio-Web-0.4.0.zip | `022c898cb67bd2a36fddb22a05e969d6fb1c64edbdcbda95d5268bff1e71ae2f` |
| SHA256SUMS-desktop.txt | `1d50df604ccf75a382e47f8b4bc4c8ceb330a8c5899218246b0bb4f0a4dea6cb` |
| SHA256SUMS-web.txt | `0df021222fb6dc676b46382cf5daaaa549c7091b13308091743b0d775b349207` |

Ambos os ZIPs passaram na verificação de integridade e os manifestos conferem.
O `LittleTec-Studio.exe` na raiz é idêntico ao da release. Os sete tamanhos do
ícone oficial foram conferidos nos recursos dos três executáveis Windows.

## Verificações

- [CI da versão](https://github.com/thegodKoDDa/littletecstudio/actions/runs/40918014177): sucesso, incluindo build e smoke Windows sem USB.
- [Publicação Pages](https://github.com/thegodKoDDa/littletecstudio/actions/runs/40918014431): sucesso.
- [Publicação da release](https://github.com/thegodKoDDa/littletecstudio/actions/runs/40919007411): sucesso.
- Nova execução local: 20 testes TypeScript, 30 Python, 13 Web, quatro Electron e
  um do editor portátil passaram; tipagem TypeScript aprovada.
- Web publicado e downloads responderam HTTP 200; edição, logo e favicon do
  [Web online](https://thegodkodda.github.io/littletecstudio/) foram conferidos.
- OG arquivado, sem alterações locais; os 3.110 arquivos protegidos passaram
  na verificação de preservação. About mantém `1189:8842` nos dois repositórios,
  e os READMEs conservam a referência oficial do produto e os links entre projetos.

Não houve repetição de ensaios físicos de escrita, cores ou persistência.
Os limites de USB, LED e compatibilidade continuam descritos no estado atual.
Evidências locais permanecem em `.runtime/`, fora do Git.

## Localhost e retomada

A porta 3000 estava atendendo outro projeto, Minecoord. Ele foi preservado.
Os testes Web agora iniciam seu próprio servidor na porta 4317, sem reaproveitar
um servidor existente; `LITTLETEC_TEST_PORT` permite escolher outra porta.
Os servidores temporários dos testes são encerrados ao terminar.

Para retomar o Studio, usar `LittleTec-Studio.exe` na raiz ou `Abrir-Web.cmd`.
No WSL, se a porta 3000 estiver ocupada:

```sh
cd /home/gabriel/dev/littletec-studio
PORT=3001 npm run dev
```

Abrir `http://localhost:3001`. O Web local inclui a ponte Windows/WSL; Pages e
o HTML portátil oferecem o editor sem incluir essa ponte.

Este encerramento acrescenta documentação e isolamento dos testes. Não altera
o produto publicado, a tag nem os arquivos da release 0.4.0.
