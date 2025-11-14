import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/updatepassword`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setEmail("");
    } catch (err) {
      toast.error(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-violet-600 to-indigo-800 items-center justify-center text-white p-10 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full animate-pulse"></div>

        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold mb-4">Forgot Password?</h1>
          <span className="flex justify-center gap-2 text-center">
            <h3 className="text-3xl text-amber-500 font-bold text-center">for</h3>
            <h1 className="text-4xl font-bold mb-4">ZapDataCloud</h1>
          </span>
          <p className="text-lg opacity-90">
            Enter your email and we’ll send you a reset link
          </p>
        </div>
      </div>

      {/* Reset form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Reset Password
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
            Enter your registered email to reset your password
          </p>

          <form onSubmit={onResetPassword} className="space-y-5">
            <div className="relative">
              <Label htmlFor="email" className="mb-1">
                Email
              </Label>
              <Mail className="absolute left-2 top-6 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-10 focus:ring-violet-500 focus:border-violet-500"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 dark:text-gray-400 mt-6">
            <Link to="/login" className="hover:underline mb-2 sm:mb-0">
              Back to Login
            </Link>
            <Link to="/register" className="text-violet-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
