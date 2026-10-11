/**
 * @fileoverview Avatar de usuario con foto o iniciales.
 * Muestra la foto de perfil cuando existe; de lo contrario,
 * las iniciales del nombre sobre el fondo del contenedor.
 */

interface UserAvatarProps {
  /** Foto de perfil (dataURL) o null. */
  photo: string | null | undefined;
  /** Primer nombre para las iniciales y el alt. */
  firstName: string;
  /** Apellidos para las iniciales y el alt. */
  lastName: string;
  /** Clases del contenedor (tamano, forma y fondo). */
  className?: string;
  /** Clases del texto de las iniciales. */
  textClassName?: string;
  /** Estilos en linea de las iniciales. */
  textStyle?: React.CSSProperties;
  /** Texto alternativo de la foto. */
  alt?: string;
}

/** Avatar circular: foto de perfil o iniciales como respaldo. */
export function UserAvatar({
  photo,
  firstName,
  lastName,
  className = '',
  textClassName = '',
  textStyle,
  alt,
}: UserAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  if (photo) {
    return (
      <img
        src={photo}
        alt={alt ?? `Foto de ${firstName} ${lastName}`.trim()}
        className={`${className} object-cover shrink-0`}
      />
    );
  }
  return (
    <span className={`${className} flex items-center justify-center shrink-0`}>
      <span className={textClassName} style={textStyle}>{initials}</span>
    </span>
  );
}
