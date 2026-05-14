import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import SiteHeader from "./SiteHeader";
import PageHead from "./PageHead";
import SiteFooter from "./SiteFooter";
import { useAuth } from "../store/AuthContext";

interface AuthPageProps {
  onOpenCart: () => void;
  mode: "signin" | "signup";
}

export default function AuthPage({ onOpenCart, mode }: AuthPageProps) {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignup) await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
      navigate("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageHead title={isSignup ? "Create account" : "Sign in"} noindex />
      <SiteHeader onOpenCart={onOpenCart} />

      <div className="flex-1 max-w-[440px] w-full mx-auto px-8 py-20">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand mb-3 block">
          {isSignup ? "Create account" : "Welcome back"}
        </span>
        <h1
          className="text-[36px] mb-2 leading-tight"
          style={{ fontWeight: 600 }}
        >
          {isSignup ? "Join Hoodude." : "Sign in."}
        </h1>
        <p className="text-[13px] text-black/60 mb-10">
          {isSignup
            ? "One account for orders, wishlist and early access to drops."
            : "Pick up where you left off — orders, wishlist, saved addresses."}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {isSignup && (
            <Field icon={<UserIcon size={16} strokeWidth={1.8} />}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="flex-1 bg-transparent outline-none text-[14px]"
              />
            </Field>
          )}
          <Field icon={<Mail size={16} strokeWidth={1.8} />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
          </Field>
          <Field icon={<Lock size={16} strokeWidth={1.8} />}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 chars)"
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
          </Field>

          {error && (
            <p className="text-[12px] text-brand font-medium">{error}</p>
          )}

          {!isSignup && (
            <div className="flex items-center justify-between text-[12px]">
              <label className="flex items-center gap-2 text-black/60">
                <input type="checkbox" className="accent-black" /> Remember me
              </label>
              <button type="button" className="text-black font-semibold hover:text-brand">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white h-12 rounded-full font-semibold text-[13px] hover:bg-brand transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignup ? "Create account" : "Sign in"}
                <ArrowRight size={14} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-3 text-[11px] text-black/40 uppercase tracking-[0.3em] font-semibold">
          <div className="flex-1 h-px bg-black/10" />
          or
          <div className="flex-1 h-px bg-black/10" />
        </div>

        <div className="text-center text-[13px] text-black/60">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="font-semibold text-black underline underline-offset-4 hover:text-brand"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Hoodude?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="font-semibold text-black underline underline-offset-4 hover:text-brand"
              >
                Create account
              </button>
            </>
          )}
        </div>

        <p className="mt-10 text-center text-[11px] text-black/40 leading-relaxed">
          By continuing you agree to our{" "}
          <button onClick={() => navigate("/terms")} className="underline underline-offset-2">
            Terms
          </button>{" "}
          and{" "}
          <button onClick={() => navigate("/privacy")} className="underline underline-offset-2">
            Privacy Policy
          </button>
          .
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border border-black/15 rounded-lg px-4 h-12 focus-within:border-black transition-colors">
      <span className="text-black/40">{icon}</span>
      {children}
    </div>
  );
}
