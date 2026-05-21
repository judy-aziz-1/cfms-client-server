// ════════════════════════════════════════════════════════════
//  admin.js — CFMS Admin Panel Logic
//  Requires: auth.js (API_BASE, getToken, getUser, logout)
// ════════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────────
let currentSection  = 'overview';
let allUsers        = [];
let allFiles        = [];
let allActivity     = [];
let selectedUser    = null;
let confirmCallback = null;

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initAdminInfo();
  loadAllData();
  initSidebar();
  initModals();
  initSearch();
});

function initAdminInfo() {
  const user = typeof getUser === 'function' ? getUser() : null;
  const name = user?.name || 'Admin User';
  document.getElementById('adminName').textContent   = name;
  document.getElementById('adminAvatar').textContent = name.charAt(0).toUpperCase();
}

// ════════════════════════════════════════════════════════════
//  LOAD ALL DATA FROM API
// ════════════════════════════════════════════════════════════
async function loadAllData() {
  try {
    const headers = { Authorization: `Bearer ${getToken()}` };
    const [usersRes, filesRes, activityRes] = await Promise.all([
      fetch(`${API_BASE}/users/admin/users`,    { headers }),
      fetch(`${API_BASE}/users/admin/files`,    { headers }),
      fetch(`${API_BASE}/users/admin/activity`, { headers })
    ]);

    if (!usersRes.ok || !filesRes.ok || !activityRes.ok) {
      throw new Error('Failed to load admin data');
    }

    allUsers    = await usersRes.json();
    allFiles    = await filesRes.json();
    allActivity = await activityRes.json();

  } catch (err) {
    showToast('Failed to load data — check your connection', 'error');
    allUsers    = [];
    allFiles    = [];
    allActivity = [];
  }

  updateStats();
  renderOverview();
  renderUsersTable(allUsers);
  renderFilesTable(allFiles);
  renderActivityLog(allActivity);
}

// ════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════
function updateStats() {
  const totalStorage = allUsers.reduce((s, u) => s + (u.storage || 0), 0);
  const totalShared  = allFiles.filter(f => f.is_shared || f.shared).length;
  const banned       = allUsers.filter(u => u.is_active === false).length;
  const todayStr     = new Date().toISOString().slice(0, 10);
  const actToday     = allActivity.filter(a => {
    const t = a.created_at || a.time || '';
    return t.startsWith(todayStr);
  }).length;

  animateCounter('statTotalUsers',  allUsers.length);
  animateCounter('statTotalFiles',  allFiles.length);
  animateCounter('statTotalShared', totalShared);
  animateCounter('statBanned',      banned);
  animateCounter('statActivity',    actToday);
  document.getElementById('statTotalStorage').textContent = formatSize(totalStorage);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = Math.max(1, Math.floor(target / 20));
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(t);
  }, 40);
}

// ════════════════════════════════════════════════════════════
//  OVERVIEW
// ════════════════════════════════════════════════════════════
function renderOverview() {
  const recentUsers = [...allUsers].slice(-3).reverse();
  document.getElementById('recentUsersList').innerHTML = recentUsers.map(u => `
    <div class="mini-row">
      <div class="mini-avatar">${u.name.charAt(0)}</div>
      <div class="mini-info">
        <div class="mini-name">${escHtml(u.name)}</div>
        <div class="mini-meta">${escHtml(u.email)} · ${u.file_count || 0} files</div>
      </div>
      <span class="badge badge-${u.is_active ? 'active' : 'banned'}">${u.is_active ? 'active' : 'banned'}</span>
    </div>`).join('') || '<div style="padding:16px;color:var(--muted);font-size:13px">No users yet</div>';

  document.getElementById('recentActivityList').innerHTML = allActivity.slice(0, 5).map(a => `
    <div class="activity-mini-row">
      <div class="activity-dot dot-${a.action}"></div>
      <div class="activity-mini-info">
        <div class="activity-mini-text">${escHtml(a.detail)}</div>
        <div class="activity-mini-time">${a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
      </div>
    </div>`).join('') || '<div style="padding:16px;color:var(--muted);font-size:13px">No activity yet</div>';
}

// ════════════════════════════════════════════════════════════
//  USERS TABLE
// ════════════════════════════════════════════════════════════
function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">No users found</td></tr>`;
    return;
  }
  tbody.innerHTML = users.map((u, i) => `
    <tr style="animation-delay:${i * 0.04}s">
      <td>
        <div class="user-cell">
          <div class="table-avatar">${u.name.charAt(0)}</div>
          <div><div class="table-name">${escHtml(u.name)}</div></div>
        </div>
      </td>
      <td><span class="table-email">${escHtml(u.email)}</span></td>
      <td><span class="badge badge-${u.role}">${u.role}</span></td>
      <td>${u.file_count || 0}</td>
      <td>${formatSize(u.storage || 0)}</td>
      <td>${formatDate(u.created_at)}</td>
      <td><span class="badge badge-${u.is_active ? 'active' : 'banned'}">${u.is_active ? 'active' : 'banned'}</span></td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn" onclick="openUserModal(${u.id})">View</button>
          <button class="tbl-btn tbl-btn-danger" onclick="confirmBanUser(${u.id})">
            ${u.is_active ? 'Ban' : 'Unban'}
          </button>
        </div>
      </td>
    </tr>`).join('');
}

