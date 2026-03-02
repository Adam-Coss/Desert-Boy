const OVERLAY_ID = 'fatal-error-overlay';

declare global {
  interface Window {
    __DESERT_BOY_WRITE_LOG__?: (level: 'INFO' | 'WARN' | 'ERROR', message: string) => void;
  }
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}\n${err.stack ?? ''}`.trim();
  }

  try {
    return typeof err === 'string' ? err : JSON.stringify(err, null, 2);
  } catch {
    return String(err);
  }
}

function logFatalError(message: string): void {
  try {
    window.__DESERT_BOY_WRITE_LOG__?.('ERROR', message);
  } catch {
    // Ignore logger issues for fatal path.
  }
}

export function showFatalError(err: unknown, context?: string): void {
  const details = formatError(err);
  const payload = [
    'Fatal error',
    context ? `Context: ${context}` : '',
    details
  ].filter(Boolean).join('\n\n');

  logFatalError(payload);

  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'fatal-error-overlay';
    overlay.innerHTML = `
      <section class="fatal-error-panel">
        <h2 class="fatal-error-title">Fatal error</h2>
        <p class="fatal-error-context" hidden></p>
        <pre class="fatal-error-details"></pre>
        <div class="fatal-error-actions">
          <button type="button" data-action="copy">Copy</button>
          <button type="button" data-action="reload">Reload</button>
        </div>
      </section>
    `;
    document.body.append(overlay);

    const copyButton = overlay.querySelector<HTMLButtonElement>('[data-action="copy"]');
    const reloadButton = overlay.querySelector<HTMLButtonElement>('[data-action="reload"]');

    copyButton?.addEventListener('click', async () => {
      const textNode = overlay?.querySelector<HTMLElement>('.fatal-error-details');
      const textToCopy = textNode?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch {
        if (!textNode) return;
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(textNode);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    reloadButton?.addEventListener('click', () => {
      window.location.reload();
    });
  }

  const contextNode = overlay.querySelector<HTMLParagraphElement>('.fatal-error-context');
  const detailsNode = overlay.querySelector<HTMLPreElement>('.fatal-error-details');

  if (contextNode) {
    if (context) {
      contextNode.hidden = false;
      contextNode.textContent = context;
    } else {
      contextNode.hidden = true;
      contextNode.textContent = '';
    }
  }

  if (detailsNode) {
    detailsNode.textContent = payload;
  }
}
