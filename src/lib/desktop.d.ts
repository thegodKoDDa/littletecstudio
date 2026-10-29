export {};

declare global {
  interface Window {
    littleTecDesktop?: {
      request(command: unknown): Promise<{ status: number; body: Record<string, unknown> }>;
      saveJson(value: unknown, name: string): Promise<boolean>;
    };
  }
}
