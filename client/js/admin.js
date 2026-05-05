// ════════════════════════════════════════════════════════════
//  admin.js — CFMS Admin Panel Logic
//  Requires: auth.js (API_BASE, getToken, getUser, logout)
// ════════════════════════════════════════════════════════════

// NOTE: API_BASE is declared in auth.js — do NOT redeclare here

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
//  LOAD ALL DATA
// ════════════════════════════════════════════════════════════
async function loadAllData() {
  // ── REAL API (uncomment when backend is ready) ────────────
  // try {
  //   const headers = { Authorization: `Bearer ${getToken()}` };
  //   const [usersRes, filesRes, activityRes] = await Promise.all([
  //     fetch(`${API_BASE}/admin/users`,    { headers }),
  //     fetch(`${API_BASE}/admin/files`,    { headers }),
  //     fetch(`${API_BASE}/admin/activity`, { headers })
  //   ]);
  //   allUsers    = await usersRes.json();
  //   allFiles    = await filesRes.json();
  //   allActivity = await activityRes.json();
  // } catch (err) {
  //   showToast('Failed to load data', 'error');
  // }
  // ─────────────────────────────────────────────────────────

  allUsers    = getMockUsers();
  allFiles    = getMockFiles();
  allActivity = getMockActivity();

  updateStats();
  renderOverview();
  renderUsersTable(allUsers);
  renderFilesTable(allFiles);
  renderActivityLog(allActivity);
}

// ── Mock Data ─────────────────────────────────────────────────
function getMockUsers() {
  return [
    { id: 1, name: 'Admin User',   email: 'admin@cfms.com',   role: 'admin', status: 'active', files: 12, storage: 52428800,  joined: '2026-01-15' },
    { id: 2, name: 'John Doe',     email: 'john@example.com',  role: 'user',  status: 'active', files: 8,  storage: 20971520,  joined: '2026-02-20' },
    { id: 3, name: 'Sarah Smith',  email: 'sarah@example.com', role: 'user',  status: 'active', files: 25, storage: 104857600, joined: '2026-03-05' },
    { id: 4, name: 'Mike Johnson', email: 'mike@example.com',  role: 'user',  status: 'banned', files: 3,  storage: 5242880,   joined: '2026-03-18' },
    { id: 5, name: 'Emily Davis',  email: 'emily@example.com', role: 'user',  status: 'active', files: 17, storage: 73400320,  joined: '2026-04-01' },
  ];
}

function getMockFiles() {
  return [
    { id: 1, name: 'Project Report.pdf', owner: 'John Doe',    type: 'pdf',   size: 2097152,  shared: true,  uploaded: '2026-04-28' },
    { id: 2, name: 'design_mockup.png',  owner: 'Sarah Smith', type: 'image', size: 524288,   shared: false, uploaded: '2026-04-25' },
    { id: 3, name: 'source_code.zip',    owner: 'Admin User',  type: 'zip',   size: 10485760, shared: true,  uploaded: '2026-04-20' },
    { id: 4, name: 'Meeting Notes.docx', owner: 'Emily Davis', type: 'doc',   size: 45056,    shared: false, uploaded: '2026-05-01' },
    { id: 5, name: 'database.sql',       owner: 'Admin User',  type: 'code',  size: 8192,     shared: false, uploaded: '2026-05-03' },
    { id: 6, name: 'presentation.pptx', owner: 'John Doe',    type: 'doc',   size: 4194304,  shared: true,  uploaded: '2026-04-15' },
    { id: 7, name: 'profile_photo.jpg',  owner: 'Sarah Smith', type: 'image', size: 1048576,  shared: false, uploaded: '2026-05-02' },
    { id: 8, name: 'README.md',          owner: 'Admin User',  type: 'doc',   size: 4096,     shared: true,  uploaded: '2026-05-04' },
  ];
}

function getMockActivity() {
  return [
    { id: 1,  action: 'upload',   user: 'John Doe',     detail: 'Uploaded Project Report.pdf',   time: '2026-05-05 09:14' },
    { id: 2,  action: 'login',    user: 'Sarah Smith',  detail: 'Logged in from 192.168.1.5',    time: '2026-05-05 09:02' },
    { id: 3,  action: 'download', user: 'Emily Davis',  detail: 'Downloaded source_code.zip',    time: '2026-05-05 08:55' },
    { id: 4,  action: 'share',    user: 'Admin User',   detail: 'Shared README.md',              time: '2026-05-05 08:40' },
    { id: 5,  action: 'delete',   user: 'Mike Johnson', detail: 'Deleted old_backup.zip',        time: '2026-05-04 17:22' },
    { id: 6,  action: 'upload',   user: 'Sarah Smith',  detail: 'Uploaded design_mockup.png',    time: '2026-05-04 16:10' },
    { id: 7,  action: 'login',    user: 'John Doe',     detail: 'Logged in from 10.0.0.4',       time: '2026-05-04 15:30' },
    { id: 8,  action: 'download', user: 'Emily Davis',  detail: 'Downloaded Meeting Notes.docx', time: '2026-05-04 14:08' },
    { id: 9,  action: 'share',    user: 'John Doe',     detail: 'Shared presentation.pptx',      time: '2026-05-04 13:45' },
    { id: 10, action: 'upload',   user: 'Admin User',   detail: 'Uploaded database.sql',         time: '2026-05-04 11:20' },
  ];
}

