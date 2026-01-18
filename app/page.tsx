import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="w-full max-w-xl p-6">
        <h1 className="text-4xl sm:text-5xl font-light text-foreground mb-10 text-center">
          Welcome to Watchdog.
        </h1>
        <LoginForm />
      </main>
    </div>
  );
}
