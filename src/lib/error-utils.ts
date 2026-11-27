export function getErrorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim()) return reason.message;
  if (
    typeof reason === "object" &&
    reason !== null &&
    "message" in reason &&
    typeof reason.message === "string" &&
    reason.message.trim()
  ) {
    return reason.message;
  }
  return fallback;
}

export function getSettledQueryError<T extends { error: unknown }>(
  result: PromiseSettledResult<T>,
  fallback: string,
): string | null {
  if (result.status === "rejected") return getErrorMessage(result.reason, fallback);
  if (result.value.error) return getErrorMessage(result.value.error, fallback);
  return null;
}

export function withTimeout<T>(
  promise: Promise<T>,
  requestName: string,
  timeoutMs = 20_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(
      () => reject(new Error(`${requestName} n’a pas répondu après ${timeoutMs / 1000} secondes.`)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        globalThis.clearTimeout(timeout);
        resolve(value);
      },
      (reason: unknown) => {
        globalThis.clearTimeout(timeout);
        reject(reason);
      },
    );
  });
}
