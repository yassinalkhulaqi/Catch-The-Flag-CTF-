/**
 * Same-origin upload with progress. The BFF still attaches the session cookie.
 * The browser never chooses the storage key.
 */
export function uploadFormData(
  path: string,
  body: FormData,
  onProgress: (ratio: number) => void,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/v1${path}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let payload: unknown = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        payload = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve(payload);
        return;
      }
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error?: { message?: string } }).error?.message ?? "Upload failed.")
          : "Upload failed.";
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(body);
  });
}
