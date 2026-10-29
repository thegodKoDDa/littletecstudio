"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Keyboard,
  MousePointer2,
  Music2,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
  WandSparkles,
  GripVertical,
} from "lucide-react";
import catalog from "@/lib/catalog.json";
import {
  type Action,
  type Modifier,
  keyboard,
  label,
  fromKeyEvent,
  textAction,
} from "@/lib/profile";
import { ActionIcon } from "./board";

type Props = {
  action: Action;
  selected: number;
  keyCount: number;
  onAssign: (a: Action) => void;
  onPreset: (index: number) => void;
  onInvert: () => void;
  onAdvance: () => void;
};
export function ActionEditor({
  action,
  selected,
  keyCount,
  onAssign,
  onPreset,
  onInvert,
  onAdvance,
}: Props) {
  const [tab, setTab] = useState("Atalhos");
  const [query, setQuery] = useState("");
  const [capture, setCapture] = useState(false);
  const [mods, setMods] = useState<Modifier[]>([]);
  const [delay, setDelay] = useState(250);
  const [append, setAppend] = useState(false);
  const [text, setText] = useState("");
  const [enter, setEnter] = useState(false);
  const [textError, setTextError] = useState("");
  const [stepEdit, setStepEdit] = useState<number | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const entries: { title: string; action: Action }[] =
    tab === "Atalhos"
      ? catalog.SHORTCUT_PRESETS.map(([title, steps]) => ({
          title: title as string,
          action: { type: "keyboard", steps } as Action,
        }))
      : tab === "Teclado"
        ? catalog.KEYS.map((key) => ({
            title: (catalog.KEY_LABELS as Record<string, string>)[key] || key,
            action: keyboard(key, mods),
          }))
        : tab === "Mídia"
          ? Object.entries(catalog.MEDIA).map(([command, title]) => ({
              title,
              action: { type: "media", command },
            }))
          : tab === "Mouse"
            ? Object.entries(catalog.MOUSE).map(([command, title]) => ({
                title,
                action: {
                  type: "mouse",
                  command,
                  modifiers: mods.filter((m) =>
                    ["Ctrl", "Shift", "Alt"].includes(m),
                  ),
                },
              }))
            : [];
  function assign(a: Action) {
    if (append && a.type === "keyboard" && action.type === "keyboard") {
      if (action.steps.length + a.steps.length > 20) {
        setTextError("O teclado comporta até 20 etapas por posição.");
        return;
      }
      onAssign({ ...action, steps: [...action.steps, ...a.steps] });
    } else onAssign(a);
  }
  return (
    <section className="inspector">
      <div className="inspector-heading">
        <span className="eyebrow">EDITOR DE AÇÃO</span>
        <span className="key-badge">
          {selected < keyCount
            ? String(selected + 1).padStart(2, "0")
            : `G${Math.floor((selected - keyCount) / 3) + 1}`}
        </span>
      </div>
      <h2>
        {selected < keyCount
          ? `Tecla ${String(selected + 1).padStart(2, "0")}`
          : `Giratório ${Math.floor((selected - keyCount) / 3) + 1}`}
      </h2>
      <p className="muted">
        {selected < keyCount
          ? "Um toque. Do seu jeito."
          : ["Giro à esquerda", "Clique central", "Giro à direita"][
              (selected - keyCount) % 3
            ]}
      </p>
      <div className="current-action">
        <span className="action-symbol">
          <ActionIcon action={action} />
        </span>
        <div>
          <span className="eyebrow">AÇÃO ATUAL</span>
          <strong>{label(action)}</strong>
        </div>
        <button
          className="icon-button"
          aria-label="Limpar posição"
          onClick={() => onAssign({ type: "none" })}
        >
          <Trash2 size={15} />
        </button>
      </div>
      <button
        className={`capture-button ${capture ? "listening" : ""}`}
        onClick={() => setCapture(!capture)}
        onKeyDown={(e) => {
          if (!capture) return;
          e.preventDefault();
          e.stopPropagation();
          if (e.code === "Escape") {
            setCapture(false);
            return;
          }
          const a = fromKeyEvent(e.nativeEvent);
          if (a) {
            assign(a);
            setCapture(false);
            if (autoAdvance) onAdvance();
          }
        }}
      >
        <Keyboard size={17} />
        <span>
          {capture ? "Pressione seu atalho…" : "Capturar do meu teclado"}
        </span>
        <span className="tiny-key">{capture ? "Esc" : "⌨"}</span>
      </button>
      <p className="capture-help">
        {capture
          ? "Esc cancela. Alguns atalhos são reservados pelo navegador."
          : "Clique para ouvir a próxima tecla ou combinação."}
      </p>
      <label className="capture-advance">
        <input
          type="checkbox"
          checked={autoAdvance}
          onChange={(e) => setAutoAdvance(e.target.checked)}
        />
        Avançar após capturar
      </label>
      {selected >= keyCount && (
        <div className="encoder-options">
          <label className="field-label">Preset para o giro inteiro</label>
          <select
            aria-label="Preset do giratório"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value !== "") onPreset(Number(e.target.value));
              e.target.value = "";
            }}
          >
            <option value="">Escolher preset…</option>
            {catalog.ENCODER_PRESETS.map((p, i) => (
              <option value={i} key={p.title}>
                {p.title}
              </option>
            ))}
          </select>
          <button className="text-button" onClick={onInvert}>
            ⇄ Inverter esquerda / direita
          </button>
        </div>
      )}
      <div className="editor-tabs">
        {[
          { name: "Atalhos", icon: WandSparkles },
          { name: "Teclado", icon: Keyboard },
          { name: "Mídia", icon: Music2 },
          { name: "Mouse", icon: MousePointer2 },
          { name: "Atraso", icon: Timer },
        ].map(({ name, icon: Icon }) => (
          <button
            className={tab === name ? "active" : ""}
            onClick={() => setTab(name)}
            key={name}
            title={name}
            aria-label={name}
          >
            <Icon size={15} />
            <span>{name}</span>
          </button>
        ))}
      </div>
      {tab === "Atraso" ? (
        <div className="delay-editor">
          <label className="field-label" htmlFor="delay">
            Tempo de espera
          </label>
          <div className="input-unit">
            <input
              id="delay"
              type="number"
              min="0"
              max="6000"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
            <span>ms</span>
          </div>
          <p className="muted">Ação de atraso independente, de 0 a 6.000 ms.</p>
          <button
            className="button secondary"
            onClick={() =>
              onAssign({
                type: "delay",
                ms: Math.min(6000, Math.max(0, Math.round(delay))),
              })
            }
          >
            Atribuir atraso <Check size={15} />
          </button>
        </div>
      ) : (
        <>
          <label className="search-input">
            <Search size={15} />
            <input
              placeholder="Buscar uma ação…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span>/</span>
          </label>
          {(tab === "Teclado" || tab === "Mouse") && (
            <div className="modifiers">
              {catalog.MODIFIERS.filter(
                (m) => tab !== "Mouse" || ["Ctrl", "Shift", "Alt"].includes(m),
              ).map((m) => (
                <button
                  key={m}
                  className={mods.includes(m as Modifier) ? "active" : ""}
                  onClick={() =>
                    setMods(
                      mods.includes(m as Modifier)
                        ? mods.filter((v) => v !== m)
                        : [...mods, m as Modifier],
                    )
                  }
                >
                  {m.replace("Right", "R ")}
                </button>
              ))}
              <button
                onClick={() => onAssign(keyboard("", mods))}
                disabled={!mods.length}
                title="Atribuir apenas os modificadores"
              >
                <Check size={12} />
              </button>
            </div>
          )}
          <div className="action-results">
            {entries
              .filter((a) =>
                a.title
                  .toLocaleLowerCase("pt-BR")
                  .includes(query.toLocaleLowerCase("pt-BR")),
              )
              .map((entry, i) => (
                <button key={i} onClick={() => assign(entry.action)}>
                  <ActionIcon action={entry.action} size={15} />
                  <span>{entry.title}</span>
                  <Plus size={14} />
                </button>
              ))}
            {entries.filter((a) =>
              a.title.toLowerCase().includes(query.toLowerCase()),
            ).length === 0 && (
              <p className="empty-search">Nenhuma ação encontrada.</p>
            )}
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={append}
              onChange={(e) => setAppend(e.target.checked)}
            />
            Adicionar à sequência atual{" "}
            <span>
              {action.type === "keyboard" ? action.steps.length : 0}/20
            </span>
          </label>
        </>
      )}
      {action.type === "keyboard" && action.steps.length > 1 && (
        <div className="sequence-editor">
          <span className="eyebrow">
            SEQUÊNCIA · {action.steps.length} ETAPAS
          </span>
          {action.steps.map((step, i) => (
            <div key={i}>
              <GripVertical size={13} />
              <button
                className="sequence-step-name"
                aria-label={`Editar etapa ${i + 1}`}
                onClick={() => setStepEdit(stepEdit === i ? null : i)}
              >
                {label(keyboard(step.key, step.modifiers))}
              </button>
              <button
                className="icon-button"
                disabled={!i}
                aria-label={`Subir etapa ${i + 1}`}
                onClick={() => {
                  const steps = [...action.steps];
                  [steps[i], steps[i - 1]] = [steps[i - 1], steps[i]];
                  onAssign({ ...action, steps });
                }}
              >
                <ArrowUp size={13} />
              </button>
              <button
                className="icon-button"
                disabled={i === action.steps.length - 1}
                aria-label={`Descer etapa ${i + 1}`}
                onClick={() => {
                  const steps = [...action.steps];
                  [steps[i], steps[i + 1]] = [steps[i + 1], steps[i]];
                  onAssign({ ...action, steps });
                }}
              >
                <ArrowDown size={13} />
              </button>
              <button
                className="icon-button"
                aria-label={`Remover etapa ${i + 1}`}
                onClick={() =>
                  onAssign({
                    ...action,
                    steps: action.steps.filter((_, n) => i !== n),
                  })
                }
              >
                <X size={13} />
              </button>
            </div>
          ))}
          {stepEdit !== null && action.steps[stepEdit] && (
            <StepEditor
              step={action.steps[stepEdit]}
              index={stepEdit}
              onChange={(step) =>
                onAssign({
                  ...action,
                  steps: action.steps.map((s, i) =>
                    i === stepEdit ? step : s,
                  ),
                })
              }
            />
          )}
        </div>
      )}
      {textError && (
        <p className="capture-help" role="alert">
          {textError}
        </p>
      )}
      <details className="text-macro">
        <summary>Digitar texto ou números</summary>
        <label className="field-label" htmlFor="macro-text">
          Sequência em posições US · até 20 etapas
        </label>
        <input
          id="macro-text"
          placeholder="Ex.: 1234"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={enter}
            onChange={(e) => setEnter(e.target.checked)}
          />
          Finalizar com Enter
        </label>
        <button
          className="button secondary full"
          onClick={() => {
            try {
              assign(textAction(text, enter));
              setTextError("");
            } catch (e) {
              setTextError((e as Error).message);
            }
          }}
        >
          Atribuir sequência
        </button>
        {textError && (
          <p className="muted" role="alert">
            {textError}
          </p>
        )}
      </details>
      {action.type === "raw" && (
        <p className="muted">
          O registro original será preservado. Sua substituição será recusada
          pelo serviço enquanto os campos não forem interpretados.
        </p>
      )}
    </section>
  );
}

