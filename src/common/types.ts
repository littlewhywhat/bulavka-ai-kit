export type MessageResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
