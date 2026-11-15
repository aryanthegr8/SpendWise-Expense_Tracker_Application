import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiHome, FiCreditCard, FiBarChart2, FiTarget, FiCalendar, FiPieChart, FiMoreHorizontal, FiX } from "react-icons/fi";

const items = [
  { to: "/", label: "Dashboard", short: "Home", icon: FiHome, end: true },
  { to: "/transactions", label: "Transactions", short: "Activity", icon: FiCreditCard },
  { to: "/analytics", label: "Analytics", short: "Analytics", icon: FiBarChart2 },
  { to: "/budgets", label: "Budgets", short: "Budgets", icon: FiPieChart },
  { to: "/goals", label: "Savings goals", short: "Goals", icon: FiTarget },
  { to: "/recurring", label: "Recurring payments", short: "Recurring", icon: FiCalendar },
];

export default function AppNavigation() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreRef = useRef(null);
  useEffect(() => { setMoreOpen(false); }, [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const dismiss = (event) => { if (!moreRef.current?.contains(event.target)) setMoreOpen(false); };
    const escape = (event) => { if (event.key === "Escape") setMoreOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [moreOpen]);
  const moreActive = items.slice(4).some(({to}) => pathname === to || pathname.startsWith(`${to}/`));
  return <>
    <nav aria-label="Financial workspace navigation" className="hidden lg:sticky lg:top-24 lg:ml-0 lg:mt-7 lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:rounded-2xl lg:border lg:border-white/10 lg:bg-white/[0.035] lg:p-3">
      <p className="px-3 pb-3 pt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
      {items.map(({to,label,icon:Icon,end}) => <NavLink key={to} to={to} end={end} className={({isActive}) => `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${isActive ? "bg-violet-600/25 text-violet-200 ring-1 ring-violet-500/30" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon className="h-4 w-4 shrink-0"/><span>{label}</span></NavLink>)}
    </nav>
    <div ref={moreRef} className="lg:hidden">
      {moreOpen && <div className="fixed inset-0 z-[45] bg-black/40" onClick={() => setMoreOpen(false)} aria-hidden="true" />}
      {moreOpen && <nav id="spendwise-more-menu" aria-label="More financial pages" className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[51] rounded-2xl border border-violet-400/20 bg-[#1b1929] p-2 shadow-2xl shadow-black/70">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400"><span>More pages</span><button type="button" aria-label="Close more menu" onClick={() => setMoreOpen(false)} className="rounded-lg p-2 text-slate-300 focus-visible:ring-2 focus-visible:ring-violet-400"><FiX/></button></div>
        {items.slice(4).map(({to,label,icon:Icon}) => <NavLink key={to} to={to} onClick={() => setMoreOpen(false)} className={({isActive}) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${isActive ? "bg-violet-600/25 text-violet-200" : "text-slate-200 hover:bg-white/10"}`}><Icon className="h-5 w-5"/>{label}</NavLink>)}
      </nav>}
      <nav aria-label="Mobile financial navigation" className="fixed inset-x-0 bottom-0 z-[50] border-t border-white/10 bg-[#11111d]/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="mx-auto grid h-[72px] max-w-lg grid-cols-5 items-stretch px-1">
          {items.slice(0,4).map(({to,short,icon:Icon,end}) => <NavLink key={to} to={to} end={end} className={({isActive}) => `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${isActive ? "text-violet-300" : "text-slate-400 hover:text-white"}`}><Icon aria-hidden="true" className="h-[21px] w-[21px]"/><span className="truncate">{short}</span></NavLink>)}
          <button type="button" aria-expanded={moreOpen} aria-controls="spendwise-more-menu" onClick={() => setMoreOpen(value => !value)} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${moreOpen || moreActive ? "text-violet-300" : "text-slate-400"}`}><FiMoreHorizontal aria-hidden="true" className="h-[22px] w-[22px]"/><span>More</span></button>
        </div>
      </nav>
    </div>
  </>;
}
