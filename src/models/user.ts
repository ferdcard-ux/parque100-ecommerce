/**
 * @fileoverview Modelos de autenticacion y usuario.
 * Contratos usados por el servicio de auth y su controlador React.
 */

/** Usuario autenticado en la aplicacion (sin datos sensibles). */
export interface User {
  /** Identificador del usuario en la base de datos. */
  id: number;
  /** Primer nombre (derivado de `Nombre` completo). */
  firstName: string;
  /** Apellidos (resto del nombre completo). */
  lastName: string;
  /** Correo electronico. */
  email: string;
  /** Indica si el usuario tiene rol administrador. */
  isAdmin: boolean;
}

/** Datos de entrega persistentes asociados al usuario autenticado. */
export interface UserDeliveryDetails {
  /** Telefono de contacto. */
  phone: string;
  /** Torre o bloque del conjunto. */
  tower: string;
  /** Piso del apartamento. */
  floor: string;
  /** Identificacion del apartamento. */
  apartment: string;
}

/** Estado global de autenticacion expuesto por useAuthController. */
export interface AuthState {
  /** Usuario activo o null si no hay sesion. */
  user: User | null;
  /** true cuando existe una sesion abierta. */
  isLoggedIn: boolean;
  /** true cuando el usuario activo es administrador. */
  isAdmin: boolean;
}

/** Credenciales del formulario de login. */
export interface LoginCredentials {
  /** Correo electronico. */
  email: string;
  /** Contrasena en texto plano (se envia al backend). */
  password: string;
  /** Persistir la sesion entre cierres del navegador. */
  remember?: boolean;
}

/** Datos del formulario de registro. */
export interface RegisterData {
  /** Primer nombre. */
  firstName: string;
  /** Apellidos. */
  lastName: string;
  /** Correo electronico. */
  email: string;
  /** Telefono de contacto (10 digitos, unico por cuenta). */
  phone: string;
  /** Contrasena elegida. */
  password: string;
  /** Confirmacion de contrasena (validada solo en cliente). */
  confirmPassword: string;
}

