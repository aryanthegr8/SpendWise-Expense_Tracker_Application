import { Link } from "react-router-dom";
import { FiCreditCard, FiActivity, FiShield, FiTrendingUp } from "react-icons/fi";

export default function AuthLayout({ children, mode }) {
  return (
    <main className="min-h-[100dvh] bg-[#080b14] text-white relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{background:"radial-gradient(ellipse 60% 45% at 25% 15%, rgba(124,58,237,.15), transparent 75%)"}} />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-[1440px] lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between border-r border-white/10 px-10 py-8 xl:px-14 xl:py-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-900/40"><FiCreditCard size={23}/></span>
            <span className="text-xl font-extrabold tracking-tight">Spend<span className="text-violet-400">Wise</span></span>
          </Link>
          <div className="max-w-lg">
            <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-violet-300">Your money, clearer</span>
            <h1 className="mt-5 text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.08]">Make every <span className="text-violet-400">transaction</span> count.</h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">One beautiful workspace to track spending, understand your habits, and make more informed financial decisions.</p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><FiActivity className="text-emerald-400" size={23}/><p className="mt-3 font-semibold">Clear insights</p><p className="mt-1 text-sm text-slate-400">See your financial patterns.</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><FiTrendingUp className="text-violet-400" size={23}/><p className="mt-3 font-semibold">Smarter tracking</p><p className="mt-1 text-sm text-slate-400">Keep your records organized.</p></div>
            </div>
          </div>
          <p className="flex items-center gap-2 text-sm text-slate-500"><FiShield/> Your financial workspace, made simple.</p>
        </section>
        <section className="flex min-h-[100dvh] flex-col px-5 py-5 sm:px-10 lg:px-12 xl:px-20">
          <div className="flex items-center justify-between lg:justify-end">
            <Link to="/" className="flex items-center gap-2 lg:hidden"><span className="rounded-xl bg-violet-600 p-2"><FiCreditCard/></span><span className="font-extrabold">Spend<span className="text-violet-400">Wise</span></span></Link>
            <span className="text-sm text-slate-400">{mode === "login" ? "New here?" : "Already a member?"} <Link className="ml-1 font-bold text-violet-300 hover:text-violet-200" to={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create account" : "Log in"}</Link></span>
          </div>
          <div className={`flex flex-1 justify-center py-6 lg:py-8 ${mode === "signup" ? "items-start lg:items-center" : "items-center"}`}><div className="w-full max-w-[440px]">{children}</div></div>
          <p className="text-center text-xs text-slate-600">SpendWise · Track wisely, spend wisely.</p>
        </section>
      </div>
    </main>
  );
}
