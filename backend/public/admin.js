const API_BASE = '/api';
let csrfToken = '';

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');
const btnChangePassTrigger = document.getElementById('btn-change-pass-trigger');
const btnChangeUsernameTrigger = document.getElementById('btn-change-username-trigger');
const btnMfaTrigger = document.getElementById('btn-mfa-trigger');
const btnSecurityTrigger = document.getElementById('btn-security-trigger');
const btnRefreshDashboard = document.getElementById('btn-refresh-dashboard');
const btnForgotPass = document.getElementById('btn-forgot-pass');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let mfaLoginPending = false;
const securityAuditState = { page: 1, limit: 25 };
let confirmationResolver = null;
let securityInputResolver = null;

async function bootstrapCsrf() {
  const res = await fetch(`${API_BASE}/admin/csrf`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.csrfToken) throw new Error('CSRF bootstrap failed');
  csrfToken = data.csrfToken;
}

async function adminFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (unsafeMethods.has(method) && !csrfToken) await bootstrapCsrf();
  const headers = new Headers(options.headers || {});
  if (unsafeMethods.has(method)) headers.set('X-CSRF-Token', csrfToken);
  return fetch(url, { ...options, headers, credentials: 'include' });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  verifyAuth();
  setupEventListeners();
});

function setupEventListeners() {
  loginForm.addEventListener('submit', handleLogin);
  btnLogout.addEventListener('click', handleLogout);

  btnChangeUsernameTrigger?.addEventListener('click', () => {
    document.getElementById('user-current-pass').value = '';
    document.getElementById('user-new-name').value = '';
    document.getElementById('username-msg').textContent = '';
    document.getElementById('username-modal').classList.remove('hidden');
  });

  document.getElementById('username-form')?.addEventListener('submit', handleChangeUsername);

  btnChangePassTrigger?.addEventListener('click', () => {
    document.getElementById('pass-current').value = '';
    document.getElementById('pass-new').value = '';
    document.getElementById('pass-msg').textContent = '';
    document.getElementById('password-modal').classList.remove('hidden');
  });

  document.getElementById('password-form')?.addEventListener('submit', handleChangePassword);
  btnMfaTrigger?.addEventListener('click', openMfaModal);
  btnSecurityTrigger?.addEventListener('click', () => activateTab('security'));
  btnRefreshDashboard?.addEventListener('click', handleDashboardRefresh);
  document.getElementById('btn-overview-refresh')?.addEventListener('click', handleDashboardRefresh);
  document.querySelectorAll('[data-target-tab]').forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.targetTab));
  });
  document.getElementById('btn-revoke-other-sessions')?.addEventListener('click', revokeOtherSessions);
  document.getElementById('security-sessions-list')?.addEventListener('click', handleSessionAction);
  document.getElementById('security-audit-event')?.addEventListener('change', () => {
    securityAuditState.page = 1;
    loadSecurityAudit();
  });
  document.getElementById('security-audit-outcome')?.addEventListener('change', () => {
    securityAuditState.page = 1;
    loadSecurityAudit();
  });
  document.getElementById('btn-refresh-security-audit')?.addEventListener('click', loadSecurityAudit);
  document.getElementById('btn-security-audit-prev')?.addEventListener('click', () => {
    if (securityAuditState.page > 1) {
      securityAuditState.page -= 1;
      loadSecurityAudit();
    }
  });
  document.getElementById('btn-security-audit-next')?.addEventListener('click', () => {
    securityAuditState.page += 1;
    loadSecurityAudit();
  });
  document.getElementById('mfa-confirm-form')?.addEventListener('submit', handleMfaConfirm);
  document.getElementById('btn-start-mfa')?.addEventListener('click', startMfaSetup);
  document.getElementById('btn-regenerate-recovery')?.addEventListener('click', regenerateRecoveryCodes);
  document.getElementById('btn-disable-mfa')?.addEventListener('click', disableMfa);
  document.getElementById('btn-confirm-cancel')?.addEventListener('click', () => closeConfirmation(false));
  document.getElementById('btn-confirm-accept')?.addEventListener('click', () => closeConfirmation(true));
  document.getElementById('security-input-form')?.addEventListener('submit', handleSecurityInputSubmit);
  document.getElementById('btn-security-input-cancel')?.addEventListener('click', () => closeSecurityInput(null));
  document.getElementById('btn-close-backup')?.addEventListener('click', () => {
    document.getElementById('mfa-backup-panel').classList.add('hidden');
    isLoggedOut = true;
    showLogin();
  });

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // Profile Form
  document.getElementById('profile-form').addEventListener('submit', handleSaveProfile);

  // Project Modals
  document.getElementById('btn-add-project').addEventListener('click', () => openProjectModal());
  document.getElementById('project-form').addEventListener('submit', handleSaveProject);

  // Skill Modals
  document.getElementById('btn-add-skill').addEventListener('click', () => openSkillModal());
  document.getElementById('skill-form').addEventListener('submit', handleSaveSkill);

  // Testimonial Modals
  document.getElementById('btn-add-testimonial').addEventListener('click', () => openTestimonialModal());
  document.getElementById('testimonial-form').addEventListener('submit', handleSaveTestimonial);

  // Modal Closers
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal-overlay').classList.add('hidden');
    });
  });
}

