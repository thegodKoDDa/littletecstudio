# LittleTec Web

> **Estado confirmado em 29/10/2026:** desktop 1.1.0 e Web 0.2.0 funcionam em uso
> real para mapeamento, troca de cores e aplicação de mudanças, conforme o usuário.
> USB no Web usa a ponte local Windows; Pages/HTML estático oferecem o editor.
> [Estado atual](docs/ESTADO_ATUAL.md) · [Documentação](docs/README.md).

Seu teclado macro 12+2 no navegador e no desktop. Interface moderna em Next.js e React com tema escuro, feedback ao vivo com Windows Raw Input, presets para os 2 knobs giratórios, ações rápidas de mídia e controle de iluminação LED.

**[Abrir no GitHub Pages — use online sem instalar](https://thegodkodda.github.io/littletec-web/)** · **[Baixar pacote HTML portátil (ZIP)](https://github.com/thegodKoDDa/littletec-web/releases/latest/download/LittleTec-Web-Standalone.zip)** · [Versão Desktop nativa](https://github.com/thegodKoDDa/littletec) · [Licença ISC](LICENSE)

[![Verificações](https://github.com/thegodKoDDa/littletec-web/actions/workflows/ci.yml/badge.svg)](https://github.com/thegodKoDDa/littletec-web/actions/workflows/ci.yml)
[![Publicar no GitHub Pages](https://github.com/thegodKoDDa/littletec-web/actions/workflows/pages.yml/badge.svg)](https://github.com/thegodKoDDa/littletec-web/actions/workflows/pages.yml)
[![Licença ISC](https://img.shields.io/badge/licen%C3%A7a-ISC-blue.svg)](LICENSE)

> [!NOTE]
> **Integração com o LittleTec Studio Desktop:**
> - Este projeto é a versão web moderna da suíte LittleTec. Se você procura o executável desktop nativo compilado em Python/Qt para Windows (`.exe`), acesse o repositório principal em **[thegodKoDDa/littletec](https://github.com/thegodKoDDa/littletec)**.
> - A interface visual, os componentes e os recursos desta versão Web servirão de base para a futura convergência visual e unificação definitiva do aplicativo desktop.

## Teclado de referência compatível

Desenvolvido, mapeado por engenharia reversa e validado especificamente para o mini teclado mecânico programável de **12 teclas + 2 botões giratórios (knobs)** com controlador **WCH CH57x**:

- **Link de referência do modelo (AliExpress)**: [Mini Teclado Mecânico Programável 12 Teclas + 2 Knobs RGB USB Type-C](https://pt.aliexpress.com/item/1005006437127027.html)
- **Identificação USB HID**: `VID_1189&PID_8842` (`0x1189:0x8842`, Interface `MI_00`, relatórios de 65 bytes com Report ID `0x03`)
- **Controlador físico**: WCH CH57x (memória interna flash persistente para 3 camadas independentes)
- **Layout físico**: 12 teclas mecânicas (`Tecla 01` a `Tecla 12`) + 2 encoders rotativos clicáveis (`Knob 1` e `Knob 2`, com giro à esquerda `↶`, clique central `●` e giro à direita `↷`, totalizando 18 posições por camada e 54 posições nas 3 camadas)
- **Iluminação LED nativa no chip**: 7 cores físicas fixas (*Vermelho*, *Laranja*, *Amarelo*, *Verde*, *Ciano*, *Azul*, *Roxo*) e 6 modos de efeito gravados no hardware (*Desligado*, *Estático*, *Respiração*, *Ciclo Automático*, *Onda ao Pressionar*, *Acender Tecla ao Pressionar*)

## Recursos

- **Entrada ao vivo por Windows Raw Input**: monitor em segundo plano que identifica teclas, mídia e cliques reais do teclado 1189:8842 sem interferir ou bloquear a digitação do sistema operacional.
- **Giratórios animados e feedback visual**: knobs virtuais com giro contínuo proporcional aos eventos reais, destaque imediato nas teclas pressionadas e contador de ações.
- **Painel dedicado para os 2 Knobs**: edição simultânea de `↶ Esquerda`, `● Clique` e `↷ Direita`, menu rápido com 12 presets (Volume, Mídia, Zoom, Abas, Linha do Tempo, Desfazer/Salvar/Refazer, Scroll, Desktops, etc.), inversão de sentido em 1 clique e clonagem entre knobs ou camadas.
- **Reconhecimento direto pelo teclado principal**: clique em qualquer posição da tela e aperte a tecla ou combinação desejada no seu próprio teclado (`Ctrl+C`, `Win+D`, `F13–F24`, etc.).
- **Sequências e digitação automática**: crie macros de até 20 etapas ou configure digitação de textos e números com `Enter` automático.
- **Controle completo de iluminação**: selecione modo e cor por camada ou aplique simultaneamente nas três camadas do hardware.
- **Editor visual sem dependências**: funciona offline e no navegador para criação, rascunho persistente no `localStorage`, simulação e exportação/importação de perfis JSON.
- **Segurança de dados e backups**: preservação estrita de campos opacos, histórico com desfazer/refazer, exportação de diagnósticos e backups brutos dos 72 relatórios USB com conferência de integridade.

## Como usar

O LittleTec Web foi projetado para funcionar de **três maneiras flexíveis**:

---

### 1. No navegador online (GitHub Pages) — sem instalar nada

Ideal para explorar a interface, planejar seus atalhos, criar perfis e exportar arquivos `.json`.

1. Acesse **[thegodkodda.github.io/littletec-web](https://thegodkodda.github.io/littletec-web/)**.
2. Navegue entre as 3 camadas, configure teclas, knobs e cores.
3. Seus rascunhos ficam salvos automaticamente no navegador.
4. Na aba **Perfis**, clique em **Exportar JSON** para salvar suas configurações e levá-las para qualquer lugar.

> [!NOTE]
> Por questões de segurança dos navegadores web modernos, o acesso USB direto a dispositivos HID personalizados via internet requer uma ponte local. No GitHub Pages, o aplicativo funciona em modo simulador e editor offline completo.

---

### 2. Baixar e usar localmente (`index.html`) — pacote portátil offline

Ideal para ter o configurador salvo no seu computador e abri-lo direto no seu navegador favorito, sem precisar de Node.js, Python ou linha de comando.

1. Baixe o arquivo **[LittleTec-Web-Standalone.zip](https://github.com/thegodKoDDa/littletec-web/releases/latest/download/LittleTec-Web-Standalone.zip)** na aba de Releases.
2. Extraia o conteúdo em uma pasta de sua preferência.
3. Dê dois cliques em **`index.html`** para abrir o editor instantaneamente no seu navegador.
4. Crie, teste combinações e exporte seus perfis JSON com total privacidade local.

---

### 3. Clonando o repositório — com acesso USB e leitura/gravação física completa

Esta forma inicia a interface Next.js conectada à **ponte USB local**, permitindo ler o hardware real, aplicar mapeamentos na memória flash do teclado e acompanhar a entrada física ao vivo.

#### Requisitos
- **Node.js 20.9 ou superior** (testado com Node 22 e Node 24).
- **Windows 10/11 x64** com Python 3 (para acesso direto à biblioteca USB `hidapi`).

#### No Windows (Recomendado)

1. Clone o repositório:
   ```cmd
   git clone https://github.com/thegodKoDDa/littletec-web.git
   cd littletec-web
   ```
2. Instale as dependências:
   ```cmd
   npm ci
   ```
3. Inicie o sistema com um duplo-clique no executável auxiliar **`Abrir-Web.cmd`** (ou execute `npm run dev` no terminal).
4. Abra **`http://127.0.0.1:3000`** no seu navegador.
5. Com o teclado conectado via USB, clique em **Conectar teclado** para carregar os dados reais da memória interna. Faça suas edições e clique em **Aplicar mapeamento** para gravar permanentemente.

#### No Linux / WSL

1. No WSL com Windows hospedeiro, execute:
   ```bash
   git clone https://github.com/thegodKoDDa/littletec-web.git
   cd littletec-web
   npm ci
   npm run dev
   ```
2. O inicializador detecta o ambiente WSL automaticamente e conecta ao Python do Windows via relay transparente, garantindo acesso USB mesmo sem expor portas além do loopback `127.0.0.1`.

---

## Scripts disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia a interface Next.js e a ponte USB Windows em conjunto |
| `npm run dev:ui` | Inicia apenas a interface Next.js (modo editor / simulação) |
| `npm test` | Executa a suíte de 14 testes automatizados de comportamento e parsing |
| `npm run typecheck` | Validação estrita de tipos com TypeScript |
| `npm run build` | Compilação otimizada de produção Next.js (com SSR e rotas API) |
| `npm run build:static` | Gera a exportação estática portátil na pasta `out/` com `index.html` |
| `npm run build:pages` | Compilação estática com caminhos relativos para publicação no GitHub Pages |

## Arquitetura da ponte USB

```text
Navegador Web (Next.js / React 19)
  │
  ├── Local: POST /api/device (mesma origem)
  │     │
  │     ├── Direto no Windows ou via Relay IPC no WSL
  │     │
  │     └── Ponte Python local em 127.0.0.1:17643
  │           │ (Autenticação via token em .runtime/, fora do navegador)
  │           │
  │           ├── ConfigurationService & Protocolo LittleTec
  │           │     └── HIDAPI Windows → Teclado 1189:8842 (Interface MI_00)
  │           │
  │           └── Windows Raw Input (ctypes)
  │                 └── Monitor de eventos ao vivo (Interface MI_01)
  │
  └── GitHub Pages / Offline: Modo Editor & Simulador (exportação/importação JSON)
```

## Garantia de qualidade e testes

A base de código inclui 14 testes automatizados em [tests/](tests/) cobrindo:
- Recepção e filtro estrito de eventos físicos de teclado, mídia e mouse;
- Detecção e cálculo de sentido dos encoders rotativos sem falsos giros;
- Preservação de campos opacos e compatibilidade bidirecional com perfis v1 e v2 do LittleTec Studio;
- Sanitização de códigos de tecla, limites físicos de macros e modificadores;
- Detecção e chaveamento de ambiente de execução (Windows nativo, WSL com relay e Linux offline).

## Licença

Distribuído sob a licença **ISC**. Consulte o arquivo [LICENSE](LICENSE) para mais informações.
