import { useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const useOrderStream = (orderId, onUpdate) => {
  useEffect(() => {
    if (!orderId) {
      return undefined;
    }
    const streamUrl = `${API_BASE_URL}/orders/${orderId}/stream`;
    const source = new EventSource(streamUrl);

    source.addEventListener("ready", (event) => {
      try {
        onUpdate?.(JSON.parse(event.data));
      } catch (_error) {
        // ignore malformed payloads
      }
    });

    source.addEventListener("update", (event) => {
      try {
        onUpdate?.(JSON.parse(event.data));
      } catch (_error) {
        // ignore malformed payloads
      }
    });

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [orderId, onUpdate]);
};
