import Link from 'next/link';
import AdminView from '@/components/views/AdminView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vestalia | Panel administrativo',
};

export default function AdminPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel administrativo</p>
          <h1>Inventario y ajustes</h1>
          <p className="lede">
            Gestiona ingredientes, suministros y equipos antes de sincronizar la información con la
            calculadora principal.
          </p>
        </div>
        <Link className="button-link button-link--ghost" href="/">
          Regresar a la calculadora
        </Link>
      </header>
      <AdminView />
    </main>
  );
}

