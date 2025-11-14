import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Globe } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onEmailRegister(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.name.trim() },
        },
      });
      if (error) throw error;
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleRegister() {
    try {
      setLoadingGoogle(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setLoadingGoogle(false);
      toast.error(err.message || "Google sign-up failed");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-violet-600 to-indigo-800 items-center justify-center text-white p-10 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full animate-pulse"></div>

        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold mb-4">Join Us!</h1>
          <span className="flex justify-center gap-2 text-center">
            <h3 className="text-3xl text-amber-500 font-bold text-center">at</h3>
            <h1 className="text-4xl font-bold mb-4">ZapDataCloud</h1>
          </span>
          <p className="text-lg opacity-90">Create your account and start exploring</p>
        </div>
      </div>

      {/* Register form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Register
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
            Create your account to continue
          </p>

          <form onSubmit={onEmailRegister} className="space-y-5">
            {/* Name */}
            <div className="relative">
              <Label htmlFor="name" className="mb-1">
                Full Name
              </Label>
              <User className="absolute left-2 top-6 text-gray-400" />
              <Input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="pl-10 focus:ring-violet-500 focus:border-violet-500"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Label htmlFor="email" className="mb-1">
                Email
              </Label>
              <Mail className="absolute left-2 top-6 text-gray-400" />
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
              <Lock className="absolute left-2 top-6 text-gray-400" />
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
                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Label htmlFor="confirmPassword" className="mb-1">
                Confirm Password
              </Label>
              <Lock className="absolute left-2 top-6 text-gray-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPass ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="pl-10 pr-10 focus:ring-violet-500 focus:border-violet-500"
                required
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
            </Button>
          </form>

          {/* Or divider */}
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

          {/* Google Sign-up */}
          <Button
            type="button"
            onClick={onGoogleRegister}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium"
          >
            {loadingGoogle ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
            Continue with Google
          </Button>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 dark:text-gray-400 mt-6">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="text-violet-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
