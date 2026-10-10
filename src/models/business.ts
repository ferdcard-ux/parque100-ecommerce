/**
 * @fileoverview Modelo de datos del negocio.
 * Contrato de la ficha editable del negocio mostrada en el panel admin.
 */

/** Ficha del negocio tal como la expone la API. */
export interface Business {
  /** Identificador fijo (siempre 1). */
  ID_Negocio: number;
  /** Nombre comercial. */
  Nombre: string;
  /** NIT del negocio (opcional). */
  NIT: string | null;
  /** Direccion fisica (opcional). */
  Direccion: string | null;
  /** Telefono de contacto (opcional). */
  Telefono: string | null;
  /** Correo de contacto (opcional). */
  Email: string | null;
  /** Horario de atencion (opcional). */
  Horario: string | null;
  /** Descripcion corta (opcional). */
  Descripcion: string | null;
}

/** Payload para actualizar la ficha del negocio. */
export interface BusinessUpdate {
  /** Nombre comercial (obligatorio). */
  Nombre: string;
  /** NIT del negocio. */
  NIT?: string;
  /** Direccion fisica. */
  Direccion?: string;
  /** Telefono de contacto. */
  Telefono?: string;
  /** Correo de contacto. */
  Email?: string;
  /** Horario de atencion. */
  Horario?: string;
  /** Descripcion corta. */
  Descripcion?: string;
}
