import { useRef, useState, type FormEvent } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import type { Category, UnitOfMeasure } from '../../../models';
import { useDialogBehavior } from '../../../utils/useDialog';
import { useScrollLock } from '../../../utils/useScrollLock';
import { DeleteConfirmModal } from './DeleteConfirmModal';

type CatalogItem = Pick<Category, 'id' | 'name'> | UnitOfMeasure;

interface CatalogOptionsModalProps {
  kind: 'category' | 'unit';
  items: CatalogItem[];
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function CatalogOptionsModal({
  kind,
  items,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: CatalogOptionsModalProps) {
  const isCategory = kind === 'category';
  const title = isCategory ? 'Administrar categorías de productos' : 'Administrar unidades de medida';
  const label = isCategory ? 'categoría' : 'unidad de medida';
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDialogBehavior(pendingDelete === null, onClose, panelRef);

  const saveNew = async (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      await onCreate(newName.trim());
      setNewName('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `No fue posible agregar la ${label}.`);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (item: CatalogItem) => {
    if (!editingName.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      await onUpdate(item.id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `No fue posible actualizar la ${label}.`);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || busy) return;
    setDeleteError(null);
    setBusy(true);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : `No fue posible eliminar la ${label}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6" onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}>
        <section ref={panelRef} role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="font-bold text-[#212121]">{title}</h2>
              <p className="mt-1 text-sm text-gray-500">Los nombres repetidos no están permitidos.</p>
            </div>
            <button onClick={onClose} disabled={busy} aria-label="Cerrar" className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-50">
              <X size={19} />
            </button>
          </header>

          <div className="space-y-4 overflow-y-auto p-6">
            <form onSubmit={saveNew} className="flex gap-2">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                maxLength={30}
                aria-label={`Nueva ${label}`}
                placeholder={`Nombre de ${label}`}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-[#F5F5F5] px-4 py-2.5 text-sm focus:border-[#C62828] focus:outline-none"
              />
              <button type="submit" disabled={busy || !newName.trim()} className="flex items-center gap-1 rounded-xl bg-[#C62828] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                <Plus size={16} /> Agregar
              </button>
            </form>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2 px-3 py-2.5">
                  {editingId === item.id ? (
                    <>
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        maxLength={30}
                        aria-label={`Editar ${label}`}
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#C62828] focus:outline-none"
                      />
                      <button onClick={() => void saveEdit(item)} disabled={busy || !editingName.trim()} aria-label={`Guardar ${label}`} className="rounded-lg p-2 text-green-700 hover:bg-green-50 disabled:opacity-50">
                        <Save size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} disabled={busy} aria-label="Cancelar edición" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm text-[#212121]">{item.name}</span>
                      <button onClick={() => {
                        setError(null);
                        setEditingId(item.id);
                        setEditingName(item.name);
                      }} disabled={busy} aria-label={`Editar ${item.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(item);
                      }} disabled={busy} aria-label={`Eliminar ${item.name}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </li>
              ))}
              {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">No hay opciones registradas.</li>}
            </ul>
            <p className="text-xs text-gray-500">
              {isCategory
                ? 'No es posible eliminar categorías que tengan productos asociados.'
                : 'Al renombrar una unidad, también se actualizan los productos que la usan; no se eliminan unidades en uso.'}
            </p>
          </div>
        </section>
      </div>

      {pendingDelete && (
        <DeleteConfirmModal
          title={`Eliminar ${label}`}
          description={<>¿Eliminar <strong>{pendingDelete.name}</strong>? Esta acción no se puede deshacer.</>}
          error={deleteError}
          busy={busy}
          onClose={() => {
            if (!busy) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </>
  );
}
