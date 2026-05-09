import { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Primitives';

export const metadata: Metadata = {
  title: 'Página no encontrada',
};

export default function NotFound() {
  return (
    <div className="grid min-h-screen p-8 bg-paper-100 place-items-center">
      <div className="max-w-md text-center">
        <Icon name="alertTriangle" size={64} className="mx-auto mb-4 text-coral-600" />
        <h1 className="mb-2 text-4xl font-bold font-display text-ink-900">404</h1>
        <p className="mb-8 text-slate-600">
          La página que buscas no existe o fue trasladada.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 font-semibold text-white transition-colors rounded-lg bg-brass-500 hover:bg-brass-600"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}