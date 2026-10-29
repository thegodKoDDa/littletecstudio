"use client";
import { useState } from "react";
import {
  Activity,
  ChevronDown,
  Crosshair,
  Pause,
  Play,
  Radio,
  Trash2,
} from "lucide-react";
import { label, positionLabel } from "@/lib/profile";
import type { LiveView } from "@/lib/live";

export function LivePanel({
  view,
  connected,
  enabled,
  follow,
  onToggle,
  onFollow,
  onClear,
}: {
  view: LiveView;
  connected: boolean;
  enabled: boolean;
  follow: boolean;
  onToggle: () => void;
  onFollow: () => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const event = view.events[0];
  const positions = event
    ? [...new Set(event.targets.map((t) => t.position))]
    : [];
  const source =
    event?.confidence === "unique" && positions.length === 1
      ? positionLabel(positions[0])
      : event?.confidence === "ambiguous"
        ? `${positions.length} origens possíveis`
        : "Origem não identificada";
  return (
    <section
      className={`live-panel ${view.ready && enabled ? "is-live" : ""}`}
      aria-label="Entrada ao vivo"
    >
      <div className="live-panel-main">
        <span className="live-radio">
          <Radio size={19} />
        </span>
        <div className="live-intro">
          <span className="eyebrow">ENTRADA AO VIVO</span>
          <strong>
            {!connected
              ? "Conecte para sentir cada movimento."
              : !enabled
                ? "Monitor pausado"
                : view.error
                  ? "Entrada ao vivo indisponível"
                  : view.ready
                    ? "Seu LittleTec, em tempo real."
                    : "Ativando monitor…"}
          </strong>
        </div>
        <div className="live-last" aria-live="polite" aria-atomic="true">
          {event ? (
            <>
              <span
                title={
                  event.observation === "release-context"
                    ? "Atalho identificado pelos eventos de liberação do Windows."
                    : undefined
                }
              >
                {event.action
                  ? label(event.action)
                  : `Movimento ${event.dx ?? 0}, ${event.dy ?? 0}`}
              </span>
              <small>{source}</small>
            </>
          ) : (
            <span className="live-wait">
              {connected
                ? "Gire um knob ou pressione uma tecla."
                : "Teclas, giros, cliques e ações de mouse."}
            </span>
          )}
        </div>
        <span className="live-count" title="Eventos recebidos do dispositivo">
          <Activity size={13} />
          {view.count}
        </span>
        <button
          className={`icon-button live-follow ${follow ? "active" : ""}`}
          aria-label="Seguir entrada na seleção"
          aria-pressed={follow}
          title="Selecionar a posição identificada, sem trocar de camada"
          onClick={onFollow}
        >
          <Crosshair size={16} />
        </button>
        <button
          className="button secondary live-toggle"
          onClick={onToggle}
          disabled={!connected}
          aria-pressed={enabled}
          aria-label={
            enabled ? "Pausar entrada ao vivo" : "Ativar entrada ao vivo"
          }
        >
          {enabled ? <Pause size={14} /> : <Play size={14} />}
          <span>{enabled ? "Pausar" : "Ativar"}</span>
        </button>
        <button
          className={`icon-button ${expanded ? "expanded" : ""}`}
          aria-label="Mostrar atividade recente"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {view.error && enabled && connected && (
        <p className="live-error" role="status">
          {view.error} <button onClick={onToggle}>Pausar monitor</button>
        </p>
      )}
      {expanded && (
        <div className="live-details">
          <div className="live-detail-heading">
            <span>
              Atividade deste dispositivo · {view.deviceCount} coleções de
              entrada
            </span>
            <button className="text-button" onClick={onClear}>
              <Trash2 size={12} />
              Limpar histórico
            </button>
          </div>
          {view.events.length ? (
            <ol>
              {view.events.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <time>{new Date(e.at).toLocaleTimeString("pt-BR")}</time>
                  <strong>
                    {e.action ? label(e.action) : "Movimento do ponteiro"}
                  </strong>
                  <span>
                    {e.confidence === "unique"
                      ? positionLabel(e.targets[0].position)
                      : e.confidence === "ambiguous"
                        ? "Mais de uma posição"
                        : "Sem posição correspondente"}
                  </span>
                  <i className={e.confidence} />
                </li>
              ))}
            </ol>
          ) : (
            <div className="live-empty">
              Nenhuma entrada recebida nesta sessão.
            </div>
          )}
          <p>
            Os eventos vêm exclusivamente do LittleTec. A origem é associada às
            ações gravadas; comandos iguais podem ter mais de uma origem. A
            camada física e o ângulo absoluto não são informados pelo aparelho.
          </p>
        </div>
      )}
    </section>
  );
}
