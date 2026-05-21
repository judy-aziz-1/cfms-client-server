// ════════════════════════════════════════════════════════════
//  dashboard.js — CFMS Dashboard Logic
//  Requires: auth.js (API_BASE, getToken, getUser, logout)
// ════════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────────
let currentSection = 'my-files';
let currentView    = 'grid';
let currentSort    = 'name';
let allFiles       = [];
let selectedFile   = null;

// ── DOM refs ──────────────────────────────────────────────────
const fileGrid     = document.getElementById('fileGrid');
const fileListEl   = document.getElementById('fileList');
const fileListBody = document.getElementById('fileListBody');
const emptyState   = document.getElementById('emptyState');
const sectionTitle = document.getElementById('sectionTitle');
const breadcrumb   = document.getElementById('breadcrumb');
const searchInput  = document.getElementById('searchInput');

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initUserInfo();
  loadFiles();
  initSidebar();
  initTopbar();
  initUploadModal();
  initFileModal();
  initFolderModal();
  initSearch();
});

// ── User Info ─────────────────────────────────────────────────
function initUserInfo() {
  const user = typeof getUser === 'function' ? getUser() : null;
  const mockUser = user || { name: 'User', email: '', role: 'user' };
  setUserUI(mockUser);
  showAdminLinkIfAdmin(mockUser);

  // Refresh from API
  fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  .then(r => r.ok ? r.json() : null)
  .then(u => { if (u) { setUserUI(u); showAdminLinkIfAdmin(u); } })
  .catch(() => {});
}

function setUserUI(user) {
  const name  = user.name  || user.username || 'User';
  const email = user.email || '';
  document.getElementById('sidebarUserName').textContent  = name;
  document.getElementById('sidebarUserEmail').textContent = email;
  document.getElementById('userAvatar').textContent       = name.charAt(0).toUpperCase();
}

function showAdminLinkIfAdmin(user) {
  const adminLink = document.getElementById('adminLink');
  if (!adminLink) return;
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@cfms.com';
  adminLink.style.display = isAdmin ? 'flex' : 'none';
}

// ════════════════════════════════════════════════════════════
//  FILE LOADING
// ════════════════════════════════════════════════════════════
async function loadFiles() {
  try {
    const res = await fetch(`${API_BASE}/files/`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to load files');
    allFiles = await res.json();
    updateStats(allFiles);
    renderFiles(filterFiles(allFiles));
  } catch (err) {
    showToast('Failed to load files', 'error');
    allFiles = [];
    updateStats([]);
    renderFiles([]);
  }
}

// ── Filter ────────────────────────────────────────────────────
function filterFiles(files) {
  const q = searchInput.value.toLowerCase().trim();
  let filtered = files;

  if (currentSection === 'shared')  filtered = files.filter(f => f.is_shared);
  if (currentSection === 'recent')  filtered = files.filter(f => isRecent(f.created_at));
  if (currentSection === 'starred') filtered = files.filter(f => f.starred);
  if (currentSection === 'trash')   filtered = files.filter(f => f.deleted);

  if (q) filtered = filtered.filter(f => f.name.toLowerCase().includes(q));
  return sortFiles(filtered);
}

function isRecent(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 7;
}

// ── Sort ──────────────────────────────────────────────────────
function sortFiles(files) {
  return [...files].sort((a, b) => {
    if (currentSort === 'name') return a.name.localeCompare(b.name);
    if (currentSort === 'size') return b.size - a.size;
    if (currentSort === 'date') return new Date(b.created_at) - new Date(a.created_at);
    if (currentSort === 'type') return a.file_type.localeCompare(b.file_type);
    return 0;
  });
}

// ════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════
function updateStats(files) {
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const sharedCnt = files.filter(f => f.is_shared).length;
  const recentCnt = files.filter(f => isRecent(f.created_at)).length;

  animateCounter('statFiles',  files.length);
  animateCounter('statShared', sharedCnt);
  animateCounter('statRecent', recentCnt);

  document.getElementById('statStorage').textContent = formatSize(totalSize);

  const pct = Math.min((totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100);
  document.getElementById('storageFill').style.width  = pct.toFixed(1) + '%';
  document.getElementById('storageText').textContent  = `${formatSize(totalSize)} / 10 GB`;
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
  }, 30);
}

// ════════════════════════════════════════════════════════════
//  RENDER FILES
// ════════════════════════════════════════════════════════════
function renderFiles(files) {
  const hasFiles = files.length > 0;
  emptyState.style.display = hasFiles ? 'none' : 'flex';
  fileGrid.style.display   = (hasFiles && currentView === 'grid') ? 'grid' : 'none';
  fileListEl.style.display = (hasFiles && currentView === 'list') ? 'block' : 'none';
  if (!hasFiles) return;
  if (currentView === 'grid') renderGrid(files);
  else                        renderList(files);
}