// ════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════
function updateStats() {
  const totalStorage = allUsers.reduce((s, u) => s + u.storage, 0);
  const totalShared  = allFiles.filter(f => f.shared).length;
  const banned       = allUsers.filter(u => u.status === 'banned').length;
  const todayStr     = new Date().toISOString().slice(0, 10);
  const actToday     = allActivity.filter(a => a.time.startsWith(todayStr)).length;

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
        <div class="mini-meta">${escHtml(u.email)} · ${u.files} files</div>
      </div>
      <span class="badge badge-${u.status}">${u.status}</span>
    </div>`).join('');

  document.getElementById('recentActivityList').innerHTML = allActivity.slice(0, 5).map(a => `
    <div class="activity-mini-row">
      <div class="activity-dot dot-${a.action}"></div>
      <div class="activity-mini-info">
        <div class="activity-mini-text">${escHtml(a.detail)}</div>
        <div class="activity-mini-time">${escHtml(a.user)} · ${a.time}</div>
      </div>
    </div>`).join('');
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
      <td>${u.files}</td>
      <td>${formatSize(u.storage)}</td>
      <td>${formatDate(u.joined)}</td>
      <td><span class="badge badge-${u.status}">${u.status}</span></td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn" onclick="openUserModal(${u.id})">View</button>
          <button class="tbl-btn tbl-btn-danger" onclick="confirmBanUser(${u.id})">
            ${u.status === 'banned' ? 'Unban' : 'Ban'}
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
          <span class="file-cell-icon">${fileIcon(f.type)}</span>
          <span class="file-cell-name" title="${escHtml(f.name)}">${escHtml(f.name)}</span>
        </div>
      </td>
      <td>${escHtml(f.owner)}</td>
      <td>${f.type.toUpperCase()}</td>
      <td>${formatSize(f.size)}</td>
      <td><span class="badge ${f.shared ? 'badge-shared' : 'badge-private'}">${f.shared ? 'Shared' : 'Private'}</span></td>
      <td>${formatDate(f.uploaded)}</td>
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
      <div class="log-user">${escHtml(a.user)}</div>
      <div class="log-time">${a.time}</div>
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
  if (filter !== 'all') filtered = filtered.filter(u => u.status === filter || u.role === filter);
  if (q) filtered = filtered.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  renderUsersTable(filtered);
}

function filterFiles() {
  const q      = document.getElementById('fileSearch').value.toLowerCase().trim();
  const filter = document.getElementById('fileFilter').value;
  let filtered = allFiles;
  if (filter !== 'all') filtered = filtered.filter(f => f.type === filter);
  if (q) filtered = filtered.filter(f =>
    f.name.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q));
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
        <span class="detail-value"><span class="badge badge-${selectedUser.status}">${selectedUser.status}</span></span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Joined</span>
        <span class="detail-value">${formatDate(selectedUser.joined)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Total Files</span>
        <span class="detail-value">${selectedUser.files} files</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Storage Used</span>
        <span class="detail-value">${formatSize(selectedUser.storage)}</span>
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
    selectedUser.status === 'banned' ? 'Unban User' : 'Ban User';

  openModal('userModal');
}

// ════════════════════════════════════════════════════════════
//  ACTIONS
// ════════════════════════════════════════════════════════════
function confirmBanUser(userId) {
  const user   = allUsers.find(u => u.id === userId);
  if (!user) return;
  const action = user.status === 'banned' ? 'unban' : 'ban';
  confirmAction(
    `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name}?`,
    `Are you sure you want to ${action} this user?`,
    () => toggleBanUser(userId)
  );
}

function toggleBanUser(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  // fetch(`${API_BASE}/admin/users/${userId}/ban`, {
  //   method:'POST', headers:{Authorization:`Bearer ${getToken()}`}
  // }).then(() => loadAllData());

  user.status = user.status === 'banned' ? 'active' : 'banned';
  renderUsersTable(allUsers);
  updateStats();
  showToast(`User ${user.status === 'banned' ? 'banned' : 'unbanned'} successfully`, 'success');
  closeModal('userModal');
}

function confirmDeleteFile(fileId) {
  const file = allFiles.find(f => f.id === fileId);
  if (!file) return;
  confirmAction(
    `Delete "${file.name}"?`,
    'This file will be permanently deleted and cannot be recovered.',
    () => {
      // fetch(`${API_BASE}/admin/files/${fileId}`, {
      //   method:'DELETE', headers:{Authorization:`Bearer ${getToken()}`}
      // }).then(() => loadAllData());

      allFiles = allFiles.filter(f => f.id !== fileId);
      renderFilesTable(allFiles);
      updateStats();
      showToast('File deleted', 'success');
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

  document.getElementById('userModalSave').addEventListener('click', () => {
    if (!selectedUser) return;
    const newRole = document.getElementById('userRoleSelect').value;

    // fetch(`${API_BASE}/admin/users/${selectedUser.id}`, {
    //   method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${getToken()}`},
    //   body: JSON.stringify({ role: newRole })
    // }).then(() => loadAllData());

    selectedUser.role = newRole;
    renderUsersTable(allUsers);
    showToast('User updated successfully', 'success');
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