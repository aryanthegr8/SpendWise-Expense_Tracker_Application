import { friendlyError } from "../utils/friendlyError";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { LOGIN } from "../graphql/mutations/user.mutation";

const inputClass = "w-full rounded-xl border border-[#30374b] bg-[#101524] py-3 pl-11 pr-12 text-white placeholder:text-slate-600 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";
export default function LoginPage() {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [login, { loading }] = useMutation(LOGIN, { refetchQueries: ["GetAuthenticatedUser"] });
  const handleChange = (e) => setLoginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.username.trim() || !loginData.password) return toast.error("Please fill in all fields");
    try { await login({ variables: { input: loginData } }); }
    catch (error) { console.error("Error logging in:", error); toast.error(friendlyError(error)); }
  };
  return <AuthLayout mode="login">
    <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-violet-400">Welcome back</p>
    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Sign in to SpendWise</h1>
    <p className="mt-4 text-slate-400">Pick up where you left off and keep your finances in view.</p>
    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
      <div><label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-200">Username</label><div className="relative"><FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input id="username" name="username" autoComplete="username" required value={loginData.username} onChange={handleChange} className={inputClass} placeholder="Enter your username" /></div></div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-200">Password</label><div className="relative"><FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={loginData.password} onChange={handleChange} className={inputClass} placeholder="Enter your password"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showPassword ? <FiEyeOff/> : <FiEye/>}</button></div></div>
      <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}{!loading && <FiArrowRight/>}</button>
    </form>
    <p className="mt-5 text-center text-sm text-slate-400">Don't have an account? <Link to="/signup" className="font-bold text-violet-300 hover:underline">Create one</Link></p>
  </AuthLayout>;
}
