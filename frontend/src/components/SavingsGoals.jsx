import QueryRetryNotice from "./ui/QueryRetryNotice";
import { friendlyError } from "../utils/friendlyError";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_SAVINGS_GOALS } from "../graphql/queries/savingsGoal.query";
import {
  CREATE_SAVINGS_GOAL, UPDATE_SAVINGS_GOAL, DELETE_SAVINGS_GOAL,
  ADD_SAVINGS_CONTRIBUTION, REMOVE_SAVINGS_CONTRIBUTION,
} from "../graphql/mutations/savingsGoal.mutation";

const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount || 0);
const initialForm = { name: "", targetAmount: "", deadline: "" };
const inputClass = "w-full rounded-xl border border-violet-400/20 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-violet-400";
const buttonClass = "rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50";

export default function SavingsGoals() {
  const { data, loading, error, refetch } = useQuery(GET_SAVINGS_GOALS, { fetchPolicy: "cache-and-network" });
  const [createGoal] = useMutation(CREATE_SAVINGS_GOAL);
  const [updateGoal] = useMutation(UPDATE_SAVINGS_GOAL);
  const [deleteGoal] = useMutation(DELETE_SAVINGS_GOAL);
  const [addContribution] = useMutation(ADD_SAVINGS_CONTRIBUTION);
  const [removeContribution] = useMutation(REMOVE_SAVINGS_CONTRIBUTION);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [contributions, setContributions] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const goals = data?.savingsGoals || [];
  const totalSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  async function perform(action, successMessage) {
    if (busy) return false;
    setBusy(true);
    setMessage("");
    try {
      await action();
      await refetch();
      setMessage(successMessage);
      return true;
    } catch (err) {
      setMessage(friendlyError(err, "Something went wrong"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitGoal(event) {
    event.preventDefault();
    if (busy) return;
    const targetAmount = Number(form.targetAmount);
    if (!form.name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      setMessage("Enter a goal name and a target greater than zero.");
      return;
    }
    const variables = { name: form.name.trim(), targetAmount, deadline: form.deadline || null };
    const success = await perform(
      () => editingId ? updateGoal({ variables: { ...variables, goalId: editingId } }) : createGoal({ variables }),
      editingId ? "Goal updated." : "Goal created."
    );
    if (success) { setForm(initialForm); setEditingId(null); }
  }

  async function contribute(event, goalId) {
    event.preventDefault();
    if (busy) return;
    const entry = contributions[goalId] || { amount: "", note: "" };
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setMessage("Contribution must be greater than zero."); return; }
    const success = await perform(() => addContribution({ variables: { goalId, amount, note: entry.note || "" } }), "Contribution added.");
    if (success) setContributions((current) => ({ ...current, [goalId]: { amount: "", note: "" } }));
  }

  function beginEdit(goal) {
    setEditingId(goal._id);
    setForm({ name: goal.name, targetAmount: String(goal.targetAmount), deadline: goal.deadline || "" });
    setMessage("Edit the goal in the form below.");
  }

  return (
    <section className="my-8 rounded-3xl border border-violet-500/20 bg-slate-900/90 p-5 text-slate-100 shadow-xl shadow-violet-950/20 md:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">SpendWise · Phase 5.6</p><h2 className="mt-1 text-2xl font-bold">Savings Goals</h2><p className="mt-1 text-sm text-slate-400">Set targets and record contributions manually.</p></div>
        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-right"><p className="text-xs text-slate-400">Total allocated</p><p className="text-xl font-bold text-violet-200">{money(totalSaved)}</p><p className="text-xs text-slate-400">of {money(totalTarget)} targeted</p></div>
      </div>
      <form onSubmit={submitGoal} className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 md:grid-cols-4">
        <label className="text-xs text-slate-300">Goal name<input className={`${inputClass} mt-1`} maxLength={80} required placeholder="Emergency Fund" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
        <label className="text-xs text-slate-300">Target (₹)<input className={`${inputClass} mt-1`} type="number" min="0.01" step="0.01" required value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}/></label>
        <label className="text-xs text-slate-300">Deadline (optional)<input className={`${inputClass} mt-1`} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}/></label>
        <div className="flex items-end gap-2"><button className={`${buttonClass} w-full`} disabled={busy} type="submit">{editingId ? "Save changes" : "Create goal"}</button>{editingId && <button type="button" className="rounded-xl border border-white/20 px-3 py-2 text-sm" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancel</button>}</div>
      </form>
      {message && <p role="status" className="mb-4 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">{message}</p>}
      {loading && !data && <p className="text-sm text-slate-400">Loading savings goals…</p>}
      <QueryRetryNotice error={error} label="Could not load savings goals" onRetry={refetch} />
      {!loading && !error && goals.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">No savings goals yet. Create your first goal above.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
          const entry = contributions[goal._id] || { amount: "", note: "" };
          return <article key={goal._id} className="rounded-2xl border border-violet-400/20 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between gap-2"><div><h3 className="text-lg font-semibold">{goal.name}</h3><p className="text-xs text-slate-400">{goal.deadline ? `Target date: ${goal.deadline}` : "No deadline"}</p></div><span className="rounded-full bg-violet-500/15 px-3 py-1 text-sm font-bold text-violet-200">{percent}%</span></div>
            <p className="mt-4 text-xl font-bold">{money(goal.savedAmount)} <span className="text-sm font-normal text-slate-400">/ {money(goal.targetAmount)}</span></p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }}/></div>
            <p className="mt-2 text-xs text-slate-400">{goal.savedAmount >= goal.targetAmount ? "Goal reached!" : `${money(goal.targetAmount - goal.savedAmount)} remaining`}</p>
            <form onSubmit={(event) => contribute(event, goal._id)} className="mt-4 grid grid-cols-2 gap-2">
              <input aria-label={`Contribution amount for ${goal.name}`} className={inputClass} type="number" min="0.01" step="0.01" required placeholder="Amount ₹" value={entry.amount} onChange={(e) => setContributions({ ...contributions, [goal._id]: { ...entry, amount: e.target.value } })}/>
              <input aria-label={`Contribution note for ${goal.name}`} className={inputClass} maxLength={200} placeholder="Note (optional)" value={entry.note} onChange={(e) => setContributions({ ...contributions, [goal._id]: { ...entry, note: e.target.value } })}/>
              <button type="submit" disabled={busy} className={`${buttonClass} col-span-2`}>Add contribution</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-3 text-xs"><button type="button" className="text-violet-300 hover:underline" onClick={() => setExpandedId(expandedId === goal._id ? null : goal._id)}>{expandedId === goal._id ? "Hide history" : `History (${goal.contributions.length})`}</button><button type="button" className="text-slate-300 hover:underline" onClick={() => beginEdit(goal)}>Edit goal</button><button type="button" disabled={busy} className="text-rose-300 hover:underline" onClick={() => { if (window.confirm(`Delete ${goal.name} and its contribution history?`)) perform(() => deleteGoal({ variables: { goalId: goal._id } }), "Goal deleted."); }}>Delete goal</button></div>
            {expandedId === goal._id && <div className="mt-4 space-y-2 border-t border-white/10 pt-3">{goal.contributions.length === 0 ? <p className="text-xs text-slate-400">No contributions recorded.</p> : [...goal.contributions].reverse().map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-2 text-xs"><div><strong className="text-emerald-300">+{money(item.amount)}</strong><p className="text-slate-400">{new Date(item.date).toLocaleDateString("en-IN")}{item.note ? ` · ${item.note}` : ""}</p></div><button type="button" disabled={busy} className="text-rose-300 hover:underline" onClick={() => { if (window.confirm("Remove this contribution?")) perform(() => removeContribution({ variables: { goalId: goal._id, contributionId: item._id } }), "Contribution removed."); }}>Remove</button></div>)}</div>}
          </article>;
        })}
      </div>
      <p className="mt-5 text-xs text-slate-500">Contributions are manually recorded allocations, not bank transfers. They do not modify transaction totals or monthly budgets.</p>
    </section>
  );
}
