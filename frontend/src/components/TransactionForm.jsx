import { friendlyError } from "../utils/friendlyError";
import { useMutation } from "@apollo/client";
import { CREATE_TRANSACTION } from "../graphql/mutations/transaction.mutation";
import toast from "react-hot-toast";

export default function TransactionForm() {
  const [createTransaction, { loading }] = useMutation(CREATE_TRANSACTION, {
    refetchQueries: ["GetTransactions", "GetTransactionStatistics"],
  });
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const input = {
      description: String(values.get("description") || "").trim(), paymentType: values.get("paymentType"),
      category: values.get("category"), amount: Number(values.get("amount")),
      location: values.get("location"), date: values.get("date"),
    };
    if (!input.description) { toast.error("Enter a transaction description"); return; }
    if (!Number.isFinite(input.amount) || input.amount <= 0 || Math.round(input.amount * 100) !== input.amount * 100) { toast.error("Enter a valid amount in Indian Rupees"); return; }
    try { await createTransaction({ variables: { input } }); form.reset(); toast.success("Transaction created successfully"); }
    catch (error) { toast.error(friendlyError(error)); }
  };
  return <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <div className="sm:col-span-2"><label className="sw-label" htmlFor="description">Description</label><input className="sw-input" id="description" name="description" placeholder="Rent, groceries, salary..." required /></div>
    <div><label className="sw-label" htmlFor="paymentType">Payment type</label><select className="sw-input" id="paymentType" name="paymentType"><option value="card">Card</option><option value="cash">Cash</option></select></div>
    <div><label className="sw-label" htmlFor="category">Category</label><select className="sw-input" id="category" name="category"><option value="saving">Saving</option><option value="expense">Expense</option><option value="investment">Investment</option></select></div>
    <div><label className="sw-label" htmlFor="amount">Amount (₹)</label><input className="sw-input" id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="e.g. 1,500.00 (enter 1500)" required /></div>
    <div><label className="sw-label" htmlFor="location">Location</label><input className="sw-input" id="location" name="location" placeholder="e.g. Mumbai" /></div>
    <div className="sm:col-span-2"><label className="sw-label" htmlFor="date">Date</label><input className="sw-input" type="date" id="date" name="date" required /></div>
    <div className="sm:col-span-2"><button className="sw-primary-button" disabled={loading} type="submit">{loading ? "Adding transaction..." : "+ Add transaction"}</button></div>
  </form>;
}
