import { friendlyError } from "../utils/friendlyError";
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { FiSearch, FiFilter, FiInbox, FiDownload } from "react-icons/fi";
import Card from "./Card";
import { GET_TRANSACTIONS } from "../graphql/queries/transaction.query";

const filters = ["all", "saving", "expense", "investment"];
const transactionTime = (date) => {
  if (date == null || date === "") return 0;
  const numeric = Number(date);
  if (Number.isFinite(numeric) && String(date).trim() !== "") return numeric < 1e11 ? numeric * 1000 : numeric;
  const parsed = new Date(date).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function Cards() {
  const { data, loading, error } = useQuery(GET_TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const transactions = data?.transactions ?? [];
  const filtered = useMemo(() => transactions.filter((item) => {
    const matchesCategory = category === "all" || item.category?.toLowerCase() === category;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.description, item.location, item.paymentType].some((value) => String(value ?? "").toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sort === "highest") return Number(b.amount) - Number(a.amount);
    if (sort === "lowest") return Number(a.amount) - Number(b.amount);
    const first = transactionTime(a.date);
    const second = transactionTime(b.date);
    return sort === "oldest" ? first - second : second - first;
  }), [transactions, category, search, sort]);

  const hasActiveFilters = Boolean(search.trim()) || category !== "all" || sort !== "newest";
  const resetFilters = () => { setSearch(""); setCategory("all"); setSort("newest"); };

  const exportCSV = () => {
    if (!filtered.length || loading || error) return;
    const safeCell = (value) => {
      const raw = String(value ?? "");
      // Prevent spreadsheet programs from interpreting untrusted text as formulas.
      const protectedText = /^[\s\u0000-\u001f]*[=+@-]/.test(raw) ? `\'${raw}` : raw;
      return `"${protectedText.replace(/"/g, '""')}"`;
    };
    const headers = ["Date", "Description", "Category", "Payment Type", "Amount (INR)", "Location"];
    const rows = filtered.map((item) => {
      const timestamp = transactionTime(item.date);
      const date = timestamp ? new Date(timestamp).toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }) : "";
      const amount = Number(item.amount);
      return [date, item.description, item.category, item.paymentType, Number.isFinite(amount) ? amount.toFixed(2) : "", item.location];
    });
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(safeCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `spendwise-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section className="mt-10" aria-label="Transaction history">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-400">Your activity</p><h2 className="text-2xl font-bold text-white">Transaction history</h2><p className="mt-1 text-sm text-slate-400">Search, organize and manage your financial records.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">{transactions.length} total transactions</span>
        <button type="button" onClick={exportCSV} disabled={loading || Boolean(error) || filtered.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-40" title="Download currently displayed transactions as CSV"><FiDownload size={16} aria-hidden="true"/> Export CSV</button>
      </div>
    </div>
    <div className="sw-panel overflow-hidden">
      <div className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search transactions</span>
            <FiSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by description, location or payment..." className="block h-12 w-full min-w-0 rounded-xl border border-white/10 bg-[#0d1120] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/60" />
          </label>
          <div className="relative w-full shrink-0 sm:w-52">
            <label className="sr-only" htmlFor="transaction-sort">Sort transactions</label>
            <FiFilter aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <select id="transaction-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="block h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0d1120] pl-10 pr-8 text-sm text-slate-200 outline-none focus:border-violet-500/60"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select>
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">{filters.map((filter) => <button key={filter} type="button" onClick={() => setCategory(filter)} aria-pressed={category === filter} className={`rounded-lg px-3.5 py-2 text-xs font-semibold capitalize transition-colors ${category === filter ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20" : "border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white"}`}>{filter === "all" ? "All transactions" : filter}</button>)}{hasActiveFilters && <button type="button" onClick={resetFilters} className="ml-auto rounded-lg border border-violet-500/30 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/10">Clear filters</button>}</div>
      </div>
      {error && <p role="alert" className="p-6 text-sm text-rose-300">Unable to load transactions: {friendlyError(error)}</p>}
      {loading && <div className="space-y-3 p-5" role="status" aria-label="Loading transactions">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.05]"/>)}<span className="sr-only">Loading transactions...</span></div>}
      {!loading && !error && filtered.length === 0 && <div className="flex flex-col items-center gap-3 px-6 py-14 text-center"><FiInbox className="text-3xl text-violet-400"/><h3 className="font-semibold text-white">{transactions.length ? "No matching transactions" : "No transactions yet"}</h3><p className="text-sm text-slate-400">{transactions.length ? "Try changing your search or filters." : "Add your first transaction to get started."}</p>{transactions.length > 0 && hasActiveFilters && <button type="button" onClick={resetFilters} className="mt-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">Clear filters</button>}</div>}
      {!loading && !error && filtered.length > 0 && <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] table-fixed text-left"><thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-slate-500"><tr><th className="w-[30%] px-5 py-4 font-semibold">Transaction</th><th className="w-[15%] px-4 py-4 font-semibold">Category</th><th className="w-[13%] px-4 py-4 font-semibold">Payment</th><th className="w-[16%] px-4 py-4 font-semibold">Date</th><th className="w-[14%] px-4 py-4 text-right font-semibold">Amount</th><th className="w-[12%] px-5 py-4 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-white/[0.07]">{filtered.map((transaction) => <Card key={transaction._id} transaction={transaction} variant="row"/>)}</tbody></table></div>
        <div className="divide-y divide-white/[0.07] md:hidden">{filtered.map((transaction) => <Card key={transaction._id} transaction={transaction} variant="mobile"/>)}</div>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-400">Showing {filtered.length} of {transactions.length} transactions</div>
      </>}
    </div>
  </section>;
}
