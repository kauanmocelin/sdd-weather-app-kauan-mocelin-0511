interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md"
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-white/60">{hint}</p>
    </section>
  );
}