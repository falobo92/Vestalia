import Link from 'next/link';
import CalculatorView from '@/components/views/CalculatorView';

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel principal</p>
          <h1>Vestalia · Costeo de recetas</h1>
          <p className="lede">
            Visualiza métricas clave y experimenta con ingredientes sin perder el contexto financiero
            de tus recetas.
          </p>
        </div>
        <Link className="button-link" href="/admin">
          Ir a Administración
        </Link>
      </header>
      <CalculatorView />
    </main>
  );
}

