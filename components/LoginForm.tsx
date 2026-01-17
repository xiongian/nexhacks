"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    // Navigate to dashboard (no backend validation for now)
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <input
        id="email"
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-6 py-4 rounded-2xl bg-card border border-[#000000] border-[0.0625rem] focus:outline-none focus:ring-2 focus:ring-foreground/20 text-foreground text-lg"
        placeholder="Phone Number/Email Address"
      />

      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-6 py-4 rounded-2xl bg-card border border-[#000000] border-[0.0625rem] focus:outline-none focus:ring-2 focus:ring-foreground/20 text-foreground text-lg"
        placeholder="Password"
      />

      {error && (
        <p className="text-danger text-sm">{error}</p>
      )}

      <div className="flex justify-end mt-2">
        <button
          type="submit"
          className="px-8 py-3 bg-danger text-foreground font-medium hover:opacity-90 transition-opacity border border-[#000000] border-[0.0625rem]"
        >
          Login
        </button>
      </div>
    </form>
  );
}