function activateTab(tabId) {
  tabBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tabId));
  tabContents.forEach((content) => content.classList.toggle('active', content.id === `tab-${tabId}`));
  if (tabId === 'overview') loadOverview();
  if (tabId === 'security') loadSecurityCenter();
}

// --- AUTHENTICATION ---
let isLoggedOut = false;

async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    await bootstrapCsrf();
    const endpoint = mfaLoginPending ? `${API_BASE}/admin/mfa/verify-login` : `${API_BASE}/admin/login`;
    const body = mfaLoginPending
      ? { code: document.getElementById('login-mfa-code').value }
      : { username, password };
    const res = await adminFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok && data.mfaRequired) {
      mfaLoginPending = true;
      document.getElementById('mfa-login-group').classList.remove('hidden');
      document.getElementById('login-mfa-code').focus();
      document.getElementById('login-submit').textContent = 'VERIFY MFA →';
      loginError.textContent = 'Authenticator verification required.';
    } else if (res.ok && data.username) {
      mfaLoginPending = false;
      isLoggedOut = false;
      if (data.username) {
        document.getElementById('user-display').textContent = `Logged in as ${data.username}`;
      }
      showApp();
      loadAllData();
    } else {
      loginError.textContent = data.message || 'Invalid username or password';
      if (mfaLoginPending && res.status === 401) {
        document.getElementById('login-mfa-code').value = '';
      }
    }
  } catch {
    loginError.textContent = 'Server connection failed or rate limit reached.';
  }
}

async function handleChangeUsername(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('user-current-pass').value;
  const newUsername = document.getElementById('user-new-name').value;
  const msgEl = document.getElementById('username-msg');

  msgEl.className = 'error-text';
  msgEl.textContent = 'Updating...';

  try {
    const res = await adminFetch(`${API_BASE}/admin/change-username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newUsername }),
    });

    const data = await res.json();
    if (res.ok) {
      msgEl.className = 'success-text';
      msgEl.textContent = '✓ Username updated successfully!';
      if (data.username) {
        document.getElementById('user-display').textContent = `Logged in as ${data.username}`;
      }
      setTimeout(() => {
        document.getElementById('username-modal').classList.add('hidden');
        handleLogout();
      }, 1500);
    } else {
      msgEl.textContent = data.message || 'Failed to update username.';
    }
  } catch {
    msgEl.textContent = 'Server error.';
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('pass-current').value;
  const newPassword = document.getElementById('pass-new').value;
  const msgEl = document.getElementById('pass-msg');

  msgEl.className = 'error-text';
  msgEl.textContent = 'Updating...';

  try {
    const res = await adminFetch(`${API_BASE}/admin/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      msgEl.className = 'success-text';
      msgEl.textContent = '✓ Password updated successfully!';
      setTimeout(() => {
        document.getElementById('password-modal').classList.add('hidden');
        handleLogout();
      }, 1500);
    } else {
      msgEl.textContent = data.message || 'Failed to update password.';
    }
  } catch {
    msgEl.textContent = 'Server error.';
  }
}

async function verifyAuth() {
  try {
    await bootstrapCsrf();
    const res = await adminFetch(`${API_BASE}/admin/me`);

    if (res.ok) {
      showApp();
      loadAllData();
    } else {
      handleLogout();
    }
  } catch {
    handleLogout();
  }
}

function showLogin() {
  const loginPass = document.getElementById('login-password');
  if (loginPass) loginPass.value = '';
  mfaLoginPending = false;
  document.getElementById('mfa-login-group')?.classList.add('hidden');
  const mfaCodeInput = document.getElementById('login-mfa-code');
  if (mfaCodeInput) mfaCodeInput.value = '';
  document.getElementById('login-submit')?.replaceChildren(document.createTextNode('ACCESS HQ →'));
  loginOverlay.classList.remove('hidden');
  appContainer.classList.add('hidden');
}

function showApp() {
  loginOverlay.classList.add('hidden');
  appContainer.classList.remove('hidden');
}

function handleLogout() {
  if (isLoggedOut) return;
  isLoggedOut = true;
  adminFetch(`${API_BASE}/admin/logout`, { method: 'POST' }).catch(() => {});
  csrfToken = '';
  const loginUser = document.getElementById('login-username');
  const loginPass = document.getElementById('login-password');
  if (loginUser) loginUser.value = '';
  if (loginPass) loginPass.value = '';
  showLogin();
}

