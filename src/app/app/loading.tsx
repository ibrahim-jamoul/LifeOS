export default function Loading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Chargement">
      <div className="h-9 w-64 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-200/80" />)}
      </div>
    </div>
  );
}
