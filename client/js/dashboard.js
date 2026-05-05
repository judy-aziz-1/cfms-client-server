// ════════════════════════════════════════════════════════════
//  dashboard.js — CFMS Dashboard Logic
//  Requires: auth.js (getToken, getUser, logout)
// ════════════════════════════════════════════════════════════

const API_BASE = 'http://localhost:8000/api';

// ── State ─────────────────────────────────────────────────────
let currentSection = 'my-files';
let currentView    = 'grid';        // 'grid' | 'list'
let currentSort    = 'name';
let allFiles       = [];            // full file list from server
let selectedFile   = null;          // file currently in options modal

// ── DOM refs ──────────────────────────────────────────────────
const fileGrid      = document.getElementById('fileGrid');
const fileListEl    = document.getElementById('fileList');
const fileListBody  = document.getElementById('fileListBody');
const emptyState    = document.getElementById('emptyState');
const sectionTitle  = document.getElementById('sectionTitle');
const breadcrumb    = document.getElementById('breadcrumb');
const searchInput   = document.getElementById('searchInput');

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Auth guard — redirect to login if not logged in
  // Uses getToken() from auth.js
  if (typeof getToken === 'function' && !getToken()) {
    window.location.href = 'login.html';
    return;
  }

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
  // Uses getUser() from auth.js — returns stored user object
  const user = typeof getUser === 'function' ? getUser() : null;

  // ── REAL API (uncomment when backend is ready) ────────────
  // fetch(`${API_BASE}/users/me`, {
  //   headers: { Authorization: `Bearer ${getToken()}` }
  // })
  //   .then(r => r.json())
  //   .then(user => setUserUI(user));
  // ─────────────────────────────────────────────────────────

  // MOCK
  const mockUser = user || { name: 'Admin User', email: 'admin@cfms.com' };
  setUserUI(mockUser);
}

function setUserUI(user) {
  const name  = user.name  || user.username || 'User';
  const email = user.email || '';
  document.getElementById('sidebarUserName').textContent  = name;
  document.getElementById('sidebarUserEmail').textContent = email;
  document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
}

// ════════════════════════════════════════════════════════════
//  FILE LOADING
// ════════════════════════════════════════════════════════════
async function loadFiles() {
  // ── REAL API (uncomment when backend is ready) ────────────
  // try {
  //   const res = await fetch(`${API_BASE}/files/`, {
  //     headers: { Authorization: `Bearer ${getToken()}` }
  //   });
  //   if (!res.ok) throw new Error('Failed to load files');
  //   allFiles = await res.json();
  //   updateStats(allFiles);
  //   renderFiles(allFiles);
  // } catch (err) {
  //   showToast('Failed to load files', 'error');
  // }
  // ─────────────────────────────────────────────────────────

  // MOCK DATA — remove when API is ready
  allFiles = getMockFiles();
  updateStats(allFiles);
  renderFiles(filterFiles(allFiles));
}

function getMockFiles() {
  return [
    { id: 1, name: 'Project Report.pdf',     type: 'pdf',   size: 2048576,   modified: '2026-04-28', shared: true },
    { id: 2, name: 'design_mockup.png',       type: 'image', size: 512000,    modified: '2026-04-25', shared: false },
    { id: 3, name: 'source_code.zip',         type: 'zip',   size: 10485760,  modified: '2026-04-20', shared: true },
    { id: 4, name: 'Meeting Notes.docx',      type: 'doc',   size: 45056,     modified: '2026-05-01', shared: false },
    { id: 5, name: 'database_schema.sql',     type: 'code',  size: 8192,      modified: '2026-05-03', shared: false },
    { id: 6, name: 'presentation.pptx',       type: 'ppt',   size: 4194304,   modified: '2026-04-15', shared: true },
    { id: 7, name: 'server_config.json',      type: 'code',  size: 2048,      modified: '2026-05-04', shared: false },
    { id: 8, name: 'README.md',               type: 'doc',   size: 4096,      modified: '2026-05-02', shared: false },
  ];
}

