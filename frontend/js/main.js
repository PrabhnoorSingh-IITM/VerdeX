// ==============================
// CAMPUSONE - Global JS
// ==============================

// --- Toast Notification ---
function showToast(message, type = 'default', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', default: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]||icons.default}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// --- Sidebar Toggle ---
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const hamburger = document.querySelector('.hamburger');
  if (!sidebar) return;
  const toggle = () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  };
  if (hamburger) hamburger.addEventListener('click', toggle);
  if (overlay) overlay.addEventListener('click', toggle);
}

// --- Modal ---
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}
// Close on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// --- Active Nav ---
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = (item.getAttribute('href') || '').split('/').pop();
    if (href === path) item.classList.add('active');
  });
}

// --- Counter Animation ---
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();
    const update = now => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(ease * target);
      el.textContent = (target % 1 !== 0 ? (ease * target).toFixed(1) : value) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

// --- Scroll Reveal ---
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- Points System ---
const PointsManager = {
  getPoints() { return parseInt(localStorage.getItem('campusPoints') || '120'); },
  addPoints(n, reason) {
    const current = this.getPoints();
    const newTotal = current + n;
    localStorage.setItem('campusPoints', newTotal);
    showToast(`+${n} points earned! ${reason}`, 'success');
    this.updateDisplay();
    return newTotal;
  },
  updateDisplay() {
    const pts = this.getPoints();
    document.querySelectorAll('.points-display').forEach(el => {
      el.textContent = pts.toLocaleString();
    });
  }
};

// --- Cart Manager ---
const CartManager = {
  getCart() { return JSON.parse(localStorage.getItem('campusCart') || '[]'); },
  saveCart(cart) { localStorage.setItem('campusCart', JSON.stringify(cart)); },
  addItem(item) {
    const cart = this.getCart();
    const existing = cart.find(i => i.id === item.id);
    if (existing) { existing.qty++; }
    else { cart.push({ ...item, qty: 1 }); }
    this.saveCart(cart);
    this.updateBadge();
    showToast(`${item.name} added to cart`, 'success');
  },
  removeItem(id) {
    let cart = this.getCart().filter(i => i.id !== id);
    this.saveCart(cart);
    this.updateBadge();
  },
  getTotal() {
    return this.getCart().reduce((s, i) => s + (i.price * i.qty), 0);
  },
  getCount() {
    return this.getCart().reduce((s, i) => s + i.qty, 0);
  },
  updateBadge() {
    document.querySelectorAll('.cart-badge').forEach(el => {
      const count = this.getCount();
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },
  clear() { localStorage.removeItem('campusCart'); this.updateBadge(); }
};

// --- Student Data (Dynamic from Firestore Session Storage API) ---
const cachedData = sessionStorage.getItem('verdeUserProfile');
const defaultFallback = {
  name: "Loading...",
  rollNo: "...",
  branch: "...",
  semester: "...",
  role: "student",
  avatar: "...",
  attendance: { overall: 0, subjects: [] },
  fees: { total: 0, paid: 0, due: 0, transactions: [] },
  timetable: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] }
};
window.StudentData = cachedData ? JSON.parse(cachedData) : defaultFallback;

// Bind to variable so we don't break existing files that reference 'StudentData'
const StudentData = window.StudentData;

// --- Topbar Info Updater ---
window.updateTopbarInfo = function() {
  const nameEl = document.querySelector('.user-name-display');
  if (nameEl) nameEl.textContent = window.StudentData.name;
  PointsManager.updateDisplay();
  CartManager.updateBadge();
  // Set sidebar user info
  document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = window.StudentData.name);
  document.querySelectorAll('.sidebar-user-role').forEach(el => el.textContent = window.StudentData.rollNo);
  document.querySelectorAll('.sidebar-user-avatar').forEach(el => el.textContent = window.StudentData.avatar);
}

// --- Dynamic Sidebar Generation ---
function generateSidebarNav() {
  const navEl = document.querySelector('.sidebar-nav');
  if (!navEl) return;
  
  const role = window.StudentData ? window.StudentData.role : 'student';
  let linksHTML = '<div class="nav-section-label">Main</div>';
  
  const buildLink = (href, icon, label, extra='') => 
    `<a href="${href}" class="nav-item"><span class="nav-icon">${icon}</span> ${label} ${extra}</a>`;

  if (role === 'student') {
    linksHTML += buildLink('dashboard.html', '🏠', 'Dashboard');
    linksHTML += buildLink('canteen.html', '🍽️', 'Canteen', '<span class="nav-badge cart-badge" style="display:none">0</span>');
    linksHTML += buildLink('attendance.html', '📊', 'Attendance');
    linksHTML += buildLink('fees.html', '💰', 'Fees & Payments');
    linksHTML += '<div class="nav-section-label" style="margin-top:12px">Schedule</div>';
    linksHTML += buildLink('timetable.html', '🕐', 'Timetable');
    linksHTML += buildLink('calendar.html', '📅', 'Calendar');
    linksHTML += '<div class="nav-section-label" style="margin-top:12px">Governance</div>';
    linksHTML += buildLink('report-issue.html', '🚨', 'Report Issue', '<span class="nav-badge" style="background:#F59E0B">Points</span>');
  } 
  else if (role === 'faculty' || role === 'teacher') {
    linksHTML += buildLink('dashboard.html', '🏠', 'Dashboard');
    linksHTML += buildLink('attendance.html', '👨‍🏫', 'Attendance Portal');
    linksHTML += '<div class="nav-section-label" style="margin-top:12px">Governance</div>';
    linksHTML += buildLink('report-issue.html', '🚨', 'Report Issue');
  }
  else if (role === 'staff' || role === 'maintenance') {
    linksHTML += buildLink('dashboard.html', '🏠', 'Dashboard');
    linksHTML += '<div class="nav-section-label" style="margin-top:12px">Operations</div>';
    linksHTML += buildLink('report-issue.html', '🛠️', 'Assigned Tasks', '<span class="nav-badge" style="background:var(--danger)">High</span>');
  }
  else if (role === 'canteen') {
    linksHTML += buildLink('dashboard.html', '🏪', 'POS Dashboard');
    linksHTML += buildLink('canteen.html', '🍔', 'Live KDS Feed');
  }
  else if (role === 'admin') {
    linksHTML += buildLink('dashboard.html', '👑', 'Command Center');
    linksHTML += buildLink('report-issue.html', '🚨', 'System Alerts');
  }

  navEl.innerHTML = linksHTML;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  generateSidebarNav();
  initSidebar();
  setActiveNav();
  initScrollReveal();
  window.updateTopbarInfo();
});
