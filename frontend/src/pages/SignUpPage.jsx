import { friendlyError } from "../utils/friendlyError";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { SIGN_UP } from "../graphql/mutations/user.mutation";

const inputClass = "w-full rounded-xl border border-[#30374b] bg-[#101524] py-3 pl-11 pr-12 text-white placeholder:text-slate-600 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";
export default function SignUpPage() {
  const [signUpData, setSignUpData] = useState({ name: "", username: "", password: "", gender: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [signup, { loading }] = useMutation(SIGN_UP, { refetchQueries: ["GetAuthenticatedUser"] });
  const handleChange = (e) => setSignUpData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signUpData.name.trim() || !signUpData.username.trim() || !signUpData.password || !signUpData.gender) return toast.error("Please complete all fields");
    try { await signup({ variables: { input: signUpData } }); }
    catch (error) { console.error("Error signing up:", error); toast.error(friendlyError(error)); }
  };
  return <AuthLayout mode="signup">
    <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-violet-400">Get started</p>
    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Create your account</h1>
    <p className="mt-3 text-slate-400">Start tracking your transactions with clarity and confidence.</p>
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div><label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-200">Full name</label><div className="relative"><FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input id="name" name="name" autoComplete="name" required value={signUpData.name} onChange={handleChange} className={inputClass} placeholder="Your full name"/></div></div>
      <div><label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-200">Username</label><div className="relative"><FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input id="username" name="username" autoComplete="username" required value={signUpData.username} onChange={handleChange} className={inputClass} placeholder="Choose a username"/></div></div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-200">Password</label><div className="relative"><FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={signUpData.password} onChange={handleChange} className={inputClass} placeholder="Create a password"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showPassword ? <FiEyeOff/> : <FiEye/>}</button></div></div>
      <fieldset><legend className="mb-3 text-sm font-semibold text-slate-200">Gender</legend><div className="grid grid-cols-2 gap-3">{[{label:"Male",value:"male"},{label:"Female",value:"female"}].map(option => <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${signUpData.gender === option.value ? "border-violet-500 bg-violet-500/10 text-violet-200" : "border-[#30374b] bg-[#101524] text-slate-300 hover:border-slate-500"}`}><input type="radio" name="gender" value={option.value} checked={signUpData.gender === option.value} onChange={handleChange} required className="accent-violet-500"/>{option.label}</label>)}</div></fieldset>
      <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Creating account..." : "Create account"}{!loading && <FiArrowRight/>}</button>
    </form>
    <p className="mt-5 text-center text-sm text-slate-400">Already have an account? <Link to="/login" className="font-bold text-violet-300 hover:underline">Sign in</Link></p>
  </AuthLayout>;
}
