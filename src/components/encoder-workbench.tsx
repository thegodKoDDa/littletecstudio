"use client";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Copy,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import catalog from "@/lib/catalog.json";
import { label, type Profile } from "@/lib/profile";
import type { LiveView } from "@/lib/live";
import { ActionIcon } from "./board";

export type EncoderCommand =
  | { kind: "preset"; encoder: number; preset: number }
  | { kind: "invert" | "clear"; encoder: number }
  | { kind: "copy"; encoder: number; layer: number }
  | { kind: "other"; encoder: number };
export function EncoderWorkbench({
  profile,
  layer,
  selected,
  changed,
  live,
  onSelect,
  onCommand,
}: {
  profile: Profile;
  layer: number;
  selected: number;
  changed: number[];
  live?: LiveView;
  onSelect: (position: number) => void;
  onCommand: (command: EncoderCommand) => void;
}) {
  if (!profile.encoder_count) return null;
  return (
    <section
      className="encoder-workbench"
      aria-label="Configurações dos giratórios"
    >
      <div className="encoder-section-heading">
        <div>
          <span className="eyebrow">
            <SlidersHorizontal size={13} />
            CONTROLES GIRATÓRIOS
          </span>
          <h2>Mais controle em cada giro.</h2>
          <p>
            Esquerda, clique e direita. Três ações independentes em cada knob.
          </p>
        </div>
        <span className="encoder-layer">Camada {layer + 1}</span>
      </div>
      <div className="encoder-card-grid">
        {Array.from({ length: profile.encoder_count }, (_, encoder) => {
          const start = profile.key_count + encoder * 3;
          const active = live?.active.some((p) => p >= start && p < start + 3);
          return (
            <article
              className={`encoder-card ${active ? "receiving" : ""}`}
              key={encoder}
            >
              <div className="encoder-card-heading">
                <div
                  className="encoder-mini-dial"
                  style={
                    {
                      "--angle": `${live?.angles[encoder] ?? 0}deg`,
                    } as CSSProperties
                  }
                >
                  <span />
                </div>
                <div>
                  <span className="eyebrow">GIRATÓRIO 0{encoder + 1}</span>
                  <h3>Knob {encoder + 1}</h3>
                </div>
                <span className={`encoder-state ${active ? "active" : ""}`}>
                  <i />
                  {active ? "Recebendo" : "3 ações"}
                </span>
              </div>
              <div className="encoder-action-grid">
                {[0, 1, 2].map((direction) => {
                  const position = start + direction;
                  const action = profile.layers[layer][position];
                  const pulse = live?.pulses[position];
                  return (
                    <button
                      className={`encoder-slot ${selected === position ? "selected" : ""} ${live?.active.includes(position) ? "live-pressed" : ""}`}
                      key={direction}
                      onClick={() => onSelect(position)}
                      aria-label={`Configurar knob ${encoder + 1}: ${["esquerda", "clique", "direita"][direction]}`}
                      title={label(action)}
                    >
                      <span className="encoder-direction">
                        {direction === 0 ? (
                          <ArrowLeft size={13} />
                        ) : direction === 2 ? (
                          <ArrowRight size={13} />
                        ) : (
                          <span>●</span>
                        )}
                        {["Esquerda", "Clique", "Direita"][direction]}
                      </span>
                      <ActionIcon action={action} size={19} />
                      <strong>{label(action)}</strong>
                      {changed.includes(position) && (
                        <i className="encoder-dirty" />
                      )}
                      {pulse && (
                        <span
                          className={`input-flash ${pulse.ambiguous ? "ambiguous" : ""}`}
                          key={pulse.id}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="encoder-preset-row">
                <label htmlFor={`encoder-preset-${encoder}`}>
                  Um fluxo pronto
                </label>
                <select
                  id={`encoder-preset-${encoder}`}
                  aria-label={`Preset do knob ${encoder + 1}`}
                  value=""
                  onChange={(e) => {
                    if (e.target.value !== "")
                      onCommand({
                        kind: "preset",
                        encoder,
                        preset: Number(e.target.value),
                      });
                  }}
                >
                  <option value="">Escolher preset…</option>
                  {catalog.ENCODER_PRESETS.map((p, i) => (
                    <option value={i} key={i}>
                      {p.title.replace(/^[^\p{L}\p{N}]+/u, "")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="encoder-card-tools">
                <button
                  onClick={() => onCommand({ kind: "invert", encoder })}
                  title="Inverter as ações de esquerda e direita"
                >
                  <ArrowLeftRight size={13} />
                  Inverter
                </button>
                <select
                  value=""
                  aria-label={`Copiar knob ${encoder + 1}`}
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    if (e.target.value === "other")
                      onCommand({ kind: "other", encoder });
                    else
                      onCommand({
                        kind: "copy",
                        encoder,
                        layer: Number(e.target.value),
                      });
                  }}
                >
                  <option value="">Copiar para…</option>
                  <option value="-1">As três camadas</option>
                  {[0, 1, 2]
                    .filter((i) => i !== layer)
                    .map((i) => (
                      <option value={i} key={i}>
                        Camada {i + 1}
                      </option>
                    ))}
                  {profile.encoder_count === 2 && (
                    <option value="other">O outro knob</option>
                  )}
                </select>
                <button
                  className="encoder-clear"
                  aria-label={`Limpar knob ${encoder + 1}`}
                  onClick={() => onCommand({ kind: "clear", encoder })}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="encoder-note">
        <Copy size={12} />
        <span>
          Presets e cópias alteram seu rascunho. Use Aplicar mapeamento para
          enviar ao teclado.
        </span>
      </div>
    </section>
  );
}
