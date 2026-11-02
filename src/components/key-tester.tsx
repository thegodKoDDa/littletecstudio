"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Keyboard, CheckCircle2, RotateCcw, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type CapturedKey = {
  id: string;
  key: string;
  code: string;
  modifiers: string[];
  time: string;
  type: "down" | "up";
};

export function KeyTester() {
  const { t } = useI18n();
  const [events, setEvents] = useState<CapturedKey[]>([]);
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<CapturedKey | null>(null);
  const [testText, setTestText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const captureBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isFocused) return;

      // Prevent scrolling while testing keys like Space or Arrows
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"].includes(e.code)) {
        e.preventDefault();
      }

      const mods: string[] = [];
      if (e.ctrlKey) mods.push("Ctrl");
      if (e.shiftKey) mods.push("Shift");
      if (e.altKey) mods.push("Alt");
      if (e.metaKey) mods.push("Win");
      setActiveModifiers(mods);

      const displayKey = e.key === " " ? "Space" : e.key;

      const entry: CapturedKey = {
        id: Math.random().toString(36).substring(2, 9),
        key: displayKey,
        code: e.code || "Desconhecido",
        modifiers: mods,
        time: new Date().toLocaleTimeString("pt-BR", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
        }),
        type: "down",
      };

      setLastEvent(entry);
      setEvents((prev) => [entry, ...prev.slice(0, 99)]);
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (!isFocused) return;
      const mods: string[] = [];
      if (e.ctrlKey) mods.push("Ctrl");
      if (e.shiftKey) mods.push("Shift");
      if (e.altKey) mods.push("Alt");
      if (e.metaKey) mods.push("Win");
      setActiveModifiers(mods);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isFocused]);

  function handleClear() {
    setEvents([]);
    setLastEvent(null);
    setTestText("");
    setActiveModifiers([]);
  }

  const isCtrlActive = activeModifiers.includes("Ctrl");
  const isShiftActive = activeModifiers.includes("Shift");
  const isAltActive = activeModifiers.includes("Alt");
  const isWinActive = activeModifiers.includes("Win");

  return (
    <div className="tests-container">
      {/* Hero Header */}
      <div className="tests-hero">
        <div className="tests-hero-icon">
          <Keyboard size={30} />
        </div>
        <div className="tests-hero-content">
          <span className="eyebrow">DIAGNÓSTICO & VALIDAÇÃO EM TEMPO REAL</span>
          <h2>{t("tests.title")}</h2>
          <p>{t("tests.desc")}</p>
        </div>
        <div className="tests-hero-actions">
          {events.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="button secondary"
              title="Limpar todos os registros e texto de teste"
            >
              <RotateCcw size={14} />
              Limpar registros
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="tests-main-grid">
        {/* Coluna Esquerda: Captura & Digitação */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card de Captura */}
          <div className="test-card">
            <div className="test-card-header">
              <span className="test-card-title">
                <Activity size={16} />
                Captura de Teclas & Encoders
              </span>
              <span className="test-card-badge">
                {isFocused ? "FOCO ATIVO" : "CLIQUE P/ FOCAR"}
              </span>
            </div>

            <div
              ref={captureBoxRef}
              tabIndex={0}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                setActiveModifiers([]);
              }}
              className={`test-capture-box ${isFocused ? "active" : ""}`}
            >
              <span className="test-capture-status">
                <span className="status-dot" />
                {isFocused
                  ? "Monitorando teclas e giros do macropad…"
                  : "Clique nesta área para focar e capturar os cliques"}
              </span>

              <div className="test-keycap-display">
                {lastEvent ? (
                  <>
                    {lastEvent.modifiers.map((mod) => (
                      <span key={mod} className="keycap-item" style={{ minWidth: "36px", height: "36px", fontSize: "12px" }}>
                        {mod}
                      </span>
                    ))}
                    <span className="keycap-item">
                      {lastEvent.key}
                    </span>
                  </>
                ) : (
                  <span className="test-keycap-placeholder">
                    Pressione qualquer tecla ou gire os encoders para validar
                  </span>
                )}
              </div>

              {lastEvent && (
                <span className="keycap-code">
                  Código físico: <strong>{lastEvent.code}</strong> · Registrado às {lastEvent.time}
                </span>
              )}
            </div>

            {/* Grid de Modificadores */}
            <div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px", fontWeight: 500 }}>
                Modificadores físicos em tempo real:
              </div>
              <div className="test-modifiers-grid">
                <div className={`modifier-indicator ${isCtrlActive ? "active" : ""}`}>
                  CTRL
                </div>
                <div className={`modifier-indicator ${isShiftActive ? "active" : ""}`}>
                  SHIFT
                </div>
                <div className={`modifier-indicator ${isAltActive ? "active" : ""}`}>
                  ALT
                </div>
                <div className={`modifier-indicator ${isWinActive ? "active" : ""}`}>
                  WIN / CMD
                </div>
              </div>
            </div>
          </div>

          {/* Card de Teste de Digitação de Texto */}
          <div className="test-card">
            <div className="test-card-header">
              <span className="test-card-title">
                <Keyboard size={16} />
                Área de Teste para Macros de Texto
              </span>
              {testText && (
                <button
                  type="button"
                  onClick={() => setTestText("")}
                  className="text-button"
                  style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Trash2 size={12} /> Limpar texto ({testText.length} carac.)
                </button>
              )}
            </div>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Clique aqui e pressione as teclas do macropad configuradas com texto para validar a digitação contínua..."
              className="test-textarea"
            />
          </div>
        </div>

        {/* Coluna Direita: Histórico de Eventos */}
        <div className="test-card" style={{ height: "100%", minHeight: "480px" }}>
          <div className="test-card-header">
            <span className="test-card-title">
              <CheckCircle2 size={16} />
              Registro de Eventos Detectados
            </span>
            <span className="test-card-badge">
              {events.length} {events.length === 1 ? "evento" : "eventos"}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="test-empty-state">
              <Keyboard size={40} />
              <strong style={{ fontSize: "13px", color: "var(--text)" }}>Nenhum evento registrado</strong>
              <p style={{ margin: 0, fontSize: "11px", maxWidth: "260px" }}>
                Ative o foco no bloco à esquerda e acione teclas normais, combinações ou teclas estendidas F13–F24.
              </p>
            </div>
          ) : (
            <div className="test-history-list">
              {events.map((evt) => (
                <div key={evt.id} className="test-history-item">
                  <div className="test-history-keys">
                    {evt.modifiers.map((m) => (
                      <span key={m} className="test-history-mod">
                        {m}
                      </span>
                    ))}
                    <span className="test-history-key">{evt.key}</span>
                    <span className="test-history-code">({evt.code})</span>
                  </div>
                  <span className="test-history-time">{evt.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
