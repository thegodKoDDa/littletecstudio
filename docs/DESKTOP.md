# Web e novo Desktop — base compartilhada

Decisão de 29/10/2026: o desenvolvimento ativo dos dois formatos passa a este
repositório, `littletecstudio`. O repositório `littletec-og` conserva o original do
fabricante, o Studio Qt 1.1.0, seus fontes, distribuição e evidências. O aplicativo Qt e os originais não foram alterados. A cópia Web anterior foi
transferida para o histórico local do Studio, conforme o inventário da reorganização.

## Aplicativo Windows

Depois do build, abrir **`LittleTec-Studio.exe` na raiz deste repositório**.
Esse executável contém o pacote completo, pode ser transportado sozinho e
prepara a execução local Windows automaticamente, inclusive se aberto pela
pasta WSL. Não precisa de `.cmd`, Python ou Node.js instalado. Uma cópia do
mesmo arquivo fica em `release/LittleTec-Studio.exe`.

O diretório `release/win-unpacked` é a distribuição interna Electron para
empacotamento. Seu `.exe` exige os arquivos ao lado e não deve ser aberto
diretamente pelo UNC/WSL. Como alternativa portátil, extrair o ZIP de
`release/` em uma pasta local Windows e manter todo o conteúdo junto.

O executável de entrada prepara uma cópia de execução em
`%LOCALAPPDATA%/LittleTec Desktop/builds/<hash>`. Isso mantém o sandbox Chromium
e evita a falha de inicialização gráfica observada ao executar diretamente por
UNC. Registra falhas em `%LOCALAPPDATA%/LittleTec Desktop/launcher.log`.
Os fontes, builds e artefatos oficiais continuam neste repositório. O ZIP
extraído em uma pasta local Windows pode ser aberto diretamente pelo `.exe`.

