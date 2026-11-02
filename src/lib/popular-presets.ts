import { keyboard, newProfile, profileSchema, type Profile, type Action } from "./profile";

export type PresetCategory = "video" | "stream" | "code" | "design";

export type PopularPreset = {
  id: PresetCategory;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  badge: string;
  tags: string[];
  createProfile: () => Profile;
};

export const POPULAR_PRESETS: PopularPreset[] = [
  {
    id: "video",
    title: "Edição de Vídeo",
    subtitle: "Premiere Pro · DaVinci Resolve · Final Cut",
    description: "Knobs configurados para scrubbing quadro a quadro e zoom na timeline. Teclas de corte, ripple delete, play/pause e marcações.",
    iconName: "film",
    badge: "Audiovisual",
    tags: ["J-K-L Scrub", "Corte Rápido", "Zoom Timeline", "Ripple Delete"],
    createProfile: () => {
      const p = newProfile(12, 2, 4, "12+2");
      p.name = "Edição de Vídeo (Premiere / DaVinci)";
      p.lighting = [
        { mode: 1, color: "blue" },
        { mode: 1, color: "cyan" },
        { mode: 1, color: "orange" },
      ];
      // Camada 1: Montagem e Corte Principal
      p.layers[0] = [
        keyboard("V"), // Tecla 01: Seleção
        keyboard("C"), // Tecla 02: Corte / Navalha
        keyboard("Delete", ["Shift"]), // Tecla 03: Ripple Delete
        keyboard("M"), // Tecla 04: Marcador
        keyboard("I"), // Tecla 05: Ponto de Entrada (In)
        keyboard("O"), // Tecla 06: Ponto de Saída (Out)
        keyboard("Space"), // Tecla 07: Play/Pause
        keyboard("K", ["Ctrl"]), // Tecla 08: Dividir no Playhead
        keyboard("Z", ["Ctrl"]), // Tecla 09: Desfazer
        keyboard("Z", ["Ctrl", "Shift"]), // Tecla 10: Refazer
        keyboard("M", ["Ctrl"]), // Tecla 11: Exportar Mídia
        keyboard("Enter"), // Tecla 12: Renderizar Área
        // Knob 1: Navegação J-K-L
        keyboard("J"), // Giro Esquerda: Retroceder
        keyboard("K"), // Clique: Pausar
        keyboard("L"), // Giro Direita: Avançar
        // Knob 2: Zoom na Linha do Tempo
        keyboard("Minus"), // Giro Esquerda: Zoom Out
        keyboard("Z", ["Shift"]), // Clique: Ajustar à Tela
        keyboard("Equal"), // Giro Direita: Zoom In
      ];
      // Camada 2: Áudio e Efeitos
      p.layers[1] = [
        keyboard("G"), // Ajuste de Ganho
        keyboard("L", ["Ctrl"]), // Bloquear Faixa
        keyboard("M", ["Shift"]), // Próximo Marcador
        keyboard("M", ["Shift", "Ctrl"]), // Marcador Anterior
        keyboard("Space"),
        { type: "media", command: "mute" },
        { type: "media", command: "volume_down" },
        { type: "media", command: "volume_up" },
        keyboard("Z", ["Ctrl"]),
        keyboard("Y", ["Ctrl"]),
        keyboard("S", ["Ctrl"]),
        keyboard("F11"),
        // Knob 1: Volume
        { type: "media", command: "volume_down" },
        { type: "media", command: "mute" },
        { type: "media", command: "volume_up" },
        // Knob 2: Scrubbing fino
        keyboard("Left"),
        keyboard("K"),
        keyboard("Right"),
      ];
      // Camada 3: Cor e Finalização
      p.layers[2] = [
        keyboard("W"), // Ripple Trim
        keyboard("Q"), // Ripple Trim Início
        keyboard("D"), // Habilitar/Desabilitar clipe
        keyboard("F"), // Match Frame
        keyboard("Space"),
        keyboard("F12"),
        keyboard("1", ["Ctrl"]),
        keyboard("2", ["Ctrl"]),
        keyboard("Z", ["Ctrl"]),
        keyboard("S", ["Ctrl"]),
        keyboard("M", ["Ctrl"]),
        keyboard("Enter"),
        // Knob 1: Frame a Frame
        keyboard("Left"),
        keyboard("K"),
        keyboard("Right"),
        // Knob 2: Zoom
        keyboard("Minus"),
        keyboard("Z", ["Shift"]),
        keyboard("Equal"),
      ];
      return profileSchema.parse(p);
    },
  },
  {
    id: "stream",
    title: "Streaming & Comunicação",
    subtitle: "OBS Studio · Discord · Spotify · YouTube",
    description: "Controle instantâneo de cenas, microfone mudo, deafen no Discord, multimídia nos knobs e acionamento de gravação.",
    iconName: "radio",
    badge: "Transmissão",
    tags: ["Mute Discord", "Troca de Cenas", "Volume Geral", "Clipe Rápido"],
    createProfile: () => {
      const p = newProfile(12, 2, 4, "12+2");
      p.name = "Streaming & Discord (OBS)";
      p.lighting = [
        { mode: 1, color: "purple" },
        { mode: 1, color: "green" },
        { mode: 1, color: "red" },
      ];
      p.layers[0] = [
        keyboard("M", ["Ctrl", "Shift"]), // Tecla 01: Mute Microfone (Discord/OBS)
        keyboard("D", ["Ctrl", "Shift"]), // Tecla 02: Deafen Discord
        keyboard("F1", ["Ctrl"]), // Tecla 03: Cena 1 (Principal)
        keyboard("F2", ["Ctrl"]), // Tecla 04: Cena 2 (Jogo / Compartilhamento)
        keyboard("F3", ["Ctrl"]), // Tecla 05: Cena 3 (Câmera Cheia)
        keyboard("F4", ["Ctrl"]), // Tecla 06: Cena 4 (Pausa / Intervalo)
        keyboard("F9", ["Ctrl"]), // Tecla 07: Iniciar / Pausar Gravação
        keyboard("F10", ["Ctrl"]), // Tecla 08: Transmissão On/Off
        keyboard("F12", ["Ctrl"]), // Tecla 09: Salvar Clipe / Replay Buffer
        keyboard("PrintScreen"), // Tecla 10: Captura de Tela
        { type: "media", command: "play_pause" }, // Tecla 11: Tocar / Pausar Música
        { type: "media", command: "next" }, // Tecla 12: Próxima Música
        // Knob 1: Volume Geral do Sistema
        { type: "media", command: "volume_down" },
        { type: "media", command: "mute" },
        { type: "media", command: "volume_up" },
        // Knob 2: Faixas de Música
        { type: "media", command: "previous" },
        { type: "media", command: "play_pause" },
        { type: "media", command: "next" },
      ];
      p.layers[1] = [
        keyboard("F5", ["Ctrl"]),
        keyboard("F6", ["Ctrl"]),
        keyboard("F7", ["Ctrl"]),
        keyboard("F8", ["Ctrl"]),
        keyboard("M", ["Ctrl", "Shift"]),
        keyboard("D", ["Ctrl", "Shift"]),
        keyboard("G", ["Win"]),
        keyboard("Tab", ["Alt"]),
        keyboard("Z", ["Ctrl"]),
        keyboard("Space"),
        { type: "media", command: "calculator" },
        { type: "media", command: "browser_home" },
        { type: "media", command: "volume_down" },
        { type: "media", command: "mute" },
        { type: "media", command: "volume_up" },
        { type: "media", command: "previous" },
        { type: "media", command: "play_pause" },
        { type: "media", command: "next" },
      ];
      p.layers[2] = p.layers[0];
      return profileSchema.parse(p);
    },
  },
  {
    id: "code",
    title: "Desenvolvimento & Código",
    subtitle: "VS Code · Terminal · Git · Navegador",
    description: "Navegação rápida de abas e código nos knobs, atalhos de terminal, formatação, Git Commit e paleta de comandos.",
    iconName: "code",
    badge: "Programação",
    tags: ["Paleta VS Code", "Git Commit", "Terminal Integrado", "Multi-cursor"],
    createProfile: () => {
      const p = newProfile(12, 2, 4, "12+2");
      p.name = "Desenvolvimento (VS Code / Git)";
      p.lighting = [
        { mode: 1, color: "cyan" },
        { mode: 1, color: "green" },
        { mode: 1, color: "yellow" },
      ];
      p.layers[0] = [
        keyboard("P", ["Ctrl", "Shift"]), // Tecla 01: Paleta de Comandos
        keyboard("P", ["Ctrl"]), // Tecla 02: Ir para Arquivo
        keyboard("F", ["Shift", "Alt"]), // Tecla 03: Formatar Documento
        keyboard("Grave", ["Ctrl"]), // Tecla 04: Terminal Integrado
        keyboard("S", ["Ctrl", "Shift"]), // Tecla 05: Salvar Tudo
        keyboard("D", ["Ctrl"]), // Tecla 06: Adicionar Seleção Próxima (Multi-cursor)
        keyboard("Slash", ["Ctrl"]), // Tecla 07: Comentar Linha
        keyboard("F2"), // Tecla 08: Renomear Símbolo
        keyboard("F12"), // Tecla 09: Ir para Definição
        keyboard("Enter", ["Ctrl"]), // Tecla 10: Git Commit / Executar
        keyboard("G", ["Ctrl", "Shift"]), // Tecla 11: Painel do Git
        keyboard("F5", ["Ctrl"]), // Tecla 12: Executar sem depuração
        // Knob 1: Alternar Abas
        keyboard("PageUp", ["Ctrl"]), // Aba anterior
        keyboard("W", ["Ctrl"]), // Fechar aba
        keyboard("PageDown", ["Ctrl"]), // Próxima aba
        // Knob 2: Mover Linha de Código
        keyboard("Up", ["Alt"]), // Mover linha para cima
        keyboard("Down", ["Shift", "Alt"]), // Duplicar linha para baixo
        keyboard("Down", ["Alt"]), // Mover linha para baixo
      ];
      p.layers[1] = [
        keyboard("B", ["Ctrl"]), // Alternar Barra Lateral
        keyboard("J", ["Ctrl"]), // Alternar Painel Inferior
        keyboard("F", ["Ctrl", "Shift"]), // Buscar em Todos os Arquivos
        keyboard("H", ["Ctrl"]), // Substituir
        keyboard("Z", ["Ctrl"]), // Desfazer
        keyboard("Y", ["Ctrl"]), // Refazer
        keyboard("Space", ["Ctrl"]), // Sugestões IntelliSense
        keyboard("K", ["Ctrl"]), // Atalhos de acorde
        keyboard("F8"), // Próximo erro/aviso
        keyboard("F8", ["Shift"]), // Erro/aviso anterior
        keyboard("C", ["Ctrl"]), // Copiar
        keyboard("V", ["Ctrl"]), // Colar
        keyboard("PageUp", ["Ctrl"]),
        keyboard("W", ["Ctrl"]),
        keyboard("PageDown", ["Ctrl"]),
        keyboard("Up", ["Alt"]),
        keyboard("Down", ["Shift", "Alt"]),
        keyboard("Down", ["Alt"]),
      ];
      p.layers[2] = p.layers[0];
      return profileSchema.parse(p);
    },
  },
  {
    id: "design",
    title: "Design & Arte Digital",
    subtitle: "Photoshop · Illustrator · Figma",
    description: "Knob 1 controla tamanho do pincel; Knob 2 controla zoom suave. Teclas para ferramentas, duplicar camadas e seleções.",
    iconName: "palette",
    badge: "Criatividade",
    tags: ["Tamanho do Pincel", "Zoom Fluido", "Duplicar Camada", "Seleção Rápida"],
    createProfile: () => {
      const p = newProfile(12, 2, 4, "12+2");
      p.name = "Design (Photoshop / Figma)";
      p.lighting = [
        { mode: 1, color: "orange" },
        { mode: 1, color: "blue" },
        { mode: 1, color: "purple" },
      ];
      p.layers[0] = [
        keyboard("B"), // Tecla 01: Pincel (Brush)
        keyboard("E"), // Tecla 02: Borracha (Eraser)
        keyboard("V"), // Tecla 03: Mover / Seleção
        keyboard("W"), // Tecla 04: Varinha Mágica / Seleção Rápida
        keyboard("L"), // Tecla 05: Laço
        keyboard("I"), // Tecla 06: Conta-gotas (Eyedropper)
        keyboard("J", ["Ctrl"]), // Tecla 07: Duplicar Camada
        keyboard("N", ["Ctrl", "Shift"]), // Tecla 08: Nova Camada
        keyboard("E", ["Ctrl"]), // Tecla 09: Mesclar Camadas
        keyboard("D", ["Ctrl"]), // Tecla 10: Desmarcar Seleção
        keyboard("T", ["Ctrl"]), // Tecla 11: Transformação Livre
        keyboard("I", ["Ctrl", "Shift"]), // Tecla 12: Inverter Seleção
        // Knob 1: Ajuste de Tamanho do Pincel
        keyboard("BracketLeft"), // Diminuir pincel
        keyboard("D"), // Cores padrão (Preto/Branco)
        keyboard("BracketRight"), // Aumentar pincel
        // Knob 2: Zoom na Prancheta
        keyboard("Minus", ["Ctrl"]), // Zoom Out
        keyboard("0", ["Ctrl"]), // Ajustar à tela (Fit 100%)
        keyboard("Equal", ["Ctrl"]), // Zoom In
      ];
      p.layers[1] = [
        keyboard("Z", ["Ctrl"]), // Desfazer
        keyboard("Z", ["Ctrl", "Shift"]), // Refazer
        keyboard("Space"), // Ferramenta Mão (Pan)
        keyboard("Tab"), // Ocultar painéis
        keyboard("", ["Alt"]), // Amostragem
        keyboard("Delete"), // Preencher
        keyboard("G", ["Ctrl"]), // Agrupar camadas
        keyboard("G", ["Ctrl", "Shift"]), // Desagrupar
        keyboard("S", ["Ctrl"]), // Salvar
        keyboard("S", ["Ctrl", "Shift"]), // Salvar Como
        keyboard("W", ["Ctrl"]), // Fechar
        keyboard("F"), // Modo tela cheia
        keyboard("BracketLeft"),
        keyboard("D"),
        keyboard("BracketRight"),
        keyboard("Minus", ["Ctrl"]),
        keyboard("0", ["Ctrl"]),
        keyboard("Equal", ["Ctrl"]),
      ];
      p.layers[2] = p.layers[0];
      return profileSchema.parse(p);
    },
  },
];
