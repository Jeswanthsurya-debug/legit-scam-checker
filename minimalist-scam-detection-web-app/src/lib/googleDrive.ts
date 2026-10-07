"use client";

import { loadExternalScript } from "./ocr";

const GIS_URL = "https://accounts.google.com/gsi/client";
const GAPI_URL = "https://apis.google.com/js/api.js";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

interface TokenClient {
  requestAccessToken: () => void;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: { access_token?: string }) => void;
}

interface GoogleGlobal {
  accounts: { oauth2: { initTokenClient: (config: TokenClientConfig) => TokenClient } };
}

interface PickerDoc {
  id: string;
  name?: string;
  mimeType?: string;
}

interface PickerData {
  action?: string;
  docs?: PickerDoc[];
}

interface PickerBuilder {
  setDeveloperKey(key: string): PickerBuilder;
  setOAuthToken(token: string): PickerBuilder;
  addView(view: unknown): PickerBuilder;
  setCallback(callback: (data: PickerData) => void): PickerBuilder;
  build(): { setVisible(value: boolean): void };
}

interface GooglePicker {
  PickerBuilder: new () => PickerBuilder;
  ViewId: Record<string, unknown>;
}

interface Gapi {
  load: (what: string, callback: () => void) => void;
  picker?: GooglePicker;
}

function global<T>(key: string): T | undefined {
  return (window as unknown as Record<string, T | undefined>)[key];
}

async function requestAccessToken(clientId: string): Promise<string> {
  const accounts = global<GoogleGlobal>("google")?.accounts;
  if (!accounts || !accounts.oauth2) throw new Error("Google sign-in could not be loaded");

  return new Promise<string>((resolve, reject) => {
    const client = accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response: { access_token?: string }) => {
        if (response.access_token) resolve(response.access_token);
        else reject(new Error("Google did not grant access to that file"));
      },
    });
    client.requestAccessToken();
  });
}

/**
 * Opens the Google Picker and downloads the chosen file into the page.
 * Only used when an API key and client ID are configured.
 */
export async function pickFromGoogleDrive(apiKey: string, clientId: string): Promise<File> {
  await loadExternalScript(GIS_URL);
  await loadExternalScript(GAPI_URL);

  const gapi = global<Gapi>("gapi");
  if (!gapi) throw new Error("Google could not be loaded");

  await new Promise<void>((resolve) => gapi.load("picker", () => resolve()));

  const pickerApi = gapi.picker;
  if (!pickerApi) throw new Error("Google Picker could not be loaded");

  const token = await requestAccessToken(clientId);

  const picked = await new Promise<PickerDoc>((resolve, reject) => {
    const picker = new pickerApi.PickerBuilder()
      .setDeveloperKey(apiKey)
      .setOAuthToken(token)
      .addView(pickerApi.ViewId.DOCS)
      .setCallback((data) => {
        if (data.action === "picked" && data.docs?.[0]) resolve(data.docs[0]);
        else if (data.action === "cancel") reject(new Error("cancelled"));
      })
      .build();
    picker.setVisible(true);
  });

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${picked.id}?alt=media`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error("That file could not be downloaded from Drive");

  const blob = await response.blob();
  return new File([blob], picked.name || "Drive file", {
    type: blob.type || picked.mimeType || "application/octet-stream",
  });
}
