"use client";

import { useEffect, useState } from "react";

export type Language = "pt-BR" | "en" | "es";

export const DICTIONARY: Record<Language, Record<string, string>> = {
  "pt-BR": {
    // Navegação principal
    "nav.mapping": "Mapeamento",
    "nav.knobs": "Giratórios",
    "nav.lighting": "Iluminação",
    "nav.profiles": "Perfis",
    "nav.diagnostics": "Diagnóstico",
    "nav.tests": "Testes",

    // Cabeçalhos de página
    "page.mapping.title": "Um teclado. Infinitas possibilidades.",
    "page.mapping.desc": "Transforme pequenos movimentos em grandes atalhos.",
    "page.knobs.title": "Seu ritmo, em cada giro.",
    "page.knobs.desc": "Personalize cada direção e acompanhe seus controles ao vivo.",
    "page.lighting.title": "Encontre a sua frequência.",
    "page.lighting.desc": "A cor certa para cada jeito de trabalhar.",
    "page.profiles.title": "Seu fluxo, sempre à mão.",
    "page.profiles.desc": "Crie, organize e leve suas configurações com você.",
    "page.diagnostics.title": "Tudo no lugar.",
    "page.diagnostics.desc": "Conexão, cópias e informações do seu dispositivo.",
    "page.tests.title": "Tudo sob controle.",
    "page.tests.desc": "Teste suas teclas, atalhos e sequências em tempo real.",

    // Estado do dispositivo e topbar
    "device.connected": "Teclado conectado",
    "device.connected_usb": "Conectado via USB",
    "device.local": "Modo local",
    "device.editor_local": "Editor local",
    "device.busy": "Operação em andamento",
    "device.connect": "Conectar teclado",
    "device.read": "Ler teclado",
    "device.apply": "Aplicar mapeamento",
    "device.review": "Revisar alterações",
    "device.undo": "Desfazer",
    "device.redo": "Refazer",
    "device.save": "Salvar perfil",
    "device.export": "Exportar",
    "device.import": "Importar",
    "device.layer": "Camada",

    // Ações de plataforma
    "action.download_desktop": "Baixar Desktop",
    "action.download_desktop_hint": "Baixar executável portátil para Windows (.exe)",
    "action.open_web": "Acessar Web",
    "action.open_web_hint": "Abrir aplicativo no navegador padrão",

    // Barra lateral
    "sidebar.workspace": "SEU ESPAÇO",
    "sidebar.device": "DISPOSITIVO",
    "sidebar.security_title": "Seu teclado. Seus dados.",
    "sidebar.security_desc_desktop": "Rascunhos salvos neste aplicativo.\nSem conta, sem nuvem.",
    "sidebar.security_desc_web": "Rascunhos salvos neste navegador.\nSem conta, sem nuvem.",
    "sidebar.theme_dark": "Tema escuro",
    "sidebar.theme_light": "Tema claro",
    "sidebar.getting_started": "Primeiros passos",
    "sidebar.help": "Ajuda",
    "sidebar.language": "Idioma",

    // Rodapé
    "footer.tagline": "Feito para o seu jeito de fazer.",
    "footer.spec": "12 teclas. 2 giros. Seu controle.",

    // Campo de testes & macros
    "tests.title": "Campo de Teste de Teclas & Macros",
    "tests.desc": "Pressione as teclas no seu teclado para validar atalhos, modificadores e macros em tempo real.",
    "tests.eyebrow": "DIAGNÓSTICO & VALIDAÇÃO EM TEMPO REAL",
    "tests.clear_records": "Limpar registros",
    "tests.card_capture": "Captura de Teclas & Encoders",
    "tests.focus_active": "FOCO ATIVO",
    "tests.click_focus": "CLIQUE P/ FOCAR",
    "tests.monitoring": "Monitorando teclas e giros do macropad…",
    "tests.click_area": "Clique nesta área para focar e capturar os cliques",
    "tests.placeholder": "Pressione qualquer tecla ou gire os encoders para validar",
    "tests.physical_code": "Código físico",
    "tests.registered_at": "Registrado às",
    "tests.modifiers_title": "Modificadores físicos em tempo real:",
    "tests.typing_card": "Área de Teste para Macros de Texto",
    "tests.clear_text": "Limpar texto",
    "tests.chars": "carac.",
    "tests.typing_placeholder": "Clique aqui e pressione as teclas do macropad configuradas com texto para validar a digitação contínua...",
    "tests.events_card": "Registro de Eventos Detectados",
    "tests.event_singular": "evento",
    "tests.event_plural": "eventos",
    "tests.no_events": "Nenhum evento registrado",
    "tests.no_events_desc": "Ative o foco no bloco à esquerda e acione teclas normais, combinações ou teclas estendidas F13–F24.",

    // Modelos prontos (Presets)
    "presets.title": "MODELOS PRONTOS POR APLICATIVO",
    "presets.desc": "Configurações completas de 1 clique para o modelo 12+2",
    "presets.apply": "Aplicar modelo",

    // Gravador de macros
    "macro.record": "Gravar sequência",
    "macro.start": "Iniciar Gravação",
    "macro.pause": "Pausar Gravação",
    "macro.assign": "Atribuir Sequência",
    "macro.steps": "etapas",

    // Modal de Download
    "modal.download_title": "Baixar LittleTec Studio para Windows",
    "modal.download_desc": "Versão completa portátil (.exe) com suporte direto e ultra-rápido a USB. Não requer instalador.",
    "modal.download_file": "LittleTec-Studio.exe (Portátil ~155 MB)",
    "modal.download_now": "Iniciar Download",
    "modal.github_releases": "Abrir página de Releases no GitHub",
    "modal.close": "Fechar",
  },
  en: {
    // Main navigation
    "nav.mapping": "Key Mapping",
    "nav.knobs": "Knobs & Dials",
    "nav.lighting": "Lighting",
    "nav.profiles": "Profiles",
    "nav.diagnostics": "Diagnostics",
    "nav.tests": "Key Tester",

    // Page headings
    "page.mapping.title": "One keyboard. Infinite possibilities.",
    "page.mapping.desc": "Turn small motions into powerful shortcuts.",
    "page.knobs.title": "Your rhythm, in every turn.",
    "page.knobs.desc": "Customize each direction and monitor controls in real time.",
    "page.lighting.title": "Find your frequency.",
    "page.lighting.desc": "The right color for your workflow.",
    "page.profiles.title": "Your workflow, always at hand.",
    "page.profiles.desc": "Create, organize, and carry your configurations anywhere.",
    "page.diagnostics.title": "Everything in place.",
    "page.diagnostics.desc": "Connection, backups, and device information.",
    "page.tests.title": "Everything under control.",
    "page.tests.desc": "Test your keys, shortcuts, and sequences in real time.",

    // Device state & topbar
    "device.connected": "Keyboard connected",
    "device.connected_usb": "Connected via USB",
    "device.local": "Local mode",
    "device.editor_local": "Local editor",
    "device.busy": "Operation in progress",
    "device.connect": "Connect keyboard",
    "device.read": "Read keyboard",
    "device.apply": "Apply mapping",
    "device.review": "Review changes",
    "device.undo": "Undo",
    "device.redo": "Redo",
    "device.save": "Save profile",
    "device.export": "Export",
    "device.import": "Import",
    "device.layer": "Layer",

    // Platform actions
    "action.download_desktop": "Download Desktop",
    "action.download_desktop_hint": "Download portable Windows executable (.exe)",
    "action.open_web": "Open Web App",
    "action.open_web_hint": "Open studio in your default browser",

    // Sidebar
    "sidebar.workspace": "WORKSPACE",
    "sidebar.device": "DEVICE",
    "sidebar.security_title": "Your keyboard. Your data.",
    "sidebar.security_desc_desktop": "Drafts saved in this app.\nNo account, no cloud.",
    "sidebar.security_desc_web": "Drafts saved in this browser.\nNo account, no cloud.",
    "sidebar.theme_dark": "Dark theme",
    "sidebar.theme_light": "Light theme",
    "sidebar.getting_started": "Getting started",
    "sidebar.help": "Help",
    "sidebar.language": "Language",

    // Footer
    "footer.tagline": "Built for the way you create.",
    "footer.spec": "12 keys. 2 knobs. Total control.",

    // Tester & macros
    "tests.title": "Key & Macro Tester",
    "tests.desc": "Press keys on your keyboard to test shortcuts, modifiers, and macros in real time.",
    "tests.eyebrow": "REAL-TIME DIAGNOSTICS & VALIDATION",
    "tests.clear_records": "Clear logs",
    "tests.card_capture": "Key & Knob Capture",
    "tests.focus_active": "FOCUS ACTIVE",
    "tests.click_focus": "CLICK TO FOCUS",
    "tests.monitoring": "Monitoring macropad keys and knob turns…",
    "tests.click_area": "Click this area to focus and capture inputs",
    "tests.placeholder": "Press any key or rotate knobs to test",
    "tests.physical_code": "Physical code",
    "tests.registered_at": "Logged at",
    "tests.modifiers_title": "Real-time physical modifiers:",
    "tests.typing_card": "Text Macro Testing Area",
    "tests.clear_text": "Clear text",
    "tests.chars": "chars",
    "tests.typing_placeholder": "Click here and press configured macropad keys to test sequential typing...",
    "tests.events_card": "Detected Events Log",
    "tests.event_singular": "event",
    "tests.event_plural": "events",
    "tests.no_events": "No events recorded",
    "tests.no_events_desc": "Focus the box on the left and trigger keys, combos, or extended keys F13–F24.",

    // Presets
    "presets.title": "APP-READY PRESETS",
    "presets.desc": "Complete 1-click configurations for the 12+2 macropad",
    "presets.apply": "Apply preset",

    // Macro recorder
    "macro.record": "Record sequence",
    "macro.start": "Start Recording",
    "macro.pause": "Pause Recording",
    "macro.assign": "Assign Sequence",
    "macro.steps": "steps",

    // Download modal
    "modal.download_title": "Download LittleTec Studio for Windows",
    "modal.download_desc": "Full portable version (.exe) with direct ultra-fast USB access. No installer required.",
    "modal.download_file": "LittleTec-Studio.exe (Portable ~155 MB)",
    "modal.download_now": "Start Download",
    "modal.github_releases": "Open GitHub Releases Page",
    "modal.close": "Close",
  },
  es: {
    // Navegación principal
    "nav.mapping": "Mapeo de Teclas",
    "nav.knobs": "Giratorios",
    "nav.lighting": "Iluminación",
    "nav.profiles": "Perfiles",
    "nav.diagnostics": "Diagnóstico",
    "nav.tests": "Probador",

    // Encabezados de página
    "page.mapping.title": "Un teclado. Infinitas posibilidades.",
    "page.mapping.desc": "Transforma pequeños movimientos en grandes atajos.",
    "page.knobs.title": "Tu ritmo, en cada giro.",
    "page.knobs.desc": "Personaliza cada dirección y sigue tus controles en vivo.",
    "page.lighting.title": "Encuentra tu frecuencia.",
    "page.lighting.desc": "El color correcto para cada forma de trabajar.",
    "page.profiles.title": "Tu flujo, siempre a mano.",
    "page.profiles.desc": "Crea, organiza y lleva tus configuraciones contigo.",
    "page.diagnostics.title": "Todo en su lugar.",
    "page.diagnostics.desc": "Conexión, copias e información de tu dispositivo.",
    "page.tests.title": "Todo bajo control.",
    "page.tests.desc": "Prueba tus teclas, atajos y secuencias en tiempo real.",

    // Estado del dispositivo y barra superior
    "device.connected": "Teclado conectado",
    "device.connected_usb": "Conectado vía USB",
    "device.local": "Modo local",
    "device.editor_local": "Editor local",
    "device.busy": "Operación en progreso",
    "device.connect": "Conectar teclado",
    "device.read": "Leer teclado",
    "device.apply": "Aplicar mapeo",
    "device.review": "Revisar cambios",
    "device.undo": "Deshacer",
    "device.redo": "Rehacer",
    "device.save": "Guardar perfil",
    "device.export": "Exportar",
    "device.import": "Importar",
    "device.layer": "Capa",

    // Acciones de plataforma
    "action.download_desktop": "Descargar Desktop",
    "action.download_desktop_hint": "Descargar ejecutable portátil para Windows (.exe)",
    "action.open_web": "Acceder a Web",
    "action.open_web_hint": "Abrir aplicación en el navegador predeterminado",

    // Barra lateral
    "sidebar.workspace": "TU ESPACIO",
    "sidebar.device": "DISPOSITIVO",
    "sidebar.security_title": "Tu teclado. Tus datos.",
    "sidebar.security_desc_desktop": "Borradores guardados en esta aplicación.\nSin cuenta, sin nube.",
    "sidebar.security_desc_web": "Borradores guardados en este navegador.\nSin cuenta, sin nube.",
    "sidebar.theme_dark": "Tema oscuro",
    "sidebar.theme_light": "Tema claro",
    "sidebar.getting_started": "Primeros pasos",
    "sidebar.help": "Ayuda",
    "sidebar.language": "Idioma",

    // Pie de página
    "footer.tagline": "Hecho para tu manera de crear.",
    "footer.spec": "12 teclas. 2 perillas. Tu control.",

    // Probador de teclas y macros
    "tests.title": "Probador de Teclas y Macros",
    "tests.desc": "Presione teclas en su teclado para validar atajos, modificadores y macros en tiempo real.",
    "tests.eyebrow": "DIAGNÓSTICO Y VALIDACIÓN EN TIEMPO REAL",
    "tests.clear_records": "Limpiar registros",
    "tests.card_capture": "Captura de Teclas y Perillas",
    "tests.focus_active": "FOCO ACTIVO",
    "tests.click_focus": "CLIC PARA ENFOCAR",
    "tests.monitoring": "Monitoreando teclas y giros del teclado…",
    "tests.click_area": "Haga clic en esta área para enfocar y capturar clics",
    "tests.placeholder": "Presione cualquier tecla o gire las perillas para probar",
    "tests.physical_code": "Código físico",
    "tests.registered_at": "Registrado a las",
    "tests.modifiers_title": "Modificadores físicos en tiempo real:",
    "tests.typing_card": "Área de Prueba para Macros de Texto",
    "tests.clear_text": "Limpiar texto",
    "tests.chars": "carac.",
    "tests.typing_placeholder": "Haga clic aquí y presione teclas configuradas para probar la escritura continua...",
    "tests.events_card": "Registro de Eventos Detectados",
    "tests.event_singular": "evento",
    "tests.event_plural": "eventos",
    "tests.no_events": "Ningún evento registrado",
    "tests.no_events_desc": "Enfoque el cuadro a la izquierda y accione teclas, combinaciones o teclas extendidas F13–F24.",

    // Plantillas
    "presets.title": "PLANTILLAS POR APLICACIÓN",
    "presets.desc": "Configuraciones completas de 1 clic para el teclado 12+2",
    "presets.apply": "Aplicar plantilla",

    // Grabador de macros
    "macro.record": "Grabar secuencia",
    "macro.start": "Iniciar Grabación",
    "macro.pause": "Pausar Grabación",
    "macro.assign": "Asignar Secuencia",
    "macro.steps": "etapas",

    // Modal de descarga
    "modal.download_title": "Descargar LittleTec Studio para Windows",
    "modal.download_desc": "Versión completa portátil (.exe) con soporte directo y rápido por USB. Sin instalación.",
    "modal.download_file": "LittleTec-Studio.exe (Portátil ~155 MB)",
    "modal.download_now": "Iniciar Descarga",
    "modal.github_releases": "Abrir página de Releases en GitHub",
    "modal.close": "Cerrar",
  },
};

