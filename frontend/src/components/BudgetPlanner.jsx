import QueryRetryNotice from "./ui/QueryRetryNotice";
import { friendlyError } from "../utils/friendlyError";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FiAlertTriangle, FiCalendar, FiCheckCircle, FiSave } from "react-icons/fi";
import { GET_TRANSACTIONS } from "../graphql/queries/transaction.query";
import { GET_BUDGETS } from "../graphql/queries/budget.query";
import { SAVE_BUDGET } from "../graphql/mutations/budget.mutation";
import { formatCurrency } from "../utils/currency";

function parseDate(value) {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const date = /^-?\d{13}$/.test(raw) ? new Date(Number(raw))
    : /^-?\d{10}$/.test(raw) ? new Date(Number(raw) * 1000)
    : /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00.000Z`)
    : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
const monthOf = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const currentMonth = () => monthOf(new Date());

export default function BudgetPlanner() {
  const [month, setMonth] = useState(currentMonth);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const { data: budgetData, loading: budgetLoading, error: budgetError, refetch: retryBudget } = useQuery(GET_BUDGETS);
  const { data: txData, loading: txLoading, error: txError, refetch: retryTx } = useQuery(GET_TRANSACTIONS);
  const [saveBudget, { loading: saving }] = useMutation(SAVE_BUDGET, { refetchQueries: [{ query: GET_BUDGETS }], awaitRefetchQueries: true });
  const budgets = budgetData?.budgets || [];
  const selectedBudget = budgets.find((item) => item.month === month);
  const spending = useMemo(() => (txData?.transactions || []).reduce((sum, tx) => {
    if (tx.category !== "expense") return sum;
    const date = parseDate(tx.date);
    return date && monthOf(date) === month ? sum + (Number(tx.amount) || 0) : sum;
  }, 0), [txData, month]);
  const limit = Number(selectedBudget?.amount) || 0;
  const ratio = limit > 0 ? spending / limit : 0;
  const remaining = limit - spending;
  const status = limit === 0 ? "Set a monthly budget to begin tracking." : ratio >= 1 ? "Monthly budget exceeded." : ratio >= 0.8 ? "You've used at least 80% of your budget." : "You're within your monthly budget.";
  const save = async (event) => {
    event.preventDefault();
    setMessage("");
    const amount = Number(draft);
    if (!Number.isFinite(amount) || amount <= 0) { setMessage("Enter a budget greater than ₹0."); return; }
    try {
      await saveBudget({ variables: { month, amount } });
      setDraft("");
      setMessage("Budget saved successfully.");
    } catch (error) { setMessage(friendlyError(error, "Unable to save budget.")); }
  };
  return <section className="sw-panel mb-7 p-5 sm:p-7" aria-label="Monthly budget planner">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-400">Plan your spending</p><h2 className="text-2xl font-bold text-white">Monthly budget planner</h2><p className="mt-2 text-sm text-slate-400">Set a monthly limit and track expenses against it.</p></div>
      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300"><FiCalendar/><span className="sr-only">Select month</span><input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setDraft(""); setMessage(""); }} className="bg-transparent text-sm text-white outline-none [color-scheme:dark]" /></label>
    </div>
    <QueryRetryNotice error={budgetError || txError} label="Budget information could not load" onRetry={() => Promise.allSettled([...(budgetError ? [retryBudget()] : []), ...(txError ? [retryTx()] : [])])} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {[{ label: "Monthly limit", value: limit }, { label: "Spent on expenses", value: spending }, { label: remaining >= 0 ? "Remaining" : "Over budget", value: Math.abs(remaining) }].map((item) => <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="mb-2 text-xs text-slate-400">{item.label}</p><p className="text-xl font-bold text-white">{formatCurrency(item.value)}</p></div>)}
    </div>
    <div className="mb-5">
      <div className="mb-2 flex justify-between text-sm"><span className="text-slate-400">Budget usage</span><span className="font-semibold text-white">{limit ? `${(ratio * 100).toFixed(1)}%` : "Not set"}</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all ${ratio >= 1 ? "bg-rose-500" : ratio >= 0.8 ? "bg-amber-400" : "bg-violet-500"}`} style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}/></div>
      <p className={`mt-2 flex items-center gap-2 text-sm ${ratio >= 0.8 ? "text-amber-300" : "text-slate-400"}`}>{ratio >= 0.8 ? <FiAlertTriangle/> : <FiCheckCircle/>}{status}</p>
    </div>
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 w-full flex-1 flex-col sm:min-w-[200px] gap-2 text-sm text-slate-300">{selectedBudget ? "Update monthly limit (₹)" : "Set monthly limit (₹)"}<input type="number" min="0.01" step="0.01" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={selectedBudget ? String(selectedBudget.amount) : "e.g. 20000"} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-500" /></label>
      <button type="submit" disabled={saving || budgetLoading || txLoading} className="sw-primary-button flex items-center gap-2"><FiSave/>{saving ? "Saving..." : selectedBudget ? "Update budget" : "Save budget"}</button>
    </form>
    {message && <p role="status" className="mt-3 text-sm text-violet-300">{message}</p>}
    {budgets.length > 0 && <div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-3 text-sm font-semibold text-slate-200">Saved monthly budgets</h3><div className="flex flex-wrap gap-2">{budgets.slice(0, 12).map((item) => <button key={item._id} type="button" onClick={() => { setMonth(item.month); setDraft(""); setMessage(""); }} className={`rounded-lg border px-3 py-2 text-xs ${item.month === month ? "border-violet-400 bg-violet-500/15 text-violet-200" : "border-white/10 bg-white/5 text-slate-300"}`}>{item.month} · {formatCurrency(item.amount)}</button>)}</div></div>}
    <p className="mt-4 text-xs text-slate-500">Only transactions categorized as expense count toward this budget. Months use UTC dates, matching financial reports.</p>
  </section>;
}
