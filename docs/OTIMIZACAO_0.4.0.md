# Ícone, abertura e conexão automática — 0.4.0

Alterações em Web e Desktop do LittleTec Studio, em 29/10/2026. O OG não foi alterado.

## Um símbolo

A fonte é `desktop/icon.png`. O build deriva um ICO com sete tamanhos (16, 24,
32, 48, 64, 128 e 256), favicon, ícone do navegador e Apple. A marca na interface
importa o mesmo PNG. O ICO é incorporado ao lançador portátil, ao executável
Electron e à ponte Python. A verificação lê os recursos PE dos executáveis
prontos e compara cada imagem aos bytes gerados do PNG oficial.

## Abertura

A entrada anterior usava PyInstaller `onefile`, que extraía o ambiente Python
com um ZIP grande a cada abertura, mesmo com o aplicativo já preparado.
O novo lançador, escrito em C# e compilado com o .NET Framework do Windows,
consulta metadados pequenos e abre o pacote já preparado. O ZIP é recurso do
próprio executável e só é lido/validado/extraído quando necessário. Um mutex
coordena duas primeiras aberturas simultâneas; a preparação mostra progresso.
O sandbox do Electron é mantido.

A interface também passou a carregar sem aguardar a ponte Python. O Desktop
usa um cliente React direto dos componentes comuns, dispensando o runtime Next
nessa entrega. Web/Pages continuam Next; o editor portátil usa os mesmos
componentes. As três saídas de build são independentes. Revisão de alterações
e serialização de perfil agora são memorizadas para evitar recálculo a cada
atualização de entrada ao vivo.

### Medição local

Mesmo computador Windows, entrada pelo caminho WSL, com conexão automática e
monitor desabilitados no smoke. O tempo mede abrir, carregar a interface,
consultar `status`, capturar a janela e fechar; inclui uma espera de 500 ms do
smoke. Não representa tempo puro até o primeiro pixel nem o tempo de leitura USB.

| Execução | Tempos do ciclo | Mediana |
| --- | --- | --- |
| Entrada anterior, pacote já preparado | 5,948 / 6,058 / 6,414 s | 6,058 s |
| Lançador novo, mesmo pacote interno anterior | 1,224 / 1,233 / 1,202 s | 1,224 s |
| Pacote final 0.4.0 | 6,603 s na preparação inicial; 1,132 / 1,151 s nas seguintes | 1,151 s |

A primeira abertura de uma versão ainda precisa preparar seus arquivos. Nas
aberturas seguintes medidas, o lançador consumiu 13–14 ms até iniciar o Electron;
o primeiro paint registrado no processo Electron ocorreu em 285–330 ms. Os
valores são observações desta máquina, não garantia para outros computadores.
Relatórios e capturas permanecem em `.runtime/startup-*.json`, fora do Git.

## Conexão automática

Na abertura normal do Desktop e do Web local, a interface sonda a ponte e faz
uma leitura inicial quando a ponte Windows está disponível. Sem ponte/aparelho,
o editor continua disponível. Não há repetição automática de gravações nem
aplicação de mapeamento ou iluminação na inicialização.

Rascunhos salvos são mantidos sem perguntar para substituí-los. Alterações feitas
durante a leitura também são preservadas; o snapshot lido atualiza a referência
do aparelho. O botão Conectar teclado / Ler teclado continua disponível e a
leitura manual mantém sua confirmação de substituição do rascunho.

Pages e `file://` não tentam acessar USB automaticamente. No Web local,
`?offline=1` permite explorar o editor sem leitura; no Desktop, `--offline`
desabilita a tentativa inicial. Smokes sempre desabilitam conexão/monitor.

## Verificação

- 20 testes TypeScript e 30 Python.
- 13 testes Web, incluindo leitura automática, rascunho existente, edição em
  andamento e falha da ponte com recuperação manual, todos com transporte simulado.
- Quatro testes Electron, incluindo conexão simulada e interface utilizável
  enquanto a ponte está bloqueada na inicialização.
- Editor portátil testado diretamente por `file://`.
- Ícones dos três executáveis conferidos nos recursos PE.
- Pacote real aberto/fechado no Windows com `--smoke`, sem acesso USB.

Não foram feitos novos ensaios físicos de mapeamento, cores ou persistência.
Protocolo, perfis v1/v2, reservados, ações opacas e LED sem readback foram mantidos.