function renderGrid(files) {
  fileGrid.innerHTML = files.map((f, i) =>
    `<div class="file-card" style="animation-delay:${i * 0.04}s"
         onclick="openFileOptions(${f.id})">
       <button class="file-card-options"
               onclick="event.stopPropagation();openFileOptions(${f.id})"
               title="Options">⋯</button>
       <div class="file-card-icon">${fileIcon(f.file_type)}</div>
       <div class="file-card-name" title="${escHtml(f.name)}">${escHtml(f.name)}</div>
       <div class="file-card-meta">
         <span>${formatSize(f.size)}</span>
         <span>${formatDate(f.created_at)}</span>
       </div>
     </div>`
  ).join('');
}

function renderList(files) {
  fileListBody.innerHTML = files.map((f, i) =>
    `<div class="list-row" style="animation-delay:${i * 0.03}s">
       <div class="list-file-name">
         <span class="list-file-icon">${fileIcon(f.file_type)}</span>
         <span class="list-file-label" title="${escHtml(f.name)}">${escHtml(f.name)}</span>
         ${f.is_shared ? '<span style="font-size:10px;color:var(--accent);margin-left:6px">SHARED</span>' : ''}
       </div>
       <span class="list-col-size">${formatSize(f.size)}</span>
       <span class="list-col-date">${formatDate(f.created_at)}</span>
       <button class="list-row-options" onclick="openFileOptions(${f.id})" title="Options">⋯</button>
     </div>`
  ).join('');
}

// ════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════
function initSidebar() {
  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      currentSection = item.dataset.section;
      const label = item.querySelector('.nav-label').textContent;
      sectionTitle.textContent = label;
      breadcrumb.innerHTML     = `<span>${label}</span>`;
      renderFiles(filterFiles(allFiles));
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

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

// ════════════════════════════════════════════════════════════
//  TOPBAR
// ════════════════════════════════════════════════════════════
function initTopbar() {
  document.getElementById('gridViewBtn').addEventListener('click', () => setView('grid'));
  document.getElementById('listViewBtn').addEventListener('click', () => setView('list'));
  document.getElementById('sortSelect').addEventListener('change', e => {
    currentSort = e.target.value;
    renderFiles(filterFiles(allFiles));
  });
  document.getElementById('newFolderBtn').addEventListener('click', () => openModal('folderModal'));
}

function setView(v) {
  currentView = v;
  document.getElementById('gridViewBtn').classList.toggle('active', v === 'grid');
  document.getElementById('listViewBtn').classList.toggle('active', v === 'list');
  renderFiles(filterFiles(allFiles));
}

// ════════════════════════════════════════════════════════════
//  SEARCH
// ════════════════════════════════════════════════════════════
function initSearch() {
  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => renderFiles(filterFiles(allFiles)), 250);
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape') closeAllModals();
  });
}

// ════════════════════════════════════════════════════════════
//  UPLOAD MODAL
// ════════════════════════════════════════════════════════════
function initUploadModal() {
  const uploadBtn  = document.getElementById('uploadBtn');
  const closeBtn   = document.getElementById('uploadModalClose');
  const cancelBtn  = document.getElementById('uploadCancelBtn');
  const confirmBtn = document.getElementById('uploadConfirmBtn');
  const dropZone   = document.getElementById('dropZone');
  const fileInput  = document.getElementById('fileInput');
  const queue      = document.getElementById('uploadQueue');

  let pendingFiles = [];

  uploadBtn.addEventListener('click',  () => openModal('uploadModal'));
  closeBtn.addEventListener('click',   () => { closeModal('uploadModal'); queue.innerHTML = ''; pendingFiles.splice(0); });
  cancelBtn.addEventListener('click',  () => { closeModal('uploadModal'); queue.innerHTML = ''; pendingFiles.splice(0); });
  confirmBtn.addEventListener('click', () => uploadAllFiles(queue, pendingFiles));

  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    pendingFiles.push(...files);
    addFilesToQueue(files, queue);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    pendingFiles.push(...files);
    addFilesToQueue(files, queue);
    fileInput.value = '';
  });
}

function addFilesToQueue(files, queue) {
  files.forEach(file => {
    const item = document.createElement('div');
    item.className = 'queue-item';
    item.innerHTML = `
      <span class="queue-icon">${fileIconByName(file.name)}</span>
      <div class="queue-info">
        <div class="queue-name">${escHtml(file.name)}</div>
        <div class="queue-size">${formatSize(file.size)}</div>
      </div>
      <div class="queue-progress"><div class="queue-bar" data-bar></div></div>`;
    queue.appendChild(item);
  });
}

