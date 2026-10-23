/**
 * Inicio de sesion del acceso academico (archivo externo para permitir una
 * Content-Security-Policy sin scripts en linea).
 */
const form = document.getElementById('login-form');
const error = document.getElementById('error');
const submit = document.getElementById('submit');
const password = document.getElementById('password');
const passwordToggle = document.getElementById('password-toggle');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');
passwordToggle.addEventListener('click', () => {
  const isVisible = password.type === 'text';
  password.type = isVisible ? 'password' : 'text';
  passwordToggle.setAttribute('aria-label', isVisible
    ? 'Mostrar contraseña'
    : 'Ocultar contraseña');
  passwordToggle.setAttribute('aria-pressed', String(!isVisible));
  eyeIcon.toggleAttribute('hidden', !isVisible);
  eyeOffIcon.toggleAttribute('hidden', isVisible);
});
const params = new URLSearchParams(window.location.search);
const requested = params.get('next') || '/';
const destination = new URL(requested, window.location.origin);
const target = destination.origin === window.location.origin
  && !destination.pathname.startsWith('/access.html')
  ? `${destination.pathname}${destination.search}${destination.hash}` : '/';
if (params.get('denied') === '1') {
  error.textContent = 'No se autorizó el acceso. Contacta al responsable del sitio.';
  error.hidden = false;
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.hidden = true;
  submit.disabled = true;
  try {
    const response = await fetch('/api/site-access/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.elements.username.value.trim(),
        password: form.elements.password.value,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.authenticated !== true) {
      throw new Error(result?.error || 'Usuario o contraseña no válidos.');
    }
    window.location.replace(target);
  } catch (cause) {
    error.textContent = cause instanceof Error ? cause.message : 'No fue posible iniciar sesión.';
    error.hidden = false;
    submit.disabled = false;
  }
});
