"use client";
import { useEffect, useRef, useState } from "react";
import {
  Sun,
  Moon,
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  Keyboard,
  Layers3,
  Lightbulb,
  LoaderCircle,
  Monitor,
  Palette,
  PlugZap,
  Redo2,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Usb,
  X,
} from "lucide-react";
import catalog from "@/lib/catalog.json";
import {
  type Action,
  type Color,
  type Profile,
  differences,
  download,
  exampleProfile,
  label,
  newProfile,
  parseProfile,
  positionLabel,
} from "@/lib/profile";
import { deviceRequest } from "@/lib/device";
import { Board } from "./board";
import { ActionEditor } from "./action-editor";
import { LivePanel } from "./live-panel";
import { EncoderWorkbench, type EncoderCommand } from "./encoder-workbench";
import { useLiveInput } from "@/lib/use-live-input";

type Page =
  | "Mapeamento"
  | "Giratórios"
  | "Iluminação"
  | "Perfis"
  | "Diagnóstico";
const storageKey = "littletec-web-draft-v1";
type Notice = { text: string; error?: boolean };
const pageInfo: Record<Page, { title: string; description: string }> = {
  Mapeamento: {
    title: "Um teclado. Infinitas possibilidades.",
    description: "Transforme pequenos movimentos em grandes atalhos.",
  },
  Giratórios: {
    title: "Seu ritmo, em cada giro.",
    description: "Personalize cada direção e acompanhe seus controles ao vivo.",
  },
  Iluminação: {
    title: "Encontre a sua frequência.",
    description: "A cor certa para cada jeito de trabalhar.",
  },
  Perfis: {
    title: "Seu fluxo, sempre à mão.",
    description: "Crie, organize e leve suas configurações com você.",
  },
  Diagnóstico: {
    title: "Tudo no lugar.",
    description: "Conexão, cópias e informações do seu dispositivo.",
  },
};
export function Studio() {
  const [profile, setProfile] = useState<Profile>(exampleProfile);
  const [baseline, setBaseline] = useState<Profile>(exampleProfile);
  const [fileSaved, setFileSaved] = useState<string>("");
  const [past, setPast] = useState<Profile[]>([]);
  const [future, setFuture] = useState<Profile[]>([]);
  const [page, setPage] = useState<Page>("Mapeamento");
  const [layer, setLayer] = useState(0);
  const [selection, setSelected] = useState(0);
  const selected = Math.max(
    page === "Giratórios" && profile.encoder_count ? profile.key_count : 0,
    Math.min(selection, profile.layers[layer].length - 1),
  );
  const hardwareCompatible =
    profile.key_count === 12 && profile.encoder_count === 2;
  const [theme, setTheme] = useState("dark");
  const [draftModel, setDraftModel] = useState("12+2");
  const [customKeys, setCustomKeys] = useState(12);
  const [customEncoders, setCustomEncoders] = useState(2);
  const [customColumns, setCustomColumns] = useState(4);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [revision, setRevision] = useState("");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [followInput, setFollowInput] = useState(false);
  const live = useLiveInput(
    connected && liveAvailable && liveEnabled,
    revision,
  );
  const hasDraft = useRef(false);
  const [ready, setReady] = useState(false);
  const isDesktop = ready && typeof window !== "undefined" && !!window.littleTecDesktop;
  const [review, setReview] = useState(false);
  const [help, setHelp] = useState(false);
  const [diagnostic, setDiagnostic] = useState<unknown>(null);
  const [lastSent, setLastSent] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [clipboard, setClipboard] = useState<Action | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<Profile[]>([]);
  const importRef = useRef<HTMLInputElement>(null);
  const backupFolderRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const changes = differences(baseline, profile);
  const currentChanges = changes
    .filter((d) => d.layer === layer)
    .map((d) => d.position);
  const lighting = profile.lighting[layer];
  const color = lighting.color ? catalog.COLORS[lighting.color][1] : "#77808b";
  const dirty = JSON.stringify(profile) !== fileSaved;
  useEffect(() => {
    try {
      const draft = localStorage.getItem(storageKey);
      if (draft) {
        const p = parseProfile(JSON.parse(draft));
        setProfile(p);
        setBaseline(structuredClone(p));
        hasDraft.current = true;
      }
      const saved = JSON.parse(
        localStorage.getItem("littletec-web-profiles") || "[]",
      );
      setSavedProfiles(saved.map(parseProfile));
    } catch {
      setNotice({
        text: "Não foi possível recuperar o rascunho local. O exemplo foi carregado.",
        error: true,
      });
    }
    try {
      setTheme(localStorage.getItem("littletec-web-theme") || "dark");
    } catch {
      /* O editor funciona sem armazenamento persistente. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(profile));
      } catch {
        setNotice({
          text: "O navegador não conseguiu salvar o rascunho. Exporte o perfil para preservar seu trabalho.",
          error: true,
        });
      }
    }
  }, [profile, ready]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (busy) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [busy]);
  useEffect(() => {
    if (!review && !help) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,[tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setHelp(false);
        setReview(false);
        return;
      }
      if (e.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [review, help]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (ready) {
      try {
        localStorage.setItem("littletec-web-theme", theme);
      } catch {
        /* Tema vale para esta sessão. */
      }
    }
  }, [theme, ready]);
  useEffect(() => {
    function shortcuts(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || review || help) return;
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,.capture-button")) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        if (e.shiftKey) exportProfile();
        else saveInBrowser();
      } else if (key === "o") {
        e.preventDefault();
        importRef.current?.click();
      } else if (key === "n") {
        e.preventDefault();
        update(newProfile());
      } else if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  });
  useEffect(() => {
    if (live.view.disconnected) {
      setConnected(false);
      setRevision("");
      setNotice({
        text: "Teclado desconectado. Seu rascunho foi mantido.",
        error: true,
      });
    }
  }, [live.view.disconnected]);
  const latestInput = live.view.events[0];
  useEffect(() => {
    if (
      followInput &&
      hardwareCompatible &&
      latestInput?.confidence === "unique" &&
      latestInput.targets.length
    ) {
      const position = latestInput.targets[0].position;
      if (page === "Giratórios" && position < profile.key_count) return;
      setSelected(position);
    }
  }, [
    latestInput?.id,
    followInput,
    hardwareCompatible,
    page,
    profile.key_count,
  ]);
  function encoderCommand(command: EncoderCommand) {
    if (command.encoder < 0 || command.encoder >= profile.encoder_count) return;
    const p = structuredClone(profile);
    const start = p.key_count + command.encoder * 3;
    const actions = p.layers[layer].slice(start, start + 3);
    if (actions.some((a) => a.type === "raw")) {
      setNotice({
        text: "Este giro contém dados não interpretados. As ações originais foram preservadas.",
        error: true,
      });
      return;
    }
    if (command.kind === "preset")
      catalog.ENCODER_PRESETS[command.preset].actions.forEach(
        (a, i) => (p.layers[layer][start + i] = structuredClone(a) as Action),
      );
    else if (command.kind === "invert")
      [p.layers[layer][start], p.layers[layer][start + 2]] = [
        p.layers[layer][start + 2],
        p.layers[layer][start],
      ];
    else if (command.kind === "clear")
      for (let i = 0; i < 3; i++) p.layers[layer][start + i] = { type: "none" };
    else if (command.kind === "copy")
      for (const target of command.layer === -1 ? [0, 1, 2] : [command.layer])
        actions.forEach(
          (a, i) => (p.layers[target][start + i] = structuredClone(a)),
        );
    else if (command.kind === "other" && p.encoder_count === 2) {
      const target = p.key_count + (1 - command.encoder) * 3;
      actions.forEach(
        (a, i) => (p.layers[layer][target + i] = structuredClone(a)),
      );
    }
    update(p);
  }
  function update(next: Profile) {
    hasDraft.current = true;
    const clean = parseProfile(next);
    if (JSON.stringify(clean) === JSON.stringify(profile)) return;
    setPast((p) => [...p.slice(-49), structuredClone(profile)]);
    setFuture([]);
    setProfile(clean);
  }
  function assign(a: Action) {
    const p = structuredClone(profile);
    p.layers[layer][selected] = a;
    update(p);
  }
  function undo() {
    if (!past.length) return;
    setFuture((f) => [structuredClone(profile), ...f]);
    setProfile(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setPast((p) => [...p, structuredClone(profile)]);
    setProfile(future[0]);
    setFuture((f) => f.slice(1));
  }
  async function run(operation: string, payload: Record<string, unknown> = {}) {
    if (busy) return;
    const sent = structuredClone(profile);
    setBusy(operation);
    setNotice(null);
    try {
      const result = await deviceRequest(operation, {
        ...payload,
        ...(revision ? { revision } : {}),
      });
      if (result.revision) setRevision(result.revision);
      if (operation === "read" && result.profile) {
        const p = parseProfile(result.profile);
        setBaseline(p);
        setConnected(true);
        setLiveAvailable(result.liveAvailable === true);
        if (result.lastLighting)
          setLastSent(
            result.lastLighting.map((value) => {
              if (!value || typeof value !== "object") return null;
              const v = value as { color?: Color; mode?: number };
              return v.color &&
                Object.hasOwn(catalog.COLORS, v.color) &&
                typeof v.mode === "number"
                ? `${catalog.COLORS[v.color][0]} · modo ${v.mode}`
                : null;
            }),
          );
        if (JSON.stringify(profileRef.current) === JSON.stringify(sent)) {
          if (
            hasDraft.current &&
            !window.confirm(
              "Leitura concluída. Substituir seu rascunho pelo mapeamento lido?",
            )
          ) {
            setNotice({ text: "Teclado lido. O rascunho foi preservado." });
            return;
          }
          setProfile({ ...p, lighting: sent.lighting });
          setPast([]);
          setFuture([]);
        }
        setNotice({
          text: "Teclado conectado. Mapeamento das três camadas lido.",
        });
      } else if (operation === "backup_export") {
        download(result.backup, "littletec-copia-bruta.json");
        setNotice({
          text: "Cópia dos 72 relatórios exportada. LED não está incluído.",
        });
      } else if (operation === "backup_import" && result.profile) {
        update(parseProfile(result.profile));
        setNotice({
          text: result.message || "Cópia importada com hashes verificados.",
        });
      } else if (operation === "apply") {
        setBaseline(sent);
        setNotice({
          text:
            result.message || "Mapeamento enviado e conferido por releitura.",
        });
      } else if (operation === "led" || operation === "led_all") {
        setLastSent((prev) =>
          prev.map((v, i) =>
            operation === "led_all" || i === layer
              ? `${catalog.COLORS[payload.color as Color][0]} · modo ${payload.mode}`
              : v,
          ),
        );
        if (operation === "led_all")
          setProfile((current) => ({
            ...current,
            lighting: current.lighting.map((v, i) =>
              JSON.stringify(v) === JSON.stringify(sent.lighting[i])
                ? {
                    mode: payload.mode as number,
                    color: payload.color as Color,
                  }
                : v,
            ),
          }));
        setNotice({ text: result.message || "Iluminação enviada." });
      } else if (operation === "diagnose") {
        setDiagnostic(result.diagnostic);
        setNotice({ text: "Diagnóstico concluído." });
      }
    } catch (e) {
      if (operation === "led" || operation === "led_all")
        setLastSent((prev) =>
          prev.map((v, i) =>
            operation === "led_all" || i === layer ? null : v,
          ),
        );
      if (["read", "apply", "led", "led_all"].includes(operation)) {
        setConnected(false);
        setRevision("");
      }
      setNotice({
        text: e instanceof Error ? e.message : "Falha na operação.",
        error: true,
      });
    } finally {
      setBusy("");
    }
  }
  function setLight(mode: number, color: Color) {
    const p = structuredClone(profile);
    p.lighting[layer] = { mode, color };
    update(p);
  }
  function exportProfile() {
    download(
      profile,
      `${profile.name.replace(/[^\p{L}\p{N}\-_]/gu, "-")}.json`,
    );
    setFileSaved(JSON.stringify(profile));
    setNotice({
      text: "Perfil exportado. Salvar arquivo não envia alterações ao teclado.",
    });
  }
  async function importProfile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error("O perfil excede 1 MB.");
      const content = JSON.parse(await file.text());
      if (content.format === "littletec-backup") {
        await run("backup_import", { backup: content });
        return;
      }
      const p = parseProfile(content);
      update(p);
      setNotice({ text: "Perfil importado. Revise antes de aplicar." });
    } catch {
      setNotice({
        text: "Perfil inválido. Importe um arquivo LittleTec v1 ou v2 com quantidades consistentes.",
        error: true,
      });
    } finally {
      e.target.value = "";
    }
  }
  async function importBackupFolder(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    try {
      const manifest = files.find((f) => f.name === "manifest.json");
      if (!manifest || manifest.size > 1_000_000)
        throw new Error(
          "Selecione a pasta de uma cópia LittleTec com manifest.json.",
        );
      const layers: Record<string, string> = {};
      for (const name of ["layer-1.bin", "layer-2.bin", "layer-3.bin"]) {
        const file = files.find((f) => f.name === name);
        if (!file || file.size !== 1560)
          throw new Error("A cópia deve conter três camadas de 1.560 bytes.");
        layers[name] = Array.from(
          new Uint8Array(await file.arrayBuffer()),
          (b) => b.toString(16).padStart(2, "0"),
        ).join("");
      }
      await run("backup_import", {
        backup: {
          format: "littletec-backup",
          manifest: JSON.parse(await manifest.text()),
          files: layers,
        },
      });
    } catch (error) {
      setNotice({ text: (error as Error).message, error: true });
    } finally {
      e.target.value = "";
    }
  }
  function persistLibrary(list: Profile[]): boolean {
    try {
      localStorage.setItem("littletec-web-profiles", JSON.stringify(list));
      setSavedProfiles(list);
      return true;
    } catch {
      setNotice({
        text: "O navegador não conseguiu salvar a biblioteca. Exporte o perfil para preservar seu trabalho.",
        error: true,
      });
      return false;
    }
  }
  function saveInBrowser() {
    const list = [
      ...savedProfiles.filter((p) => p.name !== profile.name),
      structuredClone(profile),
    ];
    if (!persistLibrary(list)) return;
    setFileSaved(JSON.stringify(profile));
    setNotice({ text: isDesktop ? "Perfil salvo na biblioteca." : "Perfil salvo neste navegador." });
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setPage("Mapeamento")} aria-label="LittleTec Studio início">
          <span className="brand-mark">
            <Command size={21} />
          </span>
          <span>
            little<span>tec</span>
            <small>STUDIO / {isDesktop ? "DESKTOP" : "WEB"}</small>
          </span>
        </a>
        <div className="workspace-label">
          SEU ESPAÇO <span>01</span>
        </div>
        <nav aria-label="Navegação principal">
          {[
            { name: "Mapeamento", icon: Keyboard },
            { name: "Giratórios", icon: SlidersHorizontal },
            { name: "Iluminação", icon: Lightbulb },
            { name: "Perfis", icon: Layers3 },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              aria-label={name}
              className={page === name ? "active" : ""}
              onClick={() => {
                setPage(name as Page);
                if (
                  name === "Giratórios" &&
                  profile.encoder_count &&
                  selected < profile.key_count
                )
                  setSelected(profile.key_count);
              }}
            >
              <Icon size={18} />
              <span>{name}</span>
              {page === name && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label">DISPOSITIVO</div>
        <button className="device-card" onClick={() => setPage("Diagnóstico")}>
          <span className="device-mini">
            <Keyboard size={27} />
          </span>
          <span>
            <strong>LittleTec 12+2</strong>
            <small>
              <i
                className={connected ? "status-dot connected" : "status-dot"}
              />
              {connected ? "Conectado via USB" : "Editor local"}
            </small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="local-icon">
              <ShieldCheck size={17} />
            </span>
            <strong>Seu teclado. Seus dados.</strong>
            <p>
              Rascunhos salvos {isDesktop ? "neste aplicativo" : "neste navegador"}.
              <br />
              Sem conta, sem nuvem.
            </p>
          </div>
          <button
            className={page === "Diagnóstico" ? "utility active" : "utility"}
            onClick={() => setPage("Diagnóstico")}
          >
            <Settings2 size={17} />
            Diagnóstico
          </button>
          <button className="utility" onClick={() => setHelp(true)}>
            <CircleHelp size={17} />
            Primeiros passos
            <ArrowUpRight size={14} />
          </button>
          <button
            className="utility"
            aria-label="Alternar tema"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}Tema{" "}
            {theme === "dark" ? "claro" : "escuro"}
          </button>
          <div className="sidebar-footer">
            <span>LittleTec Studio</span>
            <span>{isDesktop ? "DESKTOP / LOCAL" : "WEB / LOCAL"}</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Studio <span>/</span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-state">
              <i
                className={connected ? "status-dot connected" : "status-dot"}
              />
              {busy
                ? "Operação em andamento"
                : connected
                  ? "Teclado conectado"
                  : "Modo local"}
            </span>
            <span className="topbar-divider" />
            <button
              className="button connect"
              onClick={() => run("read")}
              disabled={!!busy}
            >
              {busy === "read" ? (
                <LoaderCircle className="spin" size={15} />
              ) : (
                <Usb size={15} />
              )}{" "}
              {connected ? "Ler teclado" : "Conectar teclado"}
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow title-eyebrow">
                <span />
                LITTLETEC STUDIO <span className="web-tag">{isDesktop ? "DESKTOP EDITION" : "WEB EDITION"}</span>
              </div>
              <h1>{pageInfo[page].title}</h1>
              <p>{pageInfo[page].description}</p>
            </div>
            <button
              className="icon-button heading-help"
              aria-label="Ajuda"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={20} />
            </button>
          </div>
          <div className="profile-toolbar">
            <div className="profile-name">
              <span className="profile-avatar">
                <Layers3 size={17} />
              </span>
              <div>
                <label htmlFor="profile-name">PERFIL ATUAL</label>
                <input
                  id="profile-name"
                  aria-label="Nome do perfil"
                  value={profile.name}
                  maxLength={100}
                  onChange={(e) => {
                    if (e.target.value.trim())
                      update({ ...profile, name: e.target.value });
                  }}
                />
              </div>
              <ChevronDown size={13} />
              <span className="draft-tag">{dirty ? "Rascunho" : "Salvo"}</span>
            </div>
            <div className="toolbar-right">
              <button
                className="icon-button"
                onClick={undo}
                disabled={!past.length}
                aria-label="Desfazer"
              >
                <Undo2 size={16} />
              </button>
              <button
                className="icon-button"
                onClick={redo}
                disabled={!future.length}
                aria-label="Refazer"
              >
                <Redo2 size={16} />
              </button>
              <span className="toolbar-divider" />
              <button className="text-button" onClick={exportProfile}>
                <Download size={15} />
                Exportar perfil
              </button>
            </div>
          </div>
          {(page === "Mapeamento" ||
            page === "Iluminação" ||
            page === "Giratórios") && (
            <div className="layer-bar">
              <div className="layer-tabs" aria-label="Camadas">
                {[0, 1, 2].map((i) => (
                  <button
                    className={layer === i ? "active" : ""}
                    onClick={() => setLayer(i)}
                    key={i}
                  >
                    <span>0{i + 1}</span>Camada {i + 1}
                    {changes.some((c) => c.layer === i) && <i />}
                  </button>
                ))}
              </div>
              <span className="layer-caption">
                <Layers3 size={13} />3 camadas independentes
              </span>
            </div>
          )}
          {(page === "Mapeamento" || page === "Giratórios") && (
            <LivePanel
              view={live.view}
              connected={connected && liveAvailable}
              enabled={liveEnabled}
              follow={followInput}
              onToggle={() => setLiveEnabled(!liveEnabled)}
              onFollow={() => setFollowInput(!followInput)}
              onClear={live.clear}
            />
          )}
          {page === "Giratórios" && (
            <div className="encoder-page-grid">
              <EncoderWorkbench
                profile={profile}
                layer={layer}
                selected={selected}
                changed={currentChanges}
                live={hardwareCompatible ? live.view : undefined}
                onSelect={setSelected}
                onCommand={encoderCommand}
              />
              {profile.encoder_count ? (
                <ActionEditor
                  keyCount={profile.key_count}
                  action={profile.layers[layer][selected]}
                  selected={selected}
                  onAssign={assign}
                  onAdvance={() =>
                    setSelected(
                      profile.key_count +
                        ((selected - profile.key_count + 1) %
                          (profile.encoder_count * 3)),
                    )
                  }
                  onPreset={(preset) =>
                    encoderCommand({
                      kind: "preset",
                      encoder: Math.floor((selected - profile.key_count) / 3),
                      preset,
                    })
                  }
                  onInvert={() =>
                    encoderCommand({
                      kind: "invert",
                      encoder: Math.floor((selected - profile.key_count) / 3),
                    })
                  }
                />
              ) : (
                <section className="inspector">
                  <h2>Seu rascunho não tem giratórios.</h2>
                  <p className="muted">
                    Escolha um modelo com giratórios na área Perfis.
                  </p>
                </section>
              )}
            </div>
          )}
          {page === "Mapeamento" && (
            <>
              <div className="workspace-grid">
                <section className="mapping-canvas">
                  <div className="canvas-heading">
                    <div>
                      <span className="eyebrow">SEU DISPOSITIVO</span>
                      <h2>
                        Pequeno no tamanho.
                        <br />
                        <span>Grande no controle.</span>
                      </h2>
                    </div>
                    <span className="model-chip">
                      {profile.key_count} + {profile.encoder_count}{" "}
                      <span>●</span>
                    </span>
                  </div>
                  <Board
                    live={hardwareCompatible ? live.view : undefined}
                    profile={profile}
                    layer={layer}
                    selected={selected}
                    onSelect={setSelected}
                    changed={currentChanges}
                    color={color}
                  />
                  <div className="canvas-tip">
                    <span>
                      <MousePointerIcon />
                      Selecione uma tecla ou direção de giro para editar
                    </span>
                    <kbd>CLIQUE PARA CONFIGURAR</kbd>
                  </div>
                </section>
                <ActionEditor
                  onAdvance={() =>
                    setSelected((selected + 1) % profile.layers[layer].length)
                  }
                  keyCount={profile.key_count}
                  action={profile.layers[layer][selected]}
                  selected={selected}
                  onAssign={assign}
                  onPreset={(preset) =>
                    encoderCommand({
                      kind: "preset",
                      encoder: Math.floor((selected - profile.key_count) / 3),
                      preset,
                    })
                  }
                  onInvert={() =>
                    encoderCommand({
                      kind: "invert",
                      encoder: Math.floor((selected - profile.key_count) / 3),
                    })
                  }
                />
              </div>
              <EncoderWorkbench
                profile={profile}
                layer={layer}
                selected={selected}
                changed={currentChanges}
                live={hardwareCompatible ? live.view : undefined}
                onSelect={setSelected}
                onCommand={encoderCommand}
              />
              <div className="lower-grid">
                <section className="quick-panel">
                  <div className="section-heading">
                    <span>
                      <Sparkles size={15} /> UM CLIQUE, MENOS TRABALHO
                    </span>
                    <span>Para a posição selecionada</span>
                  </div>
                  <div className="quick-actions">
                    {catalog.QUICK_ACTIONS.slice(0, 6).map((a, i) => (
                      <button
                        key={i}
                        onClick={() => assign(a.action as Action)}
                      >
                        {a.title
                          .replace(/^[^\p{L}\p{N}]+/u, "")
                          .replace(/\s*\([^)]*\)/g, "")}
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  </div>
                </section>
                <section className="flow-card">
                  <span className="flow-icon">
                    <SlidersHorizontal size={20} />
                  </span>
                  <div>
                    <strong>Comece com um fluxo pronto</strong>
                    <p>Uma camada inteira, em um clique.</p>
                  </div>
                  <select
                    aria-label="Aplicar modelo de camada"
                    disabled={!hardwareCompatible}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value === "") return;
                      const p = structuredClone(profile);
                      p.layers[layer] = structuredClone(
                        catalog.LAYER_TEMPLATES[Number(e.target.value)]
                          .positions,
                      ) as Action[];
                      update(p);
                      e.target.value = "";
                    }}
                  >
                    <option value="">Explorar modelos</option>
                    {catalog.LAYER_TEMPLATES.map((t, i) => (
                      <option key={t.title} value={i}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </section>
              </div>
              <section className="editing-tools">
                <button
                  onClick={() => {
                    setClipboard(
                      structuredClone(profile.layers[layer][selected]),
                    );
                    setNotice({ text: "Ação copiada." });
                  }}
                >
                  <Copy size={14} />
                  Copiar ação
                </button>
                <button
                  disabled={!clipboard}
                  onClick={() =>
                    clipboard && assign(structuredClone(clipboard))
                  }
                >
                  <Copy size={14} />
                  Colar ação
                </button>
                <select
                  aria-label="Clonar camada para"
                  value=""
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    const p = structuredClone(profile);
                    p.layers[Number(e.target.value)] = structuredClone(
                      p.layers[layer],
                    );
                    update(p);
                  }}
                >
                  <option value="">Clonar camada…</option>
                  {[0, 1, 2]
                    .filter((i) => i !== layer)
                    .map((i) => (
                      <option key={i} value={i}>
                        Para camada {i + 1}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    const p = structuredClone(profile);
                    p.layers[layer] = p.layers[layer].map(() => ({
                      type: "none",
                    }));
                    update(p);
                  }}
                >
                  <Trash2 size={14} />
                  Limpar camada
                </button>
                <button
                  onClick={() => {
                    const p = structuredClone(profile);
                    p.layers = p.layers.map((layer) =>
                      layer.map(() => ({ type: "none" })),
                    );
                    update(p);
                  }}
                >
                  <Trash2 size={14} />
                  Limpar tudo
                </button>
                <select
                  aria-label="Trocar com outra posição"
                  value=""
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    const p = structuredClone(profile);
                    const other = Number(e.target.value);
                    [p.layers[layer][selected], p.layers[layer][other]] = [
                      p.layers[layer][other],
                      p.layers[layer][selected],
                    ];
                    update(p);
                  }}
                >
                  <option value="">Trocar posição…</option>
                  {profile.layers[layer].map((_, i) =>
                    i === selected ? null : (
                      <option key={i} value={i}>
                        {positionLabel(i, profile.key_count)}
                      </option>
                    ),
                  )}
                </select>
                {profile.encoder_count > 0 && (
                  <button
                    onClick={() => {
                      const p = structuredClone(profile);
                      p.layers = p.layers.map((actions) => [
                        ...actions.slice(0, p.key_count),
                        ...structuredClone(
                          profile.layers[layer].slice(p.key_count),
                        ),
                      ]);
                      update(p);
                    }}
                  >
                    Copiar giros às 3 camadas
                  </button>
                )}
                {profile.encoder_count >= 2 && (
                  <button
                    onClick={() => {
                      const p = structuredClone(profile);
                      const start = p.key_count;
                      const first = p.layers[layer].slice(start, start + 3);
                      p.layers[layer].splice(
                        start,
                        6,
                        ...p.layers[layer].slice(start + 3, start + 6),
                        ...first,
                      );
                      update(p);
                    }}
                  >
                    Giro 1 ↔ 2
                  </button>
                )}
              </section>
            </>
          )}
          {page === "Iluminação" && (
            <div className="workspace-grid lighting-workspace">
              <section className="mapping-canvas lighting-canvas">
                <div className="canvas-heading">
                  <div>
                    <span className="eyebrow">COR QUE ACOMPANHA SEU RITMO</span>
                    <h2>Um toque de personalidade.</h2>
                  </div>
                  <Palette size={23} />
                </div>
                <Board
                  live={hardwareCompatible ? live.view : undefined}
                  profile={profile}
                  layer={layer}
                  selected={selected}
                  onSelect={setSelected}
                  changed={[]}
                  color={lighting.mode === 0 ? "#33383c" : color}
                  large
                />
                <div className="light-preview-label">
                  <i style={{ background: color }} />
                  {lighting.color
                    ? catalog.COLORS[lighting.color][0]
                    : "Selecione uma cor"}
                  <span>Prévia local</span>
                </div>
              </section>
              <section className="inspector lighting-inspector">
                <span className="eyebrow">ILUMINAÇÃO · CAMADA {layer + 1}</span>
                <h2>Escolha sua atmosfera.</h2>
                <p className="muted">As sete cores nativas do seu LittleTec.</p>
                <div className="color-palette">
                  {Object.entries(catalog.COLORS).map(([key, [name, hex]]) => (
                    <button
                      key={key}
                      className={lighting.color === key ? "selected" : ""}
                      onClick={() => setLight(lighting.mode ?? 1, key as Color)}
                      aria-label={name}
                      style={{ "--swatch": hex } as React.CSSProperties}
                    >
                      <span>
                        {lighting.color === key && <Check size={17} />}
                      </span>
                      <small>{name}</small>
                    </button>
                  ))}
                </div>
                <label className="field-label" htmlFor="led-mode">
                  Efeito de iluminação
                </label>
                <div className="mode-options">
                  {[
                    "Desligado",
                    "Estático",
                    "Respiração",
                    "Ciclo de cores",
                    "Onda ao pressionar",
                    "Acender ao pressionar",
                  ].map((name, i) => (
                    <button
                      key={i}
                      className={lighting.mode === i ? "active" : ""}
                      onClick={() => setLight(i, lighting.color ?? "green")}
                    >
                      <span className="mode-radio" />
                      {name}
                      <small>0{i}</small>
                    </button>
                  ))}
                </div>
                <button
                  className="button primary full"
                  disabled={
                    !connected ||
                    !!busy ||
                    lighting.mode === null ||
                    !hardwareCompatible
                  }
                  onClick={() =>
                    run("led", {
                      mode: lighting.mode,
                      color: lighting.color,
                      layer: layer + 1,
                    })
                  }
                >
                  <Lightbulb size={16} />
                  Aplicar nesta camada
                </button>
                <button
                  className="button secondary full"
                  disabled={
                    !connected ||
                    !!busy ||
                    lighting.mode === null ||
                    !hardwareCompatible
                  }
                  onClick={() =>
                    run("led_all", {
                      mode: lighting.mode,
                      color: lighting.color,
                    })
                  }
                >
                  Aplicar nas 3 camadas
                </button>
                <div className="lighting-state">
                  <ShieldCheck size={15} />
                  <p>
                    {lastSent[layer]
                      ? `Último envio: ${lastSent[layer]}.`
                      : "Nenhum envio nesta sessão."}
                    <br />
                    <span>
                      A prévia é local. O teclado não fornece leitura do LED.
                    </span>
                  </p>
                </div>
              </section>
            </div>
          )}
          {page === "Perfis" && (
            <section className="profiles-page">
              <div className="section-heading">
                <span>
                  <FolderOpen size={16} /> SUA BIBLIOTECA
                </span>
                <span>{savedProfiles.length} perfis {isDesktop ? "neste aplicativo" : "neste navegador"}</span>
              </div>
              <div className="profile-cards">
                <button
                  className="new-profile-card"
                  onClick={() => {
                    update(newProfile());
                    setNotice({
                      text: "Novo perfil vazio criado. A alteração anterior pode ser desfeita.",
                    });
                  }}
                >
                  <FilePlus2 size={27} />
                  <strong>Um novo começo</strong>
                  <p>Crie um perfil do zero.</p>
                  <span>
                    Criar perfil <ArrowRight size={14} />
                  </span>
                </button>
                {savedProfiles.map((p, i) => (
                  <article className="saved-profile-card" key={i}>
                    <div className="profile-card-icon">
                      <Layers3 size={24} />
                      <button
                        className="icon-button"
                        aria-label={`Excluir ${p.name}`}
                        onClick={() => {
                          const list = savedProfiles.filter((_, n) => i !== n);
                          persistLibrary(list);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <h2>{p.name}</h2>
                    <p>
                      {p.key_count} teclas · {p.encoder_count} giratórios · 3
                      camadas
                    </p>
                    <button
                      className="text-button"
                      onClick={() => {
                        update(structuredClone(p));
                        setPage("Mapeamento");
                      }}
                    >
                      Abrir perfil <ArrowUpRight size={15} />
                    </button>
                  </article>
                ))}
              </div>
              <details className="advanced-profiles">
                <summary>Modelos de rascunho e layout personalizado</summary>
                <p>
                  Explore os 24 modelos do Studio. O envio USB continua
                  exclusivo do aparelho 12+2.
                </p>
                <div className="advanced-profile-fields">
                  <label>
                    Modelo
                    <select
                      aria-label="Modelo de rascunho"
                      value={draftModel}
                      onChange={(e) => setDraftModel(e.target.value)}
                    >
                      {Object.keys(catalog.MODELS).map((model) => (
                        <option key={model}>{model}</option>
                      ))}
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </label>
                  {draftModel === "personalizado" && (
                    <>
                      <label>
                        Teclas
                        <input
                          aria-label="Quantidade de teclas"
                          type="number"
                          min={0}
                          max={60}
                          value={customKeys}
                          onChange={(e) =>
                            setCustomKeys(Number(e.target.value))
                          }
                        />
                      </label>
                      <label>
                        Giratórios
                        <input
                          aria-label="Quantidade de giratórios"
                          type="number"
                          min={0}
                          max={4}
                          value={customEncoders}
                          onChange={(e) =>
                            setCustomEncoders(Number(e.target.value))
                          }
                        />
                      </label>
                      <label>
                        Colunas
                        <input
                          aria-label="Quantidade de colunas"
                          type="number"
                          min={1}
                          max={10}
                          value={customColumns}
                          onChange={(e) =>
                            setCustomColumns(Number(e.target.value))
                          }
                        />
                      </label>
                    </>
                  )}
                  <button
                    className="button secondary"
                    onClick={() => {
                      try {
                        const values =
                          draftModel === "personalizado"
                            ? [customKeys, customEncoders, customColumns]
                            : (catalog.MODELS as Record<string, number[]>)[
                                draftModel
                              ];
                        update(
                          parseProfile(
                            newProfile(
                              values[0],
                              values[1],
                              values[2],
                              draftModel,
                            ),
                          ),
                        );
                        setPage("Mapeamento");
                      } catch {
                        setNotice({
                          text: "Use de 1 a 60 posições no total, até 4 giratórios e de 1 a 10 colunas.",
                          error: true,
                        });
                      }
                    }}
                  >
                    Criar rascunho <FilePlus2 size={15} />
                  </button>
                </div>
              </details>
              <div className="profile-file-actions">
                <div>
                  <span className="eyebrow">SEU PERFIL VIAJA COM VOCÊ</span>
                  <h2>Do desktop para a web.</h2>
                  <p>
                    Importe e exporte perfis v1/v2 do LittleTec.
                    <br />
                    Os campos de ações não interpretadas são preservados.
                  </p>
                </div>
                <div>
                  <button
                    className="button secondary"
                    onClick={() => importRef.current?.click()}
                  >
                    <Upload size={16} />
                    Importar JSON
                  </button>
                  <button className="button secondary" onClick={exportProfile}>
                    <Download size={16} />
                    Exportar JSON
                  </button>
                  <button className="button primary" onClick={saveInBrowser}>
                    <Save size={16} />
                    {isDesktop ? "Salvar na biblioteca" : "Salvar neste navegador"}
                  </button>
                </div>
              </div>
              <div className="backup-actions">
                <div>
                  <ShieldCheck size={20} />
                  <strong>Cópias completas, dados preservados.</strong>
                  <p>
                    Importe uma pasta de captura do Studio ou exporte os 72
                    relatórios da última leitura.
                  </p>
                </div>
                <button
                  className="button secondary"
                  disabled={!!busy}
                  onClick={() => backupFolderRef.current?.click()}
                >
                  <Upload size={15} />
                  Importar pasta de cópia
                </button>
                <button
                  className="button secondary"
                  disabled={!connected || !!busy}
                  onClick={() => run("backup_export")}
                >
                  <Download size={15} />
                  Exportar cópia USB
                </button>
              </div>
            </section>
          )}
          {page === "Diagnóstico" && (
            <section className="diagnostics-page">
              <div className="diagnostic-hero">
                <span className="diagnostic-icon">
                  <Usb size={32} />
                </span>
                <div>
                  <span className="eyebrow">LITTLETEC 12+2 · 1189:8842</span>
                  <h2>
                    {connected
                      ? "Seu dispositivo está conectado."
                      : "Seu editor está pronto."}
                  </h2>
                  <p>
                    {connected
                      ? "Leitura USB disponível pela ponte local."
                      : "Inicie a ponte no Windows e conecte para ler e aplicar suas configurações."}
                  </p>
                </div>
                <button
                  className="button primary"
                  disabled={!!busy}
                  onClick={() => run("read")}
                >
                  <PlugZap size={16} />
                  {connected ? "Atualizar leitura" : "Conectar teclado"}
                </button>
              </div>
              <div className="diagnostic-grid">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Protocolo preservado",
                    text: "Os mesmos serviços Python do Studio validam identidade, cópias e releitura.",
                  },
                  {
                    icon: Monitor,
                    title: "Edição no navegador",
                    text: "Mapeamento e perfis funcionam localmente. A ponte faz a comunicação USB no Windows.",
                  },
                  {
                    icon: Activity,
                    title: "Estado verdadeiro",
                    text: "LED mostra o último envio, sem alegar leitura do estado interno do aparelho.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <article key={title}>
                    <Icon size={23} />
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
              <div className="diagnostic-actions">
                <button
                  className="button secondary"
                  disabled={!!busy}
                  onClick={() => run("diagnose")}
                >
                  <Activity size={16} />
                  Executar diagnóstico
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    download(
                      { profile, connected, lastSent, diagnostic },
                      "littletec-web-diagnostico.json",
                    )
                  }
                >
                  <Download size={16} />
                  Exportar diagnóstico
                </button>
              </div>
              {diagnostic !== null && (
                <pre className="diagnostic-output">
                  {JSON.stringify(diagnostic, null, 2)}
                </pre>
              )}
            </section>
          )}
          <footer className="page-footer">
            <span>Feito para o seu jeito de fazer.</span>
            <span>
              12 teclas. 2 giros. Seu controle.
              <span className="footer-square" />
            </span>
          </footer>
        </main>
        <div className="apply-bar">
          <div className="save-state">
            <span
              className={`save-state-icon ${changes.length ? "pending" : ""}`}
            >
              {changes.length ? <CircleIcon /> : <Check size={15} />}
            </span>
            <div>
              <strong>
                {changes.length
                  ? `${changes.length} ${changes.length === 1 ? "posição alterada" : "posições alteradas"}`
                  : "Seu espaço está salvo localmente"}
              </strong>
              <small>
                {!hardwareCompatible
                  ? "Modelo de rascunho · envio USB exclusivo do 12+2"
                  : connected
                    ? "Rascunho separado da configuração do teclado"
                    : "Conecte o teclado quando quiser aplicar"}
              </small>
            </div>
          </div>
          <div>
            <button className="text-button" onClick={() => setReview(true)}>
              Revisar alterações <ArrowUpRight size={14} />
            </button>
            <button
              className="button primary"
              disabled={
                !connected || !!busy || !changes.length || !hardwareCompatible
              }
              onClick={() => run("apply", { profile })}
            >
              {busy === "apply" ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <ArrowDownToLine size={16} />
              )}
              Aplicar mapeamento
            </button>
          </div>
        </div>
      </div>
      <input
        type="file"
        accept="application/json,.json"
        className="sr-only"
        ref={importRef}
        onChange={importProfile}
      />
      <input
        type="file"
        multiple
        {...{ webkitdirectory: "" }}
        className="sr-only"
        ref={backupFolderRef}
        onChange={importBackupFolder}
        aria-label="Pasta da cópia bruta"
      />
      {notice && (
        <div
          className={`toast ${notice.error ? "error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          {notice.error ? <CircleHelp size={20} /> : <Check size={20} />}
          <p>{notice.text}</p>
          <button
            className="icon-button"
            onClick={() => setNotice(null)}
            aria-label="Fechar mensagem"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {busy && (
        <div className="busy-indicator" role="status">
          <LoaderCircle size={15} className="spin" />
          {busy === "read"
            ? "Lendo teclado…"
            : busy === "diagnose"
              ? "Verificando conexão…"
              : "Enviando e conferindo…"}
        </div>
      )}
      {review && (
        <div className="modal-backdrop" onClick={() => setReview(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Revisão das alterações"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">ANTES DE APLICAR</span>
                <h2>Seu novo mapeamento.</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Fechar revisão"
                onClick={() => setReview(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="muted">
              {connected
                ? "Comparação com a última leitura do aparelho."
                : "Comparação local. Conecte o teclado para comparar com o aparelho."}
            </p>
            <div className="review-list">
              {changes.length ? (
                changes.map((d) => (
                  <div key={`${d.layer}-${d.position}`}>
                    <span>
                      Camada {d.layer + 1}
                      <small>
                        {positionLabel(d.position, profile.key_count)}
                      </small>
                    </span>
                    <span>{label(d.before)}</span>
                    <ArrowRight size={14} />
                    <strong>{label(d.after)}</strong>
                  </div>
                ))
              ) : (
                <div className="empty-review">
                  <Check size={28} />
                  <p>Nenhuma alteração de mapeamento.</p>
                </div>
              )}
            </div>
            <button
              className="button secondary"
              onClick={() => download(changes, "littletec-revisao.json")}
            >
              <Download size={15} />
              Exportar revisão
            </button>
          </section>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal help-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Primeiros passos"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <span className="eyebrow">BEM-VINDO AO SEU NOVO ESPAÇO</span>
              <button
                className="icon-button"
                aria-label="Fechar ajuda"
                onClick={() => setHelp(false)}
              >
                <X size={20} />
              </button>
            </div>
            <h2>
              Menos cliques.
              <br />
              Mais possibilidades.
            </h2>
            <ol>
              <li>
                <strong>Explore e personalize.</strong>
                <p>
                  O perfil inicial é um exemplo local. Selecione uma tecla ou
                  giro e escolha uma ação.
                </p>
              </li>
              <li>
                <strong>Conecte seu LittleTec.</strong>
                <p>
                  Execute a ponte Python na pasta web/bridge no Windows. Depois,
                  clique em Conectar teclado.
                </p>
              </li>
              <li>
                <strong>Aplique quando estiver pronto.</strong>
                <p>
                  Mapeamento e iluminação têm ações de envio próprias, com
                  cópias e verificações automáticas.
                </p>
              </li>
            </ol>
            <button
              className="button primary full"
              onClick={() => setHelp(false)}
            >
              Vamos começar <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function MousePointerIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="m4 3 7 18 2-8 8-2Z" />
    </svg>
  );
}
function CircleIcon() {
  return <span className="small-dot" />;
}
