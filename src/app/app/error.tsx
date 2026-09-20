"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="card mx-auto max-w-xl text-center">
      <h1 className="text-xl font-bold">Impossible de charger cette vue</h1>
      <p className="mt-2 text-sm text-slate-600">Vos données n’ont pas été modifiées. Réessayez ou revenez au dashboard.</p>
      <button className="button-primary mt-5" onClick={reset}>Réessayer</button>
    </section>
  );
}
