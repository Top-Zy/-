/* =========================================================
   武陵山区果园管理系统 · 后台业务逻辑
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = UI.escape;

  const PAGE_TITLE = {
    dashboard: '数据看板', products: '产品管理', orders: '订单管理', orchards: '果园管理',
    news: '资讯管理', users: '用户管理', messages: '留言管理', bookings: '预约管理', settings: '系统设置'
  };
  const ORCHARD_IMAGES = [
    ['assets/img/orchard-1.jpg', '高山猕猴桃园'],
    ['assets/img/orchard-2.jpg', '金秋梨园'],
    ['assets/img/orchard-3.jpg', '柑橘示范园'],
    ['assets/img/orchard-4.jpg', '高山莓茶园'],
    ['assets/img/orchard-5.jpg', '唐崖蜜桃谷'],
    ['assets/img/orchard-6.jpg', '黔江脆李园']
  ];
  const PRODUCT_IMAGES = [
    ['assets/img/product-kiwi.jpg', '猕猴桃'], ['assets/img/product-orange.jpg', '脐橙'],
    ['assets/img/product-pear.jpg', '金秋梨'], ['assets/img/product-peach.jpg', '黄桃'],
    ['assets/img/product-plum.jpg', '脆李'], ['assets/img/product-persimmon.jpg', '甜柿'],
    ['assets/img/product-honey.jpg', '蜂蜜'], ['assets/img/product-tea.jpg', '莓茶']
  ];
  const DONUT_COLORS = ['#2f6b45', '#e58b36', '#7b8f4c', '#3e6c8e', '#c07a5e'];

  function setError(form, field, message) {
    const box = form.querySelector(`[data-error="${field}"]`);
    if (box) box.textContent = message || '';
    const input = form.querySelector(`[name="${field}"]`);
    if (input) input.classList.toggle('error', !!message);
  }
  function clearErrors(form) {
    $$('[data-error]', form).forEach(el => { el.textContent = ''; });
    $$('.error', form).forEach(el => el.classList.remove('error'));
  }
  function currentFile() { return location.pathname.split('/').pop() + location.search; }
  function safeRedirect(v, fallback) {
    if (!v || /^(https?:)?\/\//i.test(v) || v.startsWith('javascript:')) return fallback;
    return v;
  }
  function dateCN() {
    try { return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date()); }
    catch (e) { return DB.formatDate(new Date().toISOString()); }
  }
  function options(list, selected) {
    return list.map(([value, label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
  }
  function pagerHTML(total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    if (pages <= 1) return '';
    let html = `<button type="button" data-goto="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>`;
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    const end = Math.min(pages, start + 4);
    for (let i = start; i <= end; i++) html += `<button type="button" data-goto="${i}" class="${i === page ? 'active' : ''}">${i}</button>`;
    html += `<button type="button" data-goto="${page + 1}" ${page >= pages ? 'disabled' : ''}>›</button>`;
    return html;
  }
  function bindPager(container, total, page, size, onChange) {
    if (!container) return;
    container.onclick = e => {
      const btn = e.target.closest('[data-goto]');
      if (!btn || btn.disabled) return;
      const next = Number(btn.dataset.goto);
      const pages = Math.max(1, Math.ceil(total / size));
      if (next < 1 || next > pages || next === page) return;
      onChange(next);
    };
  }
  function pageSlice(list, page, size) {
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const safePage = Math.min(Math.max(1, page), pages);
    return { data: list.slice((safePage - 1) * size, safePage * size), total, page: safePage, pages };
  }

  /* ---------------- 后台框架 ---------------- */
  function mountShell(page) {
    const user = DB.getCurrentUser();
    if (!user) return;
    const stats = DB.getStats();
    const groups = [
      { title: '工作台', items: [{ key: 'dashboard', href: 'index.html', label: '数据看板', icon: 'layout-dashboard' }] },
      {
        title: '经营管理', items: [
          { key: 'orders', href: 'orders.html', label: '订单管理', icon: 'package', badge: stats.pending },
          { key: 'products', href: 'products.html', label: '产品管理', icon: 'shopping-bag' },
          { key: 'orchards', href: 'orchards.html', label: '果园管理', icon: 'sprout' },
          { key: 'bookings', href: 'bookings.html', label: '采摘预约', icon: 'calendar', badge: stats.bookingPending }
        ]
      },
      {
        title: '内容与用户', items: [
          { key: 'news', href: 'news.html', label: '资讯管理', icon: 'file-text' },
          { key: 'users', href: 'users.html', label: '用户管理', icon: 'users' },
          { key: 'messages', href: 'messages.html', label: '留言管理', icon: 'message', badge: stats.messagePending }
        ]
      },
      { title: '系统', items: [{ key: 'settings', href: 'settings.html', label: '系统设置', icon: 'settings' }] }
    ];
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
      sidebar.innerHTML = `
        <div class="side-brand">
          <img src="../assets/img/logo.svg" alt="武陵果园">
          <div><div class="sb-name">武陵果园</div><div class="sb-sub">ADMIN CONSOLE</div></div>
        </div>
        <nav class="side-nav">
          ${groups.map(g => `<div class="nav-group"><div class="nav-group-title">${g.title}</div>${g.items.map(it => `<a class="nav-item ${it.key === page ? 'active' : ''}" href="${it.href}">${UI.icon(it.icon)}<span>${it.label}</span>${it.badge ? `<span class="nav-badge">${it.badge}</span>` : ''}</a>`).join('')}</div>`).join('')}
          <div class="nav-group"><div class="nav-group-title">快捷入口</div><a class="nav-item" href="../index.html" target="_blank">${UI.icon('external')}<span>访问前台网站</span></a></div>
        </nav>
        <div class="side-user">
          <div class="su-avatar">${esc((user.name || 'A').slice(0, 1))}</div>
          <div class="su-copy"><div class="su-name">${esc(user.name)}</div><div class="su-role">超级管理员</div></div>
          <button class="su-out js-admin-logout" type="button" title="退出登录">${UI.icon('logout')}</button>
        </div>`;
    }
    const topbar = document.getElementById('adminTopbar');
    if (topbar) {
      topbar.innerHTML = `
        <div class="topbar-left">
          <button class="topbar-icon admin-toggle" type="button" id="adminToggle" aria-label="打开菜单">${UI.icon('menu')}</button>
          <div>
            <div class="topbar-breadcrumb">后台管理 ${UI.icon('chevron-right')} <span class="cur">${PAGE_TITLE[page] || '管理'}</span></div>
            <div class="topbar-title">${PAGE_TITLE[page] || '管理后台'}</div>
          </div>
        </div>
        <div class="topbar-right">
          <span class="topbar-date">${dateCN()}</span>
          <a class="topbar-icon" href="messages.html" title="待回复留言">${UI.icon('bell')}${stats.messagePending ? '<span class="dot"></span>' : ''}</a>
          <a class="topbar-icon" href="../index.html" target="_blank" title="访问前台">${UI.icon('external')}</a>
          <div class="topbar-user"><div class="tu-avatar">${esc((user.name || 'A').slice(0, 1))}</div><div class="tu-copy"><div class="tu-name">${esc(user.name)}</div><div class="tu-role">管理员</div></div></div>
        </div>`;
    }
    const toggle = document.getElementById('adminToggle');
    const overlay = document.getElementById('adminOverlay');
    const side = document.getElementById('adminSidebar');
    const closeSide = () => { if (side) side.classList.remove('open'); if (overlay) overlay.classList.remove('open'); };
    if (toggle) toggle.addEventListener('click', () => { if (side) side.classList.toggle('open'); if (overlay) overlay.classList.toggle('open'); });
    if (overlay) overlay.addEventListener('click', closeSide);
    $$('.js-admin-logout').forEach(btn => btn.addEventListener('click', async () => {
      const ok = await UI.confirm('确定退出管理后台吗？', { title: '退出登录', okText: '退出' });
      if (!ok) return;
      DB.logout();
      location.href = 'login.html';
    }));
  }

  function orderViewHTML(o) {
    return `<div class="detail-list">
      <div class="dl-row"><span class="dl-k">订单编号</span><span class="dl-v mono">${esc(o.orderNo)}</span></div>
      <div class="dl-row"><span class="dl-k">订单状态</span><span class="dl-v">${UI.statusBadge(o.status)}</span></div>
      <div class="dl-row"><span class="dl-k">客户信息</span><span class="dl-v">${esc(o.customerName)} · ${esc(o.phone)}</span></div>
      <div class="dl-row"><span class="dl-k">收货地址</span><span class="dl-v">${esc(o.address)}</span></div>
      <div class="dl-row"><span class="dl-k">支付方式</span><span class="dl-v">${esc(o.payMethod || '—')}</span></div>
      <div class="dl-row"><span class="dl-k">订单备注</span><span class="dl-v">${esc(o.remark || '无')}</span></div>
      <div class="dl-row"><span class="dl-k">下单时间</span><span class="dl-v">${DB.formatDate(o.createdAt, true)}</span></div>
    </div>
    <div class="order-detail-items">${o.items.map(it => `<div class="order-detail-item"><img src="${esc(it.image)}" alt=""><span class="odi-name">${esc(it.name)} <span style="color:var(--muted);font-size:10px">${esc(it.spec || '')}</span></span><span class="odi-qty">× ${it.qty}</span><span class="odi-price">¥${DB.money(it.price * it.qty)}</span></div>`).join('')}</div>
    <div class="order-total-line"><span>商品金额 ¥${DB.money(o.subtotal || o.total)}${o.shippingFee ? ` + 运费 ¥${DB.money(o.shippingFee)}` : ''}，合计</span><strong>¥${DB.money(o.total)}</strong></div>
    <h4 style="font-size:13px;margin:20px 0 8px">订单进度</h4>
    <div class="timeline-mini">${(o.timeline || []).map(t => `<div class="tm-item"><div class="tm-dot"></div><div class="tm-copy"><strong>${esc(t.status)}</strong><span>${DB.formatDate(t.time, true)} · ${esc(t.note || '')}</span></div></div>`).join('')}</div>`;
  }

  function openOrderModal(id) {
    const o = DB.getOrder(id);
    if (!o) return UI.toast('订单不存在', 'error');
    let actions = '';
    if (o.status === '待付款') actions += `<button class="btn btn-primary btn-sm" type="button" data-order-set="待发货">标记已付款</button>`;
    if (o.status === '待发货') actions += `<button class="btn btn-primary btn-sm" type="button" data-order-set="已发货">确认发货</button>`;
    if (o.status === '已发货') actions += `<button class="btn btn-primary btn-sm" type="button" data-order-set="已完成">完成订单</button>`;
    if (['待付款', '待发货'].includes(o.status)) actions += `<button class="btn btn-ghost btn-sm" type="button" data-order-set="已取消">取消订单</button>`;
    const m = UI.modal({
      title: '订单详情', subtitle: o.orderNo, body: orderViewHTML(o), size: 'lg',
      footer: `<button class="btn btn-ghost js-modal-close" type="button">关闭</button>${actions}`
    });
    m.el.querySelectorAll('[data-order-set]').forEach(btn => btn.addEventListener('click', () => {
      const status = btn.dataset.orderSet;
      const res = status === '已取消' ? DB.cancelOrder(o.id, '管理员取消订单', true) : DB.updateOrderStatus(o.id, status, `管理员将订单更新为${status}`);
      if (!res.ok) return UI.toast(res.message, 'error');
      UI.toast(`订单已更新为${status}`, 'success');
      m.close();
      if (document.body.dataset.adminPage === 'dashboard') initDashboard();
      else if (document.body.dataset.adminPage === 'orders') initOrders();
    }));
  }

  /* ---------------- 登录 ---------------- */
  function initLogin() {
    if (DB.isAdmin()) { location.replace(safeRedirect(UI.param('redirect'), 'index.html')); return; }
    const form = $('#adminLoginForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors(form);
      const account = $('#adminAccount').value.trim();
      const pwd = $('#adminPassword').value;
      if (!account) return setError(form, 'account', '请输入管理员账号');
      if (!pwd) return setError(form, 'password', '请输入登录密码');
      const res = DB.loginAdmin(account, pwd);
      if (!res.ok) { setError(form, 'password', res.message); UI.toast(res.message, 'error'); return; }
      UI.toast('登录成功，正在进入后台', 'success');
      setTimeout(() => { location.href = safeRedirect(UI.param('redirect'), 'index.html'); }, 400);
    });
    $$('[data-toggle-password]').forEach(btn => btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      input.type = input.type === 'password' ? 'text' : 'password';
    }));
  }

  /* ---------------- 仪表盘 ---------------- */
  let dashboardMetric = 'revenue';
  function initDashboard() {
    const stats = DB.getStats();
    const kpi = $('#kpiGrid');
    if (kpi) {
      kpi.innerHTML = `
        <article class="kpi-card"><div class="kpi-head"><span class="kpi-label">累计销售额</span><span class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg></span></div><div class="kpi-value"><small>¥</small>${DB.money(stats.revenue)}</div><div class="kpi-foot"><span class="kpi-trend">有效订单累计</span><span>不含待付款/已取消</span></div></article>
        <article class="kpi-card"><div class="kpi-head"><span class="kpi-label">累计订单</span><span class="kpi-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></span></div><div class="kpi-value">${stats.orderCount}<small>笔</small></div><div class="kpi-foot">今日新增 <strong style="color:var(--forest-700)">${stats.todayOrders}</strong> 笔</div></article>
        <article class="kpi-card"><div class="kpi-head"><span class="kpi-label">待发货订单</span><span class="kpi-icon citrus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></span></div><div class="kpi-value">${stats.pending}<small>笔</small></div><div class="kpi-foot"><a href="orders.html" style="color:var(--citrus-600);font-weight:700">去处理 →</a></div></article>
        <article class="kpi-card"><div class="kpi-head"><span class="kpi-label">库存预警</span><span class="kpi-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg></span></div><div class="kpi-value">${stats.lowStock.length}<small>款</small></div><div class="kpi-foot"><a href="products.html" style="color:var(--danger);font-weight:700">库存 ≤ 100，去补货 →</a></div></article>`;
    }
    const drawTrend = () => {
      const labels = stats.monthly.map(m => m.label);
      const values = stats.monthly.map(m => dashboardMetric === 'revenue' ? m.revenue : m.count);
      UI.drawLineChart($('#salesChart'), labels, values, { money: dashboardMetric === 'revenue', color: '#2f6b45' });
    };
    drawTrend();
    $$('#chartRange [data-metric]').forEach(btn => {
      btn.onclick = () => {
        dashboardMetric = btn.dataset.metric;
        $$('#chartRange [data-metric]').forEach(b => b.classList.toggle('active', b === btn));
        drawTrend();
      };
    });
    const legend = $('#categoryLegend');
    if (stats.categories.length) {
      UI.drawDonutChart($('#categoryChart'), stats.categories, DONUT_COLORS, '销售额 / 元');
      if (legend) legend.innerHTML = stats.categories.map((c, i) => `<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:8px;height:8px;border-radius:2px;background:${DONUT_COLORS[i % DONUT_COLORS.length]};display:inline-block"></i>${esc(c.name)} ¥${DB.money(c.value)}</span>`).join('');
    } else if (legend) {
      legend.innerHTML = '<span>暂无有效订单数据</span>';
    }
    const recent = $('#recentOrders');
    if (recent) {
      recent.innerHTML = stats.recentOrders.length ? stats.recentOrders.map(o => `<tr>
        <td><span class="mono">${esc(o.orderNo)}</span></td>
        <td><div class="cell-main" style="min-width:0"><div><div class="cm-name">${esc(o.customerName)}</div><div class="cm-sub">${esc(o.phone)}</div></div></div></td>
        <td><span class="money">¥${DB.money(o.total)}</span></td>
        <td>${UI.statusBadge(o.status)}</td>
        <td><span style="font-size:10.5px;color:var(--muted)">${DB.formatDate(o.createdAt, true)}</span></td>
        <td><button class="act-text" type="button" data-order-view="${esc(o.id)}">查看</button></td>
      </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px">暂无订单</td></tr>';
      recent.onclick = e => {
        const btn = e.target.closest('[data-order-view]');
        if (btn) openOrderModal(btn.dataset.orderView);
      };
    }
    const low = $('#lowStockList');
    if (low) {
      low.innerHTML = stats.lowStock.length ? stats.lowStock.map(p => {
        const pct = Math.max(6, Math.min(100, (p.stock / 100) * 100));
        return `<div class="quick-row"><img src="../${esc(p.image)}" alt=""><div class="qr-copy"><div class="qr-name">${esc(p.name)}</div><div class="qr-sub">库存 ${p.stock} ${esc(p.unit)}</div><div class="stock-bar"><i style="width:${pct}%"></i></div></div><a class="act-text" href="products.html">补货</a></div>`;
      }).join('') : `<div class="quick-row"><div class="qr-copy"><div class="qr-name">库存状态良好</div><div class="qr-sub">当前没有低于 100 的产品</div></div><span class="status-pill green">正常</span></div>`;
    }
    const top = $('#topProducts');
    if (top) {
      const max = Math.max(...stats.productSales.map(p => p.sales), 1);
      top.innerHTML = stats.productSales.map((p, i) => `<div class="quick-row"><span style="width:18px;font-family:var(--font-serif);color:var(--leaf-300);font-weight:700">0${i + 1}</span><img src="../${esc(p.image)}" alt=""><div class="qr-copy"><div class="qr-name">${esc(p.name)}</div><div class="qr-sub">已售 ${UI.formatNum(p.sales)} ${esc(p.unit)}</div><div class="stock-bar"><i class="ok" style="width:${Math.max(8, (p.sales / max) * 100)}%"></i></div></div><span class="qr-val">¥${DB.money(p.price)}</span></div>`).join('');
    }
    const todo = $('#todoList');
    if (todo) {
      const todos = [
        { label: '待发货订单', value: stats.pending, href: 'orders.html', icon: 'package' },
        { label: '待回复留言', value: stats.messagePending, href: 'messages.html', icon: 'message' },
        { label: '待确认预约', value: stats.bookingPending, href: 'bookings.html', icon: 'calendar' },
        { label: '库存预警产品', value: stats.lowStock.length, href: 'products.html', icon: 'alert-triangle' }
      ];
      todo.innerHTML = todos.map(t => `<a class="quick-row" href="${t.href}" style="color:inherit"><span class="kpi-icon" style="width:32px;height:32px;border-radius:8px">${UI.icon(t.icon)}</span><div class="qr-copy"><div class="qr-name">${t.label}</div><div class="qr-sub">${t.value ? '需要及时处理' : '暂无待办'}</div></div><span class="qr-val" style="color:${t.value ? 'var(--citrus-600)' : 'var(--muted)'};font-size:16px">${t.value}</span></a>`).join('');
    }
    const refresh = $('#refreshDashboard');
    if (refresh) refresh.onclick = () => { initDashboard(); UI.toast('数据已刷新', 'success'); };
    if (!window.__adminDashboardResizeBound) {
      window.__adminDashboardResizeBound = true;
      window.addEventListener('resize', UI.debounce(() => {
        if (document.body.dataset.adminPage !== 'dashboard') return;
        const current = DB.getStats();
        const labels = current.monthly.map(m => m.label);
        const values = current.monthly.map(m => dashboardMetric === 'revenue' ? m.revenue : m.count);
        UI.drawLineChart($('#salesChart'), labels, values, { money: dashboardMetric === 'revenue', color: '#2f6b45' });
        if (current.categories.length) UI.drawDonutChart($('#categoryChart'), current.categories, DONUT_COLORS, '销售额 / 元');
      }, 240));
    }
  }

  /* ---------------- 产品管理 ---------------- */
  function initProductsPage() {
    const state = { keyword: '', category: '', status: '', page: 1, size: 8 };
    const orchards = DB.getOrchards();
    const render = () => {
      let list = DB.getProducts();
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        list = list.filter(p => [p.name, p.origin, ...(p.tags || [])].join(' ').toLowerCase().includes(kw));
      }
      if (state.category) list = list.filter(p => p.category === state.category);
      if (state.status) list = list.filter(p => p.status === state.status);
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const pg = pageSlice(list, state.page, state.size);
      state.page = pg.page;
      const body = $('#productTableBody');
      body.innerHTML = pg.data.length ? pg.data.map(p => `<tr>
        <td><div class="cell-main"><img src="../${esc(p.image)}" alt=""><div><div class="cm-name">${esc(p.name)}</div><div class="cm-sub">${esc(p.spec || '')}</div></div></div></td>
        <td>${esc(p.category)}</td>
        <td><span class="money">¥${DB.money(p.price)}</span><span style="font-size:10px;color:var(--muted)">/${esc(p.unit)}</span></td>
        <td><span style="color:${p.stock <= 100 ? 'var(--danger)' : 'inherit'};font-weight:${p.stock <= 100 ? '700' : '400'}">${p.stock}</span><span style="font-size:10px;color:var(--muted)"> ${esc(p.unit)}</span></td>
        <td>${UI.formatNum(p.sales)}</td>
        <td>${esc((orchards.find(o => o.id === p.orchardId) || {}).name || '—')}</td>
        <td>${UI.statusBadge(p.status)}</td>
        <td><div class="table-actions">
          <button class="act-btn" type="button" data-product-edit="${esc(p.id)}" title="编辑">${UI.icon('edit')}</button>
          <button class="act-btn" type="button" data-product-toggle="${esc(p.id)}" title="${p.status === '上架' ? '下架' : '上架'}">${UI.icon(p.status === '上架' ? 'eye-off' : 'eye')}</button>
          <button class="act-btn danger" type="button" data-product-delete="${esc(p.id)}" title="删除">${UI.icon('trash')}</button>
        </div></td>
      </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:34px">没有符合条件的产品</td></tr>`;
      $('#productTotalTip').textContent = `共 ${pg.total} 款产品`;
      $('#productTableFoot').innerHTML = `<span>第 ${pg.page} / ${pg.pages} 页，共 ${pg.total} 条</span><div class="table-pager">${pagerHTML(pg.total, pg.page, pg.size)}</div>`;
      bindPager($('#productTableFoot'), pg.total, pg.page, pg.size, next => { state.page = next; render(); });
    };
    $('#productSearch').oninput = UI.debounce(e => { state.keyword = e.target.value.trim(); state.page = 1; render(); }, 200);
    $('#productCategoryFilter').onchange = e => { state.category = e.target.value; state.page = 1; render(); };
    $('#productStatusFilter').onchange = e => { state.status = e.target.value; state.page = 1; render(); };
    $('#addProductBtn').onclick = () => openProductModal();
    $('#productTableBody').onclick = async e => {
      const edit = e.target.closest('[data-product-edit]');
      const toggle = e.target.closest('[data-product-toggle]');
      const del = e.target.closest('[data-product-delete]');
      if (edit) openProductModal(DB.getProduct(edit.dataset.productEdit));
      if (toggle) {
        const p = DB.getProduct(toggle.dataset.productToggle);
        if (!p) return;
        const res = DB.saveProduct({ ...p, status: p.status === '上架' ? '下架' : '上架' });
        if (res.ok) { UI.toast(`产品已${res.item.status}`, 'success'); render(); }
        else UI.toast(res.message, 'error');
      }
      if (del) {
        const p = DB.getProduct(del.dataset.productDelete);
        if (!p) return;
        const ok = await UI.confirm(`确定删除“${p.name}”吗？删除后购物车中的该产品也会移除。`, { title: '删除产品', okText: '删除', danger: true });
        if (!ok) return;
        const res = DB.deleteProduct(p.id);
        if (res.ok) { UI.toast('产品已删除', 'success'); render(); }
        else UI.toast(res.message, 'error');
      }
    };
    render();
  }

  function openProductModal(p) {
    p = p || {};
    const isEdit = !!p.id;
    const orchards = DB.getOrchards();
    const selectedImage = p.image || 'assets/img/product-kiwi.jpg';
    const m = UI.modal({
      title: isEdit ? '编辑产品' : '新增产品',
      subtitle: isEdit ? p.id : '填写产品信息后保存，即可在前台商城展示',
      size: 'lg',
      body: `<form id="productForm" class="form-grid-2" novalidate>
        <input type="hidden" name="id" value="${esc(p.id || '')}">
        <div class="form-group"><label class="form-label">产品名称 <span class="req">*</span></label><input class="input" name="name" value="${esc(p.name || '')}" placeholder="例如：米良1号猕猴桃"><div class="field-error" data-error="name"></div></div>
        <div class="form-group"><label class="form-label">品类</label><select class="select" name="category">${options([['鲜果', '鲜果'], ['山货', '山货'], ['茶叶', '茶叶']], p.category || '鲜果')}</select></div>
        <div class="form-group"><label class="form-label">价格（元） <span class="req">*</span></label><input class="input" name="price" type="number" min="0.01" step="0.01" value="${esc(p.price || '')}"><div class="field-error" data-error="price"></div></div>
        <div class="form-group"><label class="form-label">计价单位</label><select class="select" name="unit">${options([['斤', '斤'], ['箱', '箱'], ['瓶', '瓶'], ['盒', '盒'], ['份', '份']], p.unit || '斤')}</select></div>
        <div class="form-group"><label class="form-label">库存</label><input class="input" name="stock" type="number" min="0" step="1" value="${esc(p.stock != null ? p.stock : 100)}"></div>
        <div class="form-group"><label class="form-label">规格</label><input class="input" name="spec" value="${esc(p.spec || '')}" placeholder="例如：净重5斤/箱"></div>
        <div class="form-group"><label class="form-label">所属果园</label><select class="select" name="orchardId">${options([['', '不指定']].concat(orchards.map(o => [o.id, o.name])), p.orchardId || '')}</select></div>
        <div class="form-group"><label class="form-label">产地展示名</label><input class="input" name="origin" value="${esc(p.origin || '')}" placeholder="例如：湘西·十八洞"></div>
        <div class="form-group"><label class="form-label">产品图片</label><div class="file-input-wrap"><img class="image-preview" id="productImagePreview" src="../${esc(selectedImage)}" alt=""><select class="select" name="image" id="productImageSelect">${options(PRODUCT_IMAGES, selectedImage)}</select></div></div>
        <div class="form-group"><label class="form-label">标签（逗号分隔）</label><input class="input" name="tags" value="${esc((p.tags || []).join('，'))}" placeholder="高山种植，现摘现发"></div>
        <div class="form-group"><label class="form-label">状态</label><select class="select" name="status">${options([['上架', '上架'], ['下架', '下架']], p.status || '上架')}</select></div>
        <div class="form-group"><label class="form-label">是否推荐</label><label class="checkbox-row" style="min-height:40px"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> 在前台首页推荐该产品</label></div>
        <div class="form-group full"><label class="form-label">简短描述</label><textarea class="textarea" name="description" style="min-height:74px">${esc(p.description || '')}</textarea></div>
        <div class="form-group full"><label class="form-label">详情介绍</label><textarea class="textarea" name="detail" style="min-height:104px">${esc(p.detail || '')}</textarea></div>
      </form>`,
      footer: `<button type="button" class="btn btn-ghost js-modal-close">取消</button><button type="submit" form="productForm" class="btn btn-primary">保存产品</button>`
    });
    $('#productImageSelect').addEventListener('change', e => { $('#productImagePreview').src = '../' + e.target.value; });
    $('#productForm').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.currentTarget;
      clearErrors(form);
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      data.featured = fd.get('featured') === 'on';
      if (!data.name.trim()) return setError(form, 'name', '请填写产品名称');
      if (!data.price || Number(data.price) <= 0) return setError(form, 'price', '请输入正确的价格');
      const res = DB.saveProduct(data);
      if (!res.ok) { UI.toast(res.message, 'error'); return; }
      UI.toast(isEdit ? '产品已更新' : '产品已新增', 'success');
      m.close();
      initProductsPage();
    });
  }

  /* ---------------- 订单管理 ---------------- */
  function initOrders() {
    const state = { keyword: '', status: '', page: 1, size: 8 };
    const renderKpi = () => {
      const all = DB.getOrders();
      const counts = { 待付款: 0, 待发货: 0, 已发货: 0, 已完成: 0 };
      all.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
      const box = $('#orderKpis');
      if (box) box.innerHTML = `
        <article class="kpi-card"><div class="kpi-head"><span class="kpi-label">全部订单</span><span class="kpi-icon blue">${UI.icon('package')}</span></div><div class="kpi-value">${all.length}<small>笔</small></div></article>
        <article class="kpi-card"><div class="kpi-head"><span class="kpi-label">待发货</span><span class="kpi-icon citrus">${UI.icon('truck')}</span></div><div class="kpi-value">${counts.待发货}<small>笔</small></div></article>
        <article class="kpi-card"><div class="kpi-head"><span class="kpi-label">已发货</span><span class="kpi-icon">${UI.icon('package')}</span></div><div class="kpi-value">${counts.已发货}<small>笔</small></div></article>
        <article class="kpi-card"><div class="kpi-head"><span class="kpi-label">已完成</span><span class="kpi-icon">${UI.icon('check-circle')}</span></div><div class="kpi-value">${counts.已完成}<small>笔</small></div></article>`;
      const tip = $('#pendingOrderTip');
      if (tip) tip.textContent = `待发货 ${counts.待发货} 笔`;
    };
    const render = () => {
      let list = DB.getOrders();
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        list = list.filter(o => [o.orderNo, o.customerName, o.phone].join(' ').toLowerCase().includes(kw));
      }
      if (state.status) list = list.filter(o => o.status === state.status);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const pg = pageSlice(list, state.page, state.size);
      state.page = pg.page;
      $('#orderTableBody').innerHTML = pg.data.length ? pg.data.map(o => `<tr>
        <td><div class="mono">${esc(o.orderNo)}</div><div style="font-size:10px;color:var(--muted)">${DB.formatDate(o.createdAt, true)}</div></td>
        <td><div class="cm-name">${esc(o.customerName)}</div><div class="cm-sub">${esc(o.phone)}</div></td>
        <td><div style="font-size:11px">${esc(o.items[0] ? o.items[0].name : '—')}${o.items.length > 1 ? ` 等 ${o.items.length} 件` : ''}</div><div class="cm-sub">${o.items.reduce((s, it) => s + it.qty, 0)} 件商品</div></td>
        <td><span class="money">¥${DB.money(o.total)}</span></td>
        <td>${esc(o.payMethod || '—')}</td>
        <td>${UI.statusBadge(o.status)}</td>
        <td><div class="table-actions"><button class="act-text" type="button" data-order-view="${esc(o.id)}">详情</button>${o.status === '待付款' ? `<button class="act-text" type="button" data-order-set="${esc(o.id)}" data-status="待发货">标记已付</button>` : ''}${o.status === '待发货' ? `<button class="act-text" type="button" data-order-set="${esc(o.id)}" data-status="已发货">发货</button>` : ''}${o.status === '已发货' ? `<button class="act-text" type="button" data-order-set="${esc(o.id)}" data-status="已完成">完成</button>` : ''}</div></td>
      </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:34px">没有符合条件的订单</td></tr>`;
      $('#orderTotalTip').textContent = `共 ${pg.total} 笔订单`;
      $('#orderTableFoot').innerHTML = `<span>第 ${pg.page} / ${pg.pages} 页，共 ${pg.total} 条</span><div class="table-pager">${pagerHTML(pg.total, pg.page, pg.size)}</div>`;
      bindPager($('#orderTableFoot'), pg.total, pg.page, pg.size, next => { state.page = next; render(); });
    };
    renderKpi();
    render();
    $('#orderSearch').oninput = UI.debounce(e => { state.keyword = e.target.value.trim(); state.page = 1; render(); }, 200);
    $('#orderStatusFilter').onchange = e => { state.status = e.target.value; state.page = 1; render(); };
    $('#orderTableBody').onclick = e => {
      const view = e.target.closest('[data-order-view]');
      const set = e.target.closest('[data-order-set]');
      if (view) openOrderModal(view.dataset.orderView);
      if (set) {
        const res = DB.updateOrderStatus(set.dataset.orderSet, set.dataset.status, `管理员将订单更新为${set.dataset.status}`);
        if (!res.ok) return UI.toast(res.message, 'error');
        UI.toast(`订单已更新为${set.dataset.status}`, 'success');
        renderKpi(); render();
      }
    };
  }

  /* ---------------- 果园管理 ---------------- */
  function initOrchardsPage() {
    const state = { keyword: '', region: '', page: 1, size: 8 };
    const regions = [...new Set(DB.getOrchards().map(o => o.region))];
    const regionSelect = $('#orchardRegionFilter');
    if (regionSelect) regionSelect.innerHTML = '<option value="">全部产区</option>' + regions.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
    const render = () => {
      let list = DB.getOrchards();
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        list = list.filter(o => [o.name, o.region, o.village, o.manager].join(' ').toLowerCase().includes(kw));
      }
      if (state.region) list = list.filter(o => o.region === state.region);
      const pg = pageSlice(list, state.page, state.size);
      state.page = pg.page;
      $('#orchardTableBody').innerHTML = pg.data.length ? pg.data.map(o => `<tr>
        <td><div class="cell-main"><img src="../${esc(o.image)}" alt=""><div><div class="cm-name">${esc(o.name)}</div><div class="cm-sub">${esc(o.village)}</div></div></div></td>
        <td><span class="badge badge-muted">${esc(o.region)}</span></td>
        <td>${o.area} 亩<br><span style="font-size:10px;color:var(--muted)">海拔 ${o.altitude}m</span></td>
        <td><div style="font-size:11px">${esc((o.varieties || []).slice(0, 2).join('、'))}</div></td>
        <td><div style="font-size:11px">${esc(o.manager)}</div><div class="cm-sub">${esc(o.phone)}</div></td>
        <td>${DB.productsByOrchard(o.id).length}</td>
        <td>${UI.statusBadge(o.status)}</td>
        <td><div class="table-actions"><button class="act-btn" type="button" data-orchard-edit="${esc(o.id)}" title="编辑">${UI.icon('edit')}</button><button class="act-btn danger" type="button" data-orchard-delete="${esc(o.id)}" title="删除">${UI.icon('trash')}</button></div></td>
      </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:34px">没有符合条件的果园</td></tr>`;
      $('#orchardTotalTip').textContent = `共 ${pg.total} 座果园`;
      $('#orchardTableFoot').innerHTML = `<span>第 ${pg.page} / ${pg.pages} 页，共 ${pg.total} 条</span><div class="table-pager">${pagerHTML(pg.total, pg.page, pg.size)}</div>`;
      bindPager($('#orchardTableFoot'), pg.total, pg.page, pg.size, next => { state.page = next; render(); });
    };
    $('#orchardSearch').oninput = UI.debounce(e => { state.keyword = e.target.value.trim(); state.page = 1; render(); }, 200);
    if (regionSelect) regionSelect.onchange = e => { state.region = e.target.value; state.page = 1; render(); };
    $('#addOrchardBtn').onclick = () => openOrchardModal();
    $('#orchardTableBody').onclick = async e => {
      const edit = e.target.closest('[data-orchard-edit]');
      const del = e.target.closest('[data-orchard-delete]');
      if (edit) openOrchardModal(DB.getOrchard(edit.dataset.orchardEdit));
      if (del) {
        const o = DB.getOrchard(del.dataset.orchardDelete);
        if (!o) return;
        const ok = await UI.confirm(`确定删除“${o.name}”吗？该果园下若仍有产品将无法删除。`, { title: '删除果园', okText: '删除', danger: true });
        if (!ok) return;
        const res = DB.deleteOrchard(o.id);
        if (res.ok) { UI.toast('果园已删除', 'success'); render(); }
        else UI.toast(res.message, 'error');
      }
    };
    render();
  }

  function openOrchardModal(o) {
    o = o || {};
    const isEdit = !!o.id;
    const selectedImage = o.image || 'assets/img/orchard-1.jpg';
    const m = UI.modal({
      title: isEdit ? '编辑果园' : '新增果园',
      subtitle: isEdit ? o.id : '录入合作果园的基础档案',
      size: 'lg',
      body: `<form id="orchardForm" class="form-grid-2" novalidate>
        <input type="hidden" name="id" value="${esc(o.id || '')}">
        <div class="form-group"><label class="form-label">果园名称 <span class="req">*</span></label><input class="input" name="name" value="${esc(o.name || '')}"><div class="field-error" data-error="name"></div></div>
        <div class="form-group"><label class="form-label">所属产区</label><select class="select" name="region">${options([['湘西', '湘西'], ['张家界', '张家界'], ['怀化', '怀化'], ['铜仁', '铜仁'], ['恩施', '恩施'], ['黔江', '黔江']], o.region || '湘西')}</select></div>
        <div class="form-group full"><label class="form-label">详细地址</label><input class="input" name="village" value="${esc(o.village || '')}" placeholder="省 / 市 / 县 / 乡镇 / 村"></div>
        <div class="form-group"><label class="form-label">种植面积（亩）</label><input class="input" name="area" type="number" min="0" value="${esc(o.area || 0)}"></div>
        <div class="form-group"><label class="form-label">平均海拔（米）</label><input class="input" name="altitude" type="number" min="0" value="${esc(o.altitude || 0)}"></div>
        <div class="form-group"><label class="form-label">负责人</label><input class="input" name="manager" value="${esc(o.manager || '')}"></div>
        <div class="form-group"><label class="form-label">联系电话</label><input class="input" name="phone" value="${esc(o.phone || '')}"></div>
        <div class="form-group"><label class="form-label">主栽品种（逗号分隔）</label><input class="input" name="varieties" value="${esc((o.varieties || []).join('，'))}"></div>
        <div class="form-group"><label class="form-label">标签（逗号分隔）</label><input class="input" name="tags" value="${esc((o.tags || []).join('，'))}"></div>
        <div class="form-group"><label class="form-label">果园图片</label><div class="file-input-wrap"><img class="image-preview" id="orchardImagePreview" src="../${esc(selectedImage)}" alt=""><select class="select" name="image" id="orchardImageSelect">${options(ORCHARD_IMAGES, selectedImage)}</select></div></div>
        <div class="form-group"><label class="form-label">状态</label><select class="select" name="status">${options([['正常', '正常'], ['暂停合作', '暂停合作']], o.status || '正常')}</select></div>
        <div class="form-group full"><label class="form-label">简介</label><textarea class="textarea" name="intro" style="min-height:74px">${esc(o.intro || '')}</textarea></div>
        <div class="form-group full"><label class="form-label">详细介绍</label><textarea class="textarea" name="detail" style="min-height:104px">${esc(o.detail || '')}</textarea></div>
      </form>`,
      footer: `<button type="button" class="btn btn-ghost js-modal-close">取消</button><button type="submit" form="orchardForm" class="btn btn-primary">保存果园</button>`
    });
    $('#orchardImageSelect').addEventListener('change', e => { $('#orchardImagePreview').src = '../' + e.target.value; });
    $('#orchardForm').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.currentTarget;
      clearErrors(form);
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name.trim()) return setError(form, 'name', '请填写果园名称');
      const res = DB.saveOrchard(data);
      if (!res.ok) { UI.toast(res.message, 'error'); return; }
      UI.toast(isEdit ? '果园已更新' : '果园已新增', 'success');
      m.close();
      initOrchardsPage();
    });
  }

  /* ---------------- 资讯管理 ---------------- */
  function initNewsPage() {
    const state = { keyword: '', category: '', page: 1, size: 8 };
    const render = () => {
      let list = DB.getNews();
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        list = list.filter(n => [n.title, n.author].join(' ').toLowerCase().includes(kw));
      }
      if (state.category) list = list.filter(n => n.category === state.category);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const pg = pageSlice(list, state.page, state.size);
      state.page = pg.page;
      $('#newsTableBody').innerHTML = pg.data.length ? pg.data.map(n => `<tr>
        <td><div class="cell-main"><img src="../${esc(n.cover)}" alt=""><div><div class="cm-name">${esc(n.title)}</div><div class="cm-sub">${esc(n.summary).slice(0, 30)}…</div></div></div></td>
        <td><span class="badge badge-muted">${esc(n.category)}</span></td>
        <td>${esc(n.author)}</td>
        <td>${UI.formatNum(n.views)}</td>
        <td>${UI.statusBadge(n.status)}</td>
        <td>${DB.formatDate(n.createdAt)}</td>
        <td><div class="table-actions"><a class="act-btn" href="../news-detail.html?id=${encodeURIComponent(n.id)}" target="_blank" title="前台查看">${UI.icon('eye')}</a><button class="act-btn" type="button" data-news-edit="${esc(n.id)}" title="编辑">${UI.icon('edit')}</button><button class="act-btn danger" type="button" data-news-delete="${esc(n.id)}" title="删除">${UI.icon('trash')}</button></div></td>
      </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:34px">没有符合条件的资讯</td></tr>`;
      $('#newsTotalTip').textContent = `共 ${pg.total} 篇资讯`;
      $('#newsTableFoot').innerHTML = `<span>第 ${pg.page} / ${pg.pages} 页，共 ${pg.total} 条</span><div class="table-pager">${pagerHTML(pg.total, pg.page, pg.size)}</div>`;
      bindPager($('#newsTableFoot'), pg.total, pg.page, pg.size, next => { state.page = next; render(); });
    };
    $('#newsSearch').oninput = UI.debounce(e => { state.keyword = e.target.value.trim(); state.page = 1; render(); }, 200);
    $('#newsCategoryFilter').onchange = e => { state.category = e.target.value; state.page = 1; render(); };
    $('#addNewsBtn').onclick = () => openNewsModal();
    $('#newsTableBody').onclick = async e => {
      const edit = e.target.closest('[data-news-edit]');
      const del = e.target.closest('[data-news-delete]');
      if (edit) openNewsModal(DB.getNewsItem(edit.dataset.newsEdit));
      if (del) {
        const n = DB.getNewsItem(del.dataset.newsDelete);
        if (!n) return;
        const ok = await UI.confirm(`确定删除资讯“${n.title}”吗？`, { title: '删除资讯', okText: '删除', danger: true });
        if (!ok) return;
        DB.deleteNews(n.id);
        UI.toast('资讯已删除', 'success');
        render();
      }
    };
    render();
  }

  function openNewsModal(n) {
    n = n || {};
    const isEdit = !!n.id;
    const selectedCover = n.cover || 'assets/img/orchard-1.jpg';
    const m = UI.modal({
      title: isEdit ? '编辑资讯' : '发布资讯',
      subtitle: isEdit ? n.id : '内容支持纯文本，空行分段，以“## ”开头可生成小标题',
      size: 'lg',
      body: `<form id="newsForm" class="form-grid-2" novalidate>
        <input type="hidden" name="id" value="${esc(n.id || '')}">
        <div class="form-group full"><label class="form-label">资讯标题 <span class="req">*</span></label><input class="input" name="title" value="${esc(n.title || '')}"><div class="field-error" data-error="title"></div></div>
        <div class="form-group"><label class="form-label">所属栏目</label><select class="select" name="category">${options([['平台动态', '平台动态'], ['基地动态', '基地动态'], ['种植知识', '种植知识'], ['活动公告', '活动公告'], ['行业资讯', '行业资讯']], n.category || '平台动态')}</select></div>
        <div class="form-group"><label class="form-label">作者</label><input class="input" name="author" value="${esc(n.author || '平台运营组')}"></div>
        <div class="form-group"><label class="form-label">封面图</label><div class="file-input-wrap"><img class="image-preview" id="newsCoverPreview" src="../${esc(selectedCover)}" alt=""><select class="select" name="cover" id="newsCoverSelect">${options(ORCHARD_IMAGES, selectedCover)}</select></div></div>
        <div class="form-group"><label class="form-label">状态</label><select class="select" name="status">${options([['已发布', '已发布'], ['草稿', '草稿']], n.status || '已发布')}</select></div>
        <div class="form-group full"><label class="form-label">摘要</label><textarea class="textarea" name="summary" style="min-height:64px">${esc(n.summary || '')}</textarea></div>
        <div class="form-group full"><label class="form-label">正文</label><textarea class="textarea" name="content" style="min-height:230px">${esc(n.content || '')}</textarea></div>
      </form>`,
      footer: `<button type="button" class="btn btn-ghost js-modal-close">取消</button><button type="submit" form="newsForm" class="btn btn-primary">保存资讯</button>`
    });
    $('#newsCoverSelect').addEventListener('change', e => { $('#newsCoverPreview').src = '../' + e.target.value; });
    $('#newsForm').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.currentTarget;
      clearErrors(form);
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.title.trim()) return setError(form, 'title', '请填写资讯标题');
      if (!data.content.trim()) return UI.toast('请填写资讯正文', 'warning');
      const res = DB.saveNews(data);
      if (!res.ok) { UI.toast(res.message, 'error'); return; }
      UI.toast(isEdit ? '资讯已更新' : '资讯已发布', 'success');
      m.close();
      initNewsPage();
    });
  }

  /* ---------------- 用户管理 ---------------- */
  function initUsersPage() {
    const state = { keyword: '', status: '', role: '', page: 1, size: 10 };
    const render = () => {
      const orders = DB.getOrders();
      let list = DB.getUsers();
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        list = list.filter(u => [u.name, u.username, u.phone].join(' ').toLowerCase().includes(kw));
      }
      if (state.status) list = list.filter(u => u.status === state.status);
      if (state.role) list = list.filter(u => u.role === state.role);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const pg = pageSlice(list, state.page, state.size);
      state.page = pg.page;
      $('#userTableBody').innerHTML = pg.data.length ? pg.data.map(u => {
        const mine = orders.filter(o => o.userId === u.id && o.status !== '已取消');
        const spend = mine.reduce((s, o) => s + o.total, 0);
        return `<tr>
          <td><div class="cell-main"><div class="user-avatar" style="width:34px;height:34px;font-size:12px">${esc((u.name || 'U').slice(0, 1))}</div><div><div class="cm-name">${esc(u.name)}</div><div class="cm-sub">@${esc(u.username)}</div></div></div></td>
          <td>${esc(u.phone)}</td>
          <td>${u.role === 'admin' ? '<span class="badge badge-citrus">管理员</span>' : '<span class="badge badge-muted">普通用户</span>'}</td>
          <td>${mine.length}</td>
          <td><span class="money">¥${DB.money(spend)}</span></td>
          <td>${UI.statusBadge(u.status)}</td>
          <td>${DB.formatDate(u.createdAt)}</td>
          <td><div class="table-actions">
            <button class="act-btn" type="button" data-user-view="${esc(u.id)}" title="查看">${UI.icon('eye')}</button>
            ${u.role !== 'admin' ? `<button class="act-btn" type="button" data-user-toggle="${esc(u.id)}" title="${u.status === '正常' ? '停用' : '启用'}">${UI.icon(u.status === '正常' ? 'lock' : 'check')}</button><button class="act-btn" type="button" data-user-reset="${esc(u.id)}" title="重置密码">${UI.icon('refresh')}</button>` : ''}
          </div></td>
        </tr>`;
      }).join('') : `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:34px">没有符合条件的用户</td></tr>`;
      $('#userTotalTip').textContent = `共 ${DB.getUsers().filter(u => u.role === 'user').length} 位注册用户`;
      $('#userDataTip').textContent = `筛选结果 ${pg.total} 条`;
      $('#userTableFoot').innerHTML = `<span>第 ${pg.page} / ${pg.pages} 页，共 ${pg.total} 条</span><div class="table-pager">${pagerHTML(pg.total, pg.page, pg.size)}</div>`;
      bindPager($('#userTableFoot'), pg.total, pg.page, pg.size, next => { state.page = next; render(); });
    };
    $('#userSearch').oninput = UI.debounce(e => { state.keyword = e.target.value.trim(); state.page = 1; render(); }, 200);
    $('#userStatusFilter').onchange = e => { state.status = e.target.value; state.page = 1; render(); };
    $('#userRoleFilter').onchange = e => { state.role = e.target.value; state.page = 1; render(); };
    $('#userTableBody').onclick = async e => {
      const view = e.target.closest('[data-user-view]');
      const toggle = e.target.closest('[data-user-toggle]');
      const reset = e.target.closest('[data-user-reset]');
      if (view) {
        const u = DB.getUsers().find(x => x.id === view.dataset.userView);
        if (!u) return;
        const mine = DB.getOrders().filter(o => o.userId === u.id);
        UI.modal({
          title: '用户详情', subtitle: `@${u.username}`,
          body: `<div class="detail-list">
            <div class="dl-row"><span class="dl-k">姓名</span><span class="dl-v">${esc(u.name)}</span></div>
            <div class="dl-row"><span class="dl-k">手机号</span><span class="dl-v">${esc(u.phone)}</span></div>
            <div class="dl-row"><span class="dl-k">邮箱</span><span class="dl-v">${esc(u.email || '未填写')}</span></div>
            <div class="dl-row"><span class="dl-k">收货地址</span><span class="dl-v">${esc(u.address || '未填写')}</span></div>
            <div class="dl-row"><span class="dl-k">角色</span><span class="dl-v">${u.role === 'admin' ? '管理员' : '普通用户'}</span></div>
            <div class="dl-row"><span class="dl-k">状态</span><span class="dl-v">${UI.statusBadge(u.status)}</span></div>
            <div class="dl-row"><span class="dl-k">注册时间</span><span class="dl-v">${DB.formatDate(u.createdAt, true)}</span></div>
            <div class="dl-row"><span class="dl-k">订单数量</span><span class="dl-v">${mine.length} 笔</span></div>
          </div>`
        });
      }
      if (toggle) {
        const u = DB.getUsers().find(x => x.id === toggle.dataset.userToggle);
        if (!u) return;
        const next = u.status === '正常' ? '停用' : '正常';
        const ok = await UI.confirm(`确定${next === '正常' ? '启用' : '停用'}用户“${u.name}”吗？`, { title: '账户状态', okText: '确定', danger: next === '停用' });
        if (!ok) return;
        const res = DB.setUserStatus(u.id, next);
        if (res.ok) { UI.toast(`账号已${next}`, 'success'); render(); }
        else UI.toast(res.message, 'error');
      }
      if (reset) {
        const u = DB.getUsers().find(x => x.id === reset.dataset.userReset);
        if (!u) return;
        const ok = await UI.confirm(`将“${u.name}”的密码重置为 123456？`, { title: '重置密码', okText: '重置' });
        if (!ok) return;
        DB.resetUserPassword(u.id, '123456');
        UI.toast('密码已重置为 123456', 'success');
      }
    };
    render();
  }

  /* ---------------- 留言管理 ---------------- */
  function initMessagesPage() {
    const state = { keyword: '', status: '', page: 1, size: 8 };
    const render = () => {
      let list = DB.getMessages();
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        list = list.filter(m => [m.name, m.phone, m.content].join(' ').toLowerCase().includes(kw));
      }
      if (state.status) list = list.filter(m => m.status === state.status);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const pg = pageSlice(list, state.page, state.size);
      state.page = pg.page;
      $('#messageTableBody').innerHTML = pg.data.length ? pg.data.map(m => `<tr>
        <td><div class="cm-name">${esc(m.name)}</div><div class="cm-sub">${esc(m.email || '未留邮箱')}</div></td>
        <td><span class="mono">${esc(m.phone)}</span></td>
        <td><div style="max-width:300px;font-size:11.5px;line-height:1.7;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(m.content)}</div></td>
        <td>${UI.statusBadge(m.status)}</td>
        <td>${DB.formatDate(m.createdAt, true)}</td>
        <td><div class="table-actions"><button class="act-btn" type="button" data-message-view="${esc(m.id)}" title="查看/回复">${UI.icon('message')}</button><button class="act-btn danger" type="button" data-message-delete="${esc(m.id)}" title="删除">${UI.icon('trash')}</button></div></td>
      </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:34px">没有符合条件的留言</td></tr>`;
      const pending = DB.getMessages().filter(m => m.status === '待回复').length;
      $('#pendingMessageTip').textContent = `待回复 ${pending} 条`;
      $('#messageTotalTip').textContent = `共 ${pg.total} 条留言`;
      $('#messageTableFoot').innerHTML = `<span>第 ${pg.page} / ${pg.pages} 页，共 ${pg.total} 条</span><div class="table-pager">${pagerHTML(pg.total, pg.page, pg.size)}</div>`;
      bindPager($('#messageTableFoot'), pg.total, pg.page, pg.size, next => { state.page = next; render(); });
    };
    $('#messageSearch').oninput = UI.debounce(e => { state.keyword = e.target.value.trim(); state.page = 1; render(); }, 200);
    $('#messageStatusFilter').onchange = e => { state.status = e.target.value; state.page = 1; render(); };
    $('#messageTableBody').onclick = async e => {
      const view = e.target.closest('[data-message-view]');
      const del = e.target.closest('[data-message-delete]');
      if (view) openMessageModal(view.dataset.messageView);
      if (del) {
        const ok = await UI.confirm('确定删除这条留言吗？删除后不可恢复。', { title: '删除留言', okText: '删除', danger: true });
        if (!ok) return;
        DB.deleteMessage(del.dataset.messageDelete);
        UI.toast('留言已删除', 'success');
        render();
      }
    };
    render();
  }

  function openMessageModal(id) {
    const m = DB.getMessages().find(x => x.id === id);
    if (!m) return;
    const modal = UI.modal({
      title: '留言详情', subtitle: `${m.name} · ${m.phone}`,
      body: `<div class="detail-list">
        <div class="dl-row"><span class="dl-k">留言时间</span><span class="dl-v">${DB.formatDate(m.createdAt, true)}</span></div>
        <div class="dl-row"><span class="dl-k">联系邮箱</span><span class="dl-v">${esc(m.email || '未填写')}</span></div>
        <div class="dl-row"><span class="dl-k">留言内容</span><span class="dl-v" style="line-height:1.9">${esc(m.content)}</span></div>
        <div class="dl-row"><span class="dl-k">当前状态</span><span class="dl-v">${UI.statusBadge(m.status)}</span></div>
      </div>
      ${m.reply ? `<div class="reply-box"><strong>已回复：</strong><br>${esc(m.reply)}<div style="font-size:10px;color:var(--muted);margin-top:6px">${DB.formatDate(m.repliedAt, true)}</div></div>` : ''}
      <form id="replyForm" style="margin-top:16px"><div class="form-group"><label class="form-label">回复内容</label><textarea class="textarea" name="reply" style="min-height:104px" placeholder="输入回复内容，保存后状态变为已回复">${esc(m.reply || '')}</textarea></div></form>`,
      footer: `<button class="btn btn-ghost js-modal-close" type="button">关闭</button><button class="btn btn-primary" type="button" id="saveReplyBtn">保存回复</button>`
    });
    $('#saveReplyBtn').addEventListener('click', () => {
      const reply = $('#replyForm [name="reply"]').value.trim();
      if (!reply) return UI.toast('请输入回复内容', 'warning');
      const res = DB.replyMessage(m.id, reply);
      if (!res.ok) return UI.toast(res.message, 'error');
      UI.toast('回复已保存', 'success');
      modal.close();
      initMessagesPage();
    });
  }

  /* ---------------- 预约管理 ---------------- */
  function initBookingsPage() {
    const state = { keyword: '', status: '', page: 1, size: 8 };
    const render = () => {
      let list = DB.getBookings();
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        list = list.filter(b => [b.name, b.phone, b.orchardName].join(' ').toLowerCase().includes(kw));
      }
      if (state.status) list = list.filter(b => b.status === state.status);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const pg = pageSlice(list, state.page, state.size);
      state.page = pg.page;
      $('#bookingTableBody').innerHTML = pg.data.length ? pg.data.map(b => {
        const o = DB.getOrchard(b.orchardId);
        return `<tr>
          <td><div class="cm-name">${esc(b.name)}</div><div class="cm-sub">${esc(b.phone)}</div></td>
          <td>${esc(b.orchardName || (o ? o.name : '—'))}</td>
          <td>${esc(b.date)}</td>
          <td>${b.people} 人</td>
          <td><div style="max-width:200px;font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(b.remark || '无')}</div></td>
          <td>${UI.statusBadge(b.status)}</td>
          <td><div class="table-actions">
            <button class="act-btn" type="button" data-booking-view="${esc(b.id)}" title="查看">${UI.icon('eye')}</button>
            ${b.status === '待确认' ? `<button class="act-btn" type="button" data-booking-set="${esc(b.id)}" data-status="已确认" title="确认">${UI.icon('check')}</button>` : ''}
            ${b.status === '已确认' ? `<button class="act-btn" type="button" data-booking-set="${esc(b.id)}" data-status="已完成" title="完成">${UI.icon('check-circle')}</button>` : ''}
            ${['待确认', '已确认'].includes(b.status) ? `<button class="act-btn danger" type="button" data-booking-set="${esc(b.id)}" data-status="已取消" title="取消">${UI.icon('x-circle')}</button>` : ''}
          </div></td>
        </tr>`;
      }).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:34px">没有符合条件的预约</td></tr>`;
      const pending = DB.getBookings().filter(b => b.status === '待确认').length;
      $('#pendingBookingTip').textContent = `待确认 ${pending} 条`;
      $('#bookingTotalTip').textContent = `共 ${pg.total} 条预约`;
      $('#bookingTableFoot').innerHTML = `<span>第 ${pg.page} / ${pg.pages} 页，共 ${pg.total} 条</span><div class="table-pager">${pagerHTML(pg.total, pg.page, pg.size)}</div>`;
      bindPager($('#bookingTableFoot'), pg.total, pg.page, pg.size, next => { state.page = next; render(); });
    };
    $('#bookingSearch').oninput = UI.debounce(e => { state.keyword = e.target.value.trim(); state.page = 1; render(); }, 200);
    $('#bookingStatusFilter').onchange = e => { state.status = e.target.value; state.page = 1; render(); };
    $('#bookingTableBody').onclick = async e => {
      const view = e.target.closest('[data-booking-view]');
      const set = e.target.closest('[data-booking-set]');
      if (view) {
        const b = DB.getBookings().find(x => x.id === view.dataset.bookingView);
        if (!b) return;
        const o = DB.getOrchard(b.orchardId);
        UI.modal({
          title: '预约详情', subtitle: b.id,
          body: `<div class="detail-list">
            <div class="dl-row"><span class="dl-k">果园</span><span class="dl-v">${esc(b.orchardName || (o ? o.name : '—'))}</span></div>
            <div class="dl-row"><span class="dl-k">预约人</span><span class="dl-v">${esc(b.name)} · ${esc(b.phone)}</span></div>
            <div class="dl-row"><span class="dl-k">到访日期</span><span class="dl-v">${esc(b.date)}</span></div>
            <div class="dl-row"><span class="dl-k">人数</span><span class="dl-v">${b.people} 人</span></div>
            <div class="dl-row"><span class="dl-k">备注</span><span class="dl-v">${esc(b.remark || '无')}</span></div>
            <div class="dl-row"><span class="dl-k">提交时间</span><span class="dl-v">${DB.formatDate(b.createdAt, true)}</span></div>
            <div class="dl-row"><span class="dl-k">状态</span><span class="dl-v">${UI.statusBadge(b.status)}</span></div>
          </div>`
        });
      }
      if (set) {
        const status = set.dataset.status;
        const ok = await UI.confirm(`确定将预约状态更新为“${status}”吗？`, { title: '更新预约', okText: '确定', danger: status === '已取消' });
        if (!ok) return;
        const res = DB.updateBookingStatus(set.dataset.bookingSet, status);
        if (res.ok) { UI.toast(`预约已更新为${status}`, 'success'); render(); }
        else UI.toast(res.message, 'error');
      }
    };
    render();
  }

  /* ---------------- 系统设置 ---------------- */
  function initSettings() {
    const settings = DB.getSettings();
    const form = $('#settingsForm');
    Object.keys(settings).forEach(k => {
      const input = form.querySelector(`[name="${k}"]`);
      if (input) input.value = settings[k] == null ? '' : settings[k];
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      DB.saveSettings(data);
      UI.toast('站点设置已保存', 'success');
    });
    const exportBtn = $('#exportDataBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      const data = DB.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const a = document.createElement('a');
      const d = new Date();
      a.href = URL.createObjectURL(blob);
      a.download = `wuling-orchard-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      UI.toast('数据备份已导出', 'success');
    });
    const importFile = $('#importDataFile');
    if (importFile) importFile.addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const obj = JSON.parse(text);
        const ok = await UI.confirm('导入将覆盖当前业务数据，确定继续吗？', { title: '导入数据', okText: '覆盖并导入', danger: true });
        if (!ok) { importFile.value = ''; return; }
        const res = DB.importData(obj);
        if (!res.ok) { UI.toast(res.message, 'error'); importFile.value = ''; return; }
        UI.toast('数据导入成功，正在刷新', 'success');
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        UI.toast('文件解析失败，请选择系统导出的 JSON 文件', 'error');
      }
      importFile.value = '';
    });
    const reset = $('#resetDataBtn');
    if (reset) reset.addEventListener('click', async () => {
      const ok = await UI.confirm('将清空当前全部业务数据并恢复初始演示数据，该操作不可撤销。确定继续吗？', { title: '恢复演示数据', okText: '恢复数据', danger: true });
      if (!ok) return;
      DB.resetDemo();
      UI.toast('演示数据已恢复，即将返回登录页', 'success');
      setTimeout(() => location.replace('login.html'), 800);
    });
    const info = $('#systemInfo');
    if (info) {
      const s = DB.getSettings();
      const stats = DB.getStats();
      const ua = navigator.userAgent;
      const browser = /Edg\//.test(ua) ? 'Microsoft Edge' : /Chrome\//.test(ua) ? 'Google Chrome' : /Firefox\//.test(ua) ? 'Mozilla Firefox' : '当前浏览器';
      const rows = [
        ['系统版本', 'v1.0.0'],
        ['数据存储', DB.storageOK ? 'localStorage 本地存储' : '内存模式（刷新后丢失）'],
        ['浏览器', browser],
        ['注册用户', stats.userCount + ' 位'],
        ['产品数量', stats.productCount + ' 款'],
        ['订单数量', stats.orderCount + ' 笔'],
        ['合作果园', stats.orchardCount + ' 座'],
        ['最近更新', DB.formatDate(s.updateAt, true)]
      ];
      info.innerHTML = rows.map(([k, v]) => `<div class="quick-row"><div class="qr-copy"><div class="qr-name">${esc(k)}</div></div><div class="qr-val" style="color:var(--muted);font-weight:500;text-align:right">${esc(v)}</div></div>`).join('');
    }
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    DB.init();
    const page = document.body.dataset.adminPage;
    if (page === 'login') { initLogin(); return; }
    if (!DB.isAdmin()) {
      const redirect = encodeURIComponent(currentFile());
      location.replace('login.html?redirect=' + redirect);
      return;
    }
    mountShell(page);
    const routes = {
      dashboard: initDashboard,
      products: initProductsPage,
      orders: initOrders,
      orchards: initOrchardsPage,
      news: initNewsPage,
      users: initUsersPage,
      messages: initMessagesPage,
      bookings: initBookingsPage,
      settings: initSettings
    };
    if (routes[page]) routes[page]();
    if (page !== 'dashboard') {
      // 数据变更后侧边栏徽章不强制刷新，切页时自然更新
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