function showToast(message, type = 'success') {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'is-error' : type === 'warning' ? 'is-warning' : ''}`;
  toast.textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function requestConfirmation({ title = 'CONFIRM ACTION', message, confirmLabel = 'CONFIRM' }) {
  return new Promise((resolve) => {
    if (confirmationResolver) confirmationResolver(false);
    confirmationResolver = resolve;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('btn-confirm-accept').textContent = confirmLabel;
    document.getElementById('confirm-modal').classList.remove('hidden');
    document.getElementById('btn-confirm-cancel').focus();
  });
}

function closeConfirmation(result) {
  document.getElementById('confirm-modal').classList.add('hidden');
  if (confirmationResolver) confirmationResolver(result);
  confirmationResolver = null;
}

function requestSecurityInput({ title, description, fields }) {
  return new Promise((resolve) => {
    if (securityInputResolver) securityInputResolver(null);
    securityInputResolver = resolve;
    document.getElementById('security-input-title').textContent = title;
    document.getElementById('security-input-description').textContent = description;
    document.getElementById('security-input-message').textContent = '';
    const container = document.getElementById('security-input-fields');
    container.replaceChildren(...fields.map((field) => {
      const group = document.createElement('div');
      group.className = 'form-group';
      const label = document.createElement('label');
      label.setAttribute('for', `security-input-${field.id}`);
      label.textContent = field.label;
      const input = document.createElement('input');
      input.id = `security-input-${field.id}`;
      input.name = field.id;
      input.type = field.type || 'text';
      input.required = true;
      input.placeholder = field.placeholder || '';
      if (field.inputmode) input.inputMode = field.inputmode;
      if (field.autocomplete) input.autocomplete = field.autocomplete;
      group.append(label, input);
      return group;
    }));
    document.getElementById('security-input-modal').classList.remove('hidden');
    document.querySelector('#security-input-fields input')?.focus();
  });
}

function handleSecurityInputSubmit(event) {
  event.preventDefault();
  const values = Object.fromEntries([...event.target.querySelectorAll('input')].map((input) => [input.name, input.value]));
  closeSecurityInput(values);
}

function closeSecurityInput(result) {
  document.getElementById('security-input-modal').classList.add('hidden');
  if (securityInputResolver) securityInputResolver(result);
  securityInputResolver = null;
}

async function handleDashboardRefresh() {
  const buttons = [btnRefreshDashboard, document.getElementById('btn-overview-refresh')].filter(Boolean);
  buttons.forEach((button) => { button.disabled = true; });
  try {
    await loadAllData();
    showToast('Control plane refreshed.');
  } catch (error) {
    showToast(error.message || 'Unable to refresh the control plane.', 'error');
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

// --- LOAD ALL DATA ---
async function loadAllData() {
  await Promise.all([
    loadOverview(),
    loadProfile(),
    loadProjects(),
    loadSkills(),
    loadTestimonials(),
    loadMessages(),
  ]);
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatSecurityDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
};

const readResponse = async (responsePromise, fallbackMessage) => {
  const response = await responsePromise;
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || fallbackMessage);
  return data;
};

function setPosture(id, state, value, detail) {
  const row = document.getElementById(id);
  if (!row) return;
  row.classList.remove('is-secure', 'is-warning');
  if (state) row.classList.add(state === 'secure' ? 'is-secure' : 'is-warning');
  const detailEl = row.querySelector('small');
  const valueEl = row.querySelector('strong');
  if (detailEl) detailEl.textContent = detail;
  if (valueEl) valueEl.textContent = value;
}

function applySystemStatus(data) {
  const statusEl = document.getElementById('system-status');
  if (!statusEl) return;
  const durable = data.persistence === 'durable';
  statusEl.className = `system-status ${durable ? 'is-secure' : 'is-warning'}`;
  statusEl.textContent = durable
    ? '● DATABASE SYNCED — changes persist across restarts.'
    : `▲ MEMORY-ONLY MODE — ${data.warning || 'changes will be lost when the server restarts.'}`;
}

function renderOverviewActivity(events = []) {
  const container = document.getElementById('overview-activity-list');
  if (!container) return;
  if (events.length === 0) {
    container.innerHTML = '<p class="modal-sub">No security activity recorded yet.</p>';
    return;
  }
  container.innerHTML = events.slice(0, 5).map((event) => `
    <article class="overview-activity-item ${event.outcome === 'failure' ? 'is-failure' : ''}">
      <strong>${escapeHtml(String(event.event || 'event').replaceAll('_', ' ').toUpperCase())}</strong>
      <small>${escapeHtml(formatSecurityDate(event.createdAt))}<br>${escapeHtml(event.details || event.outcome || 'Recorded')}</small>
    </article>`).join('');
}

async function loadOverview() {
  const results = await Promise.allSettled([
    readResponse(adminFetch(`${API_BASE}/admin/status`), 'Storage status unavailable.'),
    readResponse(adminFetch(`${API_BASE}/admin/mfa/status`), 'MFA status unavailable.'),
    readResponse(adminFetch(`${API_BASE}/admin/security/sessions`), 'Session inventory unavailable.'),
    readResponse(adminFetch(`${API_BASE}/admin/security/audit?limit=5`), 'Audit trail unavailable.'),
    readResponse(fetch(`${API_BASE}/portfolio`, { credentials: 'include' }), 'Public API unavailable.'),
  ]);
  const [status, mfa, sessions, audit, portfolio] = results.map((result) => result.status === 'fulfilled' ? result.value : null);

  if (status) {
    applySystemStatus(status);
    document.getElementById('overview-persistence').textContent = status.persistence === 'durable' ? 'DURABLE' : 'MEMORY ONLY';
    document.getElementById('overview-persistence-detail').textContent = status.persistence === 'durable' ? 'MongoDB sync is active.' : 'Connect MongoDB before production edits.';
    setPosture('posture-persistence', status.persistence === 'durable' ? 'secure' : 'warning', status.persistence === 'durable' ? 'READY' : 'CHECK', status.persistence === 'durable' ? 'MongoDB is accepting durable changes.' : 'Changes may not survive a restart.');
  } else {
    document.getElementById('overview-persistence').textContent = 'UNKNOWN';
    document.getElementById('overview-persistence-detail').textContent = 'Storage status could not be read.';
    setPosture('posture-persistence', 'warning', 'CHECK', 'Storage status could not be read.');
  }

  if (portfolio) {
    document.getElementById('overview-frontend-sync').textContent = 'SYNCED';
    document.getElementById('overview-frontend-detail').textContent = 'Public portfolio data path is responding.';
    setPosture('posture-frontend', 'secure', 'LIVE', 'Frontend data path is responding.');
  } else {
    document.getElementById('overview-frontend-sync').textContent = 'DEGRADED';
    document.getElementById('overview-frontend-detail').textContent = 'Public API needs attention.';
    setPosture('posture-frontend', 'warning', 'CHECK', 'The public portfolio data path is unavailable.');
  }

  if (mfa) {
    const enabled = Boolean(mfa.enabled);
    document.getElementById('overview-mfa').textContent = enabled ? 'PROTECTED' : 'ACTION NEEDED';
    document.getElementById('overview-mfa-detail').textContent = enabled ? `${mfa.recoveryCodesRemaining} recovery code(s) remain.` : 'Enable authenticator MFA now.';
    setPosture('posture-mfa', enabled ? 'secure' : 'warning', enabled ? 'ACTIVE' : 'OPEN', enabled ? 'Authenticator verification is enabled.' : 'Admin account needs MFA enrollment.');
  }

  if (sessions) {
    document.getElementById('overview-sessions').textContent = String(sessions.sessions.length);
    document.getElementById('overview-sessions-detail').textContent = 'Signed-in devices currently visible.';
    setPosture('posture-sessions', 'secure', 'VISIBLE', `${sessions.sessions.length} active session(s) in inventory.`);
  }

  if (audit) {
    document.getElementById('overview-audit').textContent = String(audit.total);
    document.getElementById('overview-audit-detail').textContent = 'Recent events retained in the security trail.';
    renderOverviewActivity(audit.events);
  }
}

async function loadSecurityCenter() {
  await Promise.all([loadSecuritySessions(), loadSecurityAudit()]);
}

async function loadSecuritySessions() {
  const status = document.getElementById('security-session-status');
  const list = document.getElementById('security-sessions-list');
  if (!status || !list) return;
  status.textContent = 'Loading active sessions...';
  try {
    const res = await adminFetch(`${API_BASE}/admin/security/sessions`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to load active sessions.');
    status.textContent = `${data.sessions.length} active session(s)`;
    list.innerHTML = data.sessions.length
      ? data.sessions.map((session) => `
        <article class="security-item ${session.current ? 'current' : ''}">
          <div class="flex-between">
            <strong>${session.current ? '● CURRENT SESSION' : 'ACTIVE SESSION'}</strong>
            <button type="button" class="btn-danger-sm" data-revoke-session="${escapeHtml(session.id)}">REVOKE</button>
          </div>
          <div class="security-meta">
            <span><b>DEVICE</b> ${escapeHtml(session.userAgent)}</span>
            <span><b>IP</b> ${escapeHtml(session.ip)}</span>
            <span><b>LAST ACTIVE</b> ${escapeHtml(formatSecurityDate(session.lastActivityAt))}</span>
            <span><b>EXPIRES</b> ${escapeHtml(formatSecurityDate(session.expiresAt))}</span>
          </div>
        </article>`).join('')
      : '<p class="modal-sub">No active sessions found.</p>';
  } catch (error) {
    status.textContent = error.message;
    list.innerHTML = '';
  }
}

async function loadSecurityAudit() {
  const list = document.getElementById('security-audit-list');
  if (!list) return;
  const status = document.getElementById('security-audit-status');
  const eventFilter = document.getElementById('security-audit-event')?.value || '';
  const outcomeFilter = document.getElementById('security-audit-outcome')?.value || '';
  const params = new URLSearchParams({ page: securityAuditState.page, limit: securityAuditState.limit });
  if (eventFilter) params.set('event', eventFilter);
  if (outcomeFilter) params.set('outcome', outcomeFilter);
  try {
    const res = await adminFetch(`${API_BASE}/admin/security/audit?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to load the audit log.');
    securityAuditState.page = data.page;
    if (status) status.textContent = `${data.total} event(s) recorded`;
    document.getElementById('security-audit-page').textContent = `PAGE ${data.page} / ${data.totalPages}`;
    document.getElementById('btn-security-audit-prev').disabled = data.page <= 1;
    document.getElementById('btn-security-audit-next').disabled = data.page >= data.totalPages;
    list.innerHTML = data.events.length
      ? data.events.map((event) => `
        <article class="security-item audit-${escapeHtml(event.outcome)}">
          <div class="flex-between">
            <strong>${escapeHtml(event.event.replaceAll('_', ' ').toUpperCase())}</strong>
            <span class="security-date">${escapeHtml(formatSecurityDate(event.createdAt))}</span>
          </div>
          <div class="security-meta">
            <span><b>RESULT</b> ${escapeHtml(event.outcome)}</span>
            <span><b>IP</b> ${escapeHtml(event.ip || 'Unknown')}</span>
            ${event.details ? `<span><b>DETAILS</b> ${escapeHtml(event.details)}</span>` : ''}
          </div>
        </article>`).join('')
      : '<p class="modal-sub">No security events recorded yet.</p>';
  } catch (error) {
    if (status) status.textContent = '';
    list.innerHTML = `<p class="error-text">${escapeHtml(error.message)}</p>`;
  }
}

