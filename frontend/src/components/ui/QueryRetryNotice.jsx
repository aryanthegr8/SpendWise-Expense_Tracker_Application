import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { friendlyError } from "../../utils/friendlyError";

/** Retries read-only queries only. Never use this to replay a financial mutation. */
export default function QueryRetryNotice({ error, onRetry, label = "Unable to load data" }) {
  const [retrying, setRetrying] = useState(false);
  if (!error) return null;
  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try { await onRetry(); } catch { /* The query's error state displays the failure. */ }
    finally { setRetrying(false); }
  };
  return <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
    <p className="min-w-0 flex-1">{label}: {friendlyError(error)}</p>
    <button type="button" onClick={retry} disabled={retrying} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-300/30 px-3 py-2 font-semibold text-rose-100 hover:bg-rose-500/15 disabled:cursor-wait disabled:opacity-60" aria-label={retrying ? "Retrying data request" : "Retry loading data"}>
      <FiRefreshCw className={retrying ? "animate-spin" : ""} aria-hidden="true" />{retrying ? "Retrying…" : "Try again"}
    </button>
  </div>;
}
