// ═══════════════════════════════════════════════════
//  CFMS — auth.js
//  Handles: Login, Registration, Session Management
// ═══════════════════════════════════════════════════

// ── API Configuration ────────────────────────────────
// When your teammate's server is ready, change this URL only
const API_BASE = 'http://localhost:8000/api';


// ════════════════════════════════════════════════════
//  TAB SWITCHING
// ════════════════════════════════════════════════════
function switchTab(tab) {
  const isLogin = tab === 'login';
  const tabs    = document.querySelectorAll('.tab');

  tabs[0].classList.toggle('active', isLogin);
  tabs[1].classList.toggle('active', !isLogin);

  document.getElementById('loginForm').classList.toggle('active', isLogin);
  document.getElementById('registerForm').classList.toggle('active', !isLogin);

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
//  ALERT MESSAGES
// ════════════════════════════════════════════════════
function showAlert(message, type = 'error') {
  const el     = document.getElementById('alert');
  if (!el) return;
  const prefix = type === 'error' ? '⚠ ' : '✓ ';

  el.textContent = prefix + message;
  el.className   = `alert ${type} show`;
}

function hideAlert() {
  const el = document.getElementById('alert');
  if (el) el.className = 'alert';
}


// ════════════════════════════════════════════════════
//  FORM VALIDATION
// ════════════════════════════════════════════════════

// Show or hide the error message for a specific field
function showFieldError(errorId, show) {
  const errorEl = document.getElementById(errorId);
  const inputId = errorId.replace('Err', '');
  const inputEl = document.getElementById(inputId);

  if (errorEl) errorEl.classList.toggle('show', show);
  if (inputEl) inputEl.classList.toggle('error-input', show);

  return show;
}

// Clear all error messages
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('input').forEach(el => el.classList.remove('error-input'));
}

// Validate email format
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
//  SESSION MANAGEMENT
// ════════════════════════════════════════════════════

// Save user data after successful login
function saveSession(token, user) {
  localStorage.setItem('cfms_token', token);
  localStorage.setItem('cfms_user',  JSON.stringify(user));
}

// Check if the user is already logged in
function isLoggedIn() {
  return !!localStorage.getItem('cfms_token');
}

// Get the token to send with API requests
function getToken() {
  return localStorage.getItem('cfms_token');
}

// Get the stored user object
function getUser() {
  const user = localStorage.getItem('cfms_user');
  return user ? JSON.parse(user) : null;
}

// Logout — clear session and redirect to login
function logout() {
  localStorage.removeItem('cfms_token');
  localStorage.removeItem('cfms_user');
  window.location.href = 'login.html';
}

// ── Page-specific redirect logic ──────────────────────
// Runs ONLY on login page: if already logged in → go to dashboard
// Runs ONLY on dashboard page: if NOT logged in → go to login
const currentPage = window.location.pathname;

if (currentPage.includes('dashboard.html')) {
  // We are on the dashboard — if no token, send to login
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
} else if (currentPage.includes('login.html') || currentPage.endsWith('/pages/') || currentPage.endsWith('/')) {
  // We are on the login page — if already logged in, go to dashboard
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
  }
}


// ════════════════════════════════════════════════════
//  LOGIN — only runs if login form exists on this page
// ════════════════════════════════════════════════════
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    hideAlert();

    // 1. Collect form data
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;

    // 2. Validate inputs
    let isValid = true;
    if (!isValidEmail(email)) isValid = !showFieldError('loginEmailErr', true);
    if (!password)            isValid = !showFieldError('loginPassErr', true);
    if (!isValid) return;

    // 3. Start loading state
    setLoading('loginBtn', true);

    try {

      // ════════════════════════════════════════════════
      // Real API code — uncomment when backend is ready
      // ════════════════════════════════════════════════
      /*
      const response = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Please try again.');
      }

      saveSession(data.access_token, data.user);
      window.location.href = 'dashboard.html';
      */

      // ════════════════════════════════════════════════
      // Temporary mock — remove when API is connected
      // ════════════════════════════════════════════════
      await new Promise(resolve => setTimeout(resolve, 1400));

      if (email === 'admin@cfms.com' && password === '12345678') {
        saveSession('mock-token-123', { name: 'Admin User', email });
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
      } else {
        throw new Error('Invalid email or password. Please try again.');
      }

    } catch (error) {
      showAlert(error.message);
    } finally {
      // 4. Always stop loading state
      setLoading('loginBtn', false);
    }
  });
}


// ════════════════════════════════════════════════════
//  REGISTER — only runs if register form exists on this page
// ════════════════════════════════════════════════════
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    hideAlert();

    // 1. Collect form data
    const name            = document.getElementById('regName').value.trim();
    const email           = document.getElementById('regEmail').value.trim();
    const password        = document.getElementById('regPass').value;
    const passwordConfirm = document.getElementById('regPassConfirm').value;

    // 2. Validate inputs
    let isValid = true;
    if (!name)                        isValid = !showFieldError('regNameErr', true);
    if (!isValidEmail(email))         isValid = !showFieldError('regEmailErr', true);
    if (password.length < 8)          isValid = !showFieldError('regPassErr', true);
    if (password !== passwordConfirm) isValid = !showFieldError('regPassConfirmErr', true);
    if (!isValid) return;

    // 3. Start loading state
    setLoading('registerBtn', true);

    try {

      // ════════════════════════════════════════════════
      // Real API code — uncomment when backend is ready
      // ════════════════════════════════════════════════
      /*
      const response = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed. Please try again.');
      }

      showAlert('Account created successfully! You can now log in.', 'success');
      setTimeout(() => switchTab('login'), 1500);
      */

      // ════════════════════════════════════════════════
      // Temporary mock — remove when API is connected
      // ════════════════════════════════════════════════
      await new Promise(resolve => setTimeout(resolve, 1400));

      showAlert('Account created successfully! You can now log in.', 'success');
      setTimeout(() => switchTab('login'), 1500);

    } catch (error) {
      showAlert(error.message);
    } finally {
      // 4. Always stop loading state
      setLoading('registerBtn', false);
    }
  });
}