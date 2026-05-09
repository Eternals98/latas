export default function DesignSystemPage() {
  return (
    <div className="min-h-screen p-8 bg-paper-100">
      <h1 className="mb-8 text-4xl font-bold text-ink-900">Axentria Design System Test</h1>

      {/* Colors */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-ink-900">Colors</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="flex items-center justify-center h-20 rounded-md bg-ink-900">
            <span className="text-sm font-bold text-paper-50">ink-900</span>
          </div>
          <div className="flex items-center justify-center h-20 rounded-md bg-brass-400">
            <span className="text-sm font-bold text-ink-900">brass-400</span>
          </div>
          <div className="flex items-center justify-center h-20 rounded-md bg-sage-500">
            <span className="text-sm font-bold text-paper-50">sage-500</span>
          </div>
          <div className="flex items-center justify-center h-20 rounded-md bg-coral-500">
            <span className="text-sm font-bold text-paper-50">coral-500</span>
          </div>
          <div className="flex items-center justify-center h-20 border rounded-md bg-paper-100 border-slate-200">
            <span className="text-sm font-bold text-ink-900">paper-100</span>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-ink-900">Typography</h2>
        <p className="mb-2 text-4xl font-display text-ink-900">Display — Instrument Serif</p>
        <p className="mb-2 font-sans text-lg text-ink-900">Body — Manrope</p>
        <p className="font-mono text-sm text-ink-900">Code — JetBrains Mono</p>
      </section>
    </div>
  );
}