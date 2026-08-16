"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn, signUp, sendPasswordReset } from "@/lib/firebase-client";
import AssetIcon from "@/components/shared/AssetIcon";
import logoType from "../../public/Taply assets/logotype.svg";
import registerIllustration from "../../public/auth/undraw_out-of-office_sae8 1.svg";
import loginIllustration from "../../public/auth/undraw_login_weas 1.svg";

type AuthMode = "login" | "register";

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (forgotMode) {
        await sendPasswordReset(email.trim());
        setMessage("Password reset email sent. Check your inbox.");
      } else {
        if (isRegister) await signUp(email.trim(), password);
        else await signIn(email.trim(), password);
        router.push("/workspace");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-[#101014] sm:px-8 sm:py-[52px]">
      <div className="mx-auto grid min-h-[calc(100vh-104px)] max-w-[1350px] grid-cols-1 gap-8 lg:grid-cols-[1fr_600px] lg:gap-10">
        <section className="flex flex-col items-center px-2 sm:px-10 lg:px-16">
          <Link href="/" className="mt-6 self-center sm:mt-10" aria-label="Taply home">
            <AssetIcon src={logoType} alt="Taply" className="h-[38px] w-auto" />
          </Link>

          <div className="my-auto w-full max-w-[400px] py-12">
            <h1 className="mb-[68px] text-center text-[32px] font-semibold tracking-[-0.7px]">
              {forgotMode ? "Reset password" : isRegister ? "Create account" : "Welcome back!"}
            </h1>

            <form onSubmit={submit} className="space-y-6">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="h-12 w-full rounded-[10px] border border-[#d7d7d7] px-3 text-[16px] outline-none placeholder:text-[#b8bfcd] focus:border-[#7021f8] focus:ring-2 focus:ring-[#7021f8]/10"
              />

              {!forgotMode ? (
                <>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={isRegister ? "Create password" : "Enter your password"}
                      className="h-12 w-full rounded-[10px] border border-[#d7d7d7] px-3 pr-12 text-[16px] outline-none placeholder:text-[#b8bfcd] focus:border-[#7021f8] focus:ring-2 focus:ring-[#7021f8]/10"
                    />
                    <button type="button" aria-label="Show password" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8190a5]">◉</button>
                  </div>
                  {isRegister ? (
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm password"
                        className="h-12 w-full rounded-[10px] border border-[#d7d7d7] px-3 pr-12 text-[16px] outline-none placeholder:text-[#b8bfcd] focus:border-[#7021f8] focus:ring-2 focus:ring-[#7021f8]/10"
                      />
                      <button type="button" aria-label="Show confirm password" onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8190a5]">◉</button>
                    </div>
                  ) : null}
                </>
              ) : null}

              {error ? <p className="text-center text-sm text-[#d92d20]">{error}</p> : null}
              {message ? <p className="text-center text-sm text-[#16845b]">{message}</p> : null}

              <button type="submit" disabled={loading} className="h-12 w-full rounded-[11px] bg-[#7021f8] text-[16px] font-medium text-white transition hover:bg-[#5b15d4] disabled:opacity-60">
                {loading ? "Please wait..." : forgotMode ? "Send reset email" : isRegister ? "Continue" : "Login"}
              </button>
            </form>

            {isRegister && !forgotMode ? (
              <p className="mt-6 text-center text-[16px] leading-6 text-[#5e6570]">
                By signing up, I have read an agree to<br />
                <a href="#terms" className="text-[#7021f8]">Terms</a> and <a href="#privacy" className="text-[#7021f8]">Privacy Policy</a>
              </p>
            ) : null}

            {!isRegister && !forgotMode ? <button type="button" onClick={() => setForgotMode(true)} className="mt-6 block w-full text-center text-[16px] text-[#7021f8] underline">Forget the password?</button> : null}
            {forgotMode ? <button type="button" onClick={() => { setForgotMode(false); setError(null); setMessage(null); }} className="mt-6 block w-full text-center text-[16px] text-[#7021f8] underline">Back to login</button> : null}

            {!forgotMode ? (
              <p className="mt-24 text-center text-[16px] text-[#5e6570]">
                {isRegister ? "Have an account?" : "Don’t have any account?"}{" "}
                <Link href={isRegister ? "/login" : "/register"} className="text-[#7021f8]">{isRegister ? "Sign in" : "Sign up"}</Link>
              </p>
            ) : null}
          </div>
        </section>

        <section className="relative hidden h-[920px] w-[600px] overflow-hidden rounded-[16px] bg-[#f7f4ff] lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(isRegister ? registerIllustration : loginIllustration).src}
            alt=""
            className={`absolute left-1/2 h-auto -translate-x-1/2 ${isRegister ? "top-[403px] w-[430px]" : "top-[295px] w-[410px]"}`}
          />
        </section>
      </div>
    </main>
  );
}
