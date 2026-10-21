import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { authService } from '../../../services';
import { useApp } from '../../../App';

type GateState = 'loading' | 'required' | 'accepted' | 'error' | 'unauthorized' | 'session-invalid';

export function SiteDisclaimerGate() {
  const { isLoggedIn, user, logout } = useApp();
  const location = useLocation();
  const [state, setState] = useState<GateState>('loading');
  const [retry, setRetry] = useState(0);
  const [checked, setChecked] = useState(false);
  const [disclaimerVersion, setDisclaimerVersion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!user?.token) {
      setState('session-invalid');
      return;
    }
    let active = true;
    setState('loading');
    setChecked(false);
    setError(null);
    authService.getDisclaimerStatus()
      .then((status) => {
        if (!active) return;
        setDisclaimerVersion(status.version);
        setState(status.accepted ? 'accepted' : 'required');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof Error && cause.message === 'SITE_SESSION_INVALID') {
          setState('session-invalid');
          return;
        }
        if (cause instanceof Error && cause.message === 'SITE_ACCESS_DENIED') {
          setState('unauthorized');
          return;
        }
        setError(cause instanceof Error ? cause.message : 'No fue posible comprobar el acceso.');
        setState('error');
      });
    return () => { active = false; };
  }, [isLoggedIn, user?.token, retry]);

  if (!isLoggedIn) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/access.html?next=${next}`} replace />;
  }

  const decline = async () => {
    await logout();
    window.location.replace('/access.html?denied=1');
  };

  const accept = async () => {
    if (!checked || isSaving || state !== 'required') return;
    setIsSaving(true);
    setError(null);
    try {
      await authService.acceptDisclaimer(disclaimerVersion);
      setState('accepted');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la aceptación.');
    } finally {
      setIsSaving(false);
    }
  };

  if (state === 'unauthorized') {
    return (
      <main className="min-h-screen grid place-items-center bg-[#F5F5F5] px-4">
        <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
          <p role="alert" className="text-[#212121]">Esta cuenta ya no está autorizada para acceder al sitio.</p>
          <button
            type="button"
            onClick={() => {
              void logout().catch(() => undefined).finally(() => window.location.replace('/access.html?denied=1'));
            }}
            className="mt-4 rounded-lg bg-[#C62828] px-4 py-2 text-white"
          >
            Salir
          </button>
        </section>
      </main>
    );
  }
  if (state === 'session-invalid') {
    return (
      <main className="min-h-screen grid place-items-center bg-[#F5F5F5] px-4">
        <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
          <p role="alert" className="text-[#212121]">Tu sesión venció. Inicia sesión nuevamente para continuar.</p>
          <button
            type="button"
            onClick={() => {
              void logout().catch(() => undefined).finally(() => window.location.replace('/access.html'));
            }}
            className="mt-4 rounded-lg bg-[#C62828] px-4 py-2 text-white"
          >
            Ir al acceso
          </button>
        </section>
      </main>
    );
  }
  if (state === 'loading' || state === 'error') {
    return (
      <main className="min-h-screen grid place-items-center bg-[#F5F5F5] px-4">
        <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
          <p role={state === 'error' ? 'alert' : 'status'} className="text-[#212121]">
            {state === 'loading' ? 'Verificando autorización…' : error}
          </p>
          {state === 'error' && (
            <button type="button" onClick={() => setRetry((attempt) => attempt + 1)} className="mt-4 rounded-lg bg-[#C62828] px-4 py-2 text-white">
              Reintentar
            </button>
          )}
        </section>
      </main>
    );
  }

  if (state === 'required') {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/70 p-4" role="presentation">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-disclaimer-title"
          aria-describedby="site-disclaimer-text"
          className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        >
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#C62828]">Aviso obligatorio</p>
          <h1 id="site-disclaimer-title" className="mb-4 text-2xl font-bold text-[#212121]">
            Sitio académico de demostración
          </h1>
          <div id="site-disclaimer-text" className="max-h-[45vh] overflow-y-auto space-y-3 text-sm leading-6 text-gray-700">
            <p>
              Este sitio web fue desarrollado exclusivamente con fines académicos y de demostración de funcionalidades.
              Nada de lo contenido en él debe interpretarse como información, productos, precios, inventario,
              transacciones, pagos, pedidos, servicios u ofertas reales.
            </p>
            <p>
              Su uso está limitado a los aprendices responsables del desarrollo, su instructor, compañeros de estudio
              y demás personas que hayan recibido autorización previa. El acceso requiere una cuenta aprobada.
            </p>
            <p>
              No realices compras ni pagos, no compartas datos financieros o personales reales y no uses la información
              del sitio para tomar decisiones comerciales. Las simulaciones no representan cobros, pagos confirmados
              ni compromisos de entrega.
            </p>
            <p>
              Al aceptar, confirmas que leíste y comprendiste este descargo y que utilizarás el sitio únicamente dentro
              del alcance académico autorizado. La aceptación se registra en la base de datos para esta sesión de acceso.
            </p>
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-[#212121]">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#C62828]"
            />
            <span>He leído y acepto el aviso y descargo de responsabilidad.</span>
          </label>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => void decline()} className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700">
              No acepto y salir
            </button>
            <button
              type="button"
              onClick={() => void accept()}
              disabled={!checked || isSaving}
              className="rounded-xl bg-[#C62828] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Guardando…' : 'Aceptar y continuar'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return <Outlet />;
}