function StepEditor({
  step,
  index,
  onChange,
}: {
  step: { key: string; modifiers: Modifier[] };
  index: number;
  onChange: (step: { key: string; modifiers: Modifier[] }) => void;
}) {
  return (
    <div className="step-detail">
      <label className="field-label">
        Tecla da etapa {index + 1}
        <select
          aria-label={`Tecla da etapa ${index + 1}`}
          value={step.key}
          onChange={(e) => onChange({ ...step, key: e.target.value })}
        >
          <option value="" disabled={!step.modifiers.length}>
            Apenas modificadores
          </option>
          {catalog.KEYS.map((key) => (
            <option key={key} value={key}>
              {(catalog.KEY_LABELS as Record<string, string>)[key] || key}
            </option>
          ))}
        </select>
      </label>
      <div className="modifiers">
        {catalog.MODIFIERS.map((m) => (
          <button
            key={m}
            className={step.modifiers.includes(m as Modifier) ? "active" : ""}
            disabled={
              step.key === "" &&
              step.modifiers.length === 1 &&
              step.modifiers[0] === m
            }
            onClick={() =>
              onChange({
                ...step,
                modifiers: step.modifiers.includes(m as Modifier)
                  ? step.modifiers.filter((v) => v !== m)
                  : [...step.modifiers, m as Modifier],
              })
            }
          >
            {m.replace("Right", "R ")}
          </button>
        ))}
      </div>
    </div>
  );
}
