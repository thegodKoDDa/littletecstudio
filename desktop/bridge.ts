import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';

export type Reply = { status: number; body: Record<string, unknown> };

/** Uma única ponte por aplicativo. Nunca repete um comando em falha. */
export class DesktopBridge {
  private child: ChildProcessWithoutNullStreams;
  private sequence = 0;
  private pending = new Map<number, { resolve: (r: Reply) => void; reject: (e: Error) => void }>();
  private ended = false;
  private closing = false;
  readonly ready: Promise<void>;
  private exited: Promise<void>;

  constructor(executable: string, args: string[], cwd: string, captureRoot?: string) {
    this.child = spawn(executable, args, {
      cwd, windowsHide: true, stdio: 'pipe',
      env: { ...process.env, ...(captureRoot ? { LITTLETEC_CAPTURE_ROOT: captureRoot } : {}) },
    });
    this.exited = new Promise(resolve => this.child.once('close', () => resolve()));
    this.ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('A ponte Python não iniciou no prazo.'));
        this.child.kill(); // Apenas inicialização: nenhum comando aceito ainda.
      }, 20_000);
      const fail = (error: Error) => {
        clearTimeout(timer);
        this.ended = true;
        reject(error);
        for (const entry of this.pending.values()) entry.reject(error);
        this.pending.clear();
      };
      this.child.on('error', fail);
      this.child.stdin.on('error', fail);
      this.child.once('close', () => fail(new Error('A ponte Python foi encerrada. Leia novamente antes de aplicar.')));
      this.child.stderr.resume(); // Não enviar detalhes internos ao renderer.
      const lines = createInterface({ input: this.child.stdout });
      lines.on('line', line => {
        try {
          const message = JSON.parse(line);
          if (message.ready === true) {
            clearTimeout(timer);
            resolve();
            return;
          }
          const entry = this.pending.get(message.id);
          if (!entry) return;
          this.pending.delete(message.id);
          entry.resolve({ status: message.status, body: message.body });
        } catch {
          fail(new Error('Resposta inválida da ponte Python.'));
        }
      });
    });
  }

  async request(command: unknown): Promise<Reply> {
    await this.ready;
    if (this.ended || this.closing) throw new Error('A ponte desktop está indisponível.');
    if (this.pending.size >= 16) throw new Error('Aguarde as operações em curso.');
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.stdin.write(JSON.stringify({ id, command }) + '\n');
    });
  }

  async close(): Promise<void> {
    this.closing = true;
    if (!this.child.stdin.destroyed && !this.child.stdin.writableEnded) this.child.stdin.end();
    await this.exited;
  }
}
