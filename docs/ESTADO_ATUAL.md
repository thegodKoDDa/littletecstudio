# Estado atual — LittleTec Studio 0.3.0

Atualizado em **29/10/2026**.

## Produto ativo

O antigo repositório `littletec-web` passou a **littletecstudio**. Web e Desktop
Electron usam a mesma interface React e os mesmos serviços Python. A pasta
local é `littletec-studio`; o repositório Qt foi preservado como `littletec-og`,
com desenvolvimento encerrado.

- [Web online](https://thegodkodda.github.io/littletecstudio/): editor de perfis.
- [Releases](https://github.com/thegodKoDDa/littletecstudio/releases): Desktop
  Windows, editor Web portátil e verificadores SHA-256.
- Entrada desktop local: `LittleTec-Studio.exe`, na raiz, com pacote embutido e
  preparação automática para disco Windows, inclusive ao abrir pelo WSL.
- USB no Web local usa Python Windows e relay WSL. Pages/HTML não incluem a ponte.

## Confirmações e limites

O usuário confirmou mapeamento, cores e aplicação no Web 0.2.0 e no desktop Qt
1.1.0. O novo Desktop abriu para o usuário; o erro de fechar/reabrir foi corrigido.
Essas confirmações não são ensaios individuais de todos os efeitos, combinações
ou persistência após reconexão. Os relatórios da construção e do encerramento
estão no [histórico](historico/README.md).

A reorganização mantém protocolo, perfis v1/v2, dados opacos e reservados, limites
dos registros, fila serial e revisão do snapshot. Entrada MI_01 é passiva e
mantém ambiguidades. LED permanece sem readback conhecido.

Não iniciar leitura, escrita, monitoramento ou novos ensaios físicos por rotina.
As verificações da reorganização usam testes puros, simulação, build e smoke
sem USB. Resultados estão em [REORGANIZACAO_20261029.md](REORGANIZACAO_20261029.md).

## Organização

Código ativo em `src/`, `desktop/`, `bridge/` e `tools/`. O núcleo Python é
`bridge/core/littletec/`, sem dependência de fontes ou ambiente do OG.
A antiga cópia `littletec/web/` foi transferida integralmente, exceto caches
regeneráveis, para `.local/legado/web-interno-20261029/`. Capturas `.runtime` e
resultados dessa cópia foram preservados. O histórico original de Git permanece.

A biblioteca desktop conserva o caminho `%APPDATA%/LittleTec Desktop` e as
chaves anteriores para manter os rascunhos existentes. Esse nome interno é uma
compatibilidade de dados; o produto apresentado ao usuário é LittleTec Studio.

O OG conserva o Qt 1.1.0, executável e `_internal`, fontes, testes, originais e
capturas. O novo Studio não altera seu aplicativo. Ver [OG](https://github.com/thegodKoDDa/littletec-og).