async function uploadAllFiles(queue, pendingFiles) {
  if (!pendingFiles.length) { showToast('No files selected', 'error'); return; }

  const formData = new FormData();
  pendingFiles.forEach(file => formData.append('files', file));

  try {
    const bars = queue.querySelectorAll('[data-bar]');
    // Animate bars while uploading
    bars.forEach(bar => { bar.style.width = '60%'; });

    const res = await fetch(`${API_BASE}/files/upload`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body:    formData
    });

    if (!res.ok) throw new Error('Upload failed');

    bars.forEach(bar => { bar.style.width = '100%'; });
    showToast(`${pendingFiles.length} file(s) uploaded`, 'success');
    closeModal('uploadModal');
    queue.innerHTML = '';
    pendingFiles.splice(0);
    loadFiles(); // refresh file list

  } catch (err) {
    showToast('Upload failed. Try again.', 'error');
  }
}

// ════════════════════════════════════════════════════════════
//  FILE OPTIONS MODAL
// ════════════════════════════════════════════════════════════
function initFileModal() {
  document.getElementById('fileModalClose').addEventListener('click', () => closeModal('fileModal'));
  document.getElementById('actionDownload').addEventListener('click', handleDownload);
  document.getElementById('actionShare').addEventListener('click',    handleShare);
  document.getElementById('actionRename').addEventListener('click',   handleRename);
  document.getElementById('actionDelete').addEventListener('click',   handleDelete);
}

function openFileOptions(fileId) {
  selectedFile = allFiles.find(f => f.id === fileId);
  if (!selectedFile) return;
  document.getElementById('fileModalTitle').textContent = selectedFile.name;
  openModal('fileModal');
}

async function handleDownload() {
  try {
    const res = await fetch(`${API_BASE}/files/${selectedFile.id}/download`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloading: ${selectedFile.name}`, 'success');
  } catch {
    showToast('Download failed', 'error');
  }
  closeModal('fileModal');
}

async function handleShare() {
  try {
    const res = await fetch(`${API_BASE}/files/${selectedFile.id}/share`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();
    navigator.clipboard?.writeText(data.share_link)
      .then(() => showToast('Share link copied!', 'success'))
      .catch(()  => showToast(`Share link: ${data.share_link}`, 'success'));
  } catch {
    showToast('Failed to generate share link', 'error');
  }
  closeModal('fileModal');
}

async function handleRename() {
  const newName = prompt('Enter new name:', selectedFile.name);
  if (!newName || newName === selectedFile.name) return;

  try {
    const res = await fetch(`${API_BASE}/files/${selectedFile.id}`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${getToken()}`
      },
      body: JSON.stringify({ name: newName })
    });
    if (!res.ok) throw new Error();
    showToast('File renamed', 'success');
    loadFiles();
  } catch {
    showToast('Rename failed', 'error');
  }
  closeModal('fileModal');
}

async function handleDelete() {
  if (!confirm(`Delete "${selectedFile.name}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/files/${selectedFile.id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error();
    showToast('File deleted', 'success');
    loadFiles();
  } catch {
    showToast('Delete failed', 'error');
  }
  closeModal('fileModal');
}

// ════════════════════════════════════════════════════════════
//  NEW FOLDER MODAL (UI only — backend folders coming later)
// ════════════════════════════════════════════════════════════
function initFolderModal() {
  document.getElementById('folderModalClose').addEventListener('click', () => closeModal('folderModal'));
  document.getElementById('folderCancelBtn').addEventListener('click',  () => closeModal('folderModal'));
  document.getElementById('folderCreateBtn').addEventListener('click',  createFolder);
  document.getElementById('folderNameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') createFolder();
  });
}

function createFolder() {
  const input = document.getElementById('folderNameInput');
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }
  showToast(`Folder "${name}" created`, 'success');
  input.value = '';
  closeModal('folderModal');
}

// ════════════════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════════════════
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

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
  const icons = { pdf:'📄', image:'🖼', zip:'🗜', doc:'📝', code:'⌨', ppt:'📊', folder:'📁', video:'🎬', audio:'🎵' };
  return icons[type] || '📄';
}

function fileIconByName(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    pdf:'📄', png:'🖼', jpg:'🖼', jpeg:'🖼', gif:'🖼', svg:'🖼',
    zip:'🗜', rar:'🗜', '7z':'🗜',
    doc:'📝', docx:'📝', txt:'📝', md:'📝',
    js:'⌨', py:'⌨', json:'⌨', ts:'⌨', css:'⌨', html:'⌨', sql:'⌨',
    ppt:'📊', pptx:'📊', xls:'📊', xlsx:'📊',
    mp4:'🎬', avi:'🎬', mov:'🎬', mp3:'🎵', wav:'🎵'
  };
  return map[ext] || '📄';
}

function formatSize(bytes) {
  if (!bytes) return '—';
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
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}