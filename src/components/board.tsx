import type { CSSProperties } from "react";
import {
  Keyboard as KeyboardIcon,
  ArrowLeft,
  ArrowRight,
  Command,
  Copy,
  CornerDownLeft,
  MousePointer2,
  Play,
  Scissors,
  Search,
  SkipBack,
  SkipForward,
  Undo2,
  Volume2,
  VolumeX,
  Save,
  Camera,
  Circle,
  ChevronDown,
  Sun,
  SunDim,
  Monitor,
  Music2,
  Calculator,
  Mail,
  Globe,
  RefreshCw,
  LockKeyhole,
  FolderOpen,
  PanelsTopLeft,
  Timer,
  ArrowUp,
  ArrowDown,
  Square,
  Volume1,
  AudioLines,
} from "lucide-react";
import type { Action, Profile } from "@/lib/profile";
import { label, positionLabel } from "@/lib/profile";
import type { LiveView } from "@/lib/live";

export function ActionIcon({
  action,
  size = 21,
}: {
  action: Action;
  size?: number;
}) {
  const props = { size, strokeWidth: 1.6 };
  if (action.type === "media") {
    const Icons: Record<string, typeof Play> = {
      previous: SkipBack,
      next: SkipForward,
      play_pause: Play,
      mute: VolumeX,
      volume_up: Volume2,
      volume_down: Volume1,
      stop: Square,
      bass_up: AudioLines,
      bass_down: AudioLines,
      treble_up: AudioLines,
      treble_down: AudioLines,
      brightness_up: Sun,
      brightness_down: SunDim,
      computer: Monitor,
      media_player: Music2,
      calculator: Calculator,
      email: Mail,
      browser_home: Globe,
      browser_refresh: RefreshCw,
      browser_forward: ArrowRight,
      browser_back: ArrowLeft,
    };
    const Icon = Icons[action.command] || Play;
    return <Icon {...props} />;
  }
  if (action.type === "mouse") return <MousePointer2 {...props} />;
  if (action.type === "keyboard") {
    const s = action.steps[0];
    if (s.modifiers.includes("Ctrl")) {
      const Icons: Record<string, typeof Copy> = {
        C: Copy,
        V: CornerDownLeft,
        X: Scissors,
        Z: Undo2,
        S: Save,
        F: Search,
      };
      const Icon = Icons[s.key];
      if (Icon) return <Icon {...props} />;
    }
    if (s.modifiers.includes("Win")) {
      const Icon =
        s.key === "S" && s.modifiers.includes("Shift")
          ? Camera
          : s.key === "L"
            ? LockKeyhole
            : s.key === "D"
              ? PanelsTopLeft
              : s.key === "E"
                ? FolderOpen
                : Command;
      return <Icon {...props} />;
    }
    if (s.key === "Left") return <ArrowLeft {...props} />;
    if (s.key === "Right") return <ArrowRight {...props} />;
    if (s.key === "Up") return <ArrowUp {...props} />;
    if (s.key === "Down") return <ArrowDown {...props} />;
    if (
      !s.modifiers.length &&
      action.steps.length === 1 &&
      /^([A-Z0-9]|F\d+)$/.test(s.key)
    )
      return <span className="key-character">{s.key}</span>;
    return <Command {...props} />;
  }
  if (action.type === "delay") return <Timer {...props} />;
  return <Circle {...props} />;
}
const friendly: Record<string, string> = {
  "Ctrl + C": "Copiar",
  "Ctrl + V": "Colar",
  "Ctrl + X": "Recortar",
  "Ctrl + Z": "Desfazer",
  "Ctrl + S": "Salvar",
  "Ctrl + F": "Buscar",
  "Alt + Tab": "Alternar janela",
  "Shift + Win + S": "Captura de tela",
  "Win + Shift + S": "Captura de tela",
};
export function Board({
  profile,
  layer,
  selected,
  onSelect,
  changed,
  color,
  large = false,
  live,
}: {
  profile: Profile;
  layer: number;
  selected: number;
  onSelect: (n: number) => void;
  changed: number[];
  color: string;
  large?: boolean;
  live?: LiveView;
}) {
  if (profile.key_count !== 12 || profile.encoder_count !== 2)
    return (
      <DraftBoard
        profile={profile}
        layer={layer}
        selected={selected}
        onSelect={onSelect}
        changed={changed}
        color={color}
      />
    );
  return (
    <div
      className={`board-scene ${large ? "board-large" : ""}`}
      style={{ "--led": color } as CSSProperties}
    >
      <div className="board-shadow" />
      <div className="hardware">
        <div className="hardware-top">
          <span className="hardware-brand">
            little<span>tec</span>
            <i />
          </span>
          <span className="hardware-model">MACROPAD / 12.2</span>
          <span className="hardware-screw" />
        </div>
        <div className="hardware-body">
          <div className="key-grid">
            {profile.layers[layer].slice(0, 12).map((action, index) => (
              <button
                key={index}
                className={`keycap ${selected === index ? "selected" : ""} ${changed.includes(index) ? "changed" : ""} ${live?.active.includes(index) ? "live-pressed" : ""}`}
                onClick={() => onSelect(index)}
                aria-label={`${positionLabel(index)}: ${label(action)}`}
                aria-pressed={selected === index}
              >
                <span className="key-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <ActionIcon action={action} />
                <span className="key-label">
                  {friendly[label(action)] || label(action)}
                </span>
                {changed.includes(index) && <span className="key-dot" />}
                {live?.pulses[index] && (
                  <span
                    key={live.pulses[index].id}
                    className={`input-flash ${live.pulses[index].ambiguous ? "ambiguous" : ""}`}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="knob-column">
            {[0, 1].map((knob) => (
              <div className="knob-group" key={knob}>
                <button
                  className={`knob ${selected === 13 + knob * 3 ? "selected" : ""} ${live?.active.includes(13 + knob * 3) ? "live-pressed" : ""}`}
                  onClick={() => onSelect(13 + knob * 3)}
                  aria-label={`Giro ${knob + 1}: clique`}
                >
                  <span
                    className="knob-dial"
                    style={{
                      transform: `rotate(${live?.angles[knob] ?? 0}deg)`,
                    }}
                    data-angle={live?.angles[knob] ?? 0}
                    data-testid={`knob-dial-${knob}`}
                  >
                    <span className="knob-indicator" />
                    <span className="knob-inner" />
                  </span>
                  {live?.pulses[13 + knob * 3] && (
                    <span
                      className={`input-flash round ${live.pulses[13 + knob * 3].ambiguous ? "ambiguous" : ""}`}
                      key={live.pulses[13 + knob * 3].id}
                    />
                  )}
                </button>
                <div className="knob-caption">GIRO {knob + 1}</div>
                <div className="knob-controls">
                  {[0, 1, 2].map((d) => (
                    <button
                      key={d}
                      onClick={() => onSelect(12 + knob * 3 + d)}
                      className={`${selected === 12 + knob * 3 + d ? "active" : ""} ${live?.active.includes(12 + knob * 3 + d) ? "receiving" : ""}`}
                      aria-label={positionLabel(12 + knob * 3 + d)}
                    >
                      {d === 0 ? (
                        <ArrowLeft size={12} />
                      ) : d === 1 ? (
                        <Circle size={9} />
                      ) : (
                        <ArrowRight size={12} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hardware-bottom">
          <span>MAKE IT YOURS.</span>
          <span>
            USB–C <ChevronDown size={10} />
          </span>
        </div>
      </div>
      <div className="board-legend">
        <span>
          <i /> Posição selecionada
        </span>
        <span>
          <i className="pending-dot" /> Alteração local
        </span>
        <span>
          12 teclas <b>+</b> 2 giratórios
        </span>
      </div>
    </div>
  );
}

function DraftBoard({
  profile,
  layer,
  selected,
  onSelect,
  changed,
  color,
}: {
  profile: Profile;
  layer: number;
  selected: number;
  onSelect: (n: number) => void;
  changed: number[];
  color: string;
}) {
  return (
    <div className="draft-board" style={{ "--led": color } as CSSProperties}>
      <div className="draft-board-note">
        <KeyboardIcon size={15} />
        {profile.model} · Modelo de rascunho, sem envio USB
      </div>
      {profile.key_count > 0 && (
        <div
          className="draft-key-grid"
          style={{
            gridTemplateColumns: `repeat(${profile.columns},minmax(0,1fr))`,
          }}
        >
          {profile.layers[layer].slice(0, profile.key_count).map((a, i) => (
            <button
              key={i}
              className={`keycap ${selected === i ? "selected" : ""} ${changed.includes(i) ? "changed" : ""}`}
              aria-label={`${positionLabel(i, profile.key_count)}: ${label(a)}`}
              onClick={() => onSelect(i)}
            >
              <span className="key-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <ActionIcon action={a} />
              <span className="key-label">{label(a)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="draft-encoders">
        {Array.from({ length: profile.encoder_count }, (_, k) => (
          <div key={k}>
            <span className="eyebrow">GIRO {k + 1}</span>
            {[0, 1, 2].map((d) => {
              const i = profile.key_count + k * 3 + d;
              return (
                <button
                  key={d}
                  className={`draft-encoder-action ${selected === i ? "active" : ""}`}
                  onClick={() => onSelect(i)}
                  aria-label={positionLabel(i, profile.key_count)}
                >
                  <span>{["↶", "●", "↷"][d]}</span>
                  {label(profile.layers[layer][i])}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
