import { useEffect, useState } from "react";

// Chrome fires `beforeinstallprompt` once, early in page load — often before
// the component that wants it has mounted. Capture it here at module load
// (imported from index.js) so any "Download App" button can replay it later.
let deferredPrompt = null;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(deferredPrompt));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function useInstallApp() {
  const [prompt, setPrompt] = useState(deferredPrompt);

  useEffect(() => {
    listeners.add(setPrompt);
    return () => listeners.delete(setPrompt);
  }, []);

  // Returns true when the browser's own install dialog was shown; false means
  // the caller should fall back to manual "Add to Home screen" instructions.
  async function install() {
    if (!prompt) return false;
    prompt.prompt();
    await prompt.userChoice;
    deferredPrompt = null;
    notify();
    return true;
  }

  return { canPrompt: Boolean(prompt), install };
}
