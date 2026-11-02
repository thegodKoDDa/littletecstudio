export {};

declare global {
  interface Window {
    littleTecDesktop?: {
      autoConnect: boolean;
      request(command: unknown): Promise<{ status: number; body: Record<string, unknown> }>;
      saveJson(value: unknown, name: string): Promise<boolean>;
      createShortcuts?(): Promise<{ success: boolean; message: string }>;
    };
  }
}
