# Manual Técnico

## Requisitos del sistema

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js | 18+ |
| npm | 9+ |
| Navegador | Chrome 90+, Firefox 90+, Edge 90+ |

## Instalación y ejecución

```bash
# Clonar repositorio (o copiar carpeta)
cd Parque_100

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Convenciones de código

### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos de componente | PascalCase | `HeroBanner.tsx` |
| Archivos de servicio/hook | kebab-case | `product.service.ts` |
| Variables y funciones | camelCase | `formatPrice`, `cartCount` |
| Tipos e interfaces | PascalCase | `Product`, `CartItem` |
| Constantes globales | UPPER_SNAKE_CASE | `FREE_SHIPPING_THRESHOLD` |
| Props de componentes | PascalCase + `Props` sufijo | `HeroBannerProps` |

### Formato

- **Indentación**: 2 espacios (no tabs)
- **Comillas**: simples en JavaScript/TypeScript
- **Punto y coma**: obligatorio al final de cada sentencia
- **Longitud de línea**: máximo 100 caracteres
- **JSX**: cada prop en su propia línea si hay más de 3

### Comentarios

- Usar comentarios solo para explicar **por qué** se hace algo, no **qué** se hace
- Documentar interfaces públicas con JSDoc cuando sea necesario
- Marcar con `TODO:` las tareas pendientes

```typescript
// Correcto: explica la razón de una decisión
// Se usa setTimeout para dar feedback visual de "añadido"

// Incorrecto: el código ya explica qué hace
// Suma 1 al contador
```

## Estándares técnicos

### TypeScript

- Tipado explícito en todas las funciones y componentes
- Evitar `any` — usar `unknown` cuando el tipo no se conozca
- Preferir `interface` sobre `type` para objetos que se extienden
- Usar `type` para uniones y utilitarios

### React

- Componentes funcionales con hooks
- Props tipadas con interfaz dedicada
- Custom hooks para lógica reutilizable
- Estado elevado al contexto global cuando sea compartido

### Estilos

- Tailwind CSS v4 con clases utilitarias
- Variables CSS personalizadas en `theme.css` para el tema
- `style={{}}` inline solo para valores dinámicos o gradientes

## Pruebas

Actualmente el proyecto no cuenta con pruebas automatizadas.

Para agregarlas, se recomienda:

```bash
npm install --save-dev vitest @testing-library/react
```

## Despliegue

```bash
npm run build
```

El directorio `dist/` contiene los archivos estáticos listos para servir en cualquier hosting (Vercel, Netlify, GitHub Pages, servidor Apache/Nginx).
