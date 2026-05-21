// ═══════════════════════════════════════════════════
//  CFMS — auth.js
//  Handles: Login, Registration, Session Management
// ═══════════════════════════════════════════════════

const API_BASE = 'http://localhost:8000/api';

// ════════════════════════════════════════════════════
//  SESSION MANAGEMENT
// ════════════════════════════════════════════════════
function saveSession(token, user) {
  localStorage.setItem('cfms_token', token);
  localStorage.setItem('cfms_user',  JSON.stringify(user));
}

function isLoggedIn() {
  return !!localStorage.getItem('cfms_token');
}

function getToken() {
  return localStorage.getItem('cfms_token');
}

function getUser() {
  const user = localStorage.getItem('cfms_user');
  return user ? JSON.parse(user) : null;
}

function logout() {
  localStorage.removeItem('cfms_token');
  localStorage.removeItem('cfms_user');
  window.location.replace('login.html');
}

// ── Auth Guard (runs immediately on every page) ───────
(function authGuard() {
  const path        = window.location.pathname;
  const isProtected = path.includes('dashboard.html') || path.includes('admin.html');
  const isLoginPage = path.includes('login.html') || path.endsWith('/pages/') || path.endsWith('/');

  if (isProtected && !isLoggedIn()) {
    window.location.replace('login.html');
  } else if (isLoginPage && isLoggedIn()) {
    window.location.replace('dashboard.html');
  }
})();

// ════════════════════════════════════════════════════
//  TAB SWITCHING — login page only
// ════════════════════════════════════════════════════
function switchTab(tab) {
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (!loginForm || !registerForm) return; // guard: only runs on login page

  const isLogin = tab === 'login';
  const tabs    = document.querySelectorAll('.tab');
  tabs[0].classList.toggle('active', isLogin);
  tabs[1].classList.toggle('active', !isLogin);
  loginForm.classList.toggle('active', isLogin);
  registerForm.classList.toggle('active', !isLogin);
  hideAlert();
  clearErrors();
}

// ════════════════════════════════════════════════════
//  PASSWORD VISIBILITY
// ════════════════════════════════════════════════════
function togglePass(inputId, btn) {
  const input  = document.getElementById(inputId);
  const isPass = input.type === 'password';
  input.type      = isPass ? 'text' : 'password';
  btn.textContent = isPass ? '🙈' : '👁';
}

// ════════════════════════════════════════════════════
//  ALERTS & VALIDATION
// ════════════════════════════════════════════════════
function showAlert(message, type = 'error') {
  const el = document.getElementById('alert');
  if (!el) return;
  el.textContent = (type === 'error' ? '⚠ ' : '✓ ') + message;
  el.className   = `alert ${type} show`;
}

function hideAlert() {
  const el = document.getElementById('alert');
  if (el) el.className = 'alert';
}

function showFieldError(errorId, show) {
  const errorEl = document.getElementById(errorId);
  const inputEl = document.getElementById(errorId.replace('Err', ''));
  if (errorEl) errorEl.classList.toggle('show', show);
  if (inputEl) inputEl.classList.toggle('error-input', show);
  return show;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('input').forEach(el => el.classList.remove('error-input'));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ════════════════════════════════════════════════════
//  LOADING STATE
// ════════════════════════════════════════════════════
function setLoading(buttonId, isLoading) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.disabled = isLoading;
  btn.classList.toggle('loading', isLoading);
}

// ════════════════════════════════════════════════════
//  LOGIN — only runs if login form exists
// ════════════════════════════════════════════════════
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    hideAlert();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;

    let isValid = true;
    if (!isValidEmail(email)) isValid = !showFieldError('loginEmailErr', true);
    if (!password)            isValid = !showFieldError('loginPassErr', true);
    if (!isValid) return;

    setLoading('loginBtn', true);

    try {
      // ── REAL API (uncomment when backend is ready) ──────
      /*
      const response = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed.');
      saveSession(data.access_token, data.user);
      window.location.replace('dashboard.html');
      */

      // ── MOCK ────────────────────────────────────────────
      await new Promise(resolve => setTimeout(resolve, 1400));
      if (email === 'admin@cfms.com' && password === '12345678') {
        saveSession('mock-token-123', { name: 'Admin User', email, role: 'admin' });
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => window.location.replace('dashboard.html'), 1000);
      } else {
        throw new Error('Invalid email or password. Please try again.');
      }

    } catch (error) {
      showAlert(error.message);
    } finally {
      setLoading('loginBtn', false);
    }
  });
}

// ════════════════════════════════════════════════════
//  REGISTER — only runs if register form exists
// ════════════════════════════════════════════════════
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    hideAlert();

    const name            = document.getElementById('regName').value.trim();
    const email           = document.getElementById('regEmail').value.trim();
    const password        = document.getElementById('regPass').value;
    const passwordConfirm = document.getElementById('regPassConfirm').value;

    let isValid = true;
    if (!name)                        isValid = !showFieldError('regNameErr', true);
    if (!isValidEmail(email))         isValid = !showFieldError('regEmailErr', true);
    if (password.length < 8)          isValid = !showFieldError('regPassErr', true);
    if (password !== passwordConfirm) isValid = !showFieldError('regPassConfirmErr', true);
    if (!isValid) return;

    setLoading('registerBtn', true);

    try {
      // ── REAL API (uncomment when backend is ready) ──────
      /*
      const response = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Registration failed.');
      showAlert('Account created! You can now log in.', 'success');
      setTimeout(() => switchTab('login'), 1500);
      */

      // ── MOCK ────────────────────────────────────────────
      await new Promise(resolve => setTimeout(resolve, 1400));
      showAlert('Account created successfully! You can now log in.', 'success');
      setTimeout(() => switchTab('login'), 1500);

    } catch (error) {
      showAlert(error.message);
    } finally {
      setLoading('registerBtn', false);
    }
  });
}
// XSS prevention function in the front end (escHtml) used on page 9 of the documentation
function escHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;'
    };
    return text.replace(/[&<>"'/]/g, function(m) { return map[m]; });
}

// Example of safe usage when displaying the file name on the Dashboard:
// element.innerHTML = `<span>${escHtml(file.name)}</span>`;