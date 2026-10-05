import { useState } from "react";
import { FaDownload, FaEllipsisV, FaShareSquare } from "react-icons/fa";
import Modal from "./Modal";
import { isIos, isStandalone, useInstallApp } from "../utils/installApp";

// Always-visible "Download App" entry point. Uses the browser's install dialog
// when Chrome offers one; otherwise (iPhone, or Chrome hasn't offered yet)
// shows step-by-step "Add to Home screen" instructions instead.
export default function DownloadAppButton({ className, onClick }) {
  const { install } = useInstallApp();
  const [showHelp, setShowHelp] = useState(false);

  if (isStandalone()) return null; // already running as the installed app

  async function handleClick() {
    onClick?.();
    const prompted = await install();
    if (!prompted) setShowHelp(true);
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        <FaDownload size={13} /> Download App
      </button>

      <Modal open={showHelp} title="Install RentaFlow" onClose={() => setShowHelp(false)} maxWidth="max-w-sm">
        {isIos() ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-600">
            <li>Open this page in <strong>Safari</strong>.</li>
            <li>
              Tap the Share button <FaShareSquare className="inline text-brand-500" size={13} /> at the bottom.
            </li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
          </ol>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-600">
            <li>Open this page in <strong>Chrome</strong>.</li>
            <li>
              Tap the menu <FaEllipsisV className="inline text-brand-500" size={12} /> at the top right.
            </li>
            <li>Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>), then confirm.</li>
          </ol>
        )}
        <p className="mt-4 text-xs text-ink-400">
          RentaFlow will appear on your home screen and open full-screen like a normal app.
        </p>
      </Modal>
    </>
  );
}
