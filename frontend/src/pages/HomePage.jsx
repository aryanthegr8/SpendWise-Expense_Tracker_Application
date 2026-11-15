import QueryRetryNotice from "../components/ui/QueryRetryNotice";
import { friendlyError } from "../utils/friendlyError";
import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { FiArrowDownRight, FiArrowUpRight, FiCalendar, FiTarget, FiCreditCard, FiPlusCircle, FiTrendingUp, FiPieChart } from "react-icons/fi";
import TransactionForm from "../components/TransactionForm";
import { formatCurrency } from "../utils/currency";
import { GET_TRANSACTIONS } from "../graphql/queries/transaction.query";
import { GET_AUTHENTICATED_USER } from "../graphql/queries/user.query";
import { GET_BUDGETS } from "../graphql/queries/budget.query";
import { GET_SAVINGS_GOALS } from "../graphql/queries/savingsGoal.query";
import { GET_RECURRING_PAYMENTS } from "../graphql/queries/recurringPayment.query";

const dateOf = (value) => {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const date = /^-?\d{13}$/.test(raw) ? new Date(Number(raw))
    : /^-?\d{10}$/.test(raw) ? new Date(Number(raw) * 1000)
    : /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00.000Z`)
    : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};
const monthOf = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const previousMonth = (date) => monthOf(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)));
const dayOf = (date) => date.toISOString().slice(0, 10);
const formatDate = (date) => date?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) || "Unknown date";
const sum = (items, getAmount) => items.reduce((total, item) => total + (Number(getAmount(item)) || 0), 0);

function Metric({ title, value, icon: Icon, description, tone = "text-violet-300 bg-violet-500/15" }) {
  return <div className="sw-panel min-w-0 p-5 sm:p-6">
    <div className="flex items-start justify-between gap-2"><span className="text-sm text-slate-400">{title}</span><span className={`rounded-xl p-2.5 ${tone}`}><Icon size={19} /></span></div>
    <p className="mt-5 break-words text-2xl font-bold tracking-tight text-white">{value}</p>
    <p className="mt-2 text-xs text-slate-500">{description}</p>
  </div>;
}
function Panel({ title, link, children }) {
  return <section className="sw-panel min-w-0 p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold text-white">{title}</h2><Link className="text-xs font-semibold text-violet-300 hover:text-violet-200" to={link}>View details →</Link></div>
    {children}
  </section>;
}
function Progress({ percent, warning = false }) {
  return <div className="h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, percent))}>
    <div className={`h-full rounded-full transition-all ${warning ? "bg-rose-400" : "bg-violet-500"}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
  </div>;
}

