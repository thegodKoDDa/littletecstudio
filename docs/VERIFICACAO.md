# Verificação vigente — Web 0.2, 28/10/2026

Implementado monitor passivo Windows Raw Input em thread própria, sem escrever
configuração nem bloquear os comandos do Windows. Quatro coleções de entrada
do 1189:8842/MI_01 identificadas, ignorando outros dispositivos.

Com a participação do usuário, a interface recebeu giros reais dos dois knobs
nos dois sentidos e teclas. A captura inicial registrou 192 eventos de mídia e
teclado, sem erro de interpretação ou perda de buffer. Os dials giraram na página
e os controles correspondentes receberam destaque; evidências em
`.runtime/live-real-event.png` e `.runtime/live-physical-summary.json`.

Silenciar tem duas origens na configuração atual (tecla 1 / clique do knob 1):
a ambiguidade foi preservada. Para o clique Win+D do knob 2, a captura passiva
mostrou D-up sem D-down. A recuperação por contexto recente foi validada sobre
os bytes reais preservados em `tests/fixtures/live-win-d.json`, no Linux e no
Python Windows, e na integração simulada do navegador. Não apresentar esse replay
como outro teste físico posterior à correção.

Validação da 0.2: build de produção e tipos; 14 testes TypeScript, 28 testes Python
e 9 testes Playwright. Os testes automáticos não abrem o monitor físico nem
fazem USB. O monitor foi conferido separadamente, por pedido do usuário.

Não houve novo envio de configuração, ensaio de cores ou A/F24. Mouse tem
interpretação e registro de coleção, cobertos por testes simulados; não foi
reconfigurado o teclado para produzir novas ações de mouse neste ensaio.

Uso e limites: [ENTRADA_AO_VIVO.md](ENTRADA_AO_VIVO.md).

---

## Histórico da verificação 0.1

# Verificação — 28/10/2026

LittleTec Web 0.1.0, Next.js 16.4.3 / React 19.3.1 / TypeScript.
Implementação local em web/, sem mudanças no Studio Windows 1.1 ou nos originais.

## Conectividade real corrigida

A aplicação Next estava no WSL/NAT e a ponte Windows não estava iniciada.
O loopback WSL não alcançava o loopback Windows. O transporte agora escolhe
um relay executado pelo Python Windows, enviando comando/token por stdin.
Não expõe a ponte na rede e não repete uma gravação após falha de transporte.

`npm run dev` inicia a ponte e a interface juntas. Esse caminho foi exercitado
com a ponte desligada: ambos iniciaram e a leitura real pelo navegador passou.
O launcher também foi atualizado. `dev:ui` permanece separado para testes.

Verificação física opt-in executada nesta sessão:

- Clique real em Conectar teclado no Chromium, sem simular o endpoint.
- Identidade 12 teclas / 2 encoders / variante 0 confirmada pelo Windows.
- Três camadas de 18 ações carregadas na interface; zero erros JavaScript.
- Aplicação do mesmo perfil devolveu “O mapeamento já está atualizado”.
  Não houve envio de mudanças de mapeamento ou comandos LED nesse teste.
- Exportação da cópia dos 72 relatórios pela API web passou.
- Comparação independente entre primeira e última cópia da sessão:
  **72 relatórios / 4.680 bytes idênticos**, incluindo IDs e padding.
- Acesso pelo Windows em http://localhost:3000 retornou HTTP 200; status da
  ponte retornou bridge=true, connected=true, usb_platform=true, busy=false.

Evidências locais, fora do Git:
`.runtime/real-web-connected.png`, `.runtime/web-usb-verification.json` e
`.runtime/web-usb-comparison.json`.

O script `tools/check-live-device.mjs` só executa essas operações com
`--read-usb`. Não participa de npm test, Playwright ou build.
Não repetir ensaios antigos de A/F24, slots de giros ou ciano/vermelho.
Escritas com mudanças continuam usando o serviço validado do Studio, com
regressões simuladas; não alegar novo ensaio físico de troca de cor/mapeamento.

## Regressões de software

- Compilação de produção Next passou; verificações TypeScript passaram,
  incluindo ausência de imports e parâmetros não usados.
- 10 testes TypeScript: formatos, opacos, validação, captura, diferenças,
  texto, dimensões dos 24 modelos e escolha de runtime Windows/WSL/Linux.
- 13 testes Python: acesso serial, revisão entre abas, validação, falha,
  autenticação, cópias com hashes, LED desconhecido após erro, relay sem
  repetição de escrita e health sem bloquear na fila USB.
- 7 testes Playwright: edição, histórico, persistência, captura, presets,
  navegação, iluminação, biblioteca, envio simulado, modelos, temas,
  layout e fronteira de API.
- Layout conferido em 1440×1080, 1040×800, 1040×720 e 390×844, sem
  transbordamento horizontal. Capturas em .runtime/studio-*.png.

Esses testes usam serviços/respostas simulados para envios. O Playwright inicia
somente `dev:ui` se precisar de servidor; nunca inicia a ponte USB por rotina.

A distribuição web não foi publicada; não houve commits nem push nesta etapa.
O desktop continua com cores e mapeamento funcionando, conforme o usuário.
