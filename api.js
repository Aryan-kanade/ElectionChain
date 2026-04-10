/**
 * ElectionChain API Client
 * ========================
 * Replaces localStorage with real backend calls.
 * Include this BEFORE demo.html's main script block.
 *
 * Usage: <script src="api.js"></script>
 */

const API_BASE = 'http://localhost:4000/api';

// ── TOKEN MANAGEMENT ─────────────────────────────────────────────
const Auth = {
  getToken()          { return localStorage.getItem('ec_token'); },
  setToken(t)         { localStorage.setItem('ec_token', t); },
  clearToken()        { localStorage.removeItem('ec_token'); localStorage.removeItem('ec_user'); },
  getUser()           { try { return JSON.parse(localStorage.getItem('ec_user')); } catch { return null; } },
  setUser(u)          { localStorage.setItem('ec_user', JSON.stringify(u)); },
  authHeaders()       { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.getToken()}` }; },
};

// ── CORE FETCH WRAPPER ────────────────────────────────────────────
async function apiCall(method, endpoint, body = null, useAuth = false) {
  const headers = useAuth ? Auth.authHeaders() : { 'Content-Type': 'application/json' };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res  = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (e) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Cannot reach server. Make sure backend is running: node server.js');
    }
    throw e;
  }
}

// ── API METHODS ───────────────────────────────────────────────────
const API = {

  // Fix 2: Real OTP
  async sendOTP(email) {
    return apiCall('POST', '/auth/send-otp', { email });
  },

  async verifyOTP(email, otp) {
    return apiCall('POST', '/auth/verify-otp', { email, otp });
  },

  // Fix 3: Register with backend DB
  async register(address, name, email, faceDescriptor, photoUrl) {
    return apiCall('POST', '/auth/register', { address, name, email, faceDescriptor, photoUrl });
  },

  // Login
  async login(address, role) {
    const data = await apiCall('POST', '/auth/login', { address, role });
    if (data.token) { Auth.setToken(data.token); Auth.setUser(data.user); }
    return data;
  },

  // Fix 4: Face verify on server
  async verifyFace(currentDescriptor, scanScores) {
    return apiCall('POST', '/auth/verify-face', { currentDescriptor, scanScores }, true);
  },

  // Fix 1 + Fix 4: Vote on backend/blockchain
  async castVote(candidateId, faceToken) {
    return apiCall('POST', '/vote', { candidateId, faceToken }, true);
  },

  // Candidates
  async getCandidates()             { return apiCall('GET', '/candidates', null, false); },
  async addCandidate(name, party)   { return apiCall('POST', '/candidates', { name, party }, true); },

  // Election
  async getElectionStatus()         { return apiCall('GET', '/election/status'); },
  async setElectionTimes(s, e)      { return apiCall('POST', '/election/set-times', { startTime: s, endTime: e }, true); },

  // Fix 7: Multi-admin results
  async proposeResults()            { return apiCall('POST', '/admin/propose-results', {}, true); },
  async getResultProposalStatus()   { return apiCall('GET', '/admin/result-proposal-status', null, true); },

  // Audit
  async getAuditLog()               { return apiCall('GET', '/audit', null, true); },
  async getAdminLogs()              { return apiCall('GET', '/admin/logs', null, true); },

  // Health
  async health()                    { return apiCall('GET', '/health'); },
};

// ── BACKEND STATUS BANNER ─────────────────────────────────────────
async function checkBackendConnection() {
  try {
    const h = await API.health();
    console.log('✅ Backend connected:', h);
    window._backendConnected = true;
    window._blockchainConnected = h.blockchain;

    // Show backend badge in UI if it exists
    const badge = document.getElementById('backendBadge');
    if (badge) {
      badge.textContent = h.blockchain ? '⛓ Blockchain Connected' : '🖥 Backend Connected';
      badge.style.display = 'flex';
      badge.style.background = h.blockchain ? '#dcfce7' : '#dbeafe';
      badge.style.color = h.blockchain ? '#15803d' : '#1d4ed8';
    }
  } catch (e) {
    console.warn('⚠️ Backend not reachable — running in localStorage fallback mode');
    window._backendConnected = false;
    window._blockchainConnected = false;
    const badge = document.getElementById('backendBadge');
    if (badge) {
      badge.textContent = '⚠️ Offline Mode (localStorage)';
      badge.style.display = 'flex';
      badge.style.background = '#fef3c7';
      badge.style.color = '#b45309';
    }
  }
}

// Run on load
document.addEventListener('DOMContentLoaded', checkBackendConnection);

// Expose globally
window.API  = API;
window.Auth = Auth;