// ── Filter based on active section ───────────────────────────
function filterFiles(files) {
  const q = searchInput.value.toLowerCase().trim();
  let filtered = files;

  if (currentSection === 'shared')  filtered = files.filter(f => f.shared);
  if (currentSection === 'recent')  filtered = files.filter(f => isRecent(f.modified));
  if (currentSection === 'starred') filtered = files.filter(f => f.starred);
  if (currentSection === 'trash')   filtered = files.filter(f => f.deleted);

  if (q) filtered = filtered.filter(f => f.name.toLowerCase().includes(q));

  return sortFiles(filtered);
}

function isRecent(dateStr) {
  const d    = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 7;
}

// ── Sort ──────────────────────────────────────────────────────
function sortFiles(files) {
  return [...files].sort((a, b) => {
    if (currentSort === 'name') return a.name.localeCompare(b.name);
    if (currentSort === 'size') return b.size - a.size;
    if (currentSort === 'date') return new Date(b.modified) - new Date(a.modified);
    if (currentSort === 'type') return a.type.localeCompare(b.type);
    return 0;
  });
}

// ════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════
function updateStats(files) {
  const totalSize  = files.reduce((s, f) => s + f.size, 0);
  const sharedCnt  = files.filter(f => f.shared).length;
  const recentCnt  = files.filter(f => isRecent(f.modified)).length;

  animateCounter('statFiles',   files.length);
  animateCounter('statShared',  sharedCnt);
  animateCounter('statRecent',  recentCnt);

  document.getElementById('statStorage').textContent = formatSize(totalSize);

  // Update sidebar storage bar (mock: use totalSize ratio to 10GB)
  const pct = Math.min((totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100);
  document.getElementById('storageFill').style.width = pct.toFixed(1) + '%';
  document.getElementById('storageText').textContent =
    `${formatSize(totalSize)} / 10 GB`;
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
  emptyState.style.display   = hasFiles ? 'none' : 'flex';
  fileGrid.style.display     = (hasFiles && currentView === 'grid') ? 'grid' : 'none';
  fileListEl.style.display   = (hasFiles && currentView === 'list') ? 'block' : 'none';

  if (!hasFiles) return;

  if (currentView === 'grid') renderGrid(files);
  else                        renderList(files);
}

function renderGrid(files) {
  fileGrid.innerHTML = files.map((f, i) =>
    `<div class="file-card" style="animation-delay:${i * 0.04}s"
         onclick="openFileOptions(${f.id})">
       <button class="file-card-options" onclick="event.stopPropagation();openFileOptions(${f.id})"
               title="Options">⋯</button>
       <div class="file-card-icon">${fileIcon(f.type)}</div>
       <div class="file-card-name" title="${escHtml(f.name)}">${escHtml(f.name)}</div>
       <div class="file-card-meta">
         <span>${formatSize(f.size)}</span>
         <span>${formatDate(f.modified)}</span>
       </div>
     </div>`
  ).join('');
}

function renderList(files) {
  fileListBody.innerHTML = files.map((f, i) =>
    `<div class="list-row" style="animation-delay:${i * 0.03}s">
       <div class="list-file-name">
         <span class="list-file-icon">${fileIcon(f.type)}</span>
         <span class="list-file-label" title="${escHtml(f.name)}">${escHtml(f.name)}</span>
         ${f.shared ? '<span style="font-size:10px;color:#4f8cff;margin-left:6px">SHARED</span>' : ''}
       </div>
       <span class="list-col-size">${formatSize(f.size)}</span>
       <span class="list-col-date">${formatDate(f.modified)}</span>
       <button class="list-row-options" onclick="openFileOptions(${f.id})" title="Options">⋯</button>
     </div>`
  ).join('');
}

// ════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════
function initSidebar() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      currentSection = item.dataset.section;
      const label = item.querySelector('.nav-label').textContent;
      sectionTitle.textContent = label;
      breadcrumb.innerHTML     = `<span>${label}</span>`;
      renderFiles(filterFiles(allFiles));
      // Close sidebar on mobile
      if (window.innerWidth <= 700) closeSidebar();
    });
  });

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (typeof logout === 'function') logout();
    else window.location.href = 'login.html';
  });
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

// ════════════════════════════════════════════════════════════
//  TOPBAR
// ════════════════════════════════════════════════════════════
function initTopbar() {
  document.getElementById('gridViewBtn').addEventListener('click', () => {
    setView('grid');
  });
  document.getElementById('listViewBtn').addEventListener('click', () => {
    setView('list');
  });
  document.getElementById('sortSelect').addEventListener('change', e => {
    currentSort = e.target.value;
    renderFiles(filterFiles(allFiles));
  });
  document.getElementById('newFolderBtn').addEventListener('click', () => {
    openModal('folderModal');
  });
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
    debounce = setTimeout(() => {
      renderFiles(filterFiles(allFiles));
    }, 250);
  });

  // ⌘K / Ctrl+K to focus search
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
  const btn       = document.getElementById('uploadBtn');
  const closeBtn  = document.getElementById('uploadModalClose');
  const cancelBtn = document.getElementById('uploadCancelBtn');
  const confirmBtn= document.getElementById('uploadConfirmBtn');
  const dropZone  = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const queue     = document.getElementById('uploadQueue');

  btn.addEventListener('click',       () => openModal('uploadModal'));
  closeBtn.addEventListener('click',  () => closeModal('uploadModal'));
  cancelBtn.addEventListener('click', () => closeModal('uploadModal'));

  // Drag & drop
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    addFilesToQueue(Array.from(e.dataTransfer.files), queue);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    addFilesToQueue(Array.from(fileInput.files), queue);
    fileInput.value = '';
  });

  confirmBtn.addEventListener('click', () => uploadAllFiles(queue));
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

async function uploadAllFiles(queue) {
  const bars = queue.querySelectorAll('[data-bar]');
  if (bars.length === 0) { showToast('No files selected', 'error'); return; }

  // ── REAL API (uncomment when backend is ready) ────────────
  // const formData = new FormData();
  // fileInput.files is already gone — collect from queue state
  // Or: track File objects in an array alongside queue items
  //
  // for (const file of pendingFiles) {
  //   formData.append('files', file);
  // }
  // const res = await fetch(`${API_BASE}/files/upload`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${getToken()}` },
  //   body: formData
  // });
  // if (res.ok) { showToast('Files uploaded!', 'success'); loadFiles(); }
  // ─────────────────────────────────────────────────────────

  // MOCK — animate progress bars
  for (const bar of bars) {
    await animateBar(bar);
  }
  showToast(`${bars.length} file(s) uploaded`, 'success');
  closeModal('uploadModal');
  queue.innerHTML = '';
  // Simulate new file appearing
  loadFiles();
}

function animateBar(bar) {
  return new Promise(resolve => {
    let w = 0;
    const t = setInterval(() => {
      w = Math.min(w + Math.random() * 15 + 5, 100);
      bar.style.width = w + '%';
      if (w >= 100) { clearInterval(t); resolve(); }
    }, 80);
  });
}

// ════════════════════════════════════════════════════════════
//  FILE OPTIONS MODAL
// ════════════════════════════════════════════════════════════
function initFileModal() {
  document.getElementById('fileModalClose').addEventListener('click', () =>
    closeModal('fileModal'));

  document.getElementById('actionDownload').addEventListener('click', handleDownload);
  document.getElementById('actionShare').addEventListener('click', handleShare);
  document.getElementById('actionRename').addEventListener('click', handleRename);
  document.getElementById('actionDelete').addEventListener('click', handleDelete);
}

function openFileOptions(fileId) {
  selectedFile = allFiles.find(f => f.id === fileId);
  if (!selectedFile) return;
  document.getElementById('fileModalTitle').textContent = selectedFile.name;
  openModal('fileModal');
}

function handleDownload() {
  // ── REAL API ───────────────────────────────────────────────
  // window.open(`${API_BASE}/files/${selectedFile.id}/download?token=${getToken()}`);
  // ─────────────────────────────────────────────────────────
  showToast(`Downloading: ${selectedFile.name}`, 'success');
  closeModal('fileModal');
}

