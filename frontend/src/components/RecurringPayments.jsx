import QueryRetryNotice from "./ui/QueryRetryNotice";
import { friendlyError } from "../utils/friendlyError";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FiCalendar, FiPlus, FiPause, FiPlay, FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "../utils/currency";
import { GET_RECURRING_PAYMENTS } from "../graphql/queries/recurringPayment.query";
import { CREATE_RECURRING_PAYMENT, UPDATE_RECURRING_PAYMENT, SET_RECURRING_PAYMENT_ACTIVE, MARK_RECURRING_PAYMENT_PAID, DELETE_RECURRING_PAYMENT } from "../graphql/mutations/recurringPayment.mutation";

const empty = { name: "", amount: "", category: "Subscriptions", frequency: "monthly", nextDueDate: new Date().toLocaleDateString("en-CA") };
const field = "w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400";
const button = "rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-violet-400/60 hover:text-white disabled:opacity-50";
const dateOnly = (date) => new Date(`${date}T00:00:00Z`);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const daysUntil = (date) => Math.round((dateOnly(date).getTime() - dateOnly(today()).getTime()) / 86400000);
const displayDate = (date) => dateOnly(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthlyEquivalent = (p) => Number(p.amount) * (p.frequency === "weekly" ? 52/12 : p.frequency === "yearly" ? 1/12 : 1);

export default function RecurringPayments() {
  const { data, loading, error, refetch } = useQuery(GET_RECURRING_PAYMENTS);
  const [create, { loading: creating }] = useMutation(CREATE_RECURRING_PAYMENT);
  const [update, { loading: updating }] = useMutation(UPDATE_RECURRING_PAYMENT);
  const [toggle, { loading: toggling }] = useMutation(SET_RECURRING_PAYMENT_ACTIVE);
  const [mark, { loading: marking }] = useMutation(MARK_RECURRING_PAYMENT_PAID);
  const [remove, { loading: removing }] = useMutation(DELETE_RECURRING_PAYMENT);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [historyId, setHistoryId] = useState(null);
  const payments = useMemo(() => data?.recurringPayments || [], [data]);
  const active = payments.filter(p => p.active);
  const monthly = active.reduce((sum,p) => sum + monthlyEquivalent(p), 0);
  const upcoming = active.filter(p => daysUntil(p.nextDueDate) <= 7).length;
  const pending = creating || updating || toggling || marking || removing;
  const set = (key,value) => setForm(f => ({...f,[key]:value}));
  const reset = () => { setForm({...empty, nextDueDate: today()}); setEditing(null); setShowForm(false); };
  async function run(action, id) {
    if (pending) return;
    setMessage(""); setBusyId(id);
    try { await action(); await refetch(); } catch(e) { setMessage(friendlyError(e)); } finally { setBusyId(null); }
  }
  async function save(e) {
    e.preventDefault();
    if (pending) return;
    const amount = Number(form.amount);
    if (!form.name.trim() || !form.category.trim() || !Number.isFinite(amount) || amount <= 0 || (!/^\d{4}-\d{2}-\d{2}$/.test(form.nextDueDate) || Number.isNaN(Date.parse(`${form.nextDueDate}T00:00:00Z`)))) { setMessage("Enter a name, category, positive amount, and due date."); return; }
    setMessage("");
    try {
      const input = { name: form.name.trim(), amount, category: form.category.trim(), frequency: form.frequency, nextDueDate: form.nextDueDate };
      if (editing) await update({variables:{id:editing,input}});
      else await create({variables:{input}});
      await refetch(); reset();
    } catch(e) { setMessage(friendlyError(e)); }
  }
  function edit(p) { setEditing(p._id); setForm({name:p.name,amount:String(p.amount),category:p.category,frequency:p.frequency,nextDueDate:p.nextDueDate}); setShowForm(true); }
  return <section className="sw-panel mt-7 p-5 sm:p-7" aria-label="Recurring payments">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><FiCalendar className="text-violet-300"/><h2 className="text-xl font-bold text-white">Recurring payments</h2></div><p className="mt-1 text-sm text-slate-400">Track subscriptions and bills. Confirm payments manually; no automatic charges or expense entries.</p></div>
      <button className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500" onClick={() => { if(showForm) reset(); else {setEditing(null);setForm({...empty,nextDueDate:today()});setShowForm(true);} }}><FiPlus className="mr-2 inline"/>{showForm ? "Close form" : "Add recurring payment"}</button>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Estimated monthly cost</p><p className="mt-2 text-2xl font-bold text-white">{formatCurrency(monthly)}</p></div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Active schedules</p><p className="mt-2 text-2xl font-bold text-white">{active.length}</p></div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Due or overdue within 7 days</p><p className="mt-2 text-2xl font-bold text-white">{upcoming}</p></div>
    </div>
    {showForm && <form onSubmit={save} className="mt-5 grid gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 sm:grid-cols-2">
      <label className="text-xs text-slate-300">Payment name<input className={`${field} mt-1`} value={form.name} maxLength={100} onChange={e=>set("name",e.target.value)} placeholder="Internet bill" required/></label>
      <label className="text-xs text-slate-300">Amount (₹)<input className={`${field} mt-1`} type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>set("amount",e.target.value)} required/></label>
      <label className="text-xs text-slate-300">Category<input className={`${field} mt-1`} value={form.category} maxLength={60} onChange={e=>set("category",e.target.value)} required/></label>
      <label className="text-xs text-slate-300">Frequency<select className={`${field} mt-1`} value={form.frequency} onChange={e=>set("frequency",e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
      <label className="text-xs text-slate-300 sm:col-span-2">Next due date<input className={`${field} mt-1`} type="date" value={form.nextDueDate} onChange={e=>set("nextDueDate",e.target.value)} required/></label>
      <div className="sm:col-span-2 flex gap-2"><button disabled={pending} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{editing ? "Save changes" : "Create payment"}</button><button type="button" className={button} onClick={reset}>Cancel</button></div>
    </form>}
    {message && <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{message}</p>}
    {loading ? <p className="mt-6 text-sm text-slate-400">Loading recurring payments…</p> : error ? <QueryRetryNotice error={error} label="Unable to load recurring payments" onRetry={refetch} /> : payments.length === 0 ? <p className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">No recurring payments yet. Add your first subscription or bill.</p> : <div className="mt-5 space-y-3">{payments.map(p => {
      const due = daysUntil(p.nextDueDate);
      const status = !p.active ? "Paused" : due < 0 ? `Overdue by ${Math.abs(due)} day(s)` : due === 0 ? "Due today" : `Due in ${due} day(s)`;
      return <article key={p._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{p.name}</h3><p className="mt-1 text-xs text-slate-400">{p.category} · {p.frequency} · Next: {displayDate(p.nextDueDate)}</p><p className={`mt-2 text-xs ${p.active && due <= 7 ? "text-amber-300" : "text-slate-400"}`}>{status}</p></div><p className="text-lg font-bold text-white">{formatCurrency(p.amount)}</p></div>
        <div className="mt-4 flex flex-wrap gap-2"><button className={button} disabled={pending} onClick={()=>edit(p)}><FiEdit2 className="mr-1 inline"/>Edit</button><button className={button} disabled={pending} onClick={()=>run(()=>toggle({variables:{id:p._id,active:!p.active}}),p._id)}>{p.active ? <FiPause className="mr-1 inline"/> : <FiPlay className="mr-1 inline"/>}{p.active?"Pause":"Resume"}</button>
        {p.active && <button className={`${button} border-emerald-500/30 text-emerald-300`} disabled={pending && busyId === p._id} onClick={()=>run(()=>mark({variables:{id:p._id}}),p._id)}><FiCheck className="mr-1 inline"/>Mark paid</button>}
        <button className={button} onClick={()=>setHistoryId(historyId===p._id?null:p._id)}>History ({p.history.length})</button>
        <button className={`${button} text-rose-300`} disabled={pending} onClick={()=>{if(window.confirm(`Delete ${p.name} and its payment history?`)) run(()=>remove({variables:{id:p._id}}),p._id);}}><FiTrash2 className="mr-1 inline"/>Delete</button></div>
        {historyId===p._id && <div className="mt-4 border-t border-white/10 pt-3"><p className="mb-2 text-xs font-semibold text-slate-300">Confirmed payments (not transaction entries)</p>{p.history.length ? [...p.history].reverse().map(h=><p key={h._id} className="py-1 text-xs text-slate-400">Scheduled {displayDate(h.scheduledDate)} · {formatCurrency(h.amount)} · confirmed {new Date(Number(h.paidOn) || h.paidOn).toLocaleDateString("en-IN")}</p>) : <p className="text-xs text-slate-500">No confirmed payments yet.</p>}</div>}
      </article>;
    })}</div>}
    <p className="mt-4 text-xs text-slate-500">Monthly estimates: weekly × 52 ÷ 12, yearly ÷ 12. Confirming a payment advances the due date by one cycle; overdue cycles can be confirmed individually.</p>
  </section>;
}
