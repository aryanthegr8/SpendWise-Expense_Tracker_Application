import { friendlyError } from "../../utils/friendlyError";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApolloClient, useMutation } from "@apollo/client";
import { FiChevronDown, FiCreditCard, FiLogOut, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { LOGOUT } from "../../graphql/mutations/user.mutation";

export default function Header({ user }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const client = useApolloClient();

  const [logout, { loading: signingOut }] = useMutation(LOGOUT);

  const displayName = user?.name?.trim() || user?.username || "My account";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = async () => {
    try {
      await logout();

      // Clear financial data from the previous account.
      await client.clearStore();

      // Confirm the server now considers the user logged out.
      await client.refetchQueries({
        include: ["GetAuthenticatedUser"],
      });

      setOpen(false);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error(
        friendlyError(error, "Unable to sign out. Please try again.")
      );
    }
  };

  return (
    <header className="sw-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-8 sm:py-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="SpendWise home">
          <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20"><FiCreditCard size={21} /></span>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white">Spend<span className="text-violet-400">Wise</span></span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4">
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-slate-200 transition hover:border-violet-400/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-violet-600/30 text-xs font-bold text-violet-200">
                {user?.profilePicture ? <img src={user.profilePicture} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : initials}
              </span>
              <span className="hidden max-w-32 truncate text-sm font-medium md:inline">{displayName}</span>
              <FiChevronDown className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div role="menu" aria-label="Account" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#171723] p-2 text-slate-100 shadow-2xl shadow-black/50">
                <div className="border-b border-white/10 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                  {user?.username && <p className="mt-1 truncate text-xs text-slate-400">@{user.username}</p>}
                </div>
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400"><FiUser /> Signed-in account</div>
                <button type="button" role="menuitem" disabled={signingOut} onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-wait disabled:opacity-60"><FiLogOut />{signingOut ? "Signing out..." : "Sign out"}</button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
