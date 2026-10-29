import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('littleTecDesktop', {
  autoConnect: !process.argv.includes('--littletec-offline'),
  request: (command: unknown) => ipcRenderer.invoke('device:request', command),
  saveJson: (value: unknown, name: string) => ipcRenderer.invoke('file:save-json', value, name),
});
