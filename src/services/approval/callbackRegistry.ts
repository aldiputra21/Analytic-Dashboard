// Approval Callback Registry
// Maps callback handler keys to async functions that execute the actual DB mutation
// after an approval is finalized.

export interface StagedFile {
  attachmentId: string;
  finalPath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export type CallbackFn = (
  payload: Record<string, unknown>,
  entityId?: string,
  stagedFiles?: StagedFile[],
  requestedBy?: string,
) => Promise<void>;

const registry = new Map<string, CallbackFn>();

export function registerCallback(key: string, fn: CallbackFn): void {
  registry.set(key, fn);
}

export async function invokeCallback(
  key: string,
  payload: Record<string, unknown>,
  entityId?: string,
  stagedFiles?: StagedFile[],
  requestedBy?: string,
): Promise<void> {
  const fn = registry.get(key);
  if (!fn) {
    throw new Error(`Approval callback not found: "${key}". Register it in approvalCallbacks.ts`);
  }
  await fn(payload, entityId, stagedFiles, requestedBy);
}

export function hasCallback(key: string): boolean {
  return registry.has(key);
}
