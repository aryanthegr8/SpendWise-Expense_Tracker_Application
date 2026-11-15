import { friendlyError } from "../utils/friendlyError";
import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiCreditCard, FiCalendar, FiMapPin } from "react-icons/fi";
import { GET_TRANSACTION } from "../graphql/queries/transaction.query";
import { UPDATE_TRANSACTION } from "../graphql/mutations/transaction.mutation";
import toast from "react-hot-toast";
import TransactionFormSkeleton from "../components/skeletons/TransactionFormSkeleton";

const emptyForm = {
  description: "",
  paymentType: "card",
  category: "expense",
  amount: "",
  location: "",
  date: "",
};

function dateForInput(raw) {
  if (raw === null || raw === undefined || raw === "") return "";
  const text = String(raw);
  // Preserve date-only values instead of shifting them across time zones.
  if (/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(text)) return text.slice(0, 10);
  const numeric = Number(raw);
  const parsed = Number.isFinite(numeric)
    ? new Date(numeric < 1e11 ? numeric * 1000 : numeric)
    : new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export default function TransactionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_TRANSACTION, { variables: { id } });
  const [updateTransaction, { loading: saving }] = useMutation(UPDATE_TRANSACTION, {
    refetchQueries: ["GetTransactions", "GetTransactionStatistics"],
    awaitRefetchQueries: true,
  });
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const transaction = data?.transaction;
    if (!transaction) return;
    setFormData({
      description: transaction.description ?? "",
      paymentType: transaction.paymentType ?? "card",
      category: transaction.category ?? "expense",
      amount: transaction.amount ?? "",
      location: transaction.location ?? "",
      date: dateForInput(transaction.date),
    });
  }, [data]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(formData.amount);
    if (!formData.description.trim()) return toast.error("Please enter a description");
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter a valid amount in Indian Rupees");
    if (!formData.date) return toast.error("Please select a transaction date");
    try {
      await updateTransaction({
        variables: {
          input: {
            ...formData,
            description: formData.description.trim(),
            location: formData.location.trim(),
            amount,
            transactionId: id,
          },
        },
      });
      toast.success("Transaction updated successfully");
      navigate("/");
    } catch (mutationError) {
      toast.error(friendlyError(mutationError, "Unable to update transaction"));
    }
  };

  if (loading) return <TransactionFormSkeleton />;

  if (error || !data?.transaction) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-white">
        <h1 className="text-2xl font-semibold">Transaction unavailable</h1>
        <p className="mt-3 text-slate-400">{(error ? friendlyError(error) : null) || "We couldn't find this transaction."}</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-violet-300 hover:text-violet-200">
          <FiArrowLeft /> Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-8 text-white sm:px-6 sm:pt-12">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white">
        <FiArrowLeft /> Back to dashboard
      </Link>

      <div className="mb-8">
        <div className="mb-3 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
          Transaction management
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Edit transaction</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
          Update your transaction details. All amounts are recorded in Indian Rupees (INR).
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#14141f]/95 shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 bg-white/[0.025] px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <FiCreditCard size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Transaction details</h2>
              <p className="text-xs text-slate-400">Make changes and save when you're ready</p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:gap-6 sm:p-8">
          <div className="sm:col-span-2">
            <label className="sw-label" htmlFor="description">Description <span className="text-violet-300">*</span></label>
            <input className="sw-input" id="description" name="description" value={formData.description} onChange={onChange} placeholder="e.g. Groceries, rent, salary" maxLength={200} required />
          </div>

          <div>
            <label className="sw-label" htmlFor="paymentType">Payment type</label>
            <select className="sw-input" id="paymentType" name="paymentType" value={formData.paymentType} onChange={onChange}>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="sw-label" htmlFor="category">Category</label>
            <select className="sw-input" id="category" name="category" value={formData.category} onChange={onChange}>
              <option value="saving">Saving</option>
              <option value="expense">Expense</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          <div>
            <label className="sw-label" htmlFor="amount">Amount (₹) <span className="text-violet-300">*</span></label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-violet-300">₹</span>
              <input className="sw-input !pl-9" id="amount" name="amount" type="number" min="0.01" step="0.01" value={formData.amount} onChange={onChange} placeholder="1500.00" required />
            </div>
            <p className="mt-2 text-xs text-slate-500">Enter the amount in INR; no conversion is applied.</p>
          </div>
          <div>
            <label className="sw-label" htmlFor="location">Location</label>
            <div className="relative">
              <FiMapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="sw-input !pl-11" id="location" name="location" value={formData.location} onChange={onChange} placeholder="e.g. Mumbai" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="sw-label" htmlFor="date">Transaction date <span className="text-violet-300">*</span></label>
            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="sw-input !pl-11" id="date" name="date" type="date" value={formData.date} onChange={onChange} required />
            </div>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:col-span-2 sm:flex-row sm:justify-end">
            <Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Cancel
            </Link>
            <button className="sw-primary-button inline-flex min-h-11 items-center justify-center gap-2 !w-auto px-7" type="submit" disabled={saving}>
              <FiCheck /> {saving ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