async function handleSessionAction(event) {
  const button = event.target.closest('[data-revoke-session]');
  if (!button || !await requestConfirmation({ title: 'REVOKE SESSION', message: 'This device will lose access immediately. Continue?', confirmLabel: 'REVOKE' })) return;
  button.disabled = true;
  try {
    const res = await adminFetch(`${API_BASE}/admin/security/sessions/${encodeURIComponent(button.dataset.revokeSession)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to revoke session.');
    if (data.current) {
      isLoggedOut = true;
      csrfToken = '';
      showLogin();
      return;
    }
    await loadSecurityCenter();
  } catch (error) {
    document.getElementById('security-session-status').textContent = error.message;
    button.disabled = false;
  }
}

async function revokeOtherSessions() {
  if (!await requestConfirmation({ title: 'REVOKE OTHER SESSIONS', message: 'Every other signed-in device will be logged out. Continue?', confirmLabel: 'REVOKE ALL OTHERS' })) return;
  const button = document.getElementById('btn-revoke-other-sessions');
  button.disabled = true;
  try {
    const res = await adminFetch(`${API_BASE}/admin/security/sessions/revoke-others`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to revoke other sessions.');
    await loadSecurityCenter();
  } catch (error) {
    document.getElementById('security-session-status').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function loadMfaStatus() {
  const statusText = document.getElementById('mfa-status-text');
  if (!statusText) return;
  try {
    const res = await adminFetch(`${API_BASE}/admin/mfa/status`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to load MFA status.');
    statusText.textContent = data.enabled
      ? `MFA is enabled. ${data.recoveryCodesRemaining} recovery code(s) remain.`
      : 'MFA is not enabled. Protect this admin account with an authenticator app.';
    document.getElementById('mfa-enabled-panel').classList.toggle('hidden', !data.enabled);
    document.getElementById('mfa-setup-panel').classList.toggle('hidden', data.enabled);
    document.getElementById('mfa-recovery-count').textContent = `${data.recoveryCodesRemaining} recovery code(s) remaining.`;
  } catch (error) {
    statusText.textContent = error.message;
  }
}

async function openMfaModal() {
  document.getElementById('mfa-modal').classList.remove('hidden');
  document.getElementById('mfa-backup-panel').classList.add('hidden');
  await loadMfaStatus();
}

async function startMfaSetup() {
  const setupPanel = document.getElementById('mfa-setup-panel');
  const statusText = document.getElementById('mfa-status-text');
  try {
    const res = await adminFetch(`${API_BASE}/admin/mfa/setup`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to start MFA setup.');
    document.getElementById('mfa-qr').src = data.qrCodeDataUrl;
    document.getElementById('mfa-manual-key').textContent = data.manualKey;
    document.getElementById('mfa-confirm-code').value = '';
    document.getElementById('mfa-confirm-msg').textContent = '';
    setupPanel.classList.remove('hidden');
    statusText.textContent = 'Scan the code, then confirm one authenticator code.';
  } catch (error) {
    statusText.textContent = error.message;
  }
}

async function handleMfaConfirm(event) {
  event.preventDefault();
  const msg = document.getElementById('mfa-confirm-msg');
  try {
    const res = await adminFetch(`${API_BASE}/admin/mfa/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: document.getElementById('mfa-confirm-code').value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'MFA confirmation failed.');
    showBackupCodes(data.backupCodes);
  } catch (error) {
    msg.textContent = error.message;
  }
}

function showBackupCodes(codes = []) {
  document.getElementById('mfa-setup-panel').classList.add('hidden');
  document.getElementById('mfa-enabled-panel').classList.add('hidden');
  document.getElementById('mfa-backup-panel').classList.remove('hidden');
  document.getElementById('mfa-backup-codes').textContent = codes.join('\n');
}

async function regenerateRecoveryCodes() {
  const values = await requestSecurityInput({
    title: 'REGENERATE RECOVERY CODES',
    description: 'Confirm this sensitive action with a current authenticator code. Existing recovery codes will be replaced.',
    fields: [{ id: 'code', label: 'AUTHENTICATOR CODE', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: '000000' }],
  });
  if (!values?.code) return;
  try {
    const res = await adminFetch(`${API_BASE}/admin/mfa/regenerate-backup-codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: values.code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to regenerate recovery codes.');
    showBackupCodes(data.backupCodes);
  } catch (error) {
    document.getElementById('mfa-enabled-msg').textContent = error.message;
  }
}

async function disableMfa() {
  const values = await requestSecurityInput({
    title: 'DISABLE MULTI-FACTOR AUTH',
    description: 'This removes a primary protection layer. Verify both your password and current authenticator code to continue.',
    fields: [
      { id: 'password', label: 'CURRENT ADMIN PASSWORD', type: 'password', autocomplete: 'current-password', placeholder: '••••••••' },
      { id: 'code', label: 'AUTHENTICATOR CODE', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: '000000' },
    ],
  });
  if (!values?.password || !values?.code) return;
  try {
    const res = await adminFetch(`${API_BASE}/admin/mfa/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: values.password, code: values.code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to disable MFA.');
    showToast(data.message || 'MFA disabled.', 'warning');
    handleLogout();
  } catch (error) {
    document.getElementById('mfa-enabled-msg').textContent = error.message;
  }
}

async function loadSystemStatus() {
  const statusEl = document.getElementById('system-status');
  try {
    const data = await readResponse(adminFetch(`${API_BASE}/admin/status`), 'Storage status unavailable.');
    applySystemStatus(data);
  } catch {
    statusEl.className = 'system-status is-warning';
    statusEl.textContent = '▲ STORAGE STATUS UNKNOWN — verify MongoDB before saving changes.';
  }
}

// --- PROFILE ---
async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/portfolio`);
    const data = await res.json();
    if (data && data.profile) {
      const p = data.profile;
      document.getElementById('prof-eyebrow').value = p.eyebrow || '';
      document.getElementById('prof-title1').value = p.title1 || '';
      document.getElementById('prof-titleAccent').value = p.titleAccent || '';
      document.getElementById('prof-title2').value = p.title2 || '';
      document.getElementById('prof-subtext').value = p.subtext || '';
      document.getElementById('prof-projectsShipped').value = p.projectsShipped || '';
      document.getElementById('prof-yearsCoding').value = p.yearsCoding || '';
      document.getElementById('prof-clientsServed').value = p.clientsServed || '';
      document.getElementById('prof-status').value = p.status || '';
      document.getElementById('prof-statusDetail').value = p.statusDetail || '';
      document.getElementById('prof-email').value = p.email || '';
      document.getElementById('prof-pgpKey').value = p.pgpKey || '';
      document.getElementById('prof-linkedin').value = p.linkedin || '';
      document.getElementById('prof-leetcode').value = p.leetcode || '';
      document.getElementById('prof-twitter').value = p.twitter || '';
    }
  } catch (err) {
    console.error('Failed to load profile', err);
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  const msgEl = document.getElementById('profile-save-msg');
  msgEl.textContent = 'Saving...';

  const body = {
    eyebrow: document.getElementById('prof-eyebrow').value,
    title1: document.getElementById('prof-title1').value,
    titleAccent: document.getElementById('prof-titleAccent').value,
    title2: document.getElementById('prof-title2').value,
    subtext: document.getElementById('prof-subtext').value,
    projectsShipped: document.getElementById('prof-projectsShipped').value,
    yearsCoding: document.getElementById('prof-yearsCoding').value,
    clientsServed: document.getElementById('prof-clientsServed').value,
    status: document.getElementById('prof-status').value,
    statusDetail: document.getElementById('prof-statusDetail').value,
    email: document.getElementById('prof-email').value,
    pgpKey: document.getElementById('prof-pgpKey').value,
    linkedin: document.getElementById('prof-linkedin').value,
    leetcode: document.getElementById('prof-leetcode').value,
    twitter: document.getElementById('prof-twitter').value,
  };

  try {
    const res = await adminFetch(`${API_BASE}/admin/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      msgEl.textContent = '✓ Profile updated successfully!';
      showToast('Hero profile synced to the public portfolio.');
      setTimeout(() => (msgEl.textContent = ''), 4000);
    } else {
      msgEl.textContent = '✕ Error saving profile';
    }
  } catch {
    msgEl.textContent = '✕ Server error';
  }
}

// --- PROJECTS ---
let currentProjects = [];
async function loadProjects() {
  try {
    const res = await adminFetch(`${API_BASE}/admin/projects`);
    currentProjects = await res.json();
    renderProjects();
  } catch (err) {
    console.error('Failed to load projects', err);
  }
}

function createItemCard({ tag, title, description, onEdit, onDelete }) {
  const card = document.createElement('div');
  card.className = 'item-card';

  const content = document.createElement('div');
  const tagEl = document.createElement('div');
  tagEl.className = 'item-tag';
  tagEl.textContent = tag;
  const titleEl = document.createElement('div');
  titleEl.className = 'item-title';
  titleEl.textContent = title;
  const descriptionEl = document.createElement('div');
  descriptionEl.className = 'item-desc';
  descriptionEl.textContent = description;
  content.append(tagEl, titleEl, descriptionEl);

  const actions = document.createElement('div');
  actions.className = 'item-actions';
  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'btn-ghost-sm';
  editButton.textContent = 'EDIT';
  editButton.addEventListener('click', onEdit);
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'btn-danger-sm';
  deleteButton.textContent = 'DELETE';
  deleteButton.addEventListener('click', onDelete);
  actions.append(editButton, deleteButton);

  card.append(content, actions);
  return card;
}

function renderProjects() {
  const container = document.getElementById('projects-list');
  container.replaceChildren(...currentProjects.map((p) => createItemCard({
    tag: `${p.tag || ''}${p.featured ? ' ★ FEATURED' : ''}`,
    title: `${p.title || 'Untitled project'} (${p.year || '—'})`,
    description: p.description || '',
    onEdit: () => openProjectModal(p),
    onDelete: () => deleteProject(p._id),
  })));
}

function openProjectModal(project = null) {
  document.getElementById('project-modal-title').textContent = project ? 'EDIT PROJECT' : 'NEW PROJECT';
  document.getElementById('proj-id').value = project ? project._id : '';
  document.getElementById('proj-title').value = project ? project.title : '';
  document.getElementById('proj-tag').value = project ? project.tag : '';
  document.getElementById('proj-desc').value = project ? project.description : '';
  document.getElementById('proj-year').value = project ? project.year : '2026';
  document.getElementById('proj-link').value = project ? project.link || '' : '';
  document.getElementById('proj-iconText').value = project ? project.iconText || '' : '';
  document.getElementById('proj-featured').checked = project ? project.featured : false;

  document.getElementById('project-modal').classList.remove('hidden');
}

function editProject(id) {
  const p = currentProjects.find((x) => String(x._id) === String(id));
  if (p) {
    openProjectModal(p);
  } else {
    console.error('Project not found for id:', id, 'Available:', currentProjects.map(x => x._id));
    showToast('Could not find project to edit. Refresh the control plane and try again.', 'error');
  }
}

async function deleteProject(id) {
  if (!await requestConfirmation({ title: 'DELETE PROJECT', message: 'This project will be removed from the public portfolio. Continue?', confirmLabel: 'DELETE PROJECT' })) return;
  try {
    const res = await adminFetch(`${API_BASE}/admin/projects/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      loadProjects();
      showToast('Project removed from the public dossier.');
    } else {
      showToast('Failed to delete project.', 'error');
    }
  } catch (err) {
    showToast('Failed to delete project.', 'error');
  }
}

async function handleSaveProject(e) {
  e.preventDefault();
  const id = document.getElementById('proj-id').value;
  const body = {
    title: document.getElementById('proj-title').value,
    tag: document.getElementById('proj-tag').value,
    description: document.getElementById('proj-desc').value,
    year: document.getElementById('proj-year').value,
    link: document.getElementById('proj-link').value,
    iconText: document.getElementById('proj-iconText').value,
    featured: document.getElementById('proj-featured').checked,
  };

  const url = id ? `${API_BASE}/admin/projects/${id}` : `${API_BASE}/admin/projects`;
  const method = id ? 'PUT' : 'POST';

  // Show saving indicator
  const saveBtn = e.target.querySelector('button[type="submit"]');
  const origText = saveBtn.textContent;
  saveBtn.textContent = 'SAVING...';
  saveBtn.disabled = true;

  try {
    const res = await adminFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      document.getElementById('project-modal').classList.add('hidden');
      loadProjects();
      showToast(id ? 'Project dossier updated.' : 'Project dossier created.');
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(`Failed to save project: ${data.message || res.statusText || 'Server error'}`, 'error');
    }
  } catch (err) {
    showToast(`Error saving project: ${err.message}`, 'error');
  } finally {
    saveBtn.textContent = origText;
    saveBtn.disabled = false;
  }
}

// --- SKILLS ---
let currentSkills = [];
async function loadSkills() {
  try {
    const res = await adminFetch(`${API_BASE}/admin/skills`);
    currentSkills = await res.json();
    renderSkills();
  } catch (err) {
    console.error('Failed to load skills', err);
  }
}

function renderSkills() {
  const container = document.getElementById('skills-list');
  container.replaceChildren(...currentSkills.map((s) => createItemCard({
    tag: `RANK: ${'★'.repeat(Number(s.pips) || 0)} (${s.pips}/5)`,
    title: s.name || 'Untitled skill',
    description: s.desc || '',
    onEdit: () => openSkillModal(s),
    onDelete: () => deleteSkill(s._id),
  })));
}

function openSkillModal(skill = null) {
  document.getElementById('skill-modal-title').textContent = skill ? 'EDIT SKILL' : 'NEW SKILL';
  document.getElementById('skill-id').value = skill ? skill._id : '';
  document.getElementById('skill-name').value = skill ? skill.name : '';
  document.getElementById('skill-pips').value = skill ? skill.pips : 5;
  document.getElementById('skill-desc').value = skill ? skill.desc : '';

  document.getElementById('skill-modal').classList.remove('hidden');
}

function editSkill(id) {
  const s = currentSkills.find((x) => String(x._id) === String(id));
  if (s) {
    openSkillModal(s);
  } else {
    console.error('Skill not found for id:', id, 'Available:', currentSkills.map(x => x._id));
    showToast('Could not find skill to edit. Refresh the control plane and try again.', 'error');
  }
}

async function deleteSkill(id) {
  if (!await requestConfirmation({ title: 'DELETE SKILL', message: 'This capability will be removed from the public skills arsenal. Continue?', confirmLabel: 'DELETE SKILL' })) return;
  try {
    await adminFetch(`${API_BASE}/admin/skills/${id}`, {
      method: 'DELETE',
    });
    loadSkills();
    showToast('Skill removed from the public arsenal.');
  } catch (err) {
    showToast('Failed to delete skill.', 'error');
  }
}

async function handleSaveSkill(e) {
  e.preventDefault();
  const id = document.getElementById('skill-id').value;
  const body = {
    name: document.getElementById('skill-name').value,
    pips: Number(document.getElementById('skill-pips').value),
    desc: document.getElementById('skill-desc').value,
  };

  const url = id ? `${API_BASE}/admin/skills/${id}` : `${API_BASE}/admin/skills`;
  const method = id ? 'PUT' : 'POST';

  const saveBtn = e.target.querySelector('button[type="submit"]');
  const origText = saveBtn.textContent;
  saveBtn.textContent = 'SAVING...';
  saveBtn.disabled = true;

  try {
    const res = await adminFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      document.getElementById('skill-modal').classList.add('hidden');
      loadSkills();
      showToast(id ? 'Skill updated.' : 'Skill added to the arsenal.');
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(`Failed to save skill: ${data.message || res.statusText || 'Server error'}`, 'error');
    }
  } catch (err) {
    showToast(`Error saving skill: ${err.message}`, 'error');
  } finally {
    saveBtn.textContent = origText;
    saveBtn.disabled = false;
  }
}

// --- TESTIMONIALS / FOCUS AREAS ---
let currentTestimonials = [];
async function loadTestimonials() {
  try {
    const res = await adminFetch(`${API_BASE}/admin/focus-areas`);
    currentTestimonials = await res.json();
    renderTestimonials();
  } catch (err) {
    console.error('Failed to load focus areas', err);
  }
}

function renderTestimonials() {
  const container = document.getElementById('testimonials-list');
  container.replaceChildren(...currentTestimonials.map((t) => createItemCard({
    tag: t.tag || 'FOCUS DOMAIN',
    title: t.title || 'Untitled focus area',
    description: t.desc || '',
    onEdit: () => openTestimonialModal(t),
    onDelete: () => deleteTestimonial(t._id),
  })));
}

function openTestimonialModal(focusArea = null) {
  document.getElementById('testimonial-modal-title').textContent = focusArea ? 'EDIT FOCUS AREA' : 'NEW FOCUS AREA';
  document.getElementById('test-id').value = focusArea ? focusArea._id : '';
  document.getElementById('test-role').value = focusArea ? focusArea.tag : '';
  document.getElementById('test-name').value = focusArea ? focusArea.title : '';
  document.getElementById('test-quote').value = focusArea ? focusArea.desc : '';

  document.getElementById('testimonial-modal').classList.remove('hidden');
}

function editTestimonial(id) {
  const t = currentTestimonials.find((x) => String(x._id) === String(id));
  if (t) {
    openTestimonialModal(t);
  } else {
    console.error('Focus area not found for id:', id, 'Available:', currentTestimonials.map(x => x._id));
    showToast('Could not find focus area to edit. Refresh the control plane and try again.', 'error');
  }
}

async function deleteTestimonial(id) {
  if (!await requestConfirmation({ title: 'DELETE FOCUS DOMAIN', message: 'This focus domain will be removed from the public portfolio. Continue?', confirmLabel: 'DELETE DOMAIN' })) return;
  try {
    await adminFetch(`${API_BASE}/admin/focus-areas/${id}`, {
      method: 'DELETE',
    });
    loadTestimonials();
    showToast('Focus domain removed.');
  } catch (err) {
    showToast('Failed to delete focus area.', 'error');
  }
}

async function handleSaveTestimonial(e) {
  e.preventDefault();
  const id = document.getElementById('test-id').value;
  const body = {
    tag: document.getElementById('test-role').value,
    title: document.getElementById('test-name').value,
    desc: document.getElementById('test-quote').value,
  };

  const url = id ? `${API_BASE}/admin/focus-areas/${id}` : `${API_BASE}/admin/focus-areas`;
  const method = id ? 'PUT' : 'POST';

  const saveBtn = e.target.querySelector('button[type="submit"]');
  const origText = saveBtn.textContent;
  saveBtn.textContent = 'SAVING...';
  saveBtn.disabled = true;

  try {
    const res = await adminFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      document.getElementById('testimonial-modal').classList.add('hidden');
      loadTestimonials();
      showToast(id ? 'Focus domain updated.' : 'Focus domain created.');
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(`Failed to save focus area: ${data.message || res.statusText || 'Server error'}`, 'error');
    }
  } catch (err) {
    showToast(`Error saving focus area: ${err.message}`, 'error');
  } finally {
    saveBtn.textContent = origText;
    saveBtn.disabled = false;
  }
}

// --- MESSAGES INBOX ---
async function loadMessages() {
  try {
    const res = await adminFetch(`${API_BASE}/admin/messages`);
    const messages = await res.json();
    document.getElementById('msg-badge').textContent = messages.length;

    const container = document.getElementById('messages-list');
    if (!Array.isArray(messages) || messages.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'item-desc';
      empty.textContent = 'No transmissions received yet.';
      container.replaceChildren(empty);
      return;
    }

    const cards = messages.map((m) => {
      const card = document.createElement('div');
      card.className = 'msg-card';
      const meta = document.createElement('div');
      meta.className = 'msg-meta';
      const author = document.createElement('span');
      author.className = 'msg-author';
      author.textContent = `${m.name || 'Unknown sender'} (${m.email || 'no email'})`;
      const date = document.createElement('span');
      date.className = 'msg-date';
      date.textContent = new Date(m.createdAt).toLocaleString();
      meta.append(author, date);
      const subject = document.createElement('div');
      subject.className = 'msg-subject';
      subject.textContent = `SUBJECT: ${m.subject || 'Portfolio Contact'}`;
      const body = document.createElement('div');
      body.className = 'msg-body';
      body.textContent = m.message || '';
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'btn-danger-sm';
      deleteButton.textContent = 'DELETE TRANSMISSION';
      deleteButton.addEventListener('click', () => deleteMessage(m._id));
      actions.append(deleteButton);
      card.append(meta, subject, body, actions);
      return card;
    });
    container.replaceChildren(...cards);
  } catch (err) {
    console.error('Failed to load messages', err);
  }
}

async function deleteMessage(id) {
  if (!await requestConfirmation({ title: 'DELETE TRANSMISSION', message: 'This visitor message will be permanently removed. Continue?', confirmLabel: 'DELETE MESSAGE' })) return;
  try {
    await adminFetch(`${API_BASE}/admin/messages/${id}`, {
      method: 'DELETE',
    });
    loadMessages();
    showToast('Transmission deleted.');
  } catch (err) {
    showToast('Failed to delete message.', 'error');
  }
}
