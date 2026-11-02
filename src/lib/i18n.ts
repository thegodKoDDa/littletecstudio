"use client";

import { useEffect, useState } from "react";

export type Language = "pt-BR" | "en" | "es";

export const DICTIONARY: Record<Language, Record<string, string>> = {
  "pt-BR": {
    "nav.mapping": "Mapeamento",
    "nav.knobs": "Giratórios",
    "nav.lighting": "Iluminação",
    "nav.profiles": "Perfis",
    "nav.diagnostics": "Diagnóstico",
    "nav.tests": "Testes",
    "device.connected": "Conectado via USB",
    "device.local": "Editor local",
    "device.connect": "Conectar teclado",
    "device.read": "Ler teclado",
    "device.apply": "Aplicar mapeamento",
    "device.review": "Revisar alterações",
    "footer.tagline": "Feito para o seu jeito de fazer.",
    "footer.spec": "12 teclas. 2 giros. Seu controle.",
    "tests.title": "Campo de Teste de Teclas & Macros",
    "tests.desc": "Pressione as teclas no seu teclado para validar atalhos, modificadores e macros em tempo real.",
    "presets.title": "MODELOS PRONTOS POR APLICATIVO",
    "presets.desc": "Configurações completas de 1 clique para o modelo 12+2",
    "presets.apply": "Aplicar modelo",
    "macro.record": "Gravar sequência",
    "macro.start": "Iniciar Gravação",
    "macro.pause": "Pausar Gravação",
    "macro.assign": "Atribuir Sequência",
    "macro.steps": "etapas",
  },
  en: {
    "nav.mapping": "Key Mapping",
    "nav.knobs": "Knobs & Dials",
    "nav.lighting": "Lighting",
    "nav.profiles": "Profiles",
    "nav.diagnostics": "Diagnostics",
    "nav.tests": "Key Tester",
    "device.connected": "Connected via USB",
    "device.local": "Local Editor",
    "device.connect": "Connect Keyboard",
    "device.read": "Read Keyboard",
    "device.apply": "Apply Mapping",
    "device.review": "Review Changes",
    "footer.tagline": "Built for the way you create.",
    "footer.spec": "12 keys. 2 knobs. Total control.",
    "tests.title": "Key & Macro Tester",
    "tests.desc": "Press keys on your keyboard to test shortcuts, modifiers and macros in real time.",
    "presets.title": "APP-READY PRESETS",
    "presets.desc": "Complete 1-click configurations for the 12+2 macropad",
    "presets.apply": "Apply Preset",
    "macro.record": "Record Sequence",
    "macro.start": "Start Recording",
    "macro.pause": "Pause Recording",
    "macro.assign": "Assign Sequence",
    "macro.steps": "steps",
  },
  es: {
    "nav.mapping": "Mapeo de Teclas",
    "nav.knobs": "Giratorios",
    "nav.lighting": "Iluminación",
    "nav.profiles": "Perfiles",
    "nav.diagnostics": "Diagnóstico",
    "nav.tests": "Probador de Teclas",
    "device.connected": "Conectado vía USB",
    "device.local": "Editor local",
    "device.connect": "Conectar teclado",
    "device.read": "Leer teclado",
    "device.apply": "Aplicar mapeo",
    "device.review": "Revisar cambios",
    "footer.tagline": "Hecho para tu manera de crear.",
    "footer.spec": "12 teclas. 2 perillas. Tu control.",
    "tests.title": "Probador de Teclas y Macros",
    "tests.desc": "Presione teclas en su teclado para validar atajos, modificadores y macros en tiempo real.",
    "presets.title": "PLANTILLAS POR APLICACIÓN",
    "presets.desc": "Configuraciones completas de 1 clic para el teclado 12+2",
    "presets.apply": "Aplicar plantilla",
    "macro.record": "Grabar secuencia",
    "macro.start": "Iniciar Grabación",
    "macro.pause": "Pausar Grabación",
    "macro.assign": "Asignar Secuencia",
    "macro.steps": "etapas",
  },
};

const LANG_STORAGE_KEY = "littletec-language";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "pt-BR";
  const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language;
  return stored === "en" || stored === "es" ? stored : "pt-BR";
}

export function useI18n() {
  const [lang, setLang] = useState<Language>("pt-BR");

  useEffect(() => {
    setLang(getStoredLanguage());
    function onStorage() {
      setLang(getStoredLanguage());
    }
    window.addEventListener("littletec-language-change", onStorage);
    return () => window.removeEventListener("littletec-language-change", onStorage);
  }, []);

  function changeLanguage(newLang: Language) {
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
      window.dispatchEvent(new Event("littletec-language-change"));
    }
  }

  function t(key: string): string {
    return DICTIONARY[lang]?.[key] || DICTIONARY["pt-BR"]?.[key] || key;
  }

  return { lang, changeLanguage, t };
}
