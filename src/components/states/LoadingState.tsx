export default function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white/75 backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-accent-400"
      />
      <span>Carregando clima...</span>
    </div>
  );
}