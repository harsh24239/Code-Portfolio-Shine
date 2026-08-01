const API_BASE = '/api';
let authToken = localStorage.getItem('shadow_admin_token') || '';

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');
const btnChangePassTrigger = document.getElementById('btn-change-pass-trigger');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    verifyAuth();
  } else {
    showLogin();
  }
  setupEventListeners();
});

function setupEventListeners() {
  loginForm.addEventListener('submit', handleLogin);
  btnLogout.addEventListener('click', handleLogout);

  btnChangePassTrigger?.addEventListener('click', () => {
    document.getElementById('pass-current').value = '';
    document.getElementById('pass-new').value = '';
    document.getElementById('pass-msg').textContent = '';
    document.getElementById('password-modal').classList.remove('hidden');
  });

  document.getElementById('password-form')?.addEventListener('submit', handleChangePassword);

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = `tab-${btn.dataset.tab}`;
      document.getElementById(tabId)?.classList.add('active');
    });
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

// --- AUTHENTICATION ---
async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      authToken = data.token;
      localStorage.setItem('shadow_admin_token', authToken);
      showApp();
      loadAllData();
    } else {
      loginError.textContent = data.message || 'Invalid login credentials.';
    }
  } catch {
    loginError.textContent = 'Server connection failed or rate limit reached.';
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
    const res = await fetch(`${API_BASE}/admin/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      msgEl.className = 'success-text';
      msgEl.textContent = '✓ Password updated successfully!';
      setTimeout(() => {
        document.getElementById('password-modal').classList.add('hidden');
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
    const res = await fetch(`${API_BASE}/admin/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (res.ok) {
      showApp();
      loadAllData();
    } else {
      handleLogout();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  loginOverlay.classList.remove('hidden');
  appContainer.classList.add('hidden');
}

function showApp() {
  loginOverlay.classList.add('hidden');
  appContainer.classList.remove('hidden');
}

function handleLogout() {
  authToken = '';
  localStorage.removeItem('shadow_admin_token');
  showLogin();
}

// --- LOAD ALL DATA ---
async function loadAllData() {
  loadProfile();
  loadProjects();
  loadSkills();
  loadTestimonials();
  loadMessages();
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
    const res = await fetch(`${API_BASE}/admin/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      msgEl.textContent = '✓ Profile updated successfully!';
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
    const res = await fetch(`${API_BASE}/admin/projects`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    currentProjects = await res.json();
    renderProjects();
  } catch (err) {
    console.error('Failed to load projects', err);
  }
}

function renderProjects() {
  const container = document.getElementById('projects-list');
  container.innerHTML = currentProjects
    .map(
      (p) => `
    <div class="item-card">
      <div>
        <div class="item-tag">${p.tag} ${p.featured ? '★ FEATURED' : ''}</div>
        <div class="item-title">${p.title} (${p.year})</div>
        <div class="item-desc">${p.description}</div>
      </div>
      <div class="item-actions">
        <button class="btn-ghost-sm" onclick="editProject('${p._id}')">EDIT</button>
        <button class="btn-danger-sm" onclick="deleteProject('${p._id}')">DELETE</button>
      </div>
    </div>
  `
    )
    .join('');
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

window.editProject = (id) => {
  const p = currentProjects.find((x) => x._id === id);
  if (p) openProjectModal(p);
};

window.deleteProject = async (id) => {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    await fetch(`${API_BASE}/admin/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    loadProjects();
  } catch (err) {
    alert('Failed to delete project');
  }
};

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

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      document.getElementById('project-modal').classList.add('hidden');
      loadProjects();
    }
  } catch (err) {
    alert('Error saving project');
  }
}

// --- SKILLS ---
let currentSkills = [];
async function loadSkills() {
  try {
    const res = await fetch(`${API_BASE}/admin/skills`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    currentSkills = await res.json();
    renderSkills();
  } catch (err) {
    console.error('Failed to load skills', err);
  }
}

function renderSkills() {
  const container = document.getElementById('skills-list');
  container.innerHTML = currentSkills
    .map(
      (s) => `
    <div class="item-card">
      <div>
        <div class="item-tag">RANK: ${'★'.repeat(s.pips)} (${s.pips}/5)</div>
        <div class="item-title">${s.name}</div>
        <div class="item-desc">${s.desc}</div>
      </div>
      <div class="item-actions">
        <button class="btn-ghost-sm" onclick="editSkill('${s._id}')">EDIT</button>
        <button class="btn-danger-sm" onclick="deleteSkill('${s._id}')">DELETE</button>
      </div>
    </div>
  `
    )
    .join('');
}

function openSkillModal(skill = null) {
  document.getElementById('skill-modal-title').textContent = skill ? 'EDIT SKILL' : 'NEW SKILL';
  document.getElementById('skill-id').value = skill ? skill._id : '';
  document.getElementById('skill-name').value = skill ? skill.name : '';
  document.getElementById('skill-pips').value = skill ? skill.pips : 5;
  document.getElementById('skill-desc').value = skill ? skill.desc : '';

  document.getElementById('skill-modal').classList.remove('hidden');
}

window.editSkill = (id) => {
  const s = currentSkills.find((x) => x._id === id);
  if (s) openSkillModal(s);
};

window.deleteSkill = async (id) => {
  if (!confirm('Are you sure you want to delete this skill?')) return;
  try {
    await fetch(`${API_BASE}/admin/skills/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    loadSkills();
  } catch (err) {
    alert('Failed to delete skill');
  }
};

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

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      document.getElementById('skill-modal').classList.add('hidden');
      loadSkills();
    }
  } catch (err) {
    alert('Error saving skill');
  }
}

// --- TESTIMONIALS / FOCUS AREAS ---
let currentTestimonials = [];
async function loadTestimonials() {
  try {
    const res = await fetch(`${API_BASE}/admin/focus-areas`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    currentTestimonials = await res.json();
    renderTestimonials();
  } catch (err) {
    console.error('Failed to load focus areas', err);
  }
}

function renderTestimonials() {
  const container = document.getElementById('testimonials-list');
  container.innerHTML = currentTestimonials
    .map(
      (t) => `
    <div class="item-card">
      <div>
        <div class="item-tag">${t.tag}</div>
        <div class="item-title">${t.title}</div>
        <div class="item-desc">${t.desc}</div>
      </div>
      <div class="item-actions">
        <button class="btn-ghost-sm" onclick="editTestimonial('${t._id}')">EDIT</button>
        <button class="btn-danger-sm" onclick="deleteTestimonial('${t._id}')">DELETE</button>
      </div>
    </div>
  `
    )
    .join('');
}

function openTestimonialModal(focusArea = null) {
  document.getElementById('testimonial-modal-title').textContent = focusArea ? 'EDIT FOCUS AREA' : 'NEW FOCUS AREA';
  document.getElementById('test-id').value = focusArea ? focusArea._id : '';
  document.getElementById('test-role').value = focusArea ? focusArea.tag : '';
  document.getElementById('test-name').value = focusArea ? focusArea.title : '';
  document.getElementById('test-quote').value = focusArea ? focusArea.desc : '';

  document.getElementById('testimonial-modal').classList.remove('hidden');
}

window.editTestimonial = (id) => {
  const t = currentTestimonials.find((x) => x._id === id);
  if (t) openTestimonialModal(t);
};

window.deleteTestimonial = async (id) => {
  if (!confirm('Are you sure you want to delete this focus domain?')) return;
  try {
    await fetch(`${API_BASE}/admin/focus-areas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    loadTestimonials();
  } catch (err) {
    alert('Failed to delete focus area');
  }
};

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

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      document.getElementById('testimonial-modal').classList.add('hidden');
      loadTestimonials();
    }
  } catch (err) {
    alert('Error saving focus area');
  }
}

// --- MESSAGES INBOX ---
async function loadMessages() {
  try {
    const res = await fetch(`${API_BASE}/admin/messages`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const messages = await res.json();
    document.getElementById('msg-badge').textContent = messages.length;

    const container = document.getElementById('messages-list');
    if (!Array.isArray(messages) || messages.length === 0) {
      container.innerHTML = `<div class="item-desc">No transmissions received yet.</div>`;
      return;
    }

    container.innerHTML = messages
      .map(
        (m) => `
      <div class="msg-card">
        <div class="msg-meta">
          <span class="msg-author">${m.name} (${m.email})</span>
          <span class="msg-date">${new Date(m.createdAt).toLocaleString()}</span>
        </div>
        <div class="msg-subject">SUBJECT: ${m.subject}</div>
        <div class="msg-body">${m.message}</div>
        <div style="margin-top: 0.75rem;">
          <button class="btn-danger-sm" onclick="deleteMessage('${m._id}')">DELETE TRANSMISSION</button>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load messages', err);
  }
}

window.deleteMessage = async (id) => {
  if (!confirm('Delete this transmission?')) return;
  try {
    await fetch(`${API_BASE}/admin/messages/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    loadMessages();
  } catch (err) {
    alert('Failed to delete message');
  }
};
