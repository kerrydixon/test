import { Lock } from "lucide-react";
import { login } from "../actions";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-sm p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Organiser sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the admin password to manage results and entries.
        </p>
        <form action={login} className="mt-6 space-y-3">
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" className="input" autoFocus />
          </div>
          {error && <p className="text-sm text-rose-600">Incorrect password.</p>}
          <button type="submit" className="btn-primary w-full">Sign in</button>
        </form>
      </div>
    </div>
  );
}
