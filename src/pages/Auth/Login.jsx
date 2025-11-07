import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, Loader2, LogIn, Github, Globe } from "lucide-react";

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
      navigate("/"); // to DashboardLayout index
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
        options: {
          redirectTo: window.location.origin, // returns to your app
        },
      });
      if (error) throw error;
      // No navigate here: Supabase will redirect back automatically
    } catch (err) {
      setLoadingGoogle(false);
      toast.error(err.message || "Google sign-in failed");
    }
  }

  return (
    <div className="min-h-[calc(100vh-20  vh)] w-full flex items-center justify-center px-4 text-white
      bg-gradient-to-b from-indigo-50 via-white to-violet-50
      dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md border border-slate-200/70 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur rounded-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Access your agency workspace</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-2.5 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 bg-violet-600" disabled={loadingEmail}>
              {loadingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Sign in
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dashed border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/90 dark:bg-slate-900/80 px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onGoogleLogin}
              disabled={loadingGoogle} 
              className="w-full gap-2 bg-yellow-600 border-none"
              title="Sign in with Google"
            >
              {loadingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              Continue with Google
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-yellow-400">
          <Link to="/forgotpassword" className="text-sm hover:underline text-yellow-400">
            Forgot password?
          </Link>
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/register" className="text-violet-600 hover:underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