O pacote unificado é identificado como **0.4.0**. Downloads em [Releases](https://github.com/thegodKoDDa/littletecstudio/releases).
A confirmação física do Web/Qt anterior não equivale à validação USB do novo
pacote. Build e smoke não leem, escrevem nem iniciam o monitor do teclado.

## Uma implementação, duas entregas

```text
src/components + src/lib + src/app/globals.css (interface única)
  ├─ Web: Next /api/device → ponte HTTP Windows / relay WSL
  └─ Desktop: preload Electron → IPC validado → ponte Python JSONL privada
                         ↓
         bridge/server.py: Application e fila de configuração
                         ↓
         bridge/core/littletec: serviços, perfis e protocolo
```

O Electron carrega um cliente React compilado diretamente dos mesmos componentes
do Web, sem o runtime Next desnecessário ao desktop. Nenhuma tela
é reimplementada em Qt ou copiada para uma segunda interface. A rota Web e o
Electron usam `src/lib/device-command.ts` para validar os mesmos comandos.
Python mantém I/O serial, revisão de snapshot, cópia, releitura e tentativa de
retorno. Entrada MI_01, identificação ambígua, perfis v1/v2, opacos e LED sem
readback conservam seus comportamentos anteriores.

O processo principal gerencia a ponte, a janela e os downloads. O renderer não
recebe Node.js ou acesso genérico ao sistema; só a função de comandos exposta
pelo preload. A ponte desktop não abre porta HTTP, não reinicia automaticamente
e não repete pedidos em falha. Fechar o aplicativo aguarda os pedidos em curso
antes de encerrar a ponte e o monitor.

Melhorias na interface, nas regras e nos serviços comuns entram nos próximos
builds Web e desktop. Integrações específicas de janela/arquivos ficam em
`desktop/`. Isso compartilha **código**, não sincroniza automaticamente a
biblioteca ou rascunhos entre instalações e navegadores. Usar JSON para troca.
Mudanças exigem novos builds; executáveis já instalados não se atualizam sozinhos.

## Dados e preservação

- Biblioteca, rascunho e tema desktop: perfil Chromium em
  `%APPDATA%/LittleTec Desktop`, independente do navegador e do Qt.
- Cópias, journals e último envio LED do novo desktop:
  `%APPDATA%/LittleTec Desktop/captures`, separados dos dados do Qt anterior.
  Arquivos novos têm nomes datados. Último envio LED não é leitura interna.
- Capturas anteriores continuam em seus diretórios originais.
- `docs/preservacao/desktop-qt-1.1.0.json` registra hashes dos arquivos
  versionados, do original e de `novo/dist` no início desta implementação.
- `.local/legado/web-interno-20261029/` é a cópia anterior preservada. Este checkout independente é
  a base oficial; não manter desenvolvimento paralelo na cópia interna.

Conferir o projeto anterior, somente leitura:

```sh
python3 tools/verify-preservation.py
```

## Preparar desenvolvimento Windows

Usar Node.js 22 ou superior e Python Windows x64 compatível com os requisitos.
Na raiz deste repositório:

```powershell
npm ci
python -m venv .venv-windows
.venv-windows\Scripts\python.exe -m pip install -r requirements/windows-desktop.txt
npm run desktop:dev
```

O ambiente fica neste repositório, sem usar o ambiente Qt anterior. No WSL,
criar `.venv-windows` com um Python **Windows**; `npm run dev` escolhe esse
ambiente e o relay. Para `desktop:dev` no Linux, o Python local oferece editor
sem USB; para execução física, usar o pacote Windows. `LITTLETEC_PYTHON` permite
indicar explicitamente o Python Windows ao empacotar.

## Build e verificações

```sh
npm test
python3 -m unittest discover -s bridge -q
npm run typecheck
npx playwright test
npm run desktop:build
npx playwright test --config playwright.desktop.config.ts
npm run desktop:smoke
npm run desktop:pack
```

Para conferir o pacote real no Windows, sem acesso USB:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/smoke-windows.ps1
```

O relatório e a captura de tela ficam em `.runtime/windows-smoke.json` e
`.runtime/windows-smoke.json.png`. O smoke apenas carrega a interface e pede
`status`; não conecta o teclado nem ativa o monitor.

`desktop:pack` compila a interface comum, empacota a ponte com Python Windows,
gera `release/win-unpacked`, ZIP e SHA-256. Funciona no Windows ou no WSL com
Python Windows disponível. Também empacota o executável único de entrada,
incluindo o ZIP completo e seu hash. Não publica nem cria commits, tags ou releases.
Os smokes Electron exigem ambiente gráfico (no CI Linux, usar `xvfb-run`).
O teste de interface Electron usa perfil temporário e não acessa USB.

O desktop usa `build/desktop-ui/` (empacotado em `ui/` dentro do asar), o
editor portátil usa `build/web-portable/` e Pages usa `out/`. Compilar uma
modalidade não substitui os arquivos de interface da outra.

A entrada `desktop/launcher.cs` é compilada pelo `csc.exe` do .NET Framework
presente no Windows. O ZIP é um recurso do executável e só é lido/extraído
quando seu hash ainda não foi preparado em disco local. Não há extração Python
no caminho de abertura habitual. A ponte continua sendo Python empacotado.
A janela carrega enquanto a ponte inicializa.

Na execução normal, Desktop e Web local sondam a ponte e fazem uma única
leitura inicial. Não há aplicação automática de teclas ou LED. Rascunhos são
mantidos sem confirmação modal na leitura automática. Para iniciar apenas o
editor, use `LittleTec-Studio.exe --offline`, ou `?offline=1` no Web local.
O botão manual permanece funcionando. `--smoke` sempre desativa a leitura
inicial e a ativação do monitor físico.

`desktop/icon.png` é a fonte canônica de identidade. `npm run icons:sync`
regenera ICO, favicon e ícone Apple. O empacotamento verifica os bytes dos
ícones realmente presentes no lançador, no Electron e na ponte, em sete tamanhos.

O Electron/Chromium deve acompanhar atualizações de segurança. O pacote ocupa
mais espaço que uma janela baseada no WebView do sistema. A versão inicial não
inclui assinatura Authenticode nem atualização automática.
