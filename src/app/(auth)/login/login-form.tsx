"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function authenticate(mode: "login" | "signup") {
    setIsPending(true);
    setMessage(null);

    const supabase = createClient();
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
            },
          });

    setIsPending(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (result.data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    setMessage("Compte créé. Confirmez votre adresse e-mail avant de vous connecter.");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await authenticate("login");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Connexion…" : "Se connecter"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !email || password.length < 8}
          onClick={() => authenticate("signup")}
          className="flex-1"
        >
          Créer un compte
        </Button>
      </div>
    </form>
  );
}
