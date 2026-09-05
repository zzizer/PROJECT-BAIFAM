import apiClient from "./api-client";

export type KnownNetwork = {
  uuid: string;
  name: string;
  ssid: string;
  active: boolean;
};

export type AvailableNetwork = {
  ssid: string;
  bssid: string;
  signal: number;
  security: string;
  supported: boolean;
};

export type NetworkSnapshot = {
  interface: string;
  state: string;
  current: KnownNetwork | null;
  known: KnownNetwork[];
  available: AvailableNetwork[];
};

export type ConnectPayload =
  | { uuid: string }
  | { bssid: string; password?: string };

const path = "/device/networks/";

export const NETWORKS_API = {
  connect: (payload: ConnectPayload) =>
    apiClient
      .post<{ uuid: string }>(path + "connect/", payload, { timeout: 90_000 })
      .then((response) => response.data),
  forget: (uuid: string) =>
    apiClient.delete(path + uuid + "/", {
      params: { disconnect: true },
      timeout: 30_000,
    }),
};
