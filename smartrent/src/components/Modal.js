import { FaTimes } from "react-icons/fa";

export default function Modal({ open, title, onClose, children, maxWidth = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-soft sm:p-7`}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink-900">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700" aria-label="Close">
            <FaTimes size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
