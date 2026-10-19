// Detects when a newer version of the app has been deployed, and refreshes
// into it. Every build gives the main JS bundle a new hashed filename, and
// asset-manifest.json (always fetched live — see public/service-worker.js)
// names the newest one, so comparing the two tells us if we're out of date.

function runningBundle() {
  const script = document.querySelector('script[src*="/static/js/main."]');
  return script ? new URL(script.src).pathname : null;
}

// Resolves true/false, or null when it can't tell (dev server, offline).
export async function isUpdateAvailable() {
  const current = runningBundle();
  if (!current) return null;
  try {
    const res = await fetch(`/asset-manifest.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const latest = (await res.json())?.files?.["main.js"];
    return latest ? latest !== current : null;
  } catch {
    return null;
  }
}

// Clears cached app files and the service worker's copy, then reloads so the
// newest version loads from the network. Login is kept (it's in localStorage).
export async function refreshApp() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    }
  } catch {
    // Best effort — the reload below still fetches the latest page.
  }
  window.location.reload();
}
