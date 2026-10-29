/** A ponte existe no Desktop e no Web local, sem tentativas em Pages/file://. */
export function shouldAutoConnect(
  location: { protocol: string; hostname: string; search: string },
  desktop: { autoConnect?: boolean } | undefined,
  preference: string | null,
) {
  if (preference === 'off' || new URLSearchParams(location.search).has('offline')) return false;
  if (desktop) return desktop.autoConnect !== false;
  return ['http:', 'https:'].includes(location.protocol)
    && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
}
