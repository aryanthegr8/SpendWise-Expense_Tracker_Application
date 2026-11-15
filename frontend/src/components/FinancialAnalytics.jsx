import QueryRetryNotice from "./ui/QueryRetryNotice";
import { friendlyError } from "../utils/friendlyError";
import { formatCurrency } from "../utils/currency";
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import { FiActivity, FiCalendar, FiTrendingUp } from "react-icons/fi";
import { GET_TRANSACTIONS } from "../graphql/queries/transaction.query";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const categories = [
  { key: "saving", label: "Savings", color: "#34d399" },
  { key: "expense", label: "Expenses", color: "#fb7185" },
  { key: "investment", label: "Investments", color: "#a78bfa" },
];
const money = formatCurrency;
const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const monthDate = (key) => new Date(`${key}-01T00:00:00.000Z`);
const monthLabel = (key) => monthDate(key).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });

// Date-only strings must be interpreted consistently, regardless of the browser's timezone.
function parseTransactionDate(value) {
  if (value == null || value === "") return null;
  let date;
  if (value instanceof Date) {
    date = value;
  } else {
    const raw = String(value).trim();
    // GraphQL String can serialize a MongoDB Date as epoch milliseconds.
    if (/^-?\d{13}$/.test(raw)) date = new Date(Number(raw));
    else if (/^-?\d{10}$/.test(raw)) date = new Date(Number(raw) * 1000);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = new Date(`${raw}T00:00:00.000Z`);
    else date = new Date(raw);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function FinancialAnalytics() {
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS);
  const [period, setPeriod] = useState("6");
  const transactions = data?.transactions ?? [];

  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const valid = transactions.map((item) => ({ ...item, parsedDate: parseTransactionDate(item.date) }))
      .filter((item) => item.parsedDate && categories.some((cat) => cat.key === String(item.category).toLowerCase()));
    const earliest = valid.reduce((min, item) => item.parsedDate < min ? item.parsedDate : min, currentMonth);
    const start = period === "all"
      ? new Date(Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth(), 1))
      : new Date(Date.UTC(now.getFullYear(), now.getMonth() - Number(period) + 1, 1));
    // Include future-dated transactions only in All history; bounded periods end at the current month.
    const latest = period === "all"
      ? valid.reduce((max, item) => item.parsedDate > max ? item.parsedDate : max, currentMonth)
      : currentMonth;
    const end = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth(), 1));
    const months = [];
    for (let d = new Date(start); d <= end && months.length < 240; d.setUTCMonth(d.getUTCMonth() + 1)) {
      months.push(monthKey(d));
    }
    const buckets = Object.fromEntries(months.map((key) => [key, { saving: 0, expense: 0, investment: 0 }]));
    let count = 0;
    for (const item of valid) {
      const key = monthKey(item.parsedDate);
      const category = String(item.category).toLowerCase();
      if (buckets[key]) {
        buckets[key][category] += Number(item.amount) || 0;
        count++;
      }
    }
    const totals = Object.fromEntries(categories.map((cat) => [cat.key, months.reduce((sum, key) => sum + buckets[key][cat.key], 0)]));
    const biggest = [...categories].sort((a, b) => totals[b.key] - totals[a.key])[0];
    return { months, buckets, totals, count, biggest };
  }, [transactions, period]);

  const chartData = {
    labels: analytics.months.map(monthLabel),
    datasets: categories.map((cat) => ({
      label: cat.label,
      data: analytics.months.map((key) => analytics.buckets[key][cat.key]),
      borderColor: cat.color,
      backgroundColor: `${cat.color}20`,
      pointBackgroundColor: cat.color,
      pointRadius: analytics.months.length > 18 ? 0 : 3,
      pointHoverRadius: 6,
      borderWidth: 2.5,
      tension: 0.35,
      fill: false,
    })),
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#1b2034", borderColor: "#37304f", borderWidth: 1,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#94a3b8", maxTicksLimit: 9 } },
      y: { beginAtZero: true, border: { display: false }, grid: { color: "rgba(148,163,184,0.09)" },
        ticks: { color: "#94a3b8", callback: (value) => `₹${Number(value).toLocaleString("en-IN")}` } },
    },
  };
  const total = Object.values(analytics.totals).reduce((a, b) => a + b, 0);

  return <section className="mt-10" aria-label="Financial analytics">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-400">Understand your money</p>
        <h2 className="text-2xl font-bold text-white">Financial analytics</h2>
        <p className="mt-1 text-sm text-slate-400">Trends based on your recorded transactions.</p>
      </div>
      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141827] px-3 text-slate-300">
        <FiCalendar aria-hidden="true" />
        <span className="sr-only">Analytics time range</span>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-11 bg-transparent pr-2 text-sm outline-none">
          <option className="bg-[#141827]" value="6">Last 6 months</option>
          <option className="bg-[#141827]" value="12">Last 12 months</option>
          <option className="bg-[#141827]" value="all">All history</option>
        </select>
      </label>
    </div>
    <QueryRetryNotice error={error} label="Unable to load analytics" onRetry={refetch} />
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="sw-panel p-5 sm:p-6 lg:col-span-2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2 text-lg font-semibold text-white"><FiActivity className="text-violet-400" /> Monthly trends</div><p className="mt-1 text-xs text-slate-400">Recorded amounts per month</p></div>
          <div className="flex flex-wrap gap-3">{categories.map((cat) => <span key={cat.key} className="flex items-center gap-1.5 text-xs text-slate-300"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />{cat.label}</span>)}</div>
        </div>
        {loading ? <div className="h-72 animate-pulse rounded-xl bg-white/5" /> : error ? null : analytics.count === 0 ?
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-white/10 px-5 text-center text-sm text-slate-400">No transactions in this time range. Select another range or add a transaction.</div> :
          <div className="h-72 sm:h-80"><Line data={chartData} options={chartOptions} /></div>}
      </div>
      <div className="sw-panel p-5 sm:p-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-white"><FiTrendingUp className="text-violet-400" /> Category insights</div>
        <p className="mt-1 text-xs text-slate-400">For the selected time range</p>
        <div className="mt-7 space-y-6">{categories.map((cat) => {
          const amount = analytics.totals[cat.key];
          const percentage = total > 0 ? Math.max(0, amount / total * 100) : 0;
          return <div key={cat.key}>
            <div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm text-slate-300">{cat.label}</span><span className="text-sm font-semibold text-white">{money(amount)}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: cat.color }} /></div>
            <p className="mt-1 text-right text-xs text-slate-500">{percentage.toFixed(1)}% of tracked amount</p>
          </div>;
        })}</div>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-xs text-slate-400">Average monthly expenses</p>
          <p className="mt-2 text-2xl font-bold text-white">{money(analytics.totals.expense / (analytics.months.length || 1))}</p>
          <p className="mt-2 text-xs text-slate-500">Across {analytics.months.length} calendar month{analytics.months.length === 1 ? "" : "s"}, including months with no transactions.</p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">Totals reflect recorded categories, not bank balances or verified income.</p>
      </div>
    </div>
  </section>;
}
