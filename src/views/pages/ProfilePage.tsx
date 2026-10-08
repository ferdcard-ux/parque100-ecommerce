/**
 * @fileoverview Pagina de informacion del perfil.
 */
import { useEffect, useState } from 'react';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { useApp } from '../../App';
import { PageHeader } from '../components/shared/page-header';
import { SectionTitle } from '../components/shared/section-title';
import { authService, userService } from '../../services';

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}

function ProfileField({ label, icon, value, editing, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="text-gray-500 block mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{label}</span>
      <span className="relative block">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          value={value}
          readOnly={!editing}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-colors ${
            editing ? 'border-[#C62828] bg-white' : 'border-gray-200 bg-[#F5F5F5]'
          } focus:outline-none`}
          style={{ fontSize: '0.9rem' }}
        />
      </span>
    </label>
  );
}

/** Vista/edicion de los datos personales del usuario. */
export function ProfilePage() {
  const { user, isLoggedIn, updateProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  /** Refleja la cuenta activa (incluye cambio de sesion) y su telefono guardado. */
  useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEmail(user?.email ?? '');
    setPhone('');
    setEditing(false);
    setSaved(false);
    setSaveError(null);
    if (user) {
      userService
        .getDeliveryDetails(user.id)
        .then((details) => setPhone(details.phone))
        .catch(() => { /* sin telefono guardado: se deja vacio */ });
    }
  }, [user?.id]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);
    if (pwdNew.length < 8) {
      setPwdError('La nueva contrasena debe tener al menos 8 caracteres.');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError('Las contrasenas no coinciden.');
      return;
    }
    setPwdLoading(true);
    try {
      await authService.changePassword(user!.email, pwdCurrent, pwdNew);
      setPwdSuccess(true);
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'No fue posible actualizar.');
    } finally {
      setPwdLoading(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
        <p className="text-center text-gray-400 py-16">Inicia sesion para ver tu perfil.</p>
      </main>
    );
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleSave = async () => {
    if (!user) return;
    if (firstName.trim().length === 0) {
      setSaveError('Ingresa tu nombre.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSaveError('Ingresa un correo electrónico válido.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length < 7) {
      setSaveError('Ingresa un teléfono válido.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: cleanPhone });
      setPhone(cleanPhone);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No fue posible guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <PageHeader title="Informacion de tu perfil" subtitle="Gestiona tus datos personales" backTo="/cuenta" />

        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#C62828] flex items-center justify-center mb-3">
            <span className="text-white font-bold" style={{ fontSize: '1.5rem' }}>{initials}</span>
          </div>
          <p className="text-[#212121] font-semibold">{firstName} {lastName}</p>
          <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>{email}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Datos personales</SectionTitle>
            {editing ? (
              <button onClick={() => void handleSave()} disabled={saving} className="bg-[#C62828] text-white rounded-full px-4 py-1.5 disabled:opacity-60" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Editar
              </button>
            )}
          </div>
          {saved && <p className="text-green-600 mb-3" style={{ fontSize: '0.8rem' }}>Cambios guardados.</p>}
          {saveError && <p role="alert" className="text-[#C62828] mb-3" style={{ fontSize: '0.8rem' }}>{saveError}</p>}
          <div className="flex flex-col gap-4">
            <ProfileField label="Nombre" icon={<User size={16} />} value={firstName} editing={editing} onChange={setFirstName} />
            <ProfileField label="Apellido" icon={<User size={16} />} value={lastName} editing={editing} onChange={setLastName} />
            <ProfileField label="Correo" icon={<Mail size={16} />} value={email} editing={editing} onChange={setEmail} />
            <ProfileField label="Telefono" icon={<Phone size={16} />} value={phone} editing={editing} onChange={(v) => setPhone(v.replace(/\D/g, '').slice(0, 20))} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionTitle>Seguridad</SectionTitle>
          <button
            onClick={() => setPwdOpen(true)}
            className="w-full flex items-center gap-3 text-gray-600 hover:text-[#C62828] transition-colors"
            style={{ fontSize: '0.9rem' }}
          >
            <Lock size={17} /> Cambiar contrasena
          </button>
        </div>
      </div>

      {pwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setPwdOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-[#212121] font-bold mb-4" style={{ fontSize: '1rem' }}>Cambiar contrasena</h3>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              {pwdError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.85rem' }}>{pwdError}</div>}
              {pwdSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700" style={{ fontSize: '0.85rem' }}>Contrasena actualizada.</div>}
              <ProfileField label="Contrasena actual" icon={<Lock size={16} />} value={pwdCurrent} editing onChange={setPwdCurrent} />
              <ProfileField label="Nueva contrasena" icon={<Lock size={16} />} value={pwdNew} editing onChange={setPwdNew} />
              <ProfileField label="Confirmar nueva contrasena" icon={<Lock size={16} />} value={pwdConfirm} editing onChange={setPwdConfirm} />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setPwdOpen(false)} className="flex-1 border border-gray-200 rounded-full py-2.5 hover:bg-gray-50 transition-colors" style={{ fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={pwdLoading} className="flex-1 bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full py-2.5 disabled:opacity-60 transition-colors" style={{ fontWeight: 600 }}>
                  {pwdLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
