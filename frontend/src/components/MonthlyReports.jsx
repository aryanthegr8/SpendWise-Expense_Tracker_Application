import { friendlyError } from "../utils/friendlyError";
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { FiCalendar, FiDownload, FiBarChart2 } from "react-icons/fi";
import { GET_TRANSACTIONS } from "../graphql/queries/transaction.query";
import { formatCurrency } from "../utils/currency";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const categories = [
  { key: "saving", label: "Savings", color: "#34d399" },
  { key: "expense", label: "Expenses", color: "#fb7185" },
  { key: "investment", label: "Investments", color: "#a78bfa" },
];

function parseDate(value) {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  let date;
  if (/^-?\d{13}$/.test(raw)) date = new Date(Number(raw));
  else if (/^-?\d{10}$/.test(raw)) date = new Date(Number(raw) * 1000);
  else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = new Date(`${raw}T00:00:00.000Z`);
  else date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key) => new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const previousMonth = (key) => {
  const date = new Date(`${key}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return monthKey(date);
};
const emptyTotals = () => ({ saving: 0, expense: 0, investment: 0 });
const totalOf = (values) => categories.reduce((sum, category) => sum + values[category.key], 0);

function csvCell(value) {
  const str = String(value ?? "");
  // Escape CSV and prevent spreadsheet formula execution for user-entered strings.
  const safe = /^[\s]*[=+@\-\t\r]/.test(str) && !/^-?\d+(\.\d+)?$/.test(str.trim()) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function MonthlyReports() {
  const { data, loading, error } = useQuery(GET_TRANSACTIONS);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const report = useMemo(() => {
    const prior = previousMonth(selectedMonth);
    const current = emptyTotals();
    const previous = emptyTotals();
    const selected = [];
    for (const item of data?.transactions ?? []) {
      const date = parseDate(item.date);
      const category = String(item.category ?? "").toLowerCase();
      if (!date || !categories.some((entry) => entry.key === category)) continue;
      const key = monthKey(date);
      const amount = Number(item.amount);
      if (!Number.isFinite(amount)) continue;
      if (key === selectedMonth) {
        current[category] += amount;
        selected.push({ ...item, parsedDate: date });
      } else if (key === prior) previous[category] += amount;
    }
    selected.sort((a, b) => b.parsedDate - a.parsedDate);
    return { current, previous, selected, prior };
  }, [data, selectedMonth]);

  const downloadCSV = () => {
    if (!report.selected.length) return;
    const rows = [
      ["Date", "Description", "Category", "Payment Type", "Amount (INR)", "Location"],
      ...report.selected.map((item) => [
        item.parsedDate.toISOString().slice(0, 10), item.description, item.category,
        item.paymentType, Number(item.amount).toFixed(2), item.location,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `spendwise-report-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const chartData = {
    labels: categories.map((category) => category.label),
    datasets: [
      { label: monthLabel(selectedMonth), data: categories.map((category) => report.current[category.key]), backgroundColor: categories.map((category) => category.color), borderRadius: 7 },
      { label: monthLabel(report.prior), data: categories.map((category) => report.previous[category.key]), backgroundColor: "#475569", borderRadius: 7 },
    ],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#cbd5e1" } }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } } },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { color: "#94a3b8", callback: (value) => `₹${Number(value).toLocaleString("en-IN")}` }, grid: { color: "rgba(148,163,184,0.1)" } },
    },
  };

  return (
    <section className="mt-10" aria-label="Monthly financial reports">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-400">Your monthly review</p>
          <h2 className="text-2xl font-bold text-white">Monthly financial report</h2>
          <p className="mt-1 text-sm text-slate-400">Compare recorded category amounts with the previous month.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141827] px-3 text-slate-300">
            <FiCalendar aria-hidden="true" />
            <span className="sr-only">Report month</span>
            <input type="month" value={selectedMonth} onChange={(event) => event.target.value && setSelectedMonth(event.target.value)} className="h-11 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
          </label>
          <button type="button" onClick={downloadCSV} disabled={loading || Boolean(error) || !report.selected.length} className="sw-secondary-button flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40">
            <FiDownload size={17} /> Export month CSV
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">Unable to load monthly report: {friendlyError(error)}</p>}
      {loading ? <div className="sw-panel h-64 animate-pulse" role="status" aria-label="Loading monthly report" /> : !error && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...categories, { key: "tracked", label: "Total tracked", color: "#c4b5fd" }].map((category) => {
              const current = category.key === "tracked" ? totalOf(report.current) : report.current[category.key];
              const previous = category.key === "tracked" ? totalOf(report.previous) : report.previous[category.key];
              const change = previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;
              return <div key={category.key} className="sw-panel p-5">
                <p className="text-sm text-slate-400">{category.label}</p>
                <p className="mt-3 text-2xl font-bold text-white">{formatCurrency(current)}</p>
                <p className="mt-2 text-xs text-slate-400">{change == null ? (current === 0 ? "No recorded amount this month" : "No previous-month baseline") : `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs previous month`}</p>
              </div>;
            })}
          </div>
          <div className="sw-panel p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><FiBarChart2 className="text-violet-400" /> {monthLabel(selectedMonth)} vs {monthLabel(report.prior)}</div>
            {report.selected.length === 0 && totalOf(report.previous) === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 px-5 text-center text-sm text-slate-400">No recorded transactions in either month. Choose another month or add a transaction.</div>
            ) : <div className="h-72 sm:h-80"><Bar data={chartData} options={chartOptions} /></div>}
            <p className="mt-4 text-xs text-slate-500">{report.selected.length} transaction{report.selected.length === 1 ? "" : "s"} in the selected month. Savings are recorded savings transactions, not verified income or bank balance.</p>
          </div>
        </>
      )}
    </section>
  );
}