// ════════════════════════════════════════════════════════════
//  FILES TABLE
// ════════════════════════════════════════════════════════════
function renderFilesTable(files) {
  const tbody = document.getElementById('filesTableBody');
  if (!files.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No files found</td></tr>`;
    return;
  }
  tbody.innerHTML = files.map((f, i) => `
    <tr style="animation-delay:${i * 0.04}s">
      <td>
        <div class="file-cell">
          <span class="file-cell-icon">${fileIcon(f.file_type || f.type)}</span>
          <span class="file-cell-name" title="${escHtml(f.name)}">${escHtml(f.name)}</span>
        </div>
      </td>
      <td>${escHtml(f.owner || 'Unknown')}</td>
      <td>${(f.file_type || f.type || '').toUpperCase()}</td>
      <td>${formatSize(f.size)}</td>
      <td><span class="badge ${(f.is_shared || f.shared) ? 'badge-shared' : 'badge-private'}">${(f.is_shared || f.shared) ? 'Shared' : 'Private'}</span></td>
      <td>${formatDate(f.uploaded || f.created_at)}</td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn tbl-btn-danger" onclick="confirmDeleteFile(${f.id})">Delete</button>
        </div>
      </td>
    </tr>`).join('');
}

// ════════════════════════════════════════════════════════════
//  ACTIVITY LOG
// ════════════════════════════════════════════════════════════
function renderActivityLog(activity) {
  const container = document.getElementById('activityLog');
  if (!activity.length) {
    container.innerHTML = `<div style="text-align:center;padding:60px;color:var(--muted)">No activity recorded</div>`;
    return;
  }
  container.innerHTML = activity.map((a, i) => `
    <div class="log-row" style="animation-delay:${i * 0.03}s">
      <div class="log-dot dot-${a.action}"></div>
      <div class="log-text">${escHtml(a.detail)}</div>
      <div class="log-user">User #${a.user_id}</div>
      <div class="log-time">${a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
    </div>`).join('');
}

// ════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════
function initSidebar() {
  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      switchSection(item.dataset.section);
      if (window.innerWidth <= 700) closeSidebar();
    });
  });

  document.getElementById('menuToggle').addEventListener('click', () =>
    document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (typeof logout === 'function') logout();
    else window.location.replace('login.html');
  });
}

function switchSection(section) {
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(item =>
    item.classList.toggle('active', item.dataset.section === section));
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(`section-${section}`).style.display = 'flex';
  const labels = { overview: 'Overview', users: 'Users', files: 'All Files', activity: 'Activity Log' };
  document.getElementById('breadcrumbPage').textContent = labels[section] || section;
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

// ════════════════════════════════════════════════════════════
//  SEARCH & FILTER
// ════════════════════════════════════════════════════════════
function initSearch() {
  document.getElementById('userSearch').addEventListener('input',  filterUsers);
  document.getElementById('userFilter').addEventListener('change', filterUsers);
  document.getElementById('fileSearch').addEventListener('input',  filterFiles);
  document.getElementById('fileFilter').addEventListener('change', filterFiles);

  document.getElementById('activityFilter').addEventListener('change', () => {
    const val = document.getElementById('activityFilter').value;
    renderActivityLog(val === 'all' ? allActivity : allActivity.filter(a => a.action === val));
  });

  document.getElementById('clearLogBtn').addEventListener('click', () => {
    confirmAction('Clear all activity logs?', 'This cannot be undone.', () => {
      allActivity = [];
      renderActivityLog([]);
      showToast('Activity log cleared', 'success');
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });
}

function filterUsers() {
  const q      = document.getElementById('userSearch').value.toLowerCase().trim();
  const filter = document.getElementById('userFilter').value;
  let filtered = allUsers;
  if (filter === 'active')  filtered = filtered.filter(u => u.is_active);
  if (filter === 'banned')  filtered = filtered.filter(u => !u.is_active);
  if (filter === 'admin')   filtered = filtered.filter(u => u.role === 'admin');
  if (q) filtered = filtered.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  renderUsersTable(filtered);
}

function filterFiles() {
  const q      = document.getElementById('fileSearch').value.toLowerCase().trim();
  const filter = document.getElementById('fileFilter').value;
  let filtered = allFiles;
  if (filter !== 'all') filtered = filtered.filter(f => (f.file_type || f.type) === filter);
  if (q) filtered = filtered.filter(f =>
    f.name.toLowerCase().includes(q) || (f.owner || '').toLowerCase().includes(q));
  renderFilesTable(filtered);
}

// ════════════════════════════════════════════════════════════
//  USER MODAL
// ════════════════════════════════════════════════════════════
function openUserModal(userId) {
  selectedUser = allUsers.find(u => u.id === userId);
  if (!selectedUser) return;

  document.getElementById('userModalTitle').textContent = selectedUser.name;
  document.getElementById('userModalBody').innerHTML = `
    <div class="user-detail-header">
      <div class="user-detail-avatar">${selectedUser.name.charAt(0)}</div>
      <div>
        <div class="user-detail-name">${escHtml(selectedUser.name)}</div>
        <div class="user-detail-email">${escHtml(selectedUser.email)}</div>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">Status</span>
        <span class="detail-value"><span class="badge badge-${selectedUser.is_active ? 'active' : 'banned'}">${selectedUser.is_active ? 'active' : 'banned'}</span></span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Joined</span>
        <span class="detail-value">${formatDate(selectedUser.created_at)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Total Files</span>
        <span class="detail-value">${selectedUser.file_count || 0} files</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Storage Used</span>
        <span class="detail-value">${formatSize(selectedUser.storage || 0)}</span>
      </div>
      <div class="detail-item" style="grid-column:1/-1">
        <span class="detail-label">Role</span>
        <select class="detail-role-select" id="userRoleSelect">
          <option value="user"  ${selectedUser.role === 'user'  ? 'selected' : ''}>User</option>
          <option value="admin" ${selectedUser.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>
    </div>`;

  document.getElementById('userModalBan').textContent =
    selectedUser.is_active ? 'Ban User' : 'Unban User';

  openModal('userModal');
}

// ════════════════════════════════════════════════════════════
//  ACTIONS
// ════════════════════════════════════════════════════════════
function confirmBanUser(userId) {
  const user   = allUsers.find(u => u.id === userId);
  if (!user) return;
  const action = user.is_active ? 'ban' : 'unban';
  confirmAction(
    `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name}?`,
    `Are you sure you want to ${action} this user?`,
    () => toggleBanUser(userId)
  );
}

async function toggleBanUser(userId) {
  try {
    const res = await fetch(`${API_BASE}/users/admin/users/${userId}/ban`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error();
    showToast('User updated successfully', 'success');
    loadAllData();
  } catch {
    showToast('Action failed', 'error');
  }
  closeModal('userModal');
}

function confirmDeleteFile(fileId) {
  const file = allFiles.find(f => f.id === fileId);
  if (!file) return;
  confirmAction(
    `Delete "${file.name}"?`,
    'This file will be permanently deleted and cannot be recovered.',
    async () => {
      try {
        const res = await fetch(`${API_BASE}/users/admin/files/${fileId}`, {
          method:  'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) throw new Error();
        showToast('File deleted', 'success');
        loadAllData();
      } catch {
        showToast('Delete failed', 'error');
      }
    }
  );
}

// ════════════════════════════════════════════════════════════
//  MODALS
// ════════════════════════════════════════════════════════════
function initModals() {
  document.getElementById('userModalClose').addEventListener('click',  () => closeModal('userModal'));
  document.getElementById('userModalCancel').addEventListener('click', () => closeModal('userModal'));

  document.getElementById('userModalBan').addEventListener('click', () => {
    if (selectedUser) confirmBanUser(selectedUser.id);
  });

  document.getElementById('userModalSave').addEventListener('click', async () => {
    if (!selectedUser) return;
    const newRole = document.getElementById('userRoleSelect').value;
    try {
      const res = await fetch(`${API_BASE}/users/admin/users/${selectedUser.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error();
      showToast('User updated successfully', 'success');
      loadAllData();
    } catch {
      showToast('Update failed', 'error');
    }
    closeModal('userModal');
  });

  document.getElementById('confirmModalClose').addEventListener('click', () => closeModal('confirmModal'));
  document.getElementById('confirmCancel').addEventListener('click',     () => closeModal('confirmModal'));
  document.getElementById('confirmOk').addEventListener('click', () => {
    closeModal('confirmModal');
    if (typeof confirmCallback === 'function') confirmCallback();
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function confirmAction(title, text, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent  = text;
  confirmCallback = callback;
  openModal('confirmModal');
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

// ════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════
let toastTimeout;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast${type ? ' toast-' + type : ''} show`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
function fileIcon(type) {
  const icons = { pdf:'📄', image:'🖼', zip:'🗜', doc:'📝', code:'⌨', ppt:'📊', folder:'📁' };
  return icons[type] || '📄';
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}