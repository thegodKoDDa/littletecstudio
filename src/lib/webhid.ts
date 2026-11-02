/**
 * Conexão direta via WebHID para o LittleTec 12+2 no navegador (Chromium/Chrome/Edge).
 * Utilizado como transporte no modo GitHub Pages / Web online quando não há ponte local Python ativa.
 * VID: 0x1189, PID: 0x8842, MI_00, UsagePage: 0xFF00, Usage: 0x01.
 */

export const VID = 0x1189;
export const PID = 0x8842;
export const USAGE_PAGE = 0xff00;
export const USAGE = 0x01;

export interface WebHIDCollection {
  usagePage: number;
  usage: number;
}

export interface WebHIDDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  opened: boolean;
  collections: WebHIDCollection[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
}

interface NavigatorWithHID {
  hid?: {
    requestDevice(options: {
      filters: Array<{ vendorId?: number; productId?: number; usagePage?: number; usage?: number }>;
    }): Promise<WebHIDDevice[]>;
    getDevices(): Promise<WebHIDDevice[]>;
  };
}

export function isWebHIDSupported(): boolean {
  return typeof navigator !== "undefined" && "hid" in (navigator as unknown as NavigatorWithHID);
}

export async function requestWebHIDDevice(): Promise<WebHIDDevice | null> {
  if (!isWebHIDSupported()) return null;
  const nav = navigator as unknown as NavigatorWithHID;
  if (!nav.hid) return null;
  try {
    const devices = await nav.hid.requestDevice({
      filters: [{ vendorId: VID, productId: PID, usagePage: USAGE_PAGE, usage: USAGE }],
    });
    return devices[0] || null;
  } catch {
    return null;
  }
}

export async function getConnectedWebHIDDevice(): Promise<WebHIDDevice | null> {
  if (!isWebHIDSupported()) return null;
  const nav = navigator as unknown as NavigatorWithHID;
  if (!nav.hid) return null;
  try {
    const devices = await nav.hid.getDevices();
    return (
      devices.find(
        (d: WebHIDDevice) =>
          d.vendorId === VID &&
          d.productId === PID &&
          d.collections?.some((c: WebHIDCollection) => c.usagePage === USAGE_PAGE && c.usage === USAGE),
      ) || null
    );
  } catch {
    return null;
  }
}

/**
 * Envia um relatório de configuração HID de 64 bytes com Report ID 0x03.
 */
export async function sendWebHIDReport(device: WebHIDDevice, data: Uint8Array): Promise<void> {
  if (!device.opened) await device.open();
  // Relatório tem Report ID 0x03 e 64 bytes de payload
  const payload = data.length === 65 && data[0] === 3 ? data.slice(1) : data;
  await device.sendReport(3, payload as unknown as BufferSource);
}
