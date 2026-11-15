import { useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import TransactionPage from "./pages/TransactionPage";
import NotFoundPage from "./pages/NotFoundPage";
import Header from "./components/ui/Header";
import AppNavigation from "./components/ui/AppNavigation";
import { Outlet } from "react-router-dom";
import WorkspacePage from "./pages/WorkspacePage";
import { GET_AUTHENTICATED_USER } from "./graphql/queries/user.query";

function ProtectedLayout({ user }) {
  return <><Header user={user}/><div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col items-stretch gap-0 lg:flex-row lg:items-start lg:gap-6 lg:px-5"><AppNavigation/><div className="w-full min-w-0 flex-1 pb-24 lg:pb-0"><Outlet/></div></div></>;
}

function ConnectionNotice({ onRetry, loading }) {
  return <div role="alert" className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
    <span>Cannot connect to SpendWise. Your session has not been cleared. Restart the backend and try again.</span>
    <button type="button" disabled={loading} onClick={onRetry} className="rounded-lg border border-rose-300/30 px-4 py-2 font-semibold hover:bg-rose-500/10 disabled:opacity-60">{loading ? "Retrying…" : "Try again"}</button>
  </div>;
}

function App() {
  const { loading, data, error, refetch } = useQuery(GET_AUTHENTICATED_USER, { notifyOnNetworkStatusChange: true });
  // Only remember an identity actually confirmed during this mounted app session.
  // Never persist it to localStorage or assume a session exists on a fresh visit.
  const lastConfirmedUser = useRef(null);
  const authRejected = error?.graphQLErrors?.some(({ extensions, message }) =>
    extensions?.code === "UNAUTHENTICATED" || /unauthenticated|not authenticated|unauthorized/i.test(message || "")
  );
  if (!error && data?.authUser) lastConfirmedUser.current = data.authUser;
  if (authRejected || (!error && !loading && data && !data.authUser)) lastConfirmedUser.current = null;

  const connectionFailed = Boolean(error?.networkError) && !authRejected;
  const user = authRejected ? null : (data?.authUser || (connectionFailed ? lastConfirmedUser.current : null));

  // Don't interpret a failed authentication query as "logged out".
  if (loading && !data && !lastConfirmedUser.current && !error) return null;
  if (error && !connectionFailed && !authRejected) {
    return <><ConnectionNotice loading={loading} onRetry={() => refetch().catch(() => {})}/><Toaster /></>;
  }
  if (connectionFailed && !user) {
    return <><ConnectionNotice loading={loading} onRetry={() => refetch().catch(() => {})}/><Toaster /></>;
  }

  return (
    <>
      {connectionFailed && <ConnectionNotice loading={loading} onRetry={() => refetch().catch(() => {})} />}
      <Routes>
        {user && <Route element={<ProtectedLayout user={user} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/transactions" element={<WorkspacePage title="Transactions" subtitle="Search, edit, export and record your transactions." section="transactions" />} />
          <Route path="/analytics" element={<WorkspacePage title="Analytics & reports" subtitle="Understand your financial trends and monthly activity." section="analytics" />} />
          <Route path="/budgets" element={<WorkspacePage title="Monthly budgets" subtitle="Plan your spending and monitor your monthly limits." section="budgets" />} />
          <Route path="/goals" element={<WorkspacePage title="Savings goals" subtitle="Track the milestones you are saving toward." section="goals" />} />
          <Route path="/recurring" element={<WorkspacePage title="Recurring payments" subtitle="Manage bills, subscriptions and payment history." section="recurring" />} />
          <Route path="/transaction/:id" element={<TransactionPage />} />
        </Route>}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={user ? <NotFoundPage /> : <Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
