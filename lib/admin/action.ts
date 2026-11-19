/** Shared result type for admin server actions (client-safe). */
export type ActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** navigate after success */
  redirect?: string;
  /** bump to re-trigger toasts even when the message repeats */
  at?: number;
} | null;

export const ok = (message: string, extra: Partial<NonNullable<ActionState>> = {}): ActionState => ({ ok: true, message, at: Date.now(), ...extra });
export const fail = (message: string, errors?: Record<string, string>): ActionState => ({ ok: false, message, errors, at: Date.now() });
