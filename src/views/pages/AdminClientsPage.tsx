/**
 * @fileoverview Gestion de clientes (panel admin).
 * CRUD completo: crear, editar (incluido rol) y eliminar usuarios.
 */
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { userService, type ApiUserRow, type AdminUserData } from '../../services/user.service';

const ROLES = ['cliente', 'empleado', 'admin'] as const;

const EMPTY_FORM: AdminUserData & { Contrasena: string } = {
  Nombre: '',
  Correo: '',
  Rol: 'cliente',
  Telefono: '',
  Contrasena: '',
};

interface UserModalProps {
  title: string;
  initial: AdminUserData & { Contrasena: string };
  showPassword: boolean;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: AdminUserData & { Contrasena: string }) => void;
}

function UserModal({ title, initial, showPassword, error, saving, onClose, onSubmit }: UserModalProps) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#212121] font-bold" style={{ fontSize: '1rem' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500" aria-label="Cerrar">
            <X size={15} />
          </button>
        </div>
        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.85rem' }}>{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-3">
          <label className="block">
            <span className="text-gray-500 block mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nombre</span>
            <input value={form.Nombre} onChange={set('Nombre')} maxLength={30} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#C62828]" />
          </label>
          <label className="block">
            <span className="text-gray-500 block mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Correo</span>
            <input type="email" value={form.Correo} onChange={set('Correo')} maxLength={50} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#C62828]" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-gray-500 block mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Rol</span>
              <select value={form.Rol} onChange={set('Rol')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#C62828] bg-white">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-gray-500 block mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Telefono</span>
              <input value={form.Telefono} onChange={set('Telefono')} inputMode="numeric" maxLength={20}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#C62828]" />
            </label>
          </div>
          {showPassword && (
            <label className="block">
              <span className="text-gray-500 block mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Contrasena inicial (min. 8)</span>
              <input type="password" value={form.Contrasena} onChange={set('Contrasena')} minLength={8} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#C62828]" />
            </label>
          )}
          <button type="submit" disabled={saving}
            className="mt-2 w-full py-2.5 rounded-full text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Tabla de clientes con alta, edicion de rol/datos y baja protegida. */
export function AdminClientsPage() {
  const [users, setUsers] = useState<ApiUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ApiUserRow | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ApiUserRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await userService.getAllUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.toLowerCase();
  const filtered = users.filter(
    (u) =>
      (roleFilter === 'todos' || (u.Rol ?? 'cliente') === roleFilter) &&
      (u.Nombre.toLowerCase().includes(q) || u.Correo.toLowerCase().includes(q)),
  );

  const handleCreate = async (data: AdminUserData & { Contrasena: string }) => {
    setModalError(null);
    setSaving(true);
    try {
      await userService.createUser(data);
      setModal(null);
      setNotice('Usuario creado.');
      await load();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'No fue posible crear.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: AdminUserData & { Contrasena: string }) => {
    if (!editing) return;
    setModalError(null);
    setSaving(true);
    try {
      await userService.updateUser(editing.ID_Usuario, data);
      setModal(null);
      setEditing(null);
      setNotice('Usuario actualizado.');
      await load();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'No fue posible actualizar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await userService.deleteUser(deleting.ID_Usuario);
      setDeleting(null);
      setNotice('Usuario eliminado.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible eliminar.');
      setDeleting(null);
    }
  };

  return (
    <AdminPageShell active="clientes" title="Clientes" subtitle={`${users.length} usuarios registrados`}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="flex-1 min-w-52 px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#C62828]"
          style={{ fontSize: '0.9rem' }}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#C62828]" style={{ fontSize: '0.85rem' }}>
          <option value="todos">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={() => { setModalError(null); setModal('create'); }}
          className="flex items-center gap-1.5 bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full px-5 py-2.5 transition-colors" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          <Plus size={15} /> Agregar
        </button>
      </div>

      {notice && <p className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700" style={{ fontSize: '0.85rem' }}>{notice}</p>}

      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : error ? (
        <p className="text-center text-[#C62828] py-16">{error}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Correo</th>
                <th className="px-5 py-3 font-medium">Telefono</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.ID_Usuario} className="border-b border-gray-50 last:border-0 text-[#212121]">
                  <td className="px-5 py-3">{u.Nombre}</td>
                  <td className="px-5 py-3 text-gray-500">{u.Correo}</td>
                  <td className="px-5 py-3 text-gray-500">{u.Telefono ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full ${u.Rol === 'admin' ? 'bg-[#C62828]/10 text-[#C62828]' : u.Rol === 'empleado' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                      {u.Rol ?? 'cliente'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditing(u); setModalError(null); setModal('edit'); }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#C62828] transition-colors" aria-label="Editar" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleting(u)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-[#C62828] transition-colors" aria-label="Eliminar" title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-gray-400 py-10">Sin resultados.</p>}
        </div>
      )}

      {modal === 'create' && (
        <UserModal title="Agregar usuario" initial={EMPTY_FORM} showPassword error={modalError} saving={saving}
          onClose={() => setModal(null)} onSubmit={handleCreate} />
      )}
      {modal === 'edit' && editing && (
        <UserModal title={`Editar ${editing.Nombre}`} showPassword={false} error={modalError} saving={saving}
          initial={{ Nombre: editing.Nombre, Correo: editing.Correo, Rol: editing.Rol ?? 'cliente', Telefono: editing.Telefono === null ? '' : String(editing.Telefono), Contrasena: '' }}
          onClose={() => { setModal(null); setEditing(null); }} onSubmit={handleUpdate} />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleting(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-[#212121] font-bold mb-2">Eliminar usuario</h3>
            <p className="text-gray-500 mb-6" style={{ fontSize: '0.9rem' }}>
              ¿Eliminar a <strong>{deleting.Nombre}</strong>? No es posible si tiene pedidos asociados.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 border border-gray-200 rounded-full py-2.5 hover:bg-gray-50 transition-colors" style={{ fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full py-2.5 transition-colors" style={{ fontWeight: 600 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