export default function HomePage() {
  const { data: txData, loading: txLoading, error: txError, refetch: retryTx } = useQuery(GET_TRANSACTIONS);
  const { data: userData } = useQuery(GET_AUTHENTICATED_USER);
  const { data: budgetData, loading: budgetLoading, error: budgetError, refetch: retryBudget } = useQuery(GET_BUDGETS);
  const { data: goalsData, loading: goalsLoading, error: goalsError, refetch: retryGoals } = useQuery(GET_SAVINGS_GOALS);
  const { data: recurringData, loading: recurringLoading, error: recurringError, refetch: retryRecurring } = useQuery(GET_RECURRING_PAYMENTS);
  const now = new Date();
  const month = monthOf(now);
  const priorMonth = previousMonth(now);
  const today = dayOf(now);
  const todayUTC = Date.parse(`${today}T00:00:00.000Z`);
  const firstName = (userData?.authUser?.name?.trim() || userData?.authUser?.username || "there").split(/\s+/)[0];

  const transactions = useMemo(() => (txData?.transactions || []).map((tx) => ({ ...tx, parsedDate: dateOf(tx.date) })), [txData]);
  const thisMonth = transactions.filter((tx) => tx.parsedDate && monthOf(tx.parsedDate) === month);
  const lastMonth = transactions.filter((tx) => tx.parsedDate && monthOf(tx.parsedDate) === priorMonth);
  const expenses = sum(thisMonth.filter((tx) => tx.category === "expense"), (tx) => tx.amount);
  const previousExpenses = sum(lastMonth.filter((tx) => tx.category === "expense"), (tx) => tx.amount);
  const savings = sum(thisMonth.filter((tx) => tx.category === "saving"), (tx) => tx.amount);
  const investments = sum(thisMonth.filter((tx) => tx.category === "investment"), (tx) => tx.amount);
  const change = previousExpenses > 0 ? ((expenses - previousExpenses) / previousExpenses) * 100 : null;
  const budget = (budgetData?.budgets || []).find((item) => item.month === month);
  const limit = Number(budget?.amount) || 0;
  const usage = limit > 0 ? (expenses / limit) * 100 : 0;
  const goals = goalsData?.savingsGoals || [];
  const savedTotal = sum(goals, (goal) => goal.savedAmount);
  const targetTotal = sum(goals, (goal) => goal.targetAmount);
  const goalPercent = targetTotal > 0 ? (savedTotal / targetTotal) * 100 : 0;
  const upcoming = (recurringData?.recurringPayments || []).filter((item) => {
    if (!item.active || !/^\d{4}-\d{2}-\d{2}$/.test(item.nextDueDate)) return false;
    const diff = (Date.parse(`${item.nextDueDate}T00:00:00.000Z`) - todayUTC) / 86400000;
    return diff <= 7;
  }).sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const upcomingTotal = sum(upcoming, (item) => item.amount);
  const recent = [...transactions].sort((a, b) => (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0)).slice(0, 5);

  return <main className="min-w-0 px-5 pb-20 pt-9 sm:px-8 sm:pt-12">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-violet-400">Your financial workspace</p><h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Welcome back, {firstName} ✦</h1><p className="mt-2 text-sm text-slate-400">Your financial snapshot for {now.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}.</p></div>
      <Link to="/transactions" className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20">All transactions →</Link>
    </div>
    <QueryRetryNotice error={txError || budgetError || goalsError || recurringError} label="Some financial information could not load" onRetry={() => Promise.allSettled([...(txError ? [retryTx()] : []), ...(budgetError ? [retryBudget()] : []), ...(goalsError ? [retryGoals()] : []), ...(recurringError ? [retryRecurring()] : [])])} />
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Spent this month" value={txLoading ? "Loading…" : formatCurrency(expenses)} icon={FiArrowDownRight} tone="bg-rose-500/15 text-rose-300" description={txLoading ? "Fetching transactions" : change === null ? "No previous-month expense baseline" : `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs previous month`} />
      <Metric title="Monthly budget" value={budgetLoading ? "Loading…" : budget ? formatCurrency(limit) : "Not set"} icon={FiPieChart} description={budget ? "Your spending limit" : "Create a budget to track spending"} />
      <Metric title={limit > 0 && expenses > limit ? "Over budget" : "Budget remaining"} value={txLoading || budgetLoading ? "Loading…" : budget ? formatCurrency(Math.abs(limit - expenses)) : "Not set"} icon={FiTrendingUp} tone={limit > 0 && expenses > limit ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"} description={budget ? `${Math.round(usage)}% of budget used` : "Set a monthly limit first"} />
      <Metric title="Bills due / overdue" value={recurringLoading ? "Loading…" : formatCurrency(upcomingTotal)} icon={FiCalendar} tone="bg-sky-500/15 text-sky-300" description={recurringLoading ? "Fetching schedules" : `${upcoming.length} active schedule(s) due within 7 days or overdue`} />
    </div>
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <Panel title="Monthly budget health" link="/budgets">
        {txLoading || budgetLoading ? <p className="text-sm text-slate-400">Loading budget…</p> : !budget ? <p className="text-sm text-slate-400">No budget set for this month. <Link className="text-violet-300 underline" to="/budgets">Set your monthly budget</Link>.</p> : <div className="space-y-3"><div className="flex justify-between gap-2 text-sm"><span className="text-slate-400">{formatCurrency(expenses)} spent</span><strong className="text-white">{usage.toFixed(1)}%</strong></div><Progress percent={usage} warning={usage >= 100}/><p className="text-xs text-slate-400">{usage >= 100 ? `${formatCurrency(expenses - limit)} over budget` : `${formatCurrency(limit - expenses)} remaining`} of {formatCurrency(limit)}.</p></div>}
      </Panel>
      <Panel title="Savings goals" link="/goals">
        {goalsLoading ? <p className="text-sm text-slate-400">Loading goals…</p> : goals.length === 0 ? <p className="text-sm text-slate-400">No goals yet. <Link className="text-violet-300 underline" to="/goals">Create a savings goal</Link>.</p> : <div className="space-y-3"><div className="flex justify-between gap-2 text-sm"><span className="text-slate-400">{goals.length} goal(s) · manually allocated</span><strong className="text-white">{goalPercent.toFixed(1)}%</strong></div><Progress percent={goalPercent}/><p className="text-xs text-slate-400">{formatCurrency(savedTotal)} allocated toward {formatCurrency(targetTotal)} in targets.</p></div>}
      </Panel>
    </div>
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <Panel title="Upcoming & overdue bills" link="/recurring">
        {recurringLoading ? <p className="text-sm text-slate-400">Loading bills…</p> : upcoming.length === 0 ? <p className="text-sm text-slate-400">No active payments due within 7 days or overdue.</p> : <div className="space-y-3">{upcoming.slice(0, 4).map((item) => <div key={item._id} className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{item.name}</p><p className="text-xs text-slate-400">Due {item.nextDueDate}{item.nextDueDate < today ? " · Overdue" : ""}</p></div><strong className="shrink-0 text-sm text-white">{formatCurrency(item.amount)}</strong></div>)}{upcoming.length > 4 && <p className="text-xs text-slate-400">+{upcoming.length - 4} more on the recurring payments page</p>}</div>}
      </Panel>
      <Panel title="Recent transactions" link="/transactions">
        {txLoading ? <p className="text-sm text-slate-400">Loading transactions…</p> : recent.length === 0 ? <p className="text-sm text-slate-400">No transactions recorded yet.</p> : <div className="space-y-3">{recent.map((tx) => <div key={tx._id} className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{tx.description || tx.category}</p><p className="text-xs capitalize text-slate-400">{tx.category} · {formatDate(tx.parsedDate)}</p></div><strong className={`shrink-0 text-sm ${tx.category === "expense" ? "text-rose-300" : "text-emerald-300"}`}>{formatCurrency(tx.amount)}</strong></div>)}</div>}
      </Panel>
    </div>
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Metric title="Savings transactions this month" value={txLoading ? "Loading…" : formatCurrency(savings)} icon={FiArrowUpRight} tone="bg-emerald-500/15 text-emerald-300" description="Recorded saving-category transactions, not goal contributions" />
      <Metric title="Investments this month" value={txLoading ? "Loading…" : formatCurrency(investments)} icon={FiCreditCard} tone="bg-sky-500/15 text-sky-300" description="Recorded investment-category transactions" />
    </div>
    <section className="sw-panel p-5 sm:p-6" aria-label="Add a transaction"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-violet-500/15 p-3 text-violet-300"><FiPlusCircle size={20}/></span><div><h2 className="text-lg font-bold text-white">Quick add transaction</h2><p className="text-sm text-slate-400">Record an expense, saving, or investment</p></div></div><TransactionForm /></section>
    <nav className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Quick actions"><Link to="/budgets" className="sw-panel p-4 text-sm font-semibold text-violet-200 hover:border-violet-500/40">Manage budget →</Link><Link to="/goals" className="sw-panel p-4 text-sm font-semibold text-violet-200 hover:border-violet-500/40"><FiTarget className="mr-2 inline"/>Savings goals →</Link><Link to="/analytics" className="sw-panel p-4 text-sm font-semibold text-violet-200 hover:border-violet-500/40">Financial reports →</Link></nav>
    <p className="mt-5 text-xs text-slate-500">Amounts are based on your recorded entries, not verified bank balances. Savings-goal allocations and recurring-payment confirmations are tracked separately and are not automatically counted as transactions. Months use UTC dates.</p>
  </main>;
}
