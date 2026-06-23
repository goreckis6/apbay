"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Invalid username or password");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Admin Login</h1>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-600">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
            autoComplete="username"
            required
          />
        </label>
        <label className="block mb-6">
          <span className="text-sm font-medium text-slate-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
            autoComplete="current-password"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LoginForm />
    </Suspense>
  );
}
