/**
 * Panic key handler.
 * When the configured key is pressed, immediately navigates to a safe site.
 */

export type PanicKey = '`' | 'Escape' | 'F12';

export const PANIC_URL = 'https://classroom.google.com';

let handler: ((e: KeyboardEvent) => void) | null = null;

export function enablePanicKey(key: PanicKey = '`'): void {
  disablePanicKey();
  handler = (e: KeyboardEvent) => {
    if (e.key === key) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = PANIC_URL;
    }
  };
  document.addEventListener('keydown', handler, true);
}

export function disablePanicKey(): void {
  if (handler) {
    document.removeEventListener('keydown', handler, true);
    handler = null;
  }
}
