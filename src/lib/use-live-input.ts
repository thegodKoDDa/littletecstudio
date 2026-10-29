"use client";
import { useEffect, useState } from "react";
import { deviceRequest } from "./device";
import { applyLiveEvents, emptyLive, type LiveView } from "./live";

export function useLiveInput(enabled: boolean, revision: string) {
  const [view, setView] = useState<LiveView>(emptyLive);
  useEffect(() => {
    setView((previous) => ({
      ...previous,
      ready: false,
      error: null,
      active: [],
      pulses: {},
      disconnected: false,
      lastId: 0,
    }));
    if (!enabled) return;
    const client = crypto.randomUUID();
    const controller = new AbortController();
    let cancelled = false;
    let cursor = 0;
    let hadDevices = false;
    async function listen() {
      try {
        const started = await deviceRequest(
          "live_start",
          { client },
          controller.signal,
        );
        if (!started.live?.ready)
          throw new Error(
            started.live?.error || "Não foi possível ativar a entrada ao vivo.",
          );
        cursor = started.live.cursor;
        while (!cancelled) {
          const response = await deviceRequest(
            "live_events",
            { client, cursor },
            controller.signal,
          );
          if (cancelled) return;
          if (!response.live?.ready)
            throw new Error(
              response.live?.error || "O monitor de entrada foi encerrado.",
            );
          cursor = response.live.cursor;
          const status = response.live;
          const lostDevice = hadDevices && status.devices.length === 0;
          hadDevices ||= status.devices.length > 0;
          setView((previous) => {
            if (
              !response.events?.length &&
              previous.ready &&
              !previous.error &&
              previous.deviceCount === status.devices.length &&
              previous.disconnected === lostDevice &&
              !status.lost &&
              (status.mappingAvailable !== false || !previous.active.length)
            )
              return previous;
            return {
              ...applyLiveEvents(
                {
                  ...previous,
                  active:
                    status.lost || status.mappingAvailable === false
                      ? []
                      : previous.active,
                },
                response.events || [],
              ),
              ready: true,
              error: null,
              deviceCount: status.devices.length,
              disconnected: lostDevice,
            };
          });
          if (lostDevice) return;
          // O servidor faz long polling; evitar loop rápido também com backends simulados.
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
      } catch (error) {
        if (!cancelled)
          setView((previous) => ({
            ...previous,
            ready: false,
            active: [],
            error:
              error instanceof Error
                ? error.message
                : "Entrada ao vivo indisponível.",
          }));
      }
    }
    void listen();
    return () => {
      cancelled = true;
      controller.abort();
      void deviceRequest("live_stop", { client }).catch(() => {});
    };
  }, [enabled, revision]);
  return {
    view,
    clear: () =>
      setView((previous) => ({
        ...previous,
        events: [],
        count: 0,
        pulses: {},
      })),
  };
}
