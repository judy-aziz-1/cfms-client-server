// ═══════════════════════════════════════════════════
//  CFMS — auth.js
//  المسؤول عن: تسجيل الدخول، إنشاء الحساب، الجلسة
// ═══════════════════════════════════════════════════

// ── إعدادات الـ API ──────────────────────────────────
// عند جهوزية الـ Server من زميلك، غيّر هذا الرابط فقط
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

  input.type   = isPass ? 'text' : 'password';
  btn.textContent = isPass ? '🙈' : '👁';
}


// ════════════════════════════════════════════════════
//  ALERT MESSAGES
// ════════════════════════════════════════════════════
function showAlert(message, type = 'error') {
  const el     = document.getElementById('alert');
  const prefix = type === 'error' ? '⚠ ' : '✓ ';

  el.textContent = prefix + message;
  el.className   = `alert ${type} show`;
}

function hideAlert() {
  document.getElementById('alert').className = 'alert';
}


// ════════════════════════════════════════════════════
//  FORM VALIDATION
// ════════════════════════════════════════════════════

// إظهار أو إخفاء رسالة الخطأ لحقل معين
function showFieldError(errorId, show) {
  const errorEl = document.getElementById(errorId);
  const inputId = errorId.replace('Err', '');
  const inputEl = document.getElementById(inputId);

  errorEl.classList.toggle('show', show);
  if (inputEl) inputEl.classList.toggle('error-input', show);

  return show; // نُرجع القيمة لاستخدامها في التحقق
}

// مسح جميع رسائل الخطأ
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('input').forEach(el => el.classList.remove('error-input'));
}

// التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// ════════════════════════════════════════════════════
//  LOADING STATE
// ════════════════════════════════════════════════════
function setLoading(buttonId, isLoading) {
  const btn    = document.getElementById(buttonId);
  btn.disabled = isLoading;
  btn.classList.toggle('loading', isLoading);
}


// ════════════════════════════════════════════════════
//  SESSION MANAGEMENT
// ════════════════════════════════════════════════════

// حفظ بيانات المستخدم بعد تسجيل الدخول
function saveSession(token, user) {
  localStorage.setItem('cfms_token', token);
  localStorage.setItem('cfms_user',  JSON.stringify(user));
}

// التحقق هل المستخدم مسجل دخول
function isLoggedIn() {
  return !!localStorage.getItem('cfms_token');
}

// الحصول على الـ Token للإرسال مع الطلبات
function getToken() {
  return localStorage.getItem('cfms_token');
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem('cfms_token');
  localStorage.removeItem('cfms_user');
  window.location.href = 'login.html';
}

// إذا كان المستخدم مسجلاً، اذهب مباشرة للـ Dashboard
if (isLoggedIn()) {
  window.location.href = 'dashboard.html';
}


// ════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  hideAlert();

  // 1. جمع بيانات النموذج
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;

  // 2. التحقق من البيانات
  let isValid = true;
  if (!isValidEmail(email)) isValid = !showFieldError('loginEmailErr', true);
  if (!password)            isValid = !showFieldError('loginPassErr', true);
  if (!isValid) return;

  // 3. بدء حالة التحميل
  setLoading('loginBtn', true);

  try {

    // ════════════════════════════════════════════════
    // الكود الحقيقي — فعّله عند جهوزية الـ API
    // ════════════════════════════════════════════════
    /*
    const response = await fetch(`${API_BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'خطأ في تسجيل الدخول');
    }

    saveSession(data.access_token, data.user);
    window.location.href = 'dashboard.html';
    */

    // ════════════════════════════════════════════════
    // محاكاة مؤقتة — احذفها عند ربط الـ API
    // ════════════════════════════════════════════════
    await new Promise(resolve => setTimeout(resolve, 1400));

    if (email === 'admin@cfms.com' && password === '12345678') {
      showAlert('تم تسجيل الدخول بنجاح! جاري التحويل...', 'success');
      // window.location.href = 'dashboard.html';
    } else {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

  } catch (error) {
    showAlert(error.message);
  } finally {
    // 4. إيقاف حالة التحميل دائماً
    setLoading('loginBtn', false);
  }
});


// ════════════════════════════════════════════════════
//  REGISTER
// ════════════════════════════════════════════════════
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  hideAlert();

  // 1. جمع بيانات النموذج
  const name            = document.getElementById('regName').value.trim();
  const email           = document.getElementById('regEmail').value.trim();
  const password        = document.getElementById('regPass').value;
  const passwordConfirm = document.getElementById('regPassConfirm').value;

  // 2. التحقق من البيانات
  let isValid = true;
  if (!name)                    isValid = !showFieldError('regNameErr', true);
  if (!isValidEmail(email))     isValid = !showFieldError('regEmailErr', true);
  if (password.length < 8)      isValid = !showFieldError('regPassErr', true);
  if (password !== passwordConfirm) isValid = !showFieldError('regPassConfirmErr', true);
  if (!isValid) return;

  // 3. بدء حالة التحميل
  setLoading('registerBtn', true);

  try {

    // ════════════════════════════════════════════════
    // الكود الحقيقي — فعّله عند جهوزية الـ API
    // ════════════════════════════════════════════════
    /*
    const response = await fetch(`${API_BASE}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'خطأ في إنشاء الحساب');
    }

    showAlert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.', 'success');
    setTimeout(() => switchTab('login'), 1500);
    */

    // ════════════════════════════════════════════════
    // محاكاة مؤقتة — احذفها عند ربط الـ API
    // ════════════════════════════════════════════════
    await new Promise(resolve => setTimeout(resolve, 1400));

    showAlert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.', 'success');
    setTimeout(() => switchTab('login'), 1500);

  } catch (error) {
    showAlert(error.message);
  } finally {
    // 4. إيقاف حالة التحميل دائماً
    setLoading('registerBtn', false);
  }
});