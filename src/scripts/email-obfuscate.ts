// Email obfuscation contract (component-spec.md §2):
//   Static HTML must never contain the full address or "mailto:sfullom".
//   data-l / data-d split at "@"; assembled by this script at runtime.
//   Click also writes to clipboard; if a [data-email-text] node is present,
//   it briefly swaps to "Copied!" for 1.5s. Icon-only links may instead
//   expose a [data-email-copied] node, toggled to data-visible="true" for
//   the same window so a "Copied" popup can fade in.
//   JS-disabled: link stays href="#" with the original aria-label.
//
// Idempotent: links are tagged with data-email-init once handlers attach.
export function initEmailObfuscation(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    "[data-email-obfuscate]",
  );
  if (links.length === 0) return;

  for (const link of links) {
    if (link.dataset.emailInit === "true") continue;
    const local = link.dataset.l;
    const domain = link.dataset.d;
    if (!local || !domain) continue;

    const address = `${local}@${domain}`;
    const textEl = link.querySelector<HTMLElement>("[data-email-text]");
    const copiedEl = link.querySelector<HTMLElement>("[data-email-copied]");

    if (textEl) textEl.textContent = address;
    link.href = `mailto:${address}`;
    // Keep aria-label on icon-only links (no visible text). Only links that
    // expose the address via a [data-email-text] node should drop the label,
    // since the visible address then becomes the accessible name.
    if (textEl) link.removeAttribute("aria-label");
    link.dataset.emailInit = "true";

    link.addEventListener("click", (e) => {
      if (!navigator.clipboard) return;
      e.preventDefault();
      navigator.clipboard.writeText(address).then(() => {
        if (textEl) textEl.textContent = "Copied!";
        if (copiedEl) copiedEl.dataset.visible = "true";
        link.href = "#";
        setTimeout(() => {
          if (textEl) textEl.textContent = address;
          if (copiedEl) delete copiedEl.dataset.visible;
          link.href = `mailto:${address}`;
        }, 1500);
      });
    });
  }
}
