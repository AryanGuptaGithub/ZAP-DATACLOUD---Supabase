import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, Loader2, LogIn, Globe } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onEmailLogin(e) {
    e.preventDefault();
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoadingEmail(false);
    }
  }

  async function onGoogleLogin() {
    try {
      setLoadingGoogle(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setLoadingGoogle(false);
      toast.error(err.message || "Google sign-in failed");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Full-screen Loader Overlay */}
      {/* Full-page loader overlay */}
      {(loadingEmail || loadingGoogle) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-t-violet-600 border-gray-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg font-semibold animate-pulse">
              Logging you in...
            </p>
          </div>
        </div>
      )}

      {/* Left illustration / branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-violet-600 to-indigo-800 items-center justify-center text-white p-10 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full animate-pulse"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome Back!</h1>
          <span className="flex justify-center gap-2 text-center">
            <h3 className="text-3xl text-amber-500 font-bold">to</h3>
            <h1 className="text-4xl font-bold mb-4">ZapDataCloud</h1>
          </span>
          <p className="text-lg opacity-90">Access your dashboard seamlessly</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8 overflow-hidden bg-gray-200 dark:bg-gray-900 ">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Sign In
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
            Enter your credentials to continue
          </p>

          <form onSubmit={onEmailLogin} className="space-y-5">
            {/* Email */}
            <div className="relative">
              <Label htmlFor="email" className="mb-1">
                Email
              </Label>
              <Mail className="absolute left-2 top-6  text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="pl-10 focus:ring-violet-500 focus:border-violet-500"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Label htmlFor="password" className="mb-1">
                Password
              </Label>
              <Lock className="absolute  left-2 top-6 text-gray-400" />
              <Input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="pl-10 pr-10 focus:ring-violet-500 focus:border-violet-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-6 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center justify-center gap-2"
              disabled={loadingEmail}
            >
              {loadingEmail ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              Sign In
            </Button>
          </form>

          {/* Or divider
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-400">
                or
              </span>
            </div>
          </div>

          Google Login
          <Button
            type="button"
            onClick={onGoogleLogin}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium"
          >
            {loadingGoogle ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Globe className="h-5 w-5" />
            )}
            Continue with Google
          </Button> */}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 dark:text-gray-400 mt-6">
            <Link to="/forgotpassword" className="hover:underline mb-2 sm:mb-0">
              Forgot password?
            </Link>
            <p>
              No account?{" "}
              <Link to="/register" className="text-violet-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
