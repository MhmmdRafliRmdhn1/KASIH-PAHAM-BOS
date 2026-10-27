/**
 * TransformaUMKM Dev Inspector & Insights Overlay
 * Mirrored after Next.js / Turbopack Dev Overlay & Insights Inspector
 */
(function () {
  'use strict';

  // Issue storage
  const issues = [];
  let currentIndex = 0;
  let isOpen = false;
  let isMinimized = false;

  // Injected CSS for the overlay
  const css = `
    .dev-inspector-pill {
      position: fixed;
      bottom: 18px;
      left: 18px;
      z-index: 999999;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: #18181b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }
    .dev-inspector-pill:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2);
    }
    .dev-inspector-pill.has-issues {
      background: #ea580c;
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(234, 88, 12, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.25);
    }
    .dev-inspector-pill.has-issues:hover {
      background: #c2410c;
      box-shadow: 0 6px 22px rgba(234, 88, 12, 0.6);
    }
    .dev-dot-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      display: inline-block;
    }
    .dev-inspector-pill.has-issues .dev-dot-pulse {
      background: #ffffff;
      animation: devPulse 1.8s infinite;
    }
    @keyframes devPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .dev-pill-close {
      margin-left: 2px;
      opacity: 0.7;
      font-size: 13px;
      line-height: 1;
    }
    .dev-pill-close:hover {
      opacity: 1;
    }

    /* Modal Backdrop */
    .dev-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
    }
    .dev-modal-backdrop.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* Modal Box */
    .dev-modal-box {
      width: 100%;
      max-width: 620px;
      background: #111113;
      border: 1px solid #27272a;
      border-radius: 14px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
      color: #f4f4f5;
      overflow: hidden;
      transform: scale(0.97) translateY(10px);
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dev-modal-backdrop.active .dev-modal-box {
      transform: scale(1) translateY(0);
    }

    /* Modal Topbar */
    .dev-modal-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #18181b;
      border-bottom: 1px solid #27272a;
      font-size: 12px;
      color: #a1a1aa;
    }
    .dev-nav-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .dev-nav-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #d4d4d8;
      cursor: pointer;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      padding: 0;
      transition: all 0.15s ease;
    }
    .dev-nav-btn:hover:not(:disabled) {
      background: #27272a;
      color: #ffffff;
    }
    .dev-nav-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .dev-counter {
      font-weight: 600;
      color: #fafafa;
    }
    .dev-top-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #94a3b8;
    }
    .dev-top-tag span.badge-circle {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ea580c;
    }

    /* Modal Body */
    .dev-modal-body {
      padding: 22px 24px;
    }
    .dev-insight-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 3px 9px;
      border-radius: 6px;
      background: rgba(234, 88, 12, 0.15);
      color: #fb923c;
      border: 1px solid rgba(234, 88, 12, 0.35);
      margin-bottom: 14px;
    }
    .dev-insight-badge.err {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.35);
    }
    .dev-insight-badge.warn {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.35);
    }
    .dev-insight-badge.sec {
      background: rgba(234, 88, 12, 0.18);
      color: #f97316;
      border-color: rgba(234, 88, 12, 0.4);
    }
    .dev-modal-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 10px 0;
      line-height: 1.35;
    }
    .dev-modal-desc {
      font-size: 13.5px;
      color: #a1a1aa;
      line-height: 1.6;
      margin: 0 0 18px 0;
    }

    /* Agent Prompt Card */
    .dev-prompt-card {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 18px;
    }
    .dev-prompt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .dev-prompt-label {
      font-size: 11px;
      font-weight: 600;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .dev-copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #18181b;
      border: 1px solid #3f3f46;
      color: #e4e4e7;
      font-size: 11.5px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .dev-copy-btn:hover {
      background: #27272a;
      border-color: #52525b;
      color: #ffffff;
    }
    .dev-copy-btn.copied {
      background: #065f46;
      border-color: #059669;
      color: #34d399;
    }
    .dev-prompt-code {
      font-family: "JetBrains Mono", Menlo, Consolas, Monaco, monospace;
      font-size: 12.5px;
      color: #e4e4e7;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }

    /* Modal Footer */
    .dev-modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #71717a;
      padding-top: 10px;
      border-top: 1px solid #27272a;
    }
    .dev-modal-footer button {
      background: transparent;
      border: none;
      color: #a1a1aa;
      font-size: 12px;
      cursor: pointer;
      text-decoration: underline;
      padding: 4px 8px;
    }
    .dev-modal-footer button:hover {
      color: #ffffff;
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // Create Pill element
  const pill = document.createElement('div');
  pill.className = 'dev-inspector-pill';
  pill.id = 'devInspectorPill';
  pill.innerHTML = `
    <span class="dev-dot-pulse"></span>
    <span id="devPillLabel">0 Issues</span>
  `;
  document.body.appendChild(pill);

  // Create Modal Backdrop & Box
  const modal = document.createElement('div');
  modal.className = 'dev-modal-backdrop';
  modal.id = 'devInspectorModal';
  modal.innerHTML = `
    <div class="dev-modal-box" onclick="event.stopPropagation()">
      <div class="dev-modal-topbar">
        <div class="dev-nav-group">
          <button type="button" class="dev-nav-btn" id="devPrevBtn" title="Previous issue">&lsaquo;</button>
          <span class="dev-counter" id="devIssueCounter">Insights 1/1</span>
          <button type="button" class="dev-nav-btn" id="devNextBtn" title="Next issue">&rsaquo;</button>
        </div>
        <div class="dev-top-tag">
          <span class="badge-circle"></span>
          <span>TransformaUMKM Dev Inspector</span>
          <button type="button" class="dev-nav-btn" id="devCloseModal" style="margin-left: 6px;" title="Tutup">&times;</button>
        </div>
      </div>
      <div class="dev-modal-body">
        <span class="dev-insight-badge sec" id="devTag">Security Insight</span>
        <h3 class="dev-modal-title" id="devTitle">Issue Title</h3>
        <p class="dev-modal-desc" id="devDesc">Issue Description</p>

        <div class="dev-prompt-card">
          <div class="dev-prompt-header">
            <span class="dev-prompt-label">Agent prompt</span>
            <button type="button" class="dev-copy-btn" id="devCopyBtn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              <span>Copy prompt</span>
            </button>
          </div>
          <pre class="dev-prompt-code" id="devPromptCode">Run instruction here</pre>
        </div>

        <div class="dev-modal-footer">
          <span id="devInstructionSub">Ask your coding agent to fix this issue.</span>
          <div>
            <button type="button" id="devDismissBtn">Tandai Selesai</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Helper to add issues
  window.addDevIssue = function (issue) {
    issues.push({
      category: issue.category || 'Security Insight',
      badgeClass: issue.badgeClass || 'sec',
      title: issue.title || 'Pemberitahuan Sistem',
      description: issue.description || 'Tidak ada detail tambahan.',
      agentPrompt: issue.agentPrompt || 'Periksa status aplikasi dan perbaiki masalah yang dilaporkan.',
      instruction: issue.instruction || 'Salin prompt ini ke asisten coding Anda.'
    });
    updateUI();
  };

  function updateUI() {
    const pillLabel = document.getElementById('devPillLabel');
    if (issues.length === 0) {
      pill.className = 'dev-inspector-pill';
      pillLabel.textContent = 'No issues';
      if (isOpen) closeModal();
      return;
    }

    pill.className = 'dev-inspector-pill has-issues';
    pillLabel.innerHTML = `${issues.length} ${issues.length === 1 ? 'Insight' : 'Insights'} &nbsp;<span class="dev-pill-close">&times;</span>`;

    if (currentIndex >= issues.length) currentIndex = issues.length - 1;
    if (currentIndex < 0) currentIndex = 0;

    const current = issues[currentIndex];
    if (!current) return;

    document.getElementById('devIssueCounter').textContent = `Insights ${currentIndex + 1}/${issues.length}`;
    document.getElementById('devPrevBtn').disabled = currentIndex === 0;
    document.getElementById('devNextBtn').disabled = currentIndex === issues.length - 1;

    const tag = document.getElementById('devTag');
    tag.textContent = current.category;
    tag.className = `dev-insight-badge ${current.badgeClass || 'sec'}`;

    document.getElementById('devTitle').textContent = current.title;
    document.getElementById('devDesc').textContent = current.description;
    document.getElementById('devPromptCode').textContent = current.agentPrompt;
    document.getElementById('devInstructionSub').textContent = current.instruction;
  }

  function openModal() {
    if (issues.length === 0) return;
    isOpen = true;
    modal.classList.add('active');
    updateUI();
  }

  function closeModal() {
    isOpen = false;
    modal.classList.remove('active');
  }

  // Event handlers
  pill.addEventListener('click', (e) => {
    if (e.target.closest('.dev-pill-close')) {
      pill.style.display = 'none';
      return;
    }
    if (issues.length > 0) openModal();
  });

  modal.addEventListener('click', closeModal);
  document.getElementById('devCloseModal').addEventListener('click', closeModal);

  document.getElementById('devPrevBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      currentIndex--;
      updateUI();
    }
  });

  document.getElementById('devNextBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentIndex < issues.length - 1) {
      currentIndex++;
      updateUI();
    }
  });

  document.getElementById('devDismissBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    issues.splice(currentIndex, 1);
    if (issues.length === 0) {
      closeModal();
    } else {
      if (currentIndex >= issues.length) currentIndex = issues.length - 1;
      updateUI();
    }
  });

  document.getElementById('devCopyBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const text = document.getElementById('devPromptCode').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('devCopyBtn');
      btn.classList.add('copied');
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Copied!</span>
      `;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          <span>Copy prompt</span>
        `;
      }, 2000);
    });
  });

  // Automatically monitor and capture runtime errors
  window.addEventListener('error', function (event) {
    window.addDevIssue({
      category: 'Runtime Error',
      badgeClass: 'err',
      title: event.message || 'Unhandled JavaScript Error',
      description: `Terjadi error pada file ${event.filename || 'unknown'} di baris ${event.lineno || '?'}:${event.colno || '?'}.`,
      agentPrompt: `Fix JavaScript runtime error: "${event.message}" at ${event.filename}:${event.lineno}`,
      instruction: 'Ask your coding agent to fix this script error.'
    });
  });

  window.addEventListener('unhandledrejection', function (event) {
    window.addDevIssue({
      category: 'Promise Rejection',
      badgeClass: 'err',
      title: 'Unhandled Promise Rejection',
      description: String(event.reason || 'Promise rejected without catch handler.'),
      agentPrompt: `Handle unhandled Promise rejection: ${String(event.reason)}`,
      instruction: 'Ask your coding agent to inspect asynchronous calls.'
    });
  });

  // Built-in starter security & configuration audits
  document.addEventListener('DOMContentLoaded', () => {
    // Audit 1: Session Security & Token Expiry Check
    const hasSecureSession = typeof SessionSecurity !== 'undefined';
    if (!hasSecureSession) {
      window.addDevIssue({
        category: 'Security Insight',
        badgeClass: 'sec',
        title: 'Tingkatkan keamanan penyimpanan sesi (Session Storage).',
        description: 'Saat ini sesi login UMKM disimpan tanpa enkripsi di localStorage. Disarankan menggunakan enkripsi token dan auto-expiry.',
        agentPrompt: 'Audit modul otentikasi di script.js dan implementasikan enkripsi session atau token expiry otomatis.',
        instruction: "Ask your coding agent to upgrade: Run 'next upgrade --agent=security' and follow its instructions."
      });
    }

    // Audit 2: Network / Favicon Asset Check
    if (!document.querySelector('link[rel*="icon"]')) {
      window.addDevIssue({
        category: 'Asset Insight',
        badgeClass: 'warn',
        title: 'Tambahkan icon favicon pada halaman web',
        description: 'Browser meminta favicon secara berkala. Menambahkan favicon SVG atau ICO akan mengeliminasi request 404 dari terminal live server.',
        agentPrompt: 'Tambahkan link favicon SVG inline di <head> index.html untuk menghilangkan request 404 /favicon.ico.',
        instruction: 'Ask your coding agent to configure the website favicon.'
      });
    }

    updateUI();
  });

})();
