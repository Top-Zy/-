/* =========================================================
   武陵山区果园管理系统 · 公共 UI 组件
   ========================================================= */
(function (global) {
  'use strict';

  const ICONS = {
    'leaf': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    'arrow-up-right': '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    'arrow-up': '<path d="m18 15-6-6-6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'menu': '<path d="M4 6h16M4 12h16M4 18h16"/>',
    'close': '<path d="M18 6 6 18M6 6l12 12"/>',
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'calendar': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    'truck': '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    'sprout': '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    'mountain': '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    'plus': '<path d="M5 12h14M12 5v14"/>',
    'minus': '<path d="M5 12h14"/>',
    'trash': '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    'logout': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    'package': '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    'message': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    'image': '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    'external': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'smartphone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    'trending-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
    'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    'award': '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    'map': '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    'pie-chart': '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    'bar-chart': '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'wechat': '<path d="M8.5 3C4.36 3 1 5.69 1 9c0 1.89 1.08 3.56 2.78 4.66L3 16l2.5-1.4c.93.26 1.93.4 2.99.4 4.14 0 7.5-2.69 7.5-6S12.64 3 8.5 3Z"/><path d="M16.5 8.5c3.04 0 5.5 1.96 5.5 4.38 0 1.39-.81 2.62-2.08 3.43l.36 1.69-1.9-1.05c-.62.17-1.28.27-1.88.27-3.04 0-5.5-1.96-5.5-4.34s2.46-4.38 5.5-4.38Z"/>',
    'weibo': '<circle cx="12" cy="12" r="10"/><path d="M8 13c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5"/><path d="M9 8.5c1-.7 2-.7 3 0"/>',
    'qq': '<path d="M12 2c3.5 0 6 2.8 6 6.5 0 1.3.6 2.2 1.3 3.2.8 1.1.5 2-.5 2.1-.7.1-1.4-.4-2-.8-.4 1.4-1.2 2.6-2.3 3.5 1 .3 1.8 1 1.8 1.8 0 1.2-2 2.2-4.3 2.2s-4.3-1-4.3-2.2c0-.8.8-1.5 1.8-1.8-1.1-.9-1.9-2.1-2.3-3.5-.6.4-1.3.9-2 .8-1-.1-1.3-1-.5-2.1.7-1 1.3-1.9 1.3-3.2C6 4.8 8.5 2 12 2Z"/>',
    'grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>',
    'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    'cloud': '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    'wind': '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
    'copy-check': '<path d="m12 15 2 2 4-4"/><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'
  };

  function icon(name, cls) {
    const body = ICONS[name] || ICONS['info'];
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  function escape(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function param(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  }
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay || 260);
    };
  }
  function formatNum(n) {
    return Number(n || 0).toLocaleString('zh-CN');
  }
  function stars(count) {
    const full = Math.round(count == null ? 5 : count);
    let html = '<span class="stars" aria-label="五星好评">';
    for (let i = 0; i < 5; i++) html += `<svg viewBox="0 0 24 24" fill="${i < full ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    return html + '</span>';
  }

  const STATUS_CLASS = {
    '待付款': 'blue', '待发货': 'orange', '已发货': 'blue', '已完成': 'green', '已取消': 'gray',
    '待回复': 'orange', '已回复': 'green', '待确认': 'orange', '已确认': 'green',
    '正常': 'green', '停用': 'red', '上架': 'green', '下架': 'gray', '已发布': 'green', '草稿': 'gray'
  };
  function statusBadge(status) {
    return `<span class="status-pill ${STATUS_CLASS[status] || 'gray'}">${escape(status)}</span>`;
  }

  /* ---------------- Toast ---------------- */
  function toast(message, type, duration) {
    type = type || 'success';
    let root = document.getElementById('toastRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toastRoot';
      document.body.appendChild(root);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : type === 'warning' ? 'alert-triangle' : 'info';
    el.innerHTML = `<span class="t-icon">${icon(iconName)}</span><div>${escape(message)}</div>`;
    root.appendChild(el);
    const remove = () => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 260);
    };
    const timer = setTimeout(remove, duration || 3200);
    el.addEventListener('click', () => { clearTimeout(timer); remove(); });
  }

  /* ---------------- 模态框 ---------------- */
  function modal(opts) {
    opts = opts || {};
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = `
      <div class="modal ${opts.size === 'lg' ? 'modal-lg' : opts.size === 'sm' ? 'modal-sm' : ''} ${opts.className || ''}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div><h3>${escape(opts.title || '提示')}</h3>${opts.subtitle ? `<p>${escape(opts.subtitle)}</p>` : ''}</div>
          <button type="button" class="modal-close" aria-label="关闭">${icon('close')}</button>
        </div>
        <div class="modal-body">${opts.body || ''}</div>
        ${opts.footer === null ? '' : `<div class="modal-foot">${opts.footer || `<button type="button" class="btn btn-primary js-modal-close">知道了</button>`}</div>`}
      </div>`;
    document.body.appendChild(mask);
    document.body.classList.add('no-scroll');
    const close = () => {
      mask.remove();
      if (!document.querySelector('.modal-mask')) document.body.classList.remove('no-scroll');
      if (typeof opts.onClose === 'function') opts.onClose();
    };
    mask.querySelector('.modal-close').addEventListener('click', close);
    mask.addEventListener('mousedown', e => { if (e.target === mask) close(); });
    mask.querySelectorAll('.js-modal-close').forEach(btn => btn.addEventListener('click', close));
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && document.body.contains(mask)) { close(); document.removeEventListener('keydown', esc); }
    });
    return { el: mask, close };
  }

  function confirm(message, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const m = modal({
        title: opts.title || '请确认',
        body: `<p style="font-size:14px;line-height:1.9;color:#4d5d52">${escape(message)}</p>`,
        size: 'sm',
        footer: `<button type="button" class="btn btn-ghost js-cancel">${escape(opts.cancelText || '取消')}</button>
                 <button type="button" class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'} js-ok">${escape(opts.okText || '确定')}</button>`,
        onClose: () => finish(false)
      });
      m.el.querySelector('.js-cancel').onclick = () => { finish(false); m.close(); };
      m.el.querySelector('.js-ok').onclick = () => { finish(true); m.close(); };
    });
  }

  function emptyState(title, desc, actionHtml, iconName) {
    return `<div class="empty-state">
      <div class="empty-icon">${icon(iconName || 'package')}</div>
      <h3>${escape(title || '暂无数据')}</h3>
      <p>${escape(desc || '换个条件试试，或稍后再来看看。')}</p>
      ${actionHtml || ''}
    </div>`;
  }

  /* ---------------- 前后台公共框架 ---------------- */
  const NAV = [
    { key: 'home', href: 'index.html', label: '首页' },
    { key: 'orchards', href: 'orchards.html', label: '合作果园' },
    { key: 'products', href: 'products.html', label: '鲜果商城' },
    { key: 'news', href: 'news.html', label: '果业资讯' },
    { key: 'about', href: 'about.html', label: '关于我们' },
    { key: 'contact', href: 'contact.html', label: '联系我们' }
  ];
  const PAGE_GROUP = {
    home: 'home', orchards: 'orchards', 'orchard-detail': 'orchards',
    products: 'products', 'product-detail': 'products',
    news: 'news', 'news-detail': 'news', about: 'about', contact: 'contact',
    login: '', register: '', cart: '', checkout: '', 'order-success': '', user: ''
  };

  function headerHTML() {
    const settings = DB.getSettings();
    const user = DB.getCurrentUser();
    const page = PAGE_GROUP[document.body.dataset.page] || '';
    const count = DB.cartCount();
    const nav = NAV.map(n => `<a href="${n.href}" class="${page === n.key ? 'active' : ''}">${n.label}</a>`).join('');
    const userArea = user
      ? `<div class="user-menu-wrap">
          <button type="button" class="user-trigger" id="userTrigger" aria-expanded="false">
            <span class="user-avatar">${escape((user.name || user.username).slice(0, 1))}</span>
            <span class="u-name">${escape(user.name || user.username)}</span>
            ${icon('chevron-down')}
          </button>
          <div class="user-menu hidden" id="userMenu">
            <a href="user.html">${icon('user')}个人中心</a>
            <a href="user.html#orders">${icon('package')}我的订单</a>
            <a href="cart.html">${icon('cart')}购物车</a>
            ${user.role === 'admin' ? `<a href="admin/index.html">${icon('layout-dashboard')}管理后台</a>` : ''}
            <div class="menu-sep"></div>
            <button type="button" class="menu-danger js-logout">${icon('logout')}退出登录</button>
          </div>
        </div>`
      : `<a href="login.html" class="btn btn-sm btn-primary login-btn" style="min-height:38px">登录 / 注册</a>`;
    return `
      <div class="top-note">
        <div class="container">
          <div class="note-left">${icon('leaf')}<span>${escape(settings.notice || '高山生态种植 · 产地直供')}</span></div>
          <div class="note-right"><a href="contact.html">帮助中心</a><a href="admin/login.html">管理后台</a><span>${escape(settings.workTime || '')}</span></div>
        </div>
      </div>
      <header class="site-header" id="siteHeader">
        <div class="container header-inner">
          <a class="brand" href="index.html" aria-label="武陵果园首页">
            <img src="assets/img/logo.svg" alt="武陵果园标志">
            <span class="brand-text"><span class="brand-name">${escape(settings.shortName || '武陵果园')}</span><span class="brand-sub">Wuling Mountain Orchard</span></span>
          </a>
          <nav class="main-nav" aria-label="主导航">${nav}</nav>
          <div class="header-actions">
            <a class="icon-btn header-search" href="products.html" aria-label="搜索产品" title="搜索产品">${icon('search')}</a>
            <span class="divider"></span>
            <a class="icon-btn cart-link" href="cart.html" aria-label="购物车" title="购物车">${icon('cart')}<span class="cart-count" id="cartCount" ${count ? '' : 'hidden'}>${count}</span></a>
            ${userArea}
            <button type="button" class="icon-btn mobile-toggle" id="mobileToggle" aria-label="打开菜单">${icon('menu')}</button>
          </div>
        </div>
      </header>
      <div class="mobile-nav" id="mobileNav">
        <div class="mask" data-mobile-close></div>
        <aside class="panel" aria-label="移动端导航">
          <div class="m-head">
            <a class="brand" href="index.html"><img src="assets/img/logo.svg" alt=""><span class="brand-text"><span class="brand-name">${escape(settings.shortName || '武陵果园')}</span><span class="brand-sub">Wuling Mountain Orchard</span></span></a>
            <button type="button" class="icon-btn" data-mobile-close aria-label="关闭菜单">${icon('close')}</button>
          </div>
          <nav class="m-links">${NAV.map(n => `<a href="${n.href}" class="${page === n.key ? 'active' : ''}">${n.label}</a>`).join('')}</nav>
          <div class="m-foot">
            ${user ? `<a class="btn btn-primary" href="user.html">${icon('user')}${escape(user.name)}的个人中心</a>
                      ${user.role === 'admin' ? `<a class="btn btn-ghost" href="admin/index.html">${icon('layout-dashboard')}管理后台</a>` : ''}
                      <button type="button" class="btn btn-ghost js-logout">${icon('logout')}退出登录</button>`
                    : `<a class="btn btn-primary" href="login.html">登录 / 注册</a>`}
            <a class="btn btn-ghost" href="cart.html">${icon('cart')}购物车</a>
          </div>
        </aside>
      </div>`;
  }

  function footerHTML() {
    const settings = DB.getSettings();
    const year = new Date().getFullYear();
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a class="brand" href="index.html">
                <img src="assets/img/logo.svg" alt="武陵果园">
                <span class="brand-text"><span class="brand-name">${escape(settings.shortName || '武陵果园')}</span><span class="brand-sub">Wuling Mountain Orchard</span></span>
              </a>
              <p>扎根武陵山区，连接生态果园与城市餐桌。让每一颗果子都有出处，让每一份耕耘都被看见。</p>
              <div class="footer-social">
                <a href="contact.html" aria-label="微信">${icon('wechat')}</a>
                <a href="contact.html" aria-label="微博">${icon('weibo')}</a>
                <a href="contact.html" aria-label="邮箱">${icon('mail')}</a>
              </div>
            </div>
            <div class="footer-col">
              <h4>逛一逛</h4>
              <ul>
                <li><a href="products.html">鲜果商城</a></li>
                <li><a href="orchards.html">合作果园</a></li>
                <li><a href="news.html">果业资讯</a></li>
                <li><a href="about.html">品牌故事</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>服务支持</h4>
              <ul>
                <li><a href="contact.html">联系我们</a></li>
                <li><a href="contact.html#faq">常见问题</a></li>
                <li><a href="user.html#orders">订单查询</a></li>
                <li><a href="admin/login.html">管理入口</a></li>
              </ul>
            </div>
            <div class="footer-news">
              <h4>订阅果园来信</h4>
              <p>采收提醒、时令果讯和果园故事，每月一封，不打扰。</p>
              <form class="newsletter" id="newsletterForm">
                <input type="email" placeholder="输入你的邮箱" aria-label="邮箱" required>
                <button type="submit" aria-label="订阅">${icon('arrow-right')}</button>
              </form>
              <p style="margin:10px 0 0;font-size:10.5px">${escape(settings.shipping || '')}</p>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} ${escape(settings.siteName || '武陵山区果园管理系统')} · 毕业设计演示项目</span>
            <div class="fb-links"><a href="about.html">关于我们</a><a href="contact.html">联系客服</a><span>${escape(settings.icp || '')}</span></div>
          </div>
        </div>
      </footer>
      <button type="button" class="back-top" id="backTop" aria-label="返回顶部">${icon('arrow-up')}</button>`;
  }

  function updateCartCount() {
    const el = document.getElementById('cartCount');
    if (!el) return;
    const count = DB.cartCount();
    el.textContent = count;
    el.hidden = count === 0;
  }

  function mountChrome() {
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');
    if (header) header.innerHTML = headerHTML();
    if (footer) footer.innerHTML = footerHTML();
    if (!document.getElementById('toastRoot')) {
      const t = document.createElement('div');
      t.id = 'toastRoot';
      document.body.appendChild(t);
    }
    updateCartCount();

    const headerEl = document.getElementById('siteHeader');
    const backTop = document.getElementById('backTop');
    const onScroll = () => {
      if (headerEl) headerEl.classList.toggle('scrolled', window.scrollY > 10);
      if (backTop) backTop.classList.toggle('show', window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const mobile = document.getElementById('mobileNav');
    const toggle = document.getElementById('mobileToggle');
    const openMobile = () => { if (mobile) { mobile.classList.add('open'); document.body.classList.add('no-scroll'); } };
    const closeMobile = () => { if (mobile) { mobile.classList.remove('open'); document.body.classList.remove('no-scroll'); } };
    if (toggle) toggle.addEventListener('click', openMobile);
    document.querySelectorAll('[data-mobile-close]').forEach(el => el.addEventListener('click', closeMobile));

    const trigger = document.getElementById('userTrigger');
    const menu = document.getElementById('userMenu');
    if (trigger && menu) {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const open = !menu.classList.contains('hidden');
        menu.classList.toggle('hidden', open);
        trigger.setAttribute('aria-expanded', String(!open));
      });
      document.addEventListener('click', () => { menu.classList.add('hidden'); trigger.setAttribute('aria-expanded', 'false'); });
    }

    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add-cart]');
      if (add) {
        e.preventDefault();
        const id = add.getAttribute('data-add-cart');
        const qty = Number(add.getAttribute('data-qty') || 1);
        const res = DB.addToCart(id, qty);
        if (res.ok) { toast('已加入购物车', 'success'); updateCartCount(); }
        else toast(res.message, 'warning');
      }
      const logout = e.target.closest('.js-logout');
      if (logout) {
        e.preventDefault();
        DB.logout();
        toast('已安全退出', 'info');
        setTimeout(() => { location.href = 'index.html'; }, 450);
      }
    });

    const newsForm = document.getElementById('newsletterForm');
    if (newsForm) {
      newsForm.addEventListener('submit', e => {
        e.preventDefault();
        toast('订阅成功，果园来信会寄到你的邮箱', 'success');
        newsForm.reset();
      });
    }
    initReveal();
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px' });
    items.forEach(el => io.observe(el));
  }

  /* ---------------- Canvas 图表 ---------------- */
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(260, rect.width - 36);
    const h = Math.max(180, rect.height - 26);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawLineChart(canvas, labels, values, opts) {
    if (!canvas) return;
    opts = opts || {};
    const { ctx, w, h } = setupCanvas(canvas);
    const padL = 44, padR = 16, padT = 18, padB = 34;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const max = Math.max(...values, 1);
    const niceMax = Math.ceil(max / 4) * 4 || 4;
    ctx.clearRect(0, 0, w, h);
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#edf0e7';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillStyle = '#96a294';
      ctx.textAlign = 'right';
      const val = niceMax - (niceMax / 4) * i;
      ctx.fillText(opts.money ? '¥' + formatNum(val) : formatNum(val), padL - 9, y);
    }
    const step = labels.length > 1 ? chartW / (labels.length - 1) : chartW;
    const points = values.map((v, i) => ({ x: padL + step * i, y: padT + chartH - (v / niceMax) * chartH, v }));
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, opts.fill || 'rgba(63,128,84,.24)');
    grad.addColorStop(1, 'rgba(63,128,84,0)');
    ctx.beginPath();
    ctx.moveTo(points[0].x, padT + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath();
    points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.strokeStyle = opts.color || '#2f6b45'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    points.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = opts.color || '#2f6b45'; ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.fillStyle = '#839080'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    labels.forEach((label, i) => ctx.fillText(label, padL + step * i, h - padB + 12));
  }

  function drawDonutChart(canvas, items, colors, centerLabel) {
    if (!canvas) return;
    const { ctx, w, h } = setupCanvas(canvas);
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(w, h) / 2 - 14;
    const inner = radius * 0.64;
    const total = items.reduce((s, it) => s + it.value, 0) || 1;
    ctx.clearRect(0, 0, w, h);
    let start = -Math.PI / 2;
    items.forEach((it, i) => {
      const angle = (it.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + angle);
      ctx.arc(cx, cy, inner, start + angle, start, true);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      start += angle;
    });
    ctx.fillStyle = '#23332b';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 22px "Noto Serif SC","Songti SC",serif';
    ctx.fillText(formatNum(total), cx, cy - 7);
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#839080';
    ctx.fillText(centerLabel || '销售额 / 元', cx, cy + 15);
  }

  function drawBarChart(canvas, labels, values, color) {
    if (!canvas) return;
    const { ctx, w, h } = setupCanvas(canvas);
    const padL = 36, padR = 12, padT = 16, padB = 30;
    const chartW = w - padL - padR, chartH = h - padT - padB;
    const max = Math.max(...values, 1);
    const niceMax = Math.ceil(max / 4) * 4 || 4;
    ctx.clearRect(0, 0, w, h);
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.strokeStyle = '#edf0e7'; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillStyle = '#96a294'; ctx.textAlign = 'right';
      ctx.fillText(formatNum(niceMax - (niceMax / 4) * i), padL - 8, y);
    }
    const slot = chartW / values.length;
    const barW = Math.min(32, slot * .46);
    values.forEach((v, i) => {
      const bh = (v / niceMax) * chartH;
      const x = padL + slot * i + (slot - barW) / 2;
      const y = padT + chartH - bh;
      const grad = ctx.createLinearGradient(0, y, 0, y + bh);
      grad.addColorStop(0, color || '#6f9f6c'); grad.addColorStop(1, '#2f6b45');
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barW, Math.max(bh, 2), [5, 5, 0, 0]);
      else ctx.rect(x, y, barW, Math.max(bh, 2));
      ctx.fill();
      ctx.fillStyle = '#839080'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(labels[i], padL + slot * i + slot / 2, h - padB + 10);
    });
  }

  global.UI = {
    icon, escape, param, debounce, formatNum, stars, statusBadge, toast, modal, confirm, emptyState,
    mountChrome, updateCartCount, initReveal,
    drawLineChart, drawDonutChart, drawBarChart,
    ICONS
  };
})(window);
