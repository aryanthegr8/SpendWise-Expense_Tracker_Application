import Cards from "../components/Cards";
import TransactionForm from "../components/TransactionForm";
import FinancialAnalytics from "../components/FinancialAnalytics";
import MonthlyReports from "../components/MonthlyReports";
import BudgetPlanner from "../components/BudgetPlanner";
import SavingsGoals from "../components/SavingsGoals";
import RecurringPayments from "../components/RecurringPayments";

export default function WorkspacePage({ title, subtitle, section }) {
  return <main className="min-w-0 px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
    <header className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-400">SpendWise / {title}</p><h1 className="text-3xl font-extrabold tracking-tight text-white">{title}</h1><p className="mt-2 text-sm text-slate-400">{subtitle}</p></header>
    {section === "transactions" && <><section className="sw-panel mb-6 p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold text-white">Add a transaction</h2><TransactionForm/></section><Cards/></>}
    {section === "analytics" && <><FinancialAnalytics/><MonthlyReports/></>}
    {section === "budgets" && <BudgetPlanner/>}
    {section === "goals" && <SavingsGoals/>}
    {section === "recurring" && <RecurringPayments/>}
  </main>;
}
