import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, getStoredToken, setStoredToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TokenGateProps {
  children?: ReactNode;
}

export function TokenGate({ children }: TokenGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string>(getStoredToken());
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<"checking" | "ready" | "locked">(token ? "checking" : "locked");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    async function validateExistingSession() {
      const existingToken = getStoredToken();
      if (!existingToken) {
        if (active) setStatus("locked");
        return;
      }

      try {
        await api.validateSession();
        if (active) {
          setToken(existingToken);
          setStatus("ready");
          setError("");
        }
      } catch {
        setStoredToken("");
        if (active) {
          setToken("");
          setStatus("locked");
        }
      }
    }

    validateExistingSession();
    return () => {
      active = false;
    };
  }, []);

  const saveToken = (value: string) => {
    setStoredToken(value);
    setToken(value);
    setStatus(value ? "ready" : "locked");
    setError("");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.login(email, password);
      const accessToken = response.data?.accessToken || (response as { accessToken?: string }).accessToken || "";
      if (!accessToken) {
        throw new Error("Access token was not returned by the login API");
      }

      saveToken(accessToken);
      navigate("/structures", { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "ready" && token && location.pathname === "/") {
      navigate("/structures", { replace: true });
    }
  }, [location.pathname, navigate, status, token]);

  useEffect(() => {
    if (status === "ready" && token && location.pathname === "/login") {
      navigate("/structures", { replace: true });
    }
  }, [location.pathname, navigate, status, token]);

  useEffect(() => {
    if (children && status !== "checking" && !token && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [children, location.pathname, navigate, status, token]);

  if (status === "ready" && token) {
    return <>{children}</>;
  }

  if (children && status !== "checking" && !token) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf2f8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(110,94,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(55,125,255,0.08),transparent_22%),linear-gradient(180deg,#f5f7fb_0%,#edf2f8_100%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-[1.12fr_0.88fr]">
        <section className="login-hero-diagonal relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#dbe8ff_0%,#eff3fb_42%,#ffffff_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(118,92,255,0.18),transparent_20%),radial-gradient(circle_at_78%_20%,rgba(66,153,225,0.16),transparent_22%),radial-gradient(circle_at_70%_82%,rgba(99,102,241,0.12),transparent_18%)]" />
          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-12 py-12 xl:px-16">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/72 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 backdrop-blur">
                Structure intelligence workspace
              </div>
              <h2 className="max-w-lg text-[3.15rem] font-medium leading-[1.02] tracking-[-0.06em] text-slate-950">
                Review every structure from one clear admin surface.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-500">
                Navigate structure details, ratings, floors, ownership, and reports with a lighter enterprise experience built for day-to-day admin work.
              </p>
            </div>

            <div className="relative max-w-2xl">
              <div className="absolute -bottom-10 -left-4 h-40 w-40 rounded-full bg-violet-200/40 blur-3xl" />
              <div className="absolute -right-4 -top-8 h-32 w-32 rounded-full bg-sky-200/45 blur-3xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/85 bg-white/84 p-4 shadow-[0_28px_90px_rgba(74,92,137,0.14)] backdrop-blur-xl">
                <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-[24px] border border-slate-100 bg-[#fbfcfe] p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#5b21b6_100%)] text-white">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-900">SAMS Admin</p>
                        <p className="text-[11px] text-slate-400">Operations</p>
                      </div>
                    </div>
                    {["Structures", "Approvals", "Ratings", "Reports"].map((item, index) => (
                      <div
                        className={`mb-2 rounded-[18px] px-3 py-2.5 text-[13px] ${
                          index === 0 ? "bg-violet-50 font-medium text-violet-700" : "text-slate-500"
                        }`}
                        key={item}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-slate-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-violet-500">Overview</p>
                        <p className="mt-2 text-[22px] font-medium tracking-[-0.05em] text-slate-950">Admin snapshot</p>
                      </div>
                      <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-700">
                        Verified
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        ["Structures", "218"],
                        ["Pending Reviews", "46"],
                        ["Reports Exported", "132"]
                      ].map(([label, value]) => (
                        <div className="rounded-[18px] border border-slate-100 bg-slate-50 p-3" key={label}>
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
                          <p className="mt-2 text-[24px] font-medium tracking-[-0.05em] text-slate-950">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        "Ratings updated for three industrial structures",
                        "Two PDF reports downloaded by central admin",
                        "Validation queue reduced after approval sync"
                      ].map((item) => (
                        <div className="rounded-[18px] bg-slate-50 px-4 py-3 text-[13px] text-slate-600" key={item}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-10 xl:px-14">
          <div className="w-full max-w-xl rounded-[30px] border border-white/80 bg-white/88 p-7 shadow-[0_24px_80px_rgba(77,90,130,0.12)] backdrop-blur xl:p-8">
            <div className="w-full max-w-md">
              <div className="mb-10 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] text-white shadow-lg shadow-violet-300/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-slate-900">SAMS Admin</p>
                  <p className="text-[12px] text-slate-400">Structure Review Workspace</p>
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-[2.45rem] font-medium leading-[1.04] tracking-[-0.06em] text-slate-950">
                  Login to your admin workspace
                </h1>
                <p className="mt-3 max-w-sm text-[14px] leading-6 text-slate-500">
                  Use your admin account to access all structures. Existing sessions are verified automatically when the app opens.
                </p>
              </div>

              {status === "checking" ? (
                <div className="space-y-5 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600" />
                    <p className="text-[14px] font-medium text-slate-700">Checking your saved session...</p>
                  </div>
                  <p className="text-[14px] leading-6 text-slate-500">
                    If your access token is still valid, you will be taken straight into the app.
                  </p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-slate-700">Email or username</label>
                    <Input
                      placeholder="Enter admin email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-slate-700">Password</label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="inline-flex items-center gap-2 text-[12px] text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Session restores automatically
                    </div>
                    <button className="text-[13px] font-medium text-violet-600 transition hover:text-violet-700" type="button">
                      Forgot password?
                    </button>
                  </div>

                  <Button className="mt-2 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#8b5cf6_0%,#6d28d9_100%)] text-[14px] font-medium shadow-[0_18px_40px_rgba(109,40,217,0.22)] hover:translate-y-0 hover:opacity-95" disabled={loading} type="submit">
                    <LockKeyhole className="h-4 w-4" />
                    {loading ? "Signing in..." : "Login"}
                  </Button>
                </form>
              )}

              {error ? <p className="mt-4 text-[14px] font-medium text-rose-600">{error}</p> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