function handleShare() {
  // ── REAL API ───────────────────────────────────────────────
  // fetch(`${API_BASE}/files/${selectedFile.id}/share`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${getToken()}` }
  // }).then(r => r.json()).then(data => {
  //   navigator.clipboard.writeText(data.link);
  //   showToast('Share link copied!', 'success');
  // });
  // ─────────────────────────────────────────────────────────
  navigator.clipboard?.writeText(`http://localhost:8000/share/${selectedFile.id}`)
    .then(() => showToast('Share link copied!', 'success'))
    .catch(()  => showToast('Share link generated', 'success'));
  closeModal('fileModal');
}

function handleRename() {
  const newName = prompt('Enter new name:', selectedFile.name);
  if (!newName || newName === selectedFile.name) return;

  // ── REAL API ───────────────────────────────────────────────
  // fetch(`${API_BASE}/files/${selectedFile.id}`, {
  //   method: 'PATCH',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${getToken()}`
  //   },
  //   body: JSON.stringify({ name: newName })
  // }).then(() => loadFiles());
  // ─────────────────────────────────────────────────────────

  // MOCK
  selectedFile.name = newName;
  renderFiles(filterFiles(allFiles));
  showToast('File renamed', 'success');
  closeModal('fileModal');
}

function handleDelete() {
  if (!confirm(`Delete "${selectedFile.name}"?`)) return;

  // ── REAL API ───────────────────────────────────────────────
  // fetch(`${API_BASE}/files/${selectedFile.id}`, {
  //   method: 'DELETE',
  //   headers: { Authorization: `Bearer ${getToken()}` }
  // }).then(() => loadFiles());
  // ─────────────────────────────────────────────────────────

  // MOCK
  allFiles = allFiles.filter(f => f.id !== selectedFile.id);
  updateStats(allFiles);
  renderFiles(filterFiles(allFiles));
  showToast('File deleted', 'success');
  closeModal('fileModal');
}

// ════════════════════════════════════════════════════════════
//  NEW FOLDER MODAL
// ════════════════════════════════════════════════════════════
function initFolderModal() {
  document.getElementById('folderModalClose').addEventListener('click', () =>
    closeModal('folderModal'));
  document.getElementById('folderCancelBtn').addEventListener('click', () =>
    closeModal('folderModal'));
  document.getElementById('folderCreateBtn').addEventListener('click', createFolder);

  document.getElementById('folderNameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') createFolder();
  });
}

function createFolder() {
  const input = document.getElementById('folderNameInput');
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }

  // ── REAL API ───────────────────────────────────────────────
  // fetch(`${API_BASE}/folders/`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${getToken()}`
  //   },
  //   body: JSON.stringify({ name })
  // }).then(() => loadFiles());
  // ─────────────────────────────────────────────────────────

  // MOCK — add folder to file list
  const newFolder = {
    id: Date.now(), name, type: 'folder',
    size: 0, modified: new Date().toISOString().slice(0, 10),
    shared: false
  };
  allFiles.unshift(newFolder);
  updateStats(allFiles);
  renderFiles(filterFiles(allFiles));
  showToast(`Folder "${name}" created`, 'success');
  input.value = '';
  closeModal('folderModal');
}

// ════════════════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m =>
    m.classList.remove('open'));
}

// Close modal on overlay click
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
  toast.textContent  = msg;
  toast.className    = `toast${type ? ' toast-' + type : ''} show`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
function fileIcon(type) {
  const icons = {
    pdf: '📄', image: '🖼', zip: '🗜', doc: '📝',
    code: '⌨', ppt: '📊', folder: '📁', video: '🎬',
    audio: '🎵', sheet: '📊'
  };
  return icons[type] || '📄';
}

function fileIconByName(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    pdf: '📄', png: '🖼', jpg: '🖼', jpeg: '🖼', gif: '🖼', svg: '🖼',
    zip: '🗜', rar: '🗜', '7z': '🗜',
    doc: '📝', docx: '📝', txt: '📝', md: '📝',
    js: '⌨', py: '⌨', json: '⌨', ts: '⌨', css: '⌨', html: '⌨', sql: '⌨',
    ppt: '📊', pptx: '📊', xls: '📊', xlsx: '📊',
    mp4: '🎬', avi: '🎬', mov: '🎬',
    mp3: '🎵', wav: '🎵'
  };
  return map[ext] || '📄';
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1048576)     return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824)  return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}