/**
 * @fileoverview Controlador de usuarios del panel de administracion.
 * Centraliza la gestion de cuentas (alta, edicion, baja) y los permisos
 * delegables, mas lecturas puntuales (permisos, datos de entrega).
 * Es la capa Controller entre las vistas admin y `userService`.
 */
import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services';
import type {
  ApiUserRow,
  AdminUserData,
  UserPermissions,
} from '../services/user.service';
import type { UserDeliveryDetails } from '../models';

/**
 * Controlador de usuarios.
 *
 * @param {Object} [opts] - Opciones.
 * @param {boolean} [opts.autoLoad=true] - Carga la lista al montar.
 * @returns Usuarios, permisos, estado de carga y acciones.
 */
export function useUsersController({ autoLoad = true }: { autoLoad?: boolean } = {}) {
  const [users, setUsers] = useState<ApiUserRow[]>([]);
  const [permissions, setPermissions] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  /** Recarga usuarios y su permiso de cancelacion. */
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await userService.getAllUsers();
      setUsers(list);
      const entries = await Promise.all(
        list.map(async (u) => {
          try {
            const p = await userService.getPermissions(u.ID_Usuario);
            return [u.ID_Usuario, p.puede_cancelar] as const;
          } catch {
            return [u.ID_Usuario, false] as const;
          }
        }),
      );
      setPermissions(Object.fromEntries(entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) void reload();
  }, [autoLoad, reload]);

  /** Crea un usuario y recarga la lista. */
  const createUser = useCallback(
    async (data: AdminUserData & { Contrasena: string }): Promise<number> => {
      const id = await userService.createUser(data);
      await reload();
      return id;
    },
    [reload],
  );

  /** Actualiza un usuario y recarga la lista. */
  const updateUser = useCallback(
    async (id: number, data: AdminUserData): Promise<void> => {
      await userService.updateUser(id, data);
      await reload();
    },
    [reload],
  );

  /** Elimina un usuario y recarga la lista. */
  const deleteUser = useCallback(
    async (id: number): Promise<void> => {
      await userService.deleteUser(id);
      await reload();
    },
    [reload],
  );

  /**
   * Otorga o revoca el permiso de cancelar con reversion optimista.
   *
   * @param {number} id - Identificador del usuario.
   * @param {boolean} value - Nuevo valor del permiso.
   * @returns {Promise<void>}
   * @throws {Error} Si el servidor rechaza el cambio.
   */
  const updatePermissions = useCallback(async (id: number, value: boolean): Promise<void> => {
    setPermissions((prev) => ({ ...prev, [id]: value }));
    try {
      await userService.updatePermissions(id, value);
    } catch (err) {
      setPermissions((prev) => ({ ...prev, [id]: !value }));
      throw err;
    }
  }, []);

  /** Lee los permisos delegables de un usuario. */
  const getPermissions = useCallback((id: number): Promise<UserPermissions> => {
    return userService.getPermissions(id);
  }, []);

  /** Lee los datos de entrega de un usuario. */
  const getDeliveryDetails = useCallback((id: number): Promise<UserDeliveryDetails> => {
    return userService.getDeliveryDetails(id);
  }, []);

  return {
    users,
    permissions,
    isLoading,
    error,
    reload,
    createUser,
    updateUser,
    deleteUser,
    updatePermissions,
    getPermissions,
    getDeliveryDetails,
  };
}
