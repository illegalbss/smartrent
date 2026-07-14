import { Component } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import Logo from "./Logo";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("RentaFlow crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <Logo linkTo="/" />
        <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <FaExclamationTriangle size={26} />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-ink-900">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-500">
          An unexpected error occurred. Try reloading the page — your data is saved locally and won't be lost.
        </p>
        <button
          onClick={() => window.location.assign("/")}
          className="mt-8 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          Back to Home
        </button>
      </div>
    );
  }
}
