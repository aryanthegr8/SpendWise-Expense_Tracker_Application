import { friendlyError } from "../utils/friendlyError";
import { formatCurrency } from "../utils/currency";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { FiArrowDownLeft, FiArrowUpRight, FiEdit2, FiTrash2, FiMapPin, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { DELETE_TRANSACTION } from "../graphql/mutations/transaction.mutation";
import { formatDate } from "../utils/formatDate";

const tones = {
  saving: { badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20", icon: "bg-emerald-500/15 text-emerald-300" },
  expense: { badge: "bg-rose-500/10 text-rose-300 ring-rose-500/20", icon: "bg-rose-500/15 text-rose-300" },
  investment: { badge: "bg-violet-500/10 text-violet-300 ring-violet-500/20", icon: "bg-violet-500/15 text-violet-300" },
};
const money = formatCurrency;
const capitalize = (value) => value ? value[0].toUpperCase() + value.slice(1) : "Unknown";

export default function Card({ transaction, variant = "row" }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTransaction, { loading }] = useMutation(DELETE_TRANSACTION, { refetchQueries: ["GetTransactions", "GetTransactionStatistics"] });
  const category = (transaction.category || "").toLowerCase();
  const tone = tones[category] || tones.investment;
  const Icon = category === "expense" ? FiArrowUpRight : FiArrowDownLeft;
  const amount = money(transaction.amount);
  const date = transaction.date ? formatDate(transaction.date) : "No date";

  async function handleDelete() {
    try {
      await deleteTransaction({ variables: { transactionId: transaction._id } });
      toast.success("Transaction deleted successfully");
      setConfirmOpen(false);
    } catch (error) {
      toast.error(friendlyError(error, "Unable to delete transaction"));
    }
  }

  const actions = <div className="flex items-center justify-end gap-1">
    <Link to={`/transaction/${transaction._id}`} aria-label={`Edit ${transaction.description}`} title="Edit transaction" className="rounded-lg p-2.5 text-slate-400 transition hover:bg-violet-500/10 hover:text-violet-300"><FiEdit2 size={16}/></Link>
    <button type="button" onClick={() => setConfirmOpen(true)} disabled={loading} aria-label={`Delete ${transaction.description}`} title="Delete transaction" className="rounded-lg p-2.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"><FiTrash2 size={16}/></button>
  </div>;

  return <>
    {variant === "row" ? <tr className="transition-colors hover:bg-white/[0.035]">
      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}><Icon size={18}/></span><div className="min-w-0"><p className="max-w-[220px] truncate text-sm font-semibold text-white" title={transaction.description}>{transaction.description || "Untitled transaction"}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><FiMapPin size={12}/>{transaction.location || "No location"}</p></div></div></td>
      <td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone.badge}`}>{capitalize(category)}</span></td>
      <td className="px-4 py-4 text-sm text-slate-300">{capitalize(transaction.paymentType)}</td>
      <td className="px-4 py-4 text-sm text-slate-400">{date}</td>
      <td className="px-4 py-4 text-right text-sm font-bold tabular-nums text-white">{amount}</td>
      <td className="px-5 py-4">{actions}</td>
    </tr> : <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}><Icon size={18}/></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{transaction.description || "Untitled transaction"}</p><p className="mt-1 text-xs text-slate-500">{date}</p></div></div><span className="shrink-0 text-sm font-bold tabular-nums text-white">{amount}</span></div><div className="mt-3 flex items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone.badge}`}>{capitalize(category)}</span><span className="text-xs text-slate-400">{capitalize(transaction.paymentType)}</span><span className="text-xs text-slate-500">{transaction.location || "No location"}</span></div>{actions}</div></div>}
    {confirmOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setConfirmOpen(false); }}><div role="alertdialog" aria-modal="true" aria-labelledby={`delete-title-${transaction._id}`} aria-describedby={`delete-desc-${transaction._id}`} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171b2b] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><h3 id={`delete-title-${transaction._id}`} className="text-xl font-bold text-white">Delete transaction?</h3><button type="button" disabled={loading} onClick={() => setConfirmOpen(false)} aria-label="Close confirmation" className="text-slate-400 hover:text-white"><FiX/></button></div><p id={`delete-desc-${transaction._id}`} className="mt-3 text-sm leading-6 text-slate-400">Delete <strong className="text-white">{transaction.description || "this transaction"}</strong>? This action cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={loading} onClick={() => setConfirmOpen(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">Cancel</button><button type="button" disabled={loading} onClick={handleDelete} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50">{loading ? "Deleting..." : "Delete transaction"}</button></div></div></div>}
  </>;
}
