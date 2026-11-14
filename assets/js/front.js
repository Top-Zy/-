/* =========================================================
   武陵山区果园管理系统 · 前台业务逻辑
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = UI.escape;

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
  function validPhone(v) { return /^1[3-9]\d{9}$/.test(String(v || '').trim()); }
  function shippingFee(subtotal) { return subtotal >= 99 || subtotal === 0 ? 0 : 10; }
  function safeRedirect(value, fallback) {
    if (!value) return fallback;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('javascript:')) return fallback;
    return value;
  }
  function currentUserOrRedirect() {
    const user = DB.getCurrentUser();
    if (!user) {
      location.replace('login.html?redirect=' + encodeURIComponent(location.pathname.split('/').pop() + location.search + location.hash));
      return null;
    }
    return user;
  }

  /* ---------------- 卡片渲染 ---------------- */
  function productCard(p, extraClass) {
    const stockTxt = p.stock <= 0 ? '<span class="badge badge-muted p-badge">暂时售罄</span>'
      : p.stock <= 100 ? `<span class="badge badge-citrus p-badge">仅剩 ${p.stock}${p.unit}</span>`
        : (p.featured ? '<span class="badge p-badge">当季推荐</span>' : '');
    return `<article class="product-card ${extraClass || ''}">
      <div class="product-media">
        <a href="product-detail.html?id=${encodeURIComponent(p.id)}" aria-label="查看${esc(p.name)}">
          <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
        </a>
        ${stockTxt}
        ${p.stock > 0 ? `<button class="quick-add" type="button" data-add-cart="${esc(p.id)}" aria-label="将${esc(p.name)}加入购物车">${UI.icon('plus')}</button>` : ''}
      </div>
      <div class="product-body">
        <div class="product-cat">${esc(p.category)} · ${esc(p.spec || '')}</div>
        <h3><a href="product-detail.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
        <div class="product-origin">${UI.icon('map-pin')}${esc(p.origin)}</div>
        <div class="product-bottom">
          <div>
            <div class="product-price">¥${DB.money(p.price)}<small>/${esc(p.unit)}</small></div>
            <div class="product-sales">已售 ${UI.formatNum(p.sales)} · 库存 ${p.stock}</div>
          </div>
          ${p.stock > 0 ? `<button class="add-cart-btn" type="button" data-add-cart="${esc(p.id)}" aria-label="加入购物车">${UI.icon('cart')}</button>` : `<span class="badge badge-muted">已售罄</span>`}
        </div>
      </div>
    </article>`;
  }

  function orchardCard(o) {
    return `<article class="orchard-card">
      <div class="orchard-media">
        <a href="orchard-detail.html?id=${encodeURIComponent(o.id)}" aria-label="查看${esc(o.name)}">
          <img src="${esc(o.image)}" alt="${esc(o.name)}" loading="lazy">
        </a>
        <span class="badge">${esc(o.region)}产区</span>
        <span class="o-area">${UI.icon('map-pin')}${esc(o.village)}</span>
      </div>
      <div class="orchard-body">
        <h3><a href="orchard-detail.html?id=${encodeURIComponent(o.id)}">${esc(o.name)}</a></h3>
        <p>${esc(o.intro)}</p>
        <div class="orchard-tags">${(o.tags || []).map(t => `<span class="badge badge-muted">${esc(t)}</span>`).join('')}</div>
        <div class="orchard-foot">
          <span class="variety">${esc((o.varieties || []).slice(0, 2).join(' · '))}</span>
          <span class="go">${UI.icon('arrow-up-right')}</span>
        </div>
      </div>
    </article>`;
  }

  function newsCard(n) {
    const d = new Date(n.createdAt);
    const day = String(d.getDate()).padStart(2, '0');
    const ym = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `<article class="news-card">
      <div class="news-media">
        <a href="news-detail.html?id=${encodeURIComponent(n.id)}" aria-label="阅读${esc(n.title)}"><img src="${esc(n.cover)}" alt="${esc(n.title)}" loading="lazy"></a>
        <div class="news-date"><strong>${day}</strong><span>${ym}</span></div>
      </div>
      <div class="news-body">
        <div class="n-cat">${esc(n.category)}</div>
        <h3><a href="news-detail.html?id=${encodeURIComponent(n.id)}">${esc(n.title)}</a></h3>
        <p>${esc(n.summary)}</p>
        <div class="news-meta"><span>${UI.icon('user')}${esc(n.author)}</span><span>${UI.icon('eye')}${UI.formatNum(n.views)} 阅读</span><span>${UI.icon('clock')}${DB.formatDate(n.createdAt)}</span></div>
      </div>
    </article>`;
  }

  /* ---------------- 首页 ---------------- */
  function initHome() {
    const stats = DB.getStats();
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('statOrchards', stats.orchardCount);
    setText('statProducts', stats.productCount);
    setText('statUsers', stats.userCount);
    setText('statOrders', stats.orderCount);
    const orchards = DB.getOrchards();
    if (orchards.length) {
      const firstOrchard = orchards[0];
      const villageShort = (firstOrchard.village || '').replace(/^.*?省/, '').replace(/^.*?[州市]/, '');
      setText('heroOrchardName', firstOrchard.name);
      setText('heroOrchardMeta', `${firstOrchard.region} · ${villageShort} · 海拔 ${firstOrchard.altitude}m`);
      setText('heroOrchardArea', `${firstOrchard.area} 亩`);
    }
    const featuredOrchards = $('#featuredOrchards');
    if (featuredOrchards) featuredOrchards.innerHTML = orchards.slice(0, 3).map(orchardCard).join('');
    const products = DB.getProducts().filter(p => p.status === '上架');
    const featured = [...products].filter(p => p.featured).sort((a, b) => b.sales - a.sales).slice(0, 4);
    const productBox = $('#featuredProducts');
    if (productBox) productBox.innerHTML = (featured.length ? featured : products.slice(0, 4)).map(p => productCard(p)).join('');
    const latest = [...DB.getNews()].filter(n => n.status === '已发布').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    const newsBox = $('#latestNews');
    if (newsBox) newsBox.innerHTML = latest.map(newsCard).join('');
  }

  /* ---------------- 果园列表 ---------------- */
  function initOrchards() {
    const state = { region: '全部', keyword: '' };
    const list = $('#orchardList');
    const count = $('#orchardCount');
    const search = $('#orchardSearch');
    const render = () => {
      const data = DB.getOrchards().filter(o => {
        if (state.region !== '全部' && o.region !== state.region) return false;
        if (state.keyword) {
          const text = [o.name, o.region, o.village, o.manager, ...(o.varieties || []), ...(o.tags || [])].join(' ');
          if (!text.toLowerCase().includes(state.keyword.toLowerCase())) return false;
        }
        return true;
      });
      if (count) count.textContent = data.length;
      list.innerHTML = data.length ? data.map(orchardCard).join('') : UI.emptyState('没有找到相关果园', '试试更换产区或搜索关键词。', '<a class="btn btn-primary btn-sm" href="orchards.html">查看全部</a>', 'sprout');
    };
    if (search) search.addEventListener('input', UI.debounce(() => { state.keyword = search.value.trim(); render(); }, 200));
    $$('#regionFilters [data-region]').forEach(btn => btn.addEventListener('click', () => {
      state.region = btn.dataset.region;
      $$('#regionFilters [data-region]').forEach(b => b.classList.toggle('active', b === btn));
      render();
    }));
    render();
  }

  /* ---------------- 果园详情 ---------------- */
  function initOrchardDetail() {
    const id = UI.param('id') || 'O001';
    const o = DB.getOrchard(id);
    const hero = $('#orchardHero');
    const page = $('#orchardPage');
    if (!o) {
      hero.innerHTML = `<div class="breadcrumb"><a href="index.html">首页</a><span>/</span><a href="orchards.html">合作果园</a></div><h1>未找到该果园</h1>`;
      page.innerHTML = `<div class="container section">${UI.emptyState('果园不存在或已下架', '返回果园列表看看其他合作基地。', '<a class="btn btn-primary" href="orchards.html">返回合作果园</a>', 'sprout')}</div>`;
      return;
    }
    document.title = `${o.name} · 武陵果园`;
    hero.innerHTML = `
      <div class="breadcrumb"><a href="index.html">首页</a>${UI.icon('chevron-right')}<a href="orchards.html">合作果园</a>${UI.icon('chevron-right')}<span class="current">${esc(o.name)}</span></div>
      <h1>${esc(o.name)}</h1>
      <p class="page-desc">${esc(o.intro)}</p>
      <div class="hero-chips"><span>${esc(o.region)}产区</span><span>海拔 ${o.altitude}m</span><span>${o.area} 亩</span>${(o.tags || []).slice(0, 2).map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
    const related = DB.productsByOrchard(o.id).filter(p => p.status === '上架');
    const user = DB.getCurrentUser();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    page.innerHTML = `
      <div class="container">
        <div class="detail-hero">
          <div class="detail-visual"><img src="${esc(o.image)}" alt="${esc(o.name)}"><span class="badge">${esc(o.region)}产区</span></div>
          <div class="detail-copy">
            <span class="eyebrow">PARTNER ORCHARD</span>
            <h1>${esc(o.name)}</h1>
            <div class="d-meta">
              <span>${UI.icon('map-pin')}${esc(o.village)}</span>
              <span>${UI.icon('user')}负责人：${esc(o.manager)}</span>
              <span>${UI.icon('mountain')}海拔 ${o.altitude} 米</span>
            </div>
            <p class="d-desc">${esc(o.detail || o.intro)}</p>
            <div class="detail-facts">
              <div><strong>${o.area}<small style="font-size:10px"> 亩</small></strong><span>种植面积</span></div>
              <div><strong>${o.altitude}<small style="font-size:10px"> m</small></strong><span>平均海拔</span></div>
              <div><strong>${(o.varieties || []).length}</strong><span>主栽品种</span></div>
            </div>
            <div class="detail-actions">
              <a class="btn btn-primary" href="#booking">预约采摘</a>
              <a class="btn btn-ghost" href="products.html">选购该果园产品</a>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="orchard-main-grid" id="orchardMainGrid">
            <div>
              <h2>关于这片果园</h2>
              <div class="prose">
                <p>${esc(o.detail || o.intro)}</p>
                <p>合作以来，果园坚持按平台标准记录农事与采摘批次，产品经分级后统一包装。你可以从产品详情页查看对应果园与批次信息。</p>
              </div>
              <h2 style="margin-top:34px">主栽品种</h2>
              <div class="orchard-tags" style="margin-top:14px">${(o.varieties || []).map(v => `<span class="badge badge-lg">${esc(v)}</span>`).join('')}</div>
              <h2 style="margin-top:34px">种植与管理</h2>
              <ul class="story-list" style="margin-top:16px">
                <li><span class="tick">${UI.icon('check')}</span><div><strong>生态种植</strong><span>人工除草、增施有机肥，按果树生长周期进行修剪与疏果。</span></div></li>
                <li><span class="tick">${UI.icon('check')}</span><div><strong>批次管理</strong><span>采摘日期、地块和分选等级记录在系统内，便于追溯。</span></div></li>
                <li><span class="tick">${UI.icon('check')}</span><div><strong>采后处理</strong><span>采后及时预冷、分级包装，按订单安排冷链发运。</span></div></li>
              </ul>
            </div>
            <aside class="booking-card" id="booking">
              <h3>预约到园采摘</h3>
              <p class="b-sub">${user ? '填写到访信息，管理员确认后会电话联系你。' : '登录后即可提交预约，管理员确认后会电话联系你。'}</p>
              <form id="bookingForm" novalidate>
                <div class="form-group" style="margin-bottom:12px"><label class="form-label">联系人</label><input class="input" name="name" id="bookingName" value="${user ? esc(user.name) : ''}" placeholder="怎么称呼您"><div class="field-error" data-error="name"></div></div>
                <div class="form-group" style="margin-bottom:12px"><label class="form-label">手机号</label><input class="input" name="phone" id="bookingPhone" value="${user ? esc(user.phone) : ''}" maxlength="11" placeholder="11 位手机号"><div class="field-error" data-error="phone"></div></div>
                <div style="display:grid;grid-template-columns:1fr 100px;gap:10px;margin-bottom:12px">
                  <div class="form-group"><label class="form-label">到访日期</label><input class="input" type="date" name="date" id="bookingDate" min="${minDate}"><div class="field-error" data-error="date"></div></div>
                  <div class="form-group"><label class="form-label">人数</label><input class="input" type="number" name="people" min="1" max="20" value="2"><div class="field-error" data-error="people"></div></div>
                </div>
                <div class="form-group" style="margin-bottom:14px"><label class="form-label">备注</label><textarea class="textarea" name="remark" style="min-height:74px" placeholder="例如：带小朋友、需要讲解"></textarea></div>
                <button class="btn btn-primary btn-block" type="submit">${user ? '提交预约' : '登录并预约'}</button>
              </form>
              <div class="booking-note">${UI.icon('info')}<span>预约免费，具体采摘时间和价格以果园确认为准。建议至少提前 3 天预约，雨天可改期。</span></div>
            </aside>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-head"><div><span class="eyebrow">FROM THIS ORCHARD</span><h2 class="section-title mt-2">来自这片果园的味道</h2></div><a class="link-more" href="products.html">全部产品 ${UI.icon('arrow-right')}</a></div>
          ${related.length ? `<div class="product-grid">${related.map(p => productCard(p)).join('')}</div>` : UI.emptyState('该果园暂无在售产品', '果园正在准备新一季的采收，先去商城看看其他好物。', '<a class="btn btn-primary btn-sm" href="products.html">去商城看看</a>', 'package')}
        </div>
      </div>`;

    const form = $('#bookingForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors(form);
      const u = DB.getCurrentUser();
      if (!u) {
        UI.toast('请先登录后再预约', 'info');
        setTimeout(() => { location.href = 'login.html?redirect=' + encodeURIComponent('orchard-detail.html?id=' + o.id + '#booking'); }, 400);
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      const res = DB.addBooking({ ...data, orchardId: o.id });
      if (!res.ok) {
        if (/联系人/.test(res.message)) setError(form, 'name', res.message);
        else if (/手机号/.test(res.message)) setError(form, 'phone', res.message);
        else if (/日期/.test(res.message)) setError(form, 'date', res.message);
        else if (/人数/.test(res.message)) setError(form, 'people', res.message);
        UI.toast(res.message, 'error');
        return;
      }
      UI.toast('预约已提交，管理员确认后会联系你', 'success');
      form.querySelector('[name="date"]').value = '';
      form.querySelector('[name="remark"]').value = '';
    });
  }

  /* ---------------- 商品列表 ---------------- */
  function initProducts() {
    const state = { category: '全部', keyword: '', sort: 'default' };
    const list = $('#productList');
    const count = $('#productCount');
    const search = $('#productSearch');
    const sort = $('#productSort');
    const render = () => {
      let data = DB.getProducts().filter(p => p.status === '上架');
      if (state.category !== '全部') data = data.filter(p => p.category === state.category);
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        data = data.filter(p => [p.name, p.origin, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(kw));
      }
      if (state.sort === 'price-asc') data.sort((a, b) => a.price - b.price);
      else if (state.sort === 'price-desc') data.sort((a, b) => b.price - a.price);
      else if (state.sort === 'sales') data.sort((a, b) => b.sales - a.sales);
      else data.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.sales - a.sales);
      if (count) count.textContent = data.length;
      list.innerHTML = data.length ? data.map(p => productCard(p)).join('') : UI.emptyState('没有找到相关产品', '换个关键词或品类试试，也可以看看全部好物。', '<button class="btn btn-primary btn-sm" type="button" id="resetProductFilter">查看全部</button>', 'search');
      const reset = $('#resetProductFilter');
      if (reset) reset.addEventListener('click', () => {
        state.category = '全部'; state.keyword = ''; if (search) search.value = '';
        $$('#categoryFilters [data-category]').forEach(b => b.classList.toggle('active', b.dataset.category === '全部'));
        render();
      });
    };
    if (search) search.addEventListener('input', UI.debounce(() => { state.keyword = search.value.trim(); render(); }, 200));
    if (sort) sort.addEventListener('change', () => { state.sort = sort.value; render(); });
    $$('#categoryFilters [data-category]').forEach(btn => btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      $$('#categoryFilters [data-category]').forEach(b => b.classList.toggle('active', b === btn));
      render();
    }));
    render();
  }

  /* ---------------- 商品详情 ---------------- */
  function initProductDetail() {
    const id = UI.param('id') || 'P001';
    const p = DB.getProduct(id);
    const hero = $('#productHero');
    const page = $('#productPage');
    if (!p) {
      hero.innerHTML = `<div class="breadcrumb"><a href="index.html">首页</a><span>/</span><a href="products.html">鲜果商城</a></div><h1>未找到该产品</h1>`;
      page.innerHTML = `<div class="container section">${UI.emptyState('产品不存在或已下架', '返回商城看看其他当季好物。', '<a class="btn btn-primary" href="products.html">返回鲜果商城</a>', 'package')}</div>`;
      return;
    }
    document.title = `${p.name} · 武陵果园`;
    const o = DB.getOrchard(p.orchardId);
    const related = DB.getProducts().filter(x => x.status === '上架' && x.id !== p.id && x.category === p.category).slice(0, 4);
    const stockClass = p.stock <= 0 ? 'badge-muted' : p.stock <= 100 ? 'badge-citrus' : '';
    hero.innerHTML = `
      <div class="breadcrumb"><a href="index.html">首页</a>${UI.icon('chevron-right')}<a href="products.html">鲜果商城</a>${UI.icon('chevron-right')}<span class="current">${esc(p.name)}</span></div>
      <h1>${esc(p.name)}</h1>
      <p class="page-desc">${esc(p.description)}</p>`;
    const gallery = [p.image, o ? o.image : p.image, 'assets/img/hero.jpg'];
    page.innerHTML = `
      <div class="container">
        <div class="product-detail">
          <div class="pd-gallery">
            <div class="main"><img id="pdMainImage" src="${esc(gallery[0])}" alt="${esc(p.name)}"></div>
            <div class="pd-thumbs">
              ${gallery.map((src, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-gallery-src="${esc(src)}"><img src="${esc(src)}" alt="产品图 ${i + 1}"></button>`).join('')}
            </div>
          </div>
          <div class="pd-copy">
            <div class="product-cat">${esc(p.category)} · ${esc(p.spec || '')}</div>
            <h1>${esc(p.name)}</h1>
            <div class="pd-rating">${UI.stars(5)}<span>4.9 分 · 已售 ${UI.formatNum(p.sales)} 件 · ${UI.formatNum(Math.round(p.sales / 8))} 条好评</span></div>
            <div class="pd-price-box">
              <div><div class="pd-price">¥${DB.money(p.price)}<small> / ${esc(p.unit)}</small></div><div style="font-size:11px;color:var(--muted);margin-top:6px">产地直供价 · ${esc(p.spec || '')}</div></div>
              <div class="pd-save">库存 <strong>${p.stock}</strong> ${esc(p.unit)}<br>满 99 元包邮</div>
            </div>
            <ul class="pd-info-list">
              <li><span class="k">产　地</span><span class="v">${esc(p.origin)}${o ? ` · <a href="orchard-detail.html?id=${encodeURIComponent(o.id)}" style="color:var(--forest-600);text-decoration:underline;text-underline-offset:3px">${esc(o.name)}</a>` : ''}</span></li>
              <li><span class="k">规　格</span><span class="v">${esc(p.spec || '—')}</span></li>
              <li><span class="k">储　存</span><span class="v">阴凉通风或冷藏保存，收到后尽快食用</span></li>
              <li><span class="k">发　货</span><span class="v">48 小时内产地发出，冷链配送</span></li>
            </ul>
            <div class="pd-buy-row">
              <div class="qty-stepper">
                <button type="button" id="pdMinus" aria-label="减少">−</button>
                <input type="number" id="pdQty" value="1" min="1" max="${Math.max(1, p.stock)}" aria-label="购买数量">
                <button type="button" id="pdPlus" aria-label="增加">＋</button>
              </div>
              <button class="btn btn-ghost" type="button" id="pdAddCart" ${p.stock <= 0 ? 'disabled' : ''}>${UI.icon('cart')}加入购物车</button>
              <button class="btn btn-citrus" type="button" id="pdBuyNow" ${p.stock <= 0 ? 'disabled' : ''}>立即购买</button>
            </div>
            <div class="pd-trust">
              <span>${UI.icon('shield')}坏果包赔</span><span>${UI.icon('truck')}产地直发</span><span>${UI.icon('leaf')}生态种植</span><span>${UI.icon('message')}客服在线</span>
            </div>
            ${p.stock <= 0 ? '<p style="margin-top:14px;font-size:12px;color:var(--danger)">该产品暂时售罄，可以关注下一季采收。</p>' : ''}
          </div>
        </div>

        <div class="detail-section">
          <div class="tabs" id="pdTabs">
            <button class="tab-btn active" type="button" data-tab="desc">商品详情</button>
            <button class="tab-btn" type="button" data-tab="origin">产地与溯源</button>
            <button class="tab-btn" type="button" data-tab="notice">购买须知</button>
          </div>
          <div class="tab-panel active" data-tab-panel="desc">
            <div class="prose" style="max-width:860px">
              <p>${esc(p.detail || p.description)}</p>
              <p>${esc(p.description)}</p>
              <h3>产品信息</h3>
              <p>品类：${esc(p.category)}　规格：${esc(p.spec || '—')}　产地：${esc(p.origin)}　发货地：合作果园产地仓</p>
            </div>
          </div>
          <div class="tab-panel" data-tab-panel="origin">
            <div class="prose" style="max-width:860px">
              <p>本产品来自${o ? esc(o.name) : esc(p.origin)}。${o ? esc(o.intro) : ''}</p>
              <p>${o ? `果园位于${esc(o.village)}，海拔约 ${o.altitude} 米，种植面积 ${o.area} 亩。` : ''}平台对采摘批次、分选等级和入库时间进行记录，消费者可通过包装批次信息了解产品来源。</p>
              ${o ? `<a class="btn btn-ghost btn-sm" href="orchard-detail.html?id=${encodeURIComponent(o.id)}">查看果园档案 ${UI.icon('arrow-right')}</a>` : ''}
            </div>
          </div>
          <div class="tab-panel" data-tab-panel="notice">
            <div class="prose" style="max-width:860px">
              <h3>发货与配送</h3><p>鲜果订单一般在 48 小时内发出，如遇雨天或采摘期调整，客服会提前联系。山货、茶叶通常 24 小时内发出。</p>
              <h3>售后说明</h3><p>收到后请及时开箱检查。如有破损、腐烂或重量不足，请在 24 小时内拍照联系客服，核实后按比例退款或补发。</p>
              <h3>保存建议</h3><p>不同果品保存方式略有差异，建议收到后冷藏保存，并尽快食用。蜂蜜低温结晶属正常物理现象，不影响品质。</p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-head"><div><span class="eyebrow">YOU MAY ALSO LIKE</span><h2 class="section-title mt-2">你可能也喜欢</h2></div><a class="link-more" href="products.html">全部好物 ${UI.icon('arrow-right')}</a></div>
          <div class="product-grid">${related.map(x => productCard(x)).join('')}</div>
        </div>
      </div>`;

    $$('#pdTabs .tab-btn').forEach(btn => btn.addEventListener('click', () => {
      $$('#pdTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      $$('[data-tab-panel]').forEach(pnl => pnl.classList.toggle('active', pnl.dataset.tabPanel === btn.dataset.tab));
    }));
    $$('.pd-thumbs button').forEach(btn => btn.addEventListener('click', () => {
      $('#pdMainImage').src = btn.dataset.gallerySrc;
      $$('.pd-thumbs button').forEach(b => b.classList.toggle('active', b === btn));
    }));
    const qty = $('#pdQty');
    const clampQty = () => {
      let v = parseInt(qty.value, 10) || 1;
      v = Math.max(1, Math.min(p.stock || 1, v));
      qty.value = v;
      return v;
    };
    $('#pdMinus').addEventListener('click', () => { qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) - 1); });
    $('#pdPlus').addEventListener('click', () => { qty.value = Math.min(p.stock || 1, (parseInt(qty.value, 10) || 1) + 1); });
    qty.addEventListener('change', clampQty);
    $('#pdAddCart').addEventListener('click', () => {
      const res = DB.addToCart(p.id, clampQty());
      if (res.ok) { UI.toast('已加入购物车', 'success'); UI.updateCartCount(); }
      else UI.toast(res.message, 'warning');
    });
    $('#pdBuyNow').addEventListener('click', () => {
      const res = DB.addToCart(p.id, clampQty());
      if (!res.ok) { UI.toast(res.message, 'error'); return; }
      UI.updateCartCount();
      if (!DB.getCurrentUser()) location.href = 'login.html?redirect=' + encodeURIComponent('checkout.html');
      else location.href = 'checkout.html';
    });
  }

  /* ---------------- 资讯列表 ---------------- */
  function initNews() {
    const state = { category: '全部', keyword: '' };
    const list = $('#newsList');
    const count = $('#newsCount');
    const search = $('#newsSearch');
    const render = () => {
      let data = DB.getNews().filter(n => n.status === '已发布');
      if (state.category !== '全部') data = data.filter(n => n.category === state.category);
      if (state.keyword) {
        const kw = state.keyword.toLowerCase();
        data = data.filter(n => [n.title, n.summary, n.author, n.category].join(' ').toLowerCase().includes(kw));
      }
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (count) count.textContent = data.length;
      list.innerHTML = data.length ? data.map(newsCard).join('') : UI.emptyState('没有找到相关资讯', '换个关键词或栏目试试。', '<a class="btn btn-primary btn-sm" href="news.html">查看全部</a>', 'file-text');
    };
    if (search) search.addEventListener('input', UI.debounce(() => { state.keyword = search.value.trim(); render(); }, 200));
    $$('#newsFilters [data-category]').forEach(btn => btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      $$('#newsFilters [data-category]').forEach(b => b.classList.toggle('active', b === btn));
      render();
    }));
    render();
  }

  /* ---------------- 资讯详情 ---------------- */
  function renderRich(text) {
    return String(text || '').split(/\n\n+/).map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('## ')) return `<h2>${esc(block.slice(3))}</h2>`;
      const lines = block.split('\n').filter(Boolean);
      if (lines.length > 1 && lines.every(l => /^\d+\.\s/.test(l))) {
        return `<ol style="margin:16px 0 16px 20px;list-style:decimal;color:#4b5d51;line-height:2">${lines.map(l => `<li>${esc(l.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>`;
      }
      return `<p>${esc(block).replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  function initNewsDetail() {
    const id = UI.param('id') || 'N001';
    const n = DB.getNewsItem(id);
    const hero = $('#newsHero');
    const page = $('#newsPage');
    if (!n) {
      hero.innerHTML = `<div class="breadcrumb"><a href="index.html">首页</a><span>/</span><a href="news.html">果业资讯</a></div><h1>未找到该资讯</h1>`;
      page.innerHTML = `<div class="container section">${UI.emptyState('资讯不存在或已删除', '返回资讯列表看看最新内容。', '<a class="btn btn-primary" href="news.html">返回果业资讯</a>', 'file-text')}</div>`;
      return;
    }
    document.title = `${n.title} · 武陵果园`;
    hero.innerHTML = `<div class="breadcrumb"><a href="index.html">首页</a>${UI.icon('chevron-right')}<a href="news.html">果业资讯</a>${UI.icon('chevron-right')}<span class="current">${esc(n.category)}</span></div><h1>${esc(n.title)}</h1><p class="page-desc">${esc(n.summary)}</p>`;
    DB.increaseNewsViews(n.id);
    const all = DB.getNews().filter(x => x.status === '已发布').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const idx = all.findIndex(x => x.id === n.id);
    const prev = idx > 0 ? all[idx - 1] : null;
    const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
    const recent = all.filter(x => x.id !== n.id).slice(0, 4);
    page.innerHTML = `
      <div class="container">
        <div class="article-layout">
          <article class="article">
            <div class="article-head">
              <span class="badge badge-citrus">${esc(n.category)}</span>
              <h1>${esc(n.title)}</h1>
              <div class="article-meta">
                <span>${UI.icon('user')}${esc(n.author)}</span>
                <span>${UI.icon('calendar')}${DB.formatDate(n.createdAt)}</span>
                <span>${UI.icon('eye')}${UI.formatNum(n.views + 1)} 阅读</span>
                <span>${UI.icon('clock')}约 ${Math.max(2, Math.round((n.content || '').length / 350))} 分钟</span>
              </div>
            </div>
            <div class="article-cover"><img src="${esc(n.cover)}" alt="${esc(n.title)}"></div>
            <div class="article-body">${renderRich(n.content)}</div>
            <div class="article-foot">
              <span>本文由「${esc(n.author)}」提供 · 转载请注明来源</span>
              <button class="btn btn-ghost btn-xs" type="button" id="copyArticleLink">${UI.icon('copy')}复制链接</button>
            </div>
            <div class="article-nav">
              ${prev ? `<a href="news-detail.html?id=${encodeURIComponent(prev.id)}"><span>上一篇</span>${esc(prev.title)}</a>` : ''}
              ${next ? `<a href="news-detail.html?id=${encodeURIComponent(next.id)}"><span>下一篇</span>${esc(next.title)}</a>` : ''}
            </div>
          </article>
          <aside class="article-side">
            <div class="side-box">
              <h3>最近资讯</h3>
              <div class="side-news">${recent.map(x => `<a href="news-detail.html?id=${encodeURIComponent(x.id)}"><img src="${esc(x.cover)}" alt=""><div><h4>${esc(x.title)}</h4><time>${DB.formatDate(x.createdAt)}</time></div></a>`).join('')}</div>
            </div>
            <div class="side-box">
              <h3>热门标签</h3>
              <div class="tag-cloud">${['猕猴桃', '脐橙', '高山果园', '采摘', '乡村振兴', '种植技术', '莓茶', '产地直供'].map(t => `<a href="news.html">${t}</a>`).join('')}</div>
            </div>
            <div class="side-box side-cta">
              <h3>想尝尝山里的味道？</h3>
              <p>当季鲜果、山货与茶叶，产地直发，48 小时内发出。</p>
              <a class="btn btn-citrus" href="products.html">去商城看看</a>
            </div>
          </aside>
        </div>
      </div>`;
    const copy = $('#copyArticleLink');
    if (copy) copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); UI.toast('链接已复制', 'success'); }
      catch (e) { UI.toast('复制失败，请手动复制地址栏链接', 'warning'); }
    });
  }

  /* ---------------- 关于 ---------------- */
  function initAbout() { /* 静态内容，无需额外渲染 */ }

  /* ---------------- 联系 ---------------- */
  function initContact() {
    const s = DB.getSettings();
    const map = {
      contactPhone: s.phone, contactEmail: s.email, contactAddress: s.address, contactTime: s.workTime
    };
    Object.keys(map).forEach(id => { const el = document.getElementById(id); if (el) el.textContent = map[id] || '—'; });
    const user = DB.getCurrentUser();
    const form = $('#contactForm');
    if (user) { $('#msgName').value = user.name || ''; $('#msgPhone').value = user.phone || ''; $('#msgEmail').value = user.email || ''; }
    const content = $('#msgContent');
    const count = $('#msgCount');
    if (content && count) content.addEventListener('input', () => { count.textContent = content.value.length; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors(form);
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name || data.name.trim().length < 2) return setError(form, 'name', '请填写至少 2 个字的称呼');
      if (!validPhone(data.phone)) return setError(form, 'phone', '请输入正确的 11 位手机号');
      if (!data.content || data.content.trim().length < 5) return setError(form, 'content', '留言内容至少 5 个字');
      const res = DB.addMessage(data);
      if (!res.ok) { UI.toast(res.message, 'error'); return; }
      UI.toast('留言已提交，我们会在工作日尽快回复', 'success');
      form.reset();
      if (count) count.textContent = '0';
      if (user) { $('#msgName').value = user.name || ''; $('#msgPhone').value = user.phone || ''; $('#msgEmail').value = user.email || ''; }
    });
    $$('.faq-q').forEach(btn => btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.contains('open');
      $$('.faq-item').forEach(x => x.classList.remove('open'));
      if (!open) item.classList.add('open');
    }));
  }

  /* ---------------- 登录 / 注册 ---------------- */
  function initLogin() {
    const user = DB.getCurrentUser();
    if (user) { location.replace(user.role === 'admin' ? 'admin/index.html' : safeRedirect(UI.param('redirect'), 'user.html')); return; }
    const form = $('#loginForm');
    const account = $('#loginAccount');
    const remember = $('#rememberAccount');
    try {
      const saved = localStorage.getItem('wuling_orchard_remember');
      if (saved) { account.value = saved; remember.checked = true; }
    } catch (e) { /* ignore */ }
    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors(form);
      const accountVal = account.value.trim();
      const pwd = $('#loginPassword').value;
      if (!accountVal) return setError(form, 'account', '请输入用户名或手机号');
      if (!pwd) return setError(form, 'password', '请输入密码');
      const res = DB.login(accountVal, pwd);
      if (!res.ok) { setError(form, 'password', res.message); UI.toast(res.message, 'error'); return; }
      try {
        if (remember.checked) localStorage.setItem('wuling_orchard_remember', accountVal);
        else localStorage.removeItem('wuling_orchard_remember');
      } catch (e) { /* ignore */ }
      UI.toast(`欢迎回来，${res.user.name}`, 'success');
      const target = res.user.role === 'admin' ? 'admin/index.html' : safeRedirect(UI.param('redirect'), 'user.html');
      setTimeout(() => { location.href = target; }, 450);
    });
    $$('[data-toggle-password]').forEach(btn => btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      input.type = input.type === 'password' ? 'text' : 'password';
    }));
  }

  function initRegister() {
    if (DB.getCurrentUser()) { location.replace('user.html'); return; }
    const form = $('#registerForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors(form);
      const data = Object.fromEntries(new FormData(form).entries());
      const errs = [];
      if (!/^[a-zA-Z0-9_]{3,18}$/.test(String(data.username || '').trim())) errs.push(['username', '用户名需为 3—18 位字母、数字或下划线']);
      if (!data.name || data.name.trim().length < 2) errs.push(['name', '请填写至少 2 个字的姓名']);
      if (!validPhone(data.phone)) errs.push(['phone', '请输入正确的 11 位手机号']);
      if (!data.password || data.password.length < 6) errs.push(['password', '密码至少 6 位']);
      if (data.password !== data.password2) errs.push(['password2', '两次输入的密码不一致']);
      if (!$('#regAgree').checked) errs.push(['agree', '请先阅读并同意用户服务协议']);
      if (errs.length) {
        errs.forEach(([f, m]) => setError(form, f, m));
        const first = form.querySelector(`[name="${errs[0][0]}"]`);
        if (first) first.focus();
        return;
      }
      const res = DB.register(data);
      if (!res.ok) {
        if (/用户名/.test(res.message)) setError(form, 'username', res.message);
        else if (/手机号/.test(res.message)) setError(form, 'phone', res.message);
        UI.toast(res.message, 'error');
        return;
      }
      UI.toast('注册成功，欢迎加入武陵果园', 'success');
      setTimeout(() => { location.href = 'user.html'; }, 500);
    });
  }

  /* ---------------- 购物车 ---------------- */
  function cartItemHTML(it) {
    const p = it.product;
    return `<div class="cart-item" data-cart-item="${esc(p.id)}">
      <div class="cart-prod">
        <img src="${esc(p.image)}" alt="${esc(p.name)}">
        <div><h3><a href="product-detail.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3><div class="cp-meta">${esc(p.spec || '')} · ${esc(p.origin)}</div><button class="remove-link" type="button" data-cart-remove="${esc(p.id)}">移除</button></div>
      </div>
      <div class="cart-price">¥${DB.money(p.price)}</div>
      <div class="cart-qty"><button type="button" data-cart-minus="${esc(p.id)}" aria-label="减少">−</button><span>${it.qty}</span><button type="button" data-cart-plus="${esc(p.id)}" aria-label="增加">＋</button></div>
      <div class="cart-subtotal">¥${DB.money(it.subtotal)}</div>
    </div>`;
  }

  function initCart() {
    const items = DB.getCartDetailed();
    const layout = $('#cartLayout');
    if (!items.length) {
      layout.innerHTML = `<div class="cart-card">${UI.emptyState('果篮还是空的', '去商城挑几样当季好物，把山里的秋天带回家。', '<a class="btn btn-primary" href="products.html">去逛鲜果商城</a>', 'cart')}</div>`;
      return;
    }
    const subtotal = DB.cartTotal();
    const fee = shippingFee(subtotal);
    $('#cartItems').innerHTML = `<div class="cart-head"><span>商品信息</span><span>单价</span><span>数量</span><span>小计</span></div>${items.map(cartItemHTML).join('')}`;
    $('#cartSummary').innerHTML = `
      <h3>订单摘要</h3>
      <div class="sum-row"><span>商品件数</span><strong>${items.reduce((s, it) => s + it.qty, 0)} 件</strong></div>
      <div class="sum-row"><span>商品金额</span><strong>¥${DB.money(subtotal)}</strong></div>
      <div class="sum-row"><span>运费</span><strong>${fee ? '¥' + DB.money(fee) : '包邮'}</strong></div>
      <div class="sum-row"><span>优惠</span><strong>¥0</strong></div>
      <div class="sum-row total"><span>合计</span><span class="amount">¥${DB.money(subtotal + fee)}</span></div>
      <button class="btn btn-citrus btn-block btn-lg" type="button" id="goCheckout">去结算</button>
      <a class="btn btn-ghost btn-block btn-sm mt-2" href="products.html">继续选购</a>
      <div class="secure">${UI.icon('shield')}本地演示结算 · 不产生真实支付</div>`;
    $('#goCheckout').addEventListener('click', () => {
      if (!DB.getCurrentUser()) {
        location.href = 'login.html?redirect=' + encodeURIComponent('checkout.html');
      } else location.href = 'checkout.html';
    });
    layout.onclick = e => {
      const minus = e.target.closest('[data-cart-minus]');
      const plus = e.target.closest('[data-cart-plus]');
      const remove = e.target.closest('[data-cart-remove]');
      if (minus) {
        const id = minus.dataset.cartMinus;
        const item = DB.getCartDetailed().find(x => x.product.id === id);
        if (item) {
          const res = DB.updateCartQty(id, item.qty - 1);
          if (!res.ok) UI.toast(res.message, 'warning');
          UI.updateCartCount();
          initCart();
        }
      }
      if (plus) {
        const id = plus.dataset.cartPlus;
        const item = DB.getCartDetailed().find(x => x.product.id === id);
        if (item) {
          const res = DB.updateCartQty(id, item.qty + 1);
          if (!res.ok) UI.toast(res.message, 'warning');
          UI.updateCartCount();
          initCart();
        }
      }
      if (remove) {
        DB.removeCartItem(remove.dataset.cartRemove);
        UI.updateCartCount();
        UI.toast('已从购物车移除', 'info');
        initCart();
      }
    };
  }

  /* ---------------- 结算 ---------------- */
  function initCheckout() {
    const user = DB.getCurrentUser();
    if (!user) { location.replace('login.html?redirect=' + encodeURIComponent('checkout.html')); return; }
    const items = DB.getCartDetailed();
    if (!items.length) {
      UI.toast('购物车为空，请先选购产品', 'warning');
      setTimeout(() => location.replace('cart.html'), 600);
      return;
    }
    $('#checkoutName').value = user.name || '';
    $('#checkoutPhone').value = user.phone || '';
    $('#checkoutAddress').value = user.address || '';
    const subtotal = DB.cartTotal();
    const fee = shippingFee(subtotal);
    $('#checkoutItems').innerHTML = items.map(it => `<div class="checkout-item"><img src="${esc(it.product.image)}" alt="${esc(it.product.name)}"><div class="ci-copy"><h4>${esc(it.product.name)}</h4><div class="ci-meta">${esc(it.product.spec || '')} × ${it.qty}</div></div><div class="ci-price">¥${DB.money(it.subtotal)}</div></div>`).join('');
    $('#checkoutSubtotal').textContent = '¥' + DB.money(subtotal);
    $('#checkoutShipping').textContent = fee ? '¥' + DB.money(fee) : '包邮';
    $('#checkoutTotal').textContent = '¥' + DB.money(subtotal + fee);
    const form = $('#checkoutForm');
    let submitting = false;
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (submitting) return;
      clearErrors(form);
      const data = Object.fromEntries(new FormData(form).entries());
      const errs = [];
      if (!data.name || data.name.trim().length < 2) errs.push(['name', '请填写收货人姓名']);
      if (!validPhone(data.phone)) errs.push(['phone', '请填写正确的手机号']);
      if (!data.address || data.address.trim().length < 5) errs.push(['address', '请填写详细收货地址']);
      if (errs.length) { errs.forEach(([f, m]) => setError(form, f, m)); return; }
      submitting = true;
      const btn = $('#submitOrderBtn');
      btn.disabled = true;
      btn.textContent = '正在提交…';
      const res = DB.createOrder(data);
      if (!res.ok) {
        submitting = false;
        btn.disabled = false;
        btn.textContent = '提交订单';
        UI.toast(res.message, 'error');
        return;
      }
      UI.updateCartCount();
      UI.toast('下单成功，正在跳转…', 'success');
      setTimeout(() => { location.href = 'order-success.html?no=' + encodeURIComponent(res.order.orderNo); }, 500);
    });
  }

  /* ---------------- 下单成功 ---------------- */
  function initOrderSuccess() {
    const no = UI.param('no');
    const user = DB.getCurrentUser();
    const order = no ? DB.getOrder(no) : null;
    const box = $('#successContent');
    if (!order || (user && order.userId !== user.id && user.role !== 'admin')) {
      box.innerHTML = `<div class="success-page">${UI.emptyState('没有找到该订单', '订单可能已删除，或链接不完整。', '<a class="btn btn-primary" href="user.html#orders">查看我的订单</a>', 'package')}</div>`;
      return;
    }
    box.innerHTML = `<div class="success-page">
      <div class="success-icon">${UI.icon('check')}</div>
      <h1>下单成功</h1>
      <p>感谢支持武陵山区生态果园。我们已收到你的订单，正在安排采摘和打包。</p>
      <div class="success-order">
        <div class="so-row"><span>订单编号</span><strong>${esc(order.orderNo)}</strong></div>
        <div class="so-row"><span>下单时间</span><strong style="font-family:var(--font-sans)">${DB.formatDate(order.createdAt, true)}</strong></div>
        <div class="so-row"><span>收货人</span><strong style="font-family:var(--font-sans)">${esc(order.customerName)} · ${esc(order.phone)}</strong></div>
        <div class="so-row"><span>收货地址</span><strong style="font-family:var(--font-sans);text-align:right;max-width:70%">${esc(order.address)}</strong></div>
        <div class="so-row"><span>订单金额</span><strong style="color:var(--citrus-600);font-size:20px">¥${DB.money(order.total)}</strong></div>
        <div class="so-row"><span>订单状态</span><span class="status-pill orange">待发货</span></div>
      </div>
      <div class="success-actions">
        <a class="btn btn-primary" href="user.html#orders">查看订单</a>
        <a class="btn btn-ghost" href="products.html">继续选购</a>
      </div>
      <p style="font-size:11.5px;margin-top:20px">演示环境会模拟支付成功。订单可在后台“订单管理”中更新状态。</p>
    </div>`;
  }

  /* ---------------- 个人中心 ---------------- */
  function orderStatusBadge(status) { return UI.statusBadge(status); }

  function userOrderCard(o) {
    return `<article class="order-card">
      <div class="order-card-head">
        <span>订单号：<span class="oc-no">${esc(o.orderNo)}</span></span>
        <span>${DB.formatDate(o.createdAt, true)}</span>
        <span>${orderStatusBadge(o.status)}</span>
      </div>
      <div class="order-card-body">
        ${o.items.slice(0, 3).map(it => `<div class="order-prod"><img src="${esc(it.image)}" alt="${esc(it.name)}"><div class="op-name">${esc(it.name)}</div><div class="op-meta">${esc(it.spec || '')} × ${it.qty}</div></div>`).join('')}
        ${o.items.length > 3 ? `<p style="font-size:11px;color:var(--muted);padding-top:5px">还有 ${o.items.length - 3} 件商品…</p>` : ''}
      </div>
      <div class="order-card-foot">
        <div class="order-total">共 ${o.items.reduce((s, it) => s + it.qty, 0)} 件，实付 <strong>¥${DB.money(o.total)}</strong></div>
        <div class="order-actions">
          <button class="btn btn-ghost btn-xs" type="button" data-order-view="${esc(o.id)}">查看详情</button>
          ${o.status === '待发货' || o.status === '待付款' ? `<button class="btn btn-ghost btn-xs" type="button" data-order-cancel="${esc(o.id)}">取消订单</button>` : ''}
          ${o.status === '已发货' ? `<button class="btn btn-primary btn-xs" type="button" data-order-confirm="${esc(o.id)}">确认收货</button>` : ''}
          ${o.status === '已完成' ? `<button class="btn btn-ghost btn-xs" type="button" data-order-rebuy="${esc(o.id)}">再来一单</button>` : ''}
        </div>
      </div>
    </article>`;
  }

  function userBookingCard(b) {
    const o = DB.getOrchard(b.orchardId);
    return `<article class="order-card">
      <div class="order-card-head"><span>预约编号：<span class="oc-no">${esc(b.id)}</span></span><span>提交于 ${DB.formatDate(b.createdAt, true)}</span>${UI.statusBadge(b.status)}</div>
      <div class="order-card-body" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <img src="${esc(o ? o.image : 'assets/img/orchard-1.jpg')}" alt="" style="width:92px;height:74px;border-radius:10px;object-fit:cover">
        <div style="flex:1;min-width:190px"><h3 style="font-size:18px">${esc(b.orchardName || (o ? o.name : '果园'))}</h3><div style="font-size:12px;color:var(--muted);margin-top:4px">到访日期：${esc(b.date)} · ${b.people} 人 · 联系人 ${esc(b.name)}</div><div style="font-size:12px;color:var(--muted)">备注：${esc(b.remark || '无')}</div></div>
        <div class="order-actions">
          ${b.status === '待确认' || b.status === '已确认' ? `<button class="btn btn-ghost btn-xs" type="button" data-booking-cancel="${esc(b.id)}">取消预约</button>` : ''}
          ${o ? `<a class="btn btn-primary btn-xs" href="orchard-detail.html?id=${encodeURIComponent(o.id)}">查看果园</a>` : ''}
        </div>
      </div>
    </article>`;
  }

  function renderOrderDetail(o) {
    return `<div class="detail-list">
      <div class="dl-row"><span class="dl-k">订单编号</span><span class="dl-v mono">${esc(o.orderNo)}</span></div>
      <div class="dl-row"><span class="dl-k">订单状态</span><span class="dl-v">${UI.statusBadge(o.status)}</span></div>
      <div class="dl-row"><span class="dl-k">收货信息</span><span class="dl-v">${esc(o.customerName)} · ${esc(o.phone)}<br>${esc(o.address)}</span></div>
      <div class="dl-row"><span class="dl-k">支付方式</span><span class="dl-v">${esc(o.payMethod || '—')}</span></div>
      <div class="dl-row"><span class="dl-k">订单备注</span><span class="dl-v">${esc(o.remark || '无')}</span></div>
    </div>
    <div class="order-detail-items">${o.items.map(it => `<div class="order-detail-item"><img src="${esc(it.image)}" alt=""><span class="odi-name">${esc(it.name)} <span style="color:var(--muted);font-size:10px">${esc(it.spec || '')}</span></span><span class="odi-qty">× ${it.qty}</span><span class="odi-price">¥${DB.money(it.price * it.qty)}</span></div>`).join('')}</div>
    <div class="order-total-line"><span>合计</span><strong>¥${DB.money(o.total)}</strong></div>
    <h4 style="font-size:13px;margin:20px 0 8px">订单进度</h4>
    <div class="timeline-mini">${(o.timeline || []).map(t => `<div class="tm-item"><div class="tm-dot"></div><div class="tm-copy"><strong>${esc(t.status)}</strong><span>${DB.formatDate(t.time, true)} · ${esc(t.note || '')}</span></div></div>`).join('')}</div>`;
  }

  function initUser() {
    const user = currentUserOrRedirect();
    if (!user) return;
    const state = { panel: 'profile', orderStatus: '全部' };
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    const refreshProfile = () => {
      const u = DB.getCurrentUser();
      setText('userMiniAvatar', (u.name || '果').slice(0, 1));
      setText('userMiniName', u.name);
      setText('userMiniPhone', u.phone);
      setText('profileAvatar', (u.name || '果').slice(0, 1));
      setText('profileName', u.name);
      setText('profileMeta', `${u.username} · 加入于 ${DB.formatDate(u.createdAt)}`);
      const usernameInput = $('#profileUsername');
      if (usernameInput) usernameInput.value = u.username;
      $('#profileNameInput').value = u.name;
      $('#profilePhoneInput').value = u.phone;
      $('#profileEmailInput').value = u.email || '';
      $('#profileAddressInput').value = u.address || '';
      setText('securityMeta', `账号 ${u.username}，注册于 ${DB.formatDate(u.createdAt)}，当前状态：${u.status}`);
      const orders = DB.getOrdersByUser(u.id);
      const bookings = DB.getBookings().filter(b => b.userId === u.id);
      setText('orderCountBadge', orders.length);
      setText('bookingCountBadge', bookings.filter(b => b.status !== '已取消').length);
      return { orders, bookings };
    };

    const renderOrders = () => {
      const orders = DB.getOrdersByUser(user.id).filter(o => state.orderStatus === '全部' || o.status === state.orderStatus);
      const box = $('#userOrders');
      box.innerHTML = orders.length ? orders.map(userOrderCard).join('') : UI.emptyState('这一栏还没有订单', '去商城挑点当季好物吧，山里的果子正当时。', '<a class="btn btn-primary btn-sm" href="products.html">去逛商城</a>', 'package');
    };
    const renderBookings = () => {
      const bookings = DB.getBookings().filter(b => b.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const box = $('#userBookings');
      box.innerHTML = bookings.length ? bookings.map(userBookingCard).join('') : UI.emptyState('还没有采摘预约', '选一座喜欢的果园，约上家人朋友去山里走走。', '<a class="btn btn-primary btn-sm" href="orchards.html">去看看果园</a>', 'calendar');
    };
    const switchPanel = panel => {
      state.panel = panel;
      $$('#userNav [data-panel]').forEach(b => b.classList.toggle('active', b.dataset.panel === panel));
      $$('[data-panel-content]').forEach(p => p.classList.toggle('active', p.dataset.panelContent === panel));
      const titles = { profile: '个人资料', orders: '我的订单', bookings: '采摘预约', security: '账户安全' };
      setText('userPanelTitle', titles[panel] || '个人中心');
      if (panel === 'orders') renderOrders();
      if (panel === 'bookings') renderBookings();
      try { history.replaceState(null, '', '#' + panel); } catch (e) { /* ignore */ }
    };

    refreshProfile();
    renderOrders();
    renderBookings();
    const initial = (location.hash || '#profile').slice(1);
    switchPanel(['profile', 'orders', 'bookings', 'security'].includes(initial) ? initial : 'profile');

    $$('#userNav [data-panel]').forEach(btn => btn.addEventListener('click', () => switchPanel(btn.dataset.panel)));

    $('#profileForm').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.currentTarget;
      clearErrors(form);
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name || data.name.trim().length < 2) return setError(form, 'name', '请填写至少 2 个字的姓名');
      if (!validPhone(data.phone)) return setError(form, 'phone', '请输入正确的 11 位手机号');
      const res = DB.updateProfile(data);
      if (!res.ok) { UI.toast(res.message, 'error'); return; }
      UI.toast('个人资料已保存', 'success');
      refreshProfile();
    });

    $('#passwordForm').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.currentTarget;
      clearErrors(form);
      const oldPwd = $('#oldPassword').value;
      const newPwd = $('#newPassword').value;
      const newPwd2 = $('#newPassword2').value;
      if (!oldPwd) return setError(form, 'oldPassword', '请输入原密码');
      if (!newPwd || newPwd.length < 6) return setError(form, 'newPassword', '新密码至少 6 位');
      if (newPwd !== newPwd2) return setError(form, 'newPassword2', '两次输入的新密码不一致');
      const res = DB.changePassword(oldPwd, newPwd);
      if (!res.ok) { setError(form, 'oldPassword', res.message); UI.toast(res.message, 'error'); return; }
      form.reset();
      UI.toast('密码修改成功', 'success');
    });

    $('#userOrderFilters').addEventListener('click', e => {
      const btn = e.target.closest('[data-status]');
      if (!btn) return;
      state.orderStatus = btn.dataset.status;
      $$('#userOrderFilters [data-status]').forEach(b => b.classList.toggle('active', b === btn));
      renderOrders();
    });

    $('#userOrders').addEventListener('click', async e => {
      const view = e.target.closest('[data-order-view]');
      const cancel = e.target.closest('[data-order-cancel]');
      const confirm = e.target.closest('[data-order-confirm]');
      const rebuy = e.target.closest('[data-order-rebuy]');
      if (view) {
        const o = DB.getOrder(view.dataset.orderView);
        if (!o) return;
        UI.modal({ title: '订单详情', subtitle: o.orderNo, body: renderOrderDetail(o), size: 'lg' });
      }
      if (cancel) {
        const ok = await UI.confirm('确定取消这笔订单吗？取消后库存会释放，操作不可撤销。', { title: '取消订单', okText: '确认取消', danger: true });
        if (!ok) return;
        const res = DB.cancelOrder(cancel.dataset.orderCancel, '用户主动取消');
        if (res.ok) { UI.toast('订单已取消', 'success'); renderOrders(); refreshProfile(); }
        else UI.toast(res.message, 'error');
      }
      if (confirm) {
        const ok = await UI.confirm('确认已经收到商品了吗？确认后订单将完成。', { title: '确认收货', okText: '确认收货' });
        if (!ok) return;
        const res = DB.confirmOrder(confirm.dataset.orderConfirm);
        if (res.ok) { UI.toast('已确认收货，感谢支持', 'success'); renderOrders(); }
        else UI.toast(res.message, 'error');
      }
      if (rebuy) {
        const o = DB.getOrder(rebuy.dataset.orderRebuy);
        if (!o) return;
        let okCount = 0;
        o.items.forEach(it => { if (DB.addToCart(it.productId, it.qty).ok) okCount++; });
        UI.updateCartCount();
        if (okCount) { UI.toast('已加入购物车', 'success'); setTimeout(() => location.href = 'cart.html', 500); }
        else UI.toast('商品暂时无法购买', 'warning');
      }
    });

    $('#userBookings').addEventListener('click', async e => {
      const btn = e.target.closest('[data-booking-cancel]');
      if (!btn) return;
      const ok = await UI.confirm('确定取消这次采摘预约吗？', { title: '取消预约', okText: '确认取消', danger: true });
      if (!ok) return;
      const res = DB.cancelBooking(btn.dataset.bookingCancel);
      if (res.ok) { UI.toast('预约已取消', 'success'); renderBookings(); refreshProfile(); }
      else UI.toast(res.message, 'error');
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    DB.init();
    UI.mountChrome();
    const page = document.body.dataset.page;
    const routes = {
      home: initHome, orchards: initOrchards, 'orchard-detail': initOrchardDetail,
      products: initProducts, 'product-detail': initProductDetail,
      news: initNews, 'news-detail': initNewsDetail, about: initAbout, contact: initContact,
      login: initLogin, register: initRegister, cart: initCart, checkout: initCheckout,
      'order-success': initOrderSuccess, user: initUser
    };
    if (routes[page]) routes[page]();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