const LANG_STORAGE_KEY = "littletec-language";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "pt-BR";
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language;
    return stored === "en" || stored === "es" ? stored : "pt-BR";
  } catch {
    return "pt-BR";
  }
}

let currentLang: Language = typeof window !== "undefined" ? getStoredLanguage() : "pt-BR";
const listeners = new Set<(lang: Language) => void>();

export function setAppLanguage(newLang: Language) {
  currentLang = newLang;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
      window.dispatchEvent(new CustomEvent("littletec-language-change", { detail: newLang }));
    } catch {
      // ignore storage errors
    }
  }
  for (const listener of listeners) {
    listener(newLang);
  }
}

export function useI18n() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") return currentLang;
    return "pt-BR";
  });

  useEffect(() => {
    const handler = (l: Language) => setLang(l);
    listeners.add(handler);
    const stored = getStoredLanguage();
    if (stored !== lang) {
      currentLang = stored;
      setLang(stored);
    }
    return () => {
      listeners.delete(handler);
    };
  }, [lang]);

  function changeLanguage(newLang: Language) {
    setAppLanguage(newLang);
  }

  function t(key: string, fallback?: string): string {
    return DICTIONARY[lang]?.[key] ?? DICTIONARY["pt-BR"]?.[key] ?? fallback ?? key;
  }

  return { lang, changeLanguage, t };
}
