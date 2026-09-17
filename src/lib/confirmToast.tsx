import toast from 'react-hot-toast';

export interface ConfirmToastOptions {
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  duration?: number;
}

/**
 * Custom interactive confirmation toast using react-hot-toast.
 * Replaces native browser window.confirm() with an elegant UI toast.
 *
 * @param message The confirmation message to display (supports multiline)
 * @param options Optional configuration for button text, styling type, and duration
 * @returns Promise<boolean> resolving to true if confirmed, false if cancelled/dismissed
 */
export function confirmToast(
  message: string,
  options?: ConfirmToastOptions
): Promise<boolean> {
  const {
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    type = 'danger',
    duration = Infinity,
  } = options || {};

  return new Promise<boolean>((resolve) => {
    let resolved = false;

    const handleAction = (toastId: string, result: boolean) => {
      if (!resolved) {
        resolved = true;
        toast.dismiss(toastId);
        resolve(result);
      }
    };

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
          } transition-all duration-200 pointer-events-auto flex flex-col gap-3 p-4 bg-base-100 text-base-content border border-base-300 rounded-2xl shadow-2xl max-w-sm w-full`}
          style={{ minWidth: '290px' }}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0 select-none pt-0.5">
              {type === 'danger' ? '⚠️' : type === 'warning' ? '⚡' : 'ℹ️'}
            </div>
            <div className="flex-1 pr-4">
              <p className="text-sm font-semibold text-base-content leading-snug whitespace-pre-line">
                {message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAction(t.id, false)}
              className="text-base-content/40 hover:text-base-content text-xs p-1 rounded-md transition-colors -mr-1 -mt-1"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={() => handleAction(t.id, false)}
              className="btn btn-xs btn-ghost text-base-content/70 hover:text-base-content"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => handleAction(t.id, true)}
              className={`btn btn-xs font-semibold ${
                type === 'danger'
                  ? 'btn-error text-white'
                  : type === 'warning'
                  ? 'btn-warning text-slate-900'
                  : 'btn-primary'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration,
        position: 'top-center',
      }
    );
  });
}
