/* =========================================================
   武陵山区果园管理系统 · 数据访问层（Demo 版）
   说明：毕业设计演示环境使用 localStorage 模拟数据库，
        所有实体、字段与 database/schema.sql 中的 MySQL 表保持一致。
   ========================================================= */
(function (global) {
  'use strict';

  const PREFIX = 'wuling_orchard_v1_';
  const VERSION = '1.0.0';
  const KEYS = {
    users: 'users',
    products: 'products',
    orchards: 'orchards',
    orders: 'orders',
    messages: 'messages',
    news: 'news',
    bookings: 'bookings',
    settings: 'settings',
    session: 'session',
    cartGuest: 'cart_guest',
    cartUser: 'cart_user_',
    initialized: 'initialized'
  };

  /* ---------------- 存储适配 ---------------- */
  const memory = Object.create(null);
  let storageOK = true;
  try {
    const probe = PREFIX + '__probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch (e) {
    storageOK = false;
  }

  function rawGet(key) {
    if (storageOK) {
      try { return localStorage.getItem(PREFIX + key); } catch (e) { /* ignore */ }
    }
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
  }
  function rawSet(key, value) {
    if (storageOK) {
      try { localStorage.setItem(PREFIX + key, value); return; } catch (e) { /* ignore */ }
    }
    memory[key] = value;
  }
  function rawRemove(key) {
    if (storageOK) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
    }
    delete memory[key];
  }
  function read(key, fallback) {
    const raw = rawGet(key);
    if (raw === null || raw === undefined) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }
  function write(key, value) {
    rawSet(key, JSON.stringify(value));
    return value;
  }
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* ---------------- 工具函数 ---------------- */
  function uid(prefix) {
    return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function nowISO() { return new Date().toISOString(); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateISO(daysAgo, hour, minute) {
    const d = new Date();
    d.setDate(d.getDate() - (daysAgo || 0));
    d.setHours(hour === undefined ? 10 : hour, minute === undefined ? 30 : minute, 0, 0);
    return d.toISOString();
  }
  function localDateKey(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function todayKey() { return localDateKey(nowISO()); }
  function futureDateKey(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + (Number(daysAhead) || 0));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function formatDate(iso, withTime) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return withTime ? `${base} ${pad(d.getHours())}:${pad(d.getMinutes())}` : base;
  }
  function formatShortDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function money(n) {
    const num = Number(n) || 0;
    return num.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }
  function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
  function orderNo(seq) {
    const d = new Date();
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    return 'WO' + stamp + String(seq || Math.floor(Math.random() * 9000) + 1000);
  }
  function normalize(str) { return String(str == null ? '' : str).trim(); }
  function includesText(haystack, needle) {
    return String(haystack || '').toLowerCase().includes(String(needle || '').trim().toLowerCase());
  }

  /* ---------------- 演示数据 ---------------- */
  function buildSeed() {
    const orchards = [
      {
        id: 'O001', name: '十八洞高山猕猴桃基地', region: '湘西', village: '湖南省湘西州花垣县十八洞村',
        area: 680, altitude: 850, manager: '石建国', phone: '13907430011', image: 'assets/img/orchard-1.jpg',
        varieties: ['米良1号猕猴桃', '高山黄桃'], tags: ['生态种植', '富硒土壤', '数字果园'],
        intro: '基地位于武陵山脉腹地，海拔 850 米，昼夜温差大、云雾时间长。园区采用“合作社 + 农户”模式，统一品种、统一管护、统一分选，是平台首批数字化示范果园。',
        detail: '十八洞高山猕猴桃基地建于 2016 年，现有连片种植面积 680 亩，其中猕猴桃 520 亩、黄桃 160 亩。园区布设小型气象站、土壤墒情监测点和虫情测报灯，管理人员可通过平台记录农事、查看长势、安排采收。基地带动周边 86 户农户稳定增收，2025 年鲜果总产量约 420 吨。',
        status: '正常', createdAt: dateISO(420, 9, 0)
      },
      {
        id: 'O002', name: '张家界金秋梨园', region: '张家界', village: '湖南省张家界市永定区王家坪镇',
        area: 420, altitude: 620, manager: '龚春梅', phone: '13907430012', image: 'assets/img/orchard-2.jpg',
        varieties: ['金秋梨', '五倍子蜂蜜'], tags: ['林下养蜂', '绿色防控', '采摘体验'],
        intro: '梨园依山而建，引用山泉水灌溉，林下放置蜂箱发展“果园 + 蜂蜜”循环农业。每年九月开园采摘，是张家界周边热门的小众秋游目的地。',
        detail: '金秋梨园海拔 620 米，种植面积 420 亩，主栽品种为金秋梨，配套种植少量早熟梨用于错峰上市。园区推行生草栽培和物理诱虫，减少化学农药使用；林下养殖五倍子蜜蜂 120 箱，形成“花果—蜜蜂—土壤”生态循环。园区设有采摘步道、观景平台和农产品展销区。',
        status: '正常', createdAt: dateISO(360, 10, 0)
      },
      {
        id: 'O003', name: '麻阳冰糖橙示范园', region: '怀化', village: '湖南省怀化市麻阳苗族自治县高村镇',
        area: 860, altitude: 310, manager: '滕树华', phone: '13907430013', image: 'assets/img/orchard-3.jpg',
        varieties: ['纽荷尔脐橙', '太秋甜柿'], tags: ['冰糖橙之乡', '水肥一体化', '产地直供'],
        intro: '麻阳素有“中国冰糖橙之都”的美誉。示范园应用水肥一体化与绿色防控技术，果实糖度高、化渣性好，是平台脐橙品类的主力供应基地。',
        detail: '示范园位于锦江河流域，海拔 310 米，年均气温 17.2℃，无霜期 298 天。园区总面积 860 亩，其中脐橙 720 亩、甜柿 140 亩，配套建设 1200 立方米蓄水池和水肥一体化系统。通过平台记录施肥、用药、采摘批次，实现“一园一码”质量追溯。',
        status: '正常', createdAt: dateISO(510, 8, 30)
      },
      {
        id: 'O004', name: '梵净山莓茶生态园', region: '铜仁', village: '贵州省铜仁市江口县太平镇',
        area: 530, altitude: 780, manager: '杨秀英', phone: '13907430014', image: 'assets/img/orchard-4.jpg',
        varieties: ['显齿蛇葡萄（莓茶）', '空壳脆李'], tags: ['高山云雾', '非遗工艺', '生态茶园'],
        intro: '生态园位于梵净山自然保护区外围，常年云雾缭绕。莓茶采用传统摊青、杀青、揉捻、晒干工艺，汤色金黄、回甘持久，是武陵山区特色山货代表。',
        detail: '生态园海拔 780 米，种植莓茶 430 亩、脆李 100 亩。园区坚持人工除草、施用有机肥，采摘期从四月持续到九月。平台对采摘批次、加工日期和成品入库进行记录，消费者扫码即可查看产品来源。2025 年干茶产量约 26 吨，带动周边 120 余人就业。',
        status: '正常', createdAt: dateISO(300, 9, 30)
      },
      {
        id: 'O005', name: '咸丰唐崖蜜桃谷', region: '恩施', village: '湖北省恩施州咸丰县唐崖镇',
        area: 390, altitude: 720, manager: '冉光明', phone: '13907430015', image: 'assets/img/orchard-5.jpg',
        varieties: ['高山黄桃', '脆李'], tags: ['世界遗产地', '套袋栽培', '错峰上市'],
        intro: '蜜桃谷毗邻唐崖土司城遗址，海拔 720 米，黄桃成熟期比平原地区晚 20 天左右。果实套袋生长，果面洁净、香气浓郁，适合鲜食与礼盒销售。',
        detail: '蜜桃谷种植面积 390 亩，主栽黄桃 300 亩、脆李 90 亩。园区采用“一树一策”修剪和果实套袋技术，减少病虫危害；通过平台预售和订单管理，把采摘期与物流运力提前匹配，降低集中上市造成的损耗。',
        status: '正常', createdAt: dateISO(260, 11, 0)
      },
      {
        id: 'O006', name: '黔江脆李标准化果园', region: '黔江', village: '重庆市黔江区中塘镇',
        area: 510, altitude: 680, manager: '任正江', phone: '13907430016', image: 'assets/img/orchard-6.jpg',
        varieties: ['蜂糖李', '青脆李'], tags: ['标准果园', '冷链预冷', '山地轨道'],
        intro: '果园按标准化生产技术规程建设，配套山地轨道运输车和产地预冷库。脆李果肉脆嫩、离核化渣，采后 2 小时内进入冷链，最大程度保留新鲜口感。',
        detail: '黔江脆李标准化果园面积 510 亩，是平台“产地直供”模式的重点基地。园区建设山地单轨运输线 2.6 公里，减少人工搬运损耗；配套 200 立方米预冷库，采摘后快速预冷、分级包装。平台根据订单量安排采摘计划，实现以销定采。',
        status: '正常', createdAt: dateISO(220, 10, 30)
      }
    ];

    const products = [
      {
        id: 'P001', name: '米良1号猕猴桃', category: '鲜果', price: 18.8, unit: '斤', spec: '净重5斤/箱',
        stock: 320, sales: 1260, orchardId: 'O001', origin: '湘西·十八洞', image: 'assets/img/product-kiwi.jpg',
        tags: ['高山种植', '现摘现发'], featured: true, status: '上架',
        description: '生长在海拔 850 米的云雾果园，果肉翠绿、酸甜适中，维生素 C 含量丰富。人工精选大果，泡沫托加固，产地直发。',
        detail: '米良1号是武陵山区主栽猕猴桃品种之一，果形端正、耐贮藏。果实成熟后糖度可达 17° 以上，入口细腻、香气清新。建议收到后放置 2—3 天，待果实微软时食用口感最佳。',
        createdAt: dateISO(200, 9, 0)
      },
      {
        id: 'P002', name: '麻阳纽荷尔脐橙', category: '鲜果', price: 12.8, unit: '斤', spec: '净重10斤/箱',
        stock: 460, sales: 2080, orchardId: 'O003', origin: '怀化·麻阳', image: 'assets/img/product-orange.jpg',
        tags: ['冰糖橙之乡', '果园直采'], featured: true, status: '上架',
        description: '锦江河流域老产区，日照充足、昼夜温差大。果肉细嫩化渣，甜中带微酸，剥皮不脏手。',
        detail: '纽荷尔脐橙果大无核、橙红光亮，可溶性固形物含量 13%—15%。果园采用水肥一体化和绿色防控，采摘后经过清洗、分级、装箱。常温通风可存放 15 天左右，冷藏风味更佳。',
        createdAt: dateISO(190, 10, 0)
      },
      {
        id: 'P003', name: '张家界金秋梨', category: '鲜果', price: 9.9, unit: '斤', spec: '净重8斤/箱',
        stock: 280, sales: 860, orchardId: 'O002', origin: '张家界·永定', image: 'assets/img/product-pear.jpg',
        tags: ['山泉灌溉', '清甜多汁'], featured: false, status: '上架',
        description: '山泉水灌溉，果皮薄、汁水足，咬一口清甜爽脆。九月采摘，冷链发运，适合家庭分享。',
        detail: '金秋梨是张家界地方优良品种，果肉乳白、石细胞少，平均单果重 280 克。果园采用生草栽培，增施有机肥，果实糖度稳定。梨性凉润燥，秋季鲜食或炖煮皆宜。',
        createdAt: dateISO(180, 11, 0)
      },
      {
        id: 'P004', name: '咸丰高山黄桃', category: '鲜果', price: 16.8, unit: '斤', spec: '净重5斤/箱',
        stock: 150, sales: 640, orchardId: 'O005', origin: '恩施·咸丰', image: 'assets/img/product-peach.jpg',
        tags: ['套袋生长', '晚熟黄桃'], featured: true, status: '上架',
        description: '海拔 720 米晚熟黄桃，套袋生长，果面金黄。果肉细腻、香气浓，硬吃脆甜、软吃多汁。',
        detail: '唐崖蜜桃谷的黄桃比平原产区晚熟约 20 天，错峰上市。果实套袋减少病虫和日灼，采摘后分级装箱。收到后可直接食用，也可放置 1—2 天至微软，风味更浓。',
        createdAt: dateISO(170, 9, 30)
      },
      {
        id: 'P005', name: '黔江蜂糖脆李', category: '鲜果', price: 14.8, unit: '斤', spec: '净重5斤/箱',
        stock: 90, sales: 410, orchardId: 'O006', origin: '重庆·黔江', image: 'assets/img/product-plum.jpg',
        tags: ['冷链预冷', '离核化渣'], featured: false, status: '上架',
        description: '山地轨道运输 + 采后预冷，果子带着山里的清凉到达。果肉脆嫩、甜度高，离核化渣。',
        detail: '蜂糖李以“脆、甜、香”著称，果皮青黄、果肉淡黄，可溶性固形物可达 16%。采摘后 2 小时内预冷，全程冷链运输。建议冷藏保存，3—5 天内食用风味最佳。',
        createdAt: dateISO(160, 10, 0)
      },
      {
        id: 'P006', name: '太秋甜柿', category: '鲜果', price: 13.8, unit: '斤', spec: '净重5斤/箱',
        stock: 210, sales: 330, orchardId: 'O003', origin: '怀化·麻阳', image: 'assets/img/product-persimmon.jpg',
        tags: ['树上脱涩', '脆甜无渣'], featured: false, status: '上架',
        description: '太秋甜柿可在树上自然脱涩，摘下来就能吃。果肉脆甜、汁水丰盈，没有普通柿子的涩味。',
        detail: '太秋甜柿是近年推广的甜柿良种，果顶平、果面橙红，单果重 200—300 克。果实成熟后自然脱涩，可脆食。运输过程中请避免磕碰，收到后冷藏保存。',
        createdAt: dateISO(150, 11, 30)
      },
      {
        id: 'P007', name: '五倍子土蜂蜜', category: '山货', price: 68, unit: '瓶', spec: '500g/瓶',
        stock: 75, sales: 190, orchardId: 'O002', origin: '张家界·永定', image: 'assets/img/product-honey.jpg',
        tags: ['林下养蜂', '自然成熟'], featured: true, status: '上架',
        description: '梨园林下蜂箱自然酿造成熟，取蜜周期长，花香浓郁、口感醇厚。无添加，低温易结晶属正常现象。',
        detail: '五倍子蜂蜜是武陵山区特色蜜种，蜜源来自梨园周边的五倍子等野生植物。蜂群采用传统木桶与活框结合养殖，一年只取一次成熟蜜。蜂蜜中的葡萄糖在低温下会结晶，不影响品质。',
        createdAt: dateISO(140, 9, 0)
      },
      {
        id: 'P008', name: '张家界莓茶', category: '茶叶', price: 88, unit: '盒', spec: '250g/盒',
        stock: 60, sales: 240, orchardId: 'O004', origin: '铜仁·江口', image: 'assets/img/product-tea.jpg',
        tags: ['高山云雾', '传统工艺'], featured: false, status: '上架',
        description: '梵净山高山莓茶，传统工艺制作。汤色金黄透亮，入口先苦后甘，回甘持久，适合日常冲泡。',
        detail: '莓茶学名显齿蛇葡萄，是武陵山区的特色代用茶。采摘嫩叶经摊青、杀青、揉捻、晒干等工序制成，表面白霜为天然黄酮类物质。建议每次 3—5 克，用 90℃ 以上热水冲泡。',
        createdAt: dateISO(130, 10, 30)
      }
    ];

    const users = [
      { id: 'U001', username: 'admin', password: 'admin123', name: '平台管理员', phone: '13800000000', email: 'admin@wuling-orchard.cn', role: 'admin', status: '正常', address: '湖南省湘西州吉首市武陵山现代农业产业园', createdAt: dateISO(600, 9, 0) },
      { id: 'U002', username: 'test', password: '123456', name: '陈小满', phone: '13907430001', email: 'chenxm@example.com', role: 'user', status: '正常', address: '湖南省长沙市岳麓区麓山南路 18 号', createdAt: dateISO(280, 10, 0) },
      { id: 'U003', username: 'lixiang', password: '123456', name: '李香', phone: '13907430002', email: 'lixiang@example.com', role: 'user', status: '正常', address: '广东省广州市天河区体育西路 66 号', createdAt: dateISO(240, 11, 0) },
      { id: 'U004', username: 'longamei', password: '123456', name: '龙阿妹', phone: '13907430003', email: 'longam@example.com', role: 'user', status: '正常', address: '贵州省贵阳市观山湖区林城东路 9 号', createdAt: dateISO(160, 9, 30) },
      { id: 'U005', username: 'zhangyuanshan', password: '123456', name: '张远山', phone: '13907430004', email: 'zhangys@example.com', role: 'user', status: '停用', address: '湖北省武汉市洪山区珞喻路 128 号', createdAt: dateISO(120, 8, 30) }
    ];

    const news = [
      {
        id: 'N001', title: '从会种到“慧”种：武陵山区果园管理系统上线试运行', category: '平台动态', cover: 'assets/img/orchard-1.jpg',
        summary: '果园档案、农事记录、订单管理、产品溯源被装进同一个系统，武陵山区的果农有了自己的“数字果园”。',
        author: '平台运营组', views: 328, status: '已发布', createdAt: dateISO(2, 9, 30),
        content: `近日，由计算机应用技术专业学生团队设计的“武陵山区果园管理系统”完成首轮功能联调，进入试运行阶段。系统面向武陵山区中小型果园和合作社，提供果园档案、产品上架、订单处理、客户留言和内容运营等一体化功能。\n\n## 一部手机管好一片果园\n\n过去，果园的种植记录、采摘批次和销售订单多分散在纸笔、聊天记录和表格中。系统将分散信息统一归档：每个果园有独立档案，每个产品对应明确产地，每笔订单都能追溯到来货果园。管理人员登录后台即可查看销售趋势、库存预警和待处理订单。\n\n## 前台展示 + 后台管理\n\n系统采用“前台商城 + 后台管理”的双模块设计。消费者在前台浏览果园、选购鲜果、预约采摘、提交留言；管理员在后台维护产品、处理订单、回复咨询、发布资讯。演示版本使用浏览器本地存储模拟数据库，后续可平滑迁移至 MySQL。\n\n## 让好果子被更多人看见\n\n“武陵山区不缺好果子，缺的是把好果子讲清楚、卖出去的工具。”项目指导教师表示，系统下一步将结合真实合作社需求，完善溯源码、物流跟踪和移动端适配，让数字化真正服务于山地特色农业。`
      },
      {
        id: 'N002', title: '十八洞猕猴桃开园采摘：一颗果子带动一条产业链', category: '基地动态', cover: 'assets/img/orchard-1.jpg',
        summary: '今年基地猕猴桃预计产量 420 吨，通过平台预售和订单农业，已有六成鲜果找到“婆家”。',
        author: '石建国', views: 512, status: '已发布', createdAt: dateISO(8, 10, 0),
        content: `九月的十八洞村，猕猴桃藤蔓下挂满果实。基地负责人石建国正带着工人查看糖度、安排采摘批次。“今年气候总体平稳，果子个头均匀，糖度已经上来了。”他说。\n\n## 以销定采，减少损耗\n\n与往年“先摘后卖”不同，今年基地尝试通过果园管理系统提前发布预售信息，根据订单量安排采摘。系统里的订单看板会显示待发货数量和收货地区，基地据此匹配采摘量和冷链车次。\n\n## 数字档案让品质可追溯\n\n每一批鲜果入库时，管理员都会记录采摘日期、地块编号、糖度和分选等级。消费者收到产品后，可以通过包装上的批次信息了解果品来源。基地还布设了土壤墒情和气象监测设备，为施肥、灌溉提供依据。\n\n## 带动农户稳定增收\n\n基地通过“合作社 + 农户”模式，带动周边 86 户农户参与种植和务工。今年预计总产量 420 吨，户均增收 6000 元以上。下一步，基地将尝试果园认养和研学采摘，让更多游客走进山里。`
      },
      {
        id: 'N003', title: '秋季果园管理技术要点：施肥、修剪与病虫害防治', category: '种植知识', cover: 'assets/img/orchard-2.jpg',
        summary: '采果后是恢复树势的关键期。本文整理秋季施肥、整形修剪和绿色防控的实用要点，供果园管理者参考。',
        author: '农技服务组', views: 276, status: '已发布', createdAt: dateISO(15, 14, 0),
        content: `秋季是果树采后恢复和养分积累的关键时期。科学管理不仅影响当年树势，也决定来年的花芽质量和产量。\n\n## 一、采后施肥要“早”\n\n采果后应尽早施用基肥，以腐熟有机肥为主，配合适量复合肥和中微量元素。幼树采用环状沟施，成年树可采用放射状沟施或条沟施。施肥后及时灌水，促进根系吸收。\n\n## 二、修剪要“轻”\n\n秋季修剪以疏除病虫枝、交叉枝和过密枝为主，不宜大砍大锯。保持树冠通风透光，减少越冬病虫基数。修剪伤口较大的，应及时涂抹保护剂。\n\n## 三、绿色防控要“防”\n\n采果后清理园内落果、烂果和杂草，集中无害化处理。可在树干绑草把诱集越冬害虫，冬季再集中销毁。药剂防治应严格按照农药标签使用，注意安全间隔期。\n\n## 四、做好冬季清园准备\n\n关注天气预报，在寒潮来临前完成树干涂白、根颈培土等工作。山地果园还应注意排水沟清理，防止冬季雨雪造成积水烂根。`
      },
      {
        id: 'N004', title: '果园直供节开启：48 小时从枝头到餐桌', category: '活动公告', cover: 'assets/img/orchard-3.jpg',
        summary: '即日起至 11 月 30 日，平台联合六个合作果园推出直供节，满 99 元包邮，部分产品享采摘季特价。',
        author: '平台运营组', views: 438, status: '已发布', createdAt: dateISO(4, 8, 30),
        content: `为帮助武陵山区优质果品走出大山，平台于本月启动“果园直供节”。活动期间，消费者可在前台商城选购猕猴桃、脐橙、金秋梨、黄桃、脆李、甜柿、蜂蜜和莓茶等特色产品。\n\n## 活动时间\n\n即日起至 11 月 30 日，每周五上午 10 点更新一批当日采摘的鲜果库存。\n\n## 活动内容\n\n1. 全场满 99 元包邮（偏远地区除外）；\n2. 猕猴桃、黄桃 5 斤装享直供价；\n3. 下单时可备注采摘或发货需求，客服将按订单顺序协调；\n4. 企业团购、工会福利可联系客服定制礼盒。\n\n## 发货说明\n\n鲜果订单一般在 48 小时内发出，如遇雨天或采摘期调整，客服会提前联系。收到后请及时开箱检查，如有破损请保留照片并在 24 小时内联系售后。`
      },
      {
        id: 'N005', title: '省农科院专家赴麻阳开展柑橘病虫害绿色防控指导', category: '行业资讯', cover: 'assets/img/orchard-3.jpg',
        summary: '专家团队深入麻阳冰糖橙示范园，围绕木虱防控、水肥管理和采后保鲜进行现场指导。',
        author: '行业观察', views: 189, status: '已发布', createdAt: dateISO(22, 11, 0),
        content: `近日，省农业科学院柑橘专家团队来到怀化市麻阳苗族自治县，深入果园开展柑橘病虫害绿色防控技术指导。\n\n## 现场把脉\n\n专家一行查看了示范园的树势、叶片和果实情况，重点了解柑橘木虱、红蜘蛛等病虫害发生动态。针对今年秋季气温偏高、降雨偏少的情况，专家建议加强园区巡查，优先采用黄板、诱虫灯和生物农药进行防控。\n\n## 水肥管理建议\n\n专家指出，采前应控制氮肥用量，适当增施钾肥，提高果实糖度和耐贮性。有条件的果园可采用水肥一体化系统，根据土壤墒情精准补水补肥。\n\n## 采后处理\n\n针对采后保鲜，专家建议果实采摘后及时预冷，分级包装，避免机械损伤。贮藏库要保持适宜温湿度，并定期通风换气。`
      },
      {
        id: 'N006', title: '莓茶采摘与加工：一片叶子的乡村振兴故事', category: '基地动态', cover: 'assets/img/orchard-4.jpg',
        summary: '从清明前的嫩叶到杯中的金黄茶汤，梵净山莓茶要经过摊青、杀青、揉捻、晒干等多道工序。',
        author: '杨秀英', views: 233, status: '已发布', createdAt: dateISO(33, 10, 30),
        content: `清晨五点半，梵净山脚下的薄雾还没散去，杨秀英和村民们已经背上竹篓上山采莓茶。\n\n## 采摘有标准\n\n莓茶采摘以嫩叶为主，长度约 5 厘米，要求不带老梗、不采雨水叶。采回的鲜叶要尽快摊放，避免发热变质。\n\n## 传统工艺与现代标准\n\n鲜叶经过摊青、杀青、揉捻、晒干等工序，逐渐形成表面白霜。杨秀英说，杀青的火候和揉捻的力度最考验经验。如今，生态园在保留传统工艺的同时，引入了水分检测和批次记录，产品质量更加稳定。\n\n## 一片叶子带动一方增收\n\n生态园每年采茶期带动周边 120 余人就业，其中不少是留守妇女。通过平台销售，莓茶从山里走向全国。下一步，生态园计划开发莓茶研学体验，让游客了解一片叶子的旅程。`
      }
    ];

    const orderSeeds = [
      { days: 158, user: 'U002', items: [['P002', 2], ['P003', 1]], status: '已完成', pay: '微信支付', remark: '请尽快发货' },
      { days: 146, user: 'U003', items: [['P001', 2]], status: '已完成', pay: '支付宝', remark: '' },
      { days: 126, user: 'U004', items: [['P007', 1], ['P008', 1]], status: '已完成', pay: '微信支付', remark: '送人，请包装好' },
      { days: 108, user: 'U002', items: [['P004', 2], ['P005', 1]], status: '已完成', pay: '微信支付', remark: '' },
      { days: 92, user: 'U003', items: [['P002', 3]], status: '已完成', pay: '银行卡', remark: '企业团购' },
      { days: 76, user: 'U005', items: [['P001', 1], ['P003', 1]], status: '已完成', pay: '支付宝', remark: '' },
      { days: 61, user: 'U004', items: [['P006', 2]], status: '已完成', pay: '微信支付', remark: '' },
      { days: 47, user: 'U002', items: [['P008', 2], ['P007', 1]], status: '已完成', pay: '微信支付', remark: '需要发票' },
      { days: 33, user: 'U003', items: [['P004', 3]], status: '已完成', pay: '支付宝', remark: '' },
      { days: 24, user: 'U004', items: [['P001', 1], ['P002', 1]], status: '已发货', pay: '微信支付', remark: '' },
      { days: 15, user: 'U002', items: [['P005', 2], ['P003', 2]], status: '已发货', pay: '微信支付', remark: '周末在家' },
      { days: 9, user: 'U003', items: [['P007', 2]], status: '待发货', pay: '支付宝', remark: '' },
      { days: 4, user: 'U004', items: [['P008', 1], ['P006', 1]], status: '待发货', pay: '微信支付', remark: '请发顺丰' },
      { days: 2, user: 'U002', items: [['P002', 2], ['P004', 1]], status: '待发货', pay: '微信支付', remark: '' },
      { days: 1, user: 'U003', items: [['P001', 1]], status: '待付款', pay: '微信支付', remark: '' },
      { days: 1, user: 'U005', items: [['P003', 1]], status: '已取消', pay: '支付宝', remark: '拍错了' }
    ];

    const userName = { U002: '陈小满', U003: '李香', U004: '龙阿妹', U005: '张远山' };
    const userPhone = { U002: '13907430001', U003: '13907430002', U004: '13907430003', U005: '13907430004' };
    const userAddr = {
      U002: '湖南省长沙市岳麓区麓山南路 18 号',
      U003: '广东省广州市天河区体育西路 66 号',
      U004: '贵州省贵阳市观山湖区林城东路 9 号',
      U005: '湖北省武汉市洪山区珞喻路 128 号'
    };

    function timelineFor(status, days) {
      const base = [
        { status: '待付款', time: dateISO(days, 9, 5), note: '订单提交成功，等待付款' }
      ];
      if (status === '待付款') return base;
      base.push({ status: '待发货', time: dateISO(days, 9, 18), note: '支付成功，商家备货中' });
      if (status === '待发货') return base;
      if (status === '已取消') {
        base.push({ status: '已取消', time: dateISO(Math.max(0, days - 1), 11, 20), note: '订单已取消，库存已释放' });
        return base;
      }
      base.push({ status: '已发货', time: dateISO(Math.max(0, days - 1), 15, 30), note: '包裹已交由冷链物流发出' });
      if (status === '已发货') return base;
      base.push({ status: '已完成', time: dateISO(Math.max(0, days - 2), 18, 10), note: '确认收货，订单完成' });
      return base;
    }

    const orders = orderSeeds.map((o, index) => {
      const items = o.items.map(([pid, qty]) => {
        const p = products.find(x => x.id === pid);
        return { productId: p.id, name: p.name, price: p.price, qty, unit: p.unit, spec: p.spec, image: p.image, category: p.category, orchardId: p.orchardId };
      });
      const total = round2(items.reduce((s, it) => s + it.price * it.qty, 0));
      const createdAt = dateISO(o.days, 9, 5);
      const tl = timelineFor(o.status, o.days);
      return {
        id: 'ORD' + String(index + 1).padStart(3, '0'),
        orderNo: 'WO' + localDateKey(createdAt).replace(/-/g, '') + String(1001 + index),
        userId: o.user, customerName: userName[o.user], phone: userPhone[o.user], address: userAddr[o.user],
        items, total, status: o.status, payMethod: o.pay, remark: o.remark,
        createdAt, updatedAt: tl[tl.length - 1].time, timeline: tl
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const messages = [
      { id: 'M001', name: '向女士', phone: '13807431111', email: 'xiang@example.com', content: '你好，我们公司想采购 80 份猕猴桃礼盒作为员工福利，可以定制包装和贺卡吗？大概什么时候能发货？', status: '待回复', reply: '', createdAt: dateISO(1, 10, 20), repliedAt: '' },
      { id: 'M002', name: '刘先生', phone: '13707432222', email: '', content: '请问十八洞基地周末可以带小朋友去采摘吗？两大一小，需要提前预约吗？', status: '待回复', reply: '', createdAt: dateISO(2, 15, 40), repliedAt: '' },
      { id: 'M003', name: '周老师', phone: '13607433333', email: 'zhou@example.com', content: '收到脐橙了，果子很新鲜，想问一下保存方法，常温能放多久？', status: '已回复', reply: '您好，脐橙建议放在阴凉通风处，常温可存放 15 天左右；冷藏可延长至 30 天。感谢您的支持！', createdAt: dateISO(4, 11, 10), repliedAt: dateISO(3, 9, 20) },
      { id: 'M004', name: '杨同学', phone: '13507434444', email: '', content: '请问平台是否支持果园认养？我们班级想做一次助农实践活动。', status: '待回复', reply: '', createdAt: dateISO(5, 16, 5), repliedAt: '' }
    ];

    const bookings = [
      { id: 'B001', userId: 'U002', orchardId: 'O001', name: '陈小满', phone: '13907430001', date: futureDateKey(5), people: 3, remark: '两大一小，想体验猕猴桃采摘', status: '待确认', createdAt: dateISO(2, 14, 20) },
      { id: 'B002', userId: 'U003', orchardId: 'O003', name: '李香', phone: '13907430002', date: futureDateKey(9), people: 2, remark: '希望安排讲解', status: '已确认', createdAt: dateISO(3, 10, 10) },
      { id: 'B003', userId: 'U004', orchardId: 'O004', name: '龙阿妹', phone: '13907430003', date: futureDateKey(12), people: 6, remark: '团队研学活动', status: '待确认', createdAt: dateISO(1, 9, 40) }
    ];

    const settings = {
      siteName: '武陵山区果园管理系统',
      shortName: '武陵果园',
      phone: '0743-8888666',
      mobile: '139-0743-0001',
      email: 'service@wuling-orchard.cn',
      address: '湖南省湘西土家族苗族自治州吉首市武陵山现代农业产业园 8 号',
      workTime: '周一至周日 08:30—18:00',
      notice: '高山生态种植 · 产地直供 · 48 小时内发货',
      wechat: 'wuling-orchard',
      shipping: '满 99 元包邮（偏远地区除外）',
      icp: '湘ICP备2026000000号（演示）',
      updateAt: nowISO()
    };

    return { users, products, orchards, orders, messages, news, bookings, settings };
  }

  /* ---------------- 初始化 ---------------- */
  function seed(force) {
    const data = buildSeed();
    Object.keys(data).forEach(k => write(k, data[k]));
    write(KEYS.initialized, { version: VERSION, at: nowISO() });
    if (force) {
      rawRemove(KEYS.session);
      rawRemove(KEYS.cartGuest);
      Object.keys(data.users).forEach(u => rawRemove(KEYS.cartUser + data.users[u].id));
    }
  }

  function migrateImagePaths() {
    // 兼容旧版演示数据：早期使用 SVG 插画，现已统一替换为本地实景照片。
    const migrate = value => {
      if (typeof value !== 'string') return value;
      if (/^assets\/img\/(product|orchard)-[a-z0-9-]+\.svg$/i.test(value)) return value.replace(/\.svg$/i, '.jpg');
      if (/^assets\/img\/hero\.svg$/i.test(value)) return 'assets/img/hero.jpg';
      return value;
    };
    ['products', 'orchards', 'news'].forEach(key => {
      const list = read(key, []);
      let changed = false;
      list.forEach(item => {
        ['image', 'cover'].forEach(field => {
          const next = migrate(item[field]);
          if (next !== item[field]) { item[field] = next; changed = true; }
        });
      });
      if (changed) write(key, list);
    });
    const orders = read(KEYS.orders, []);
    let orderChanged = false;
    orders.forEach(order => (order.items || []).forEach(item => {
      const next = migrate(item.image);
      if (next !== item.image) { item.image = next; orderChanged = true; }
    }));
    if (orderChanged) write(KEYS.orders, orders);
  }

  function init() {
    if (!rawGet(KEYS.initialized)) seed(false);
    const required = ['users', 'products', 'orchards', 'orders', 'messages', 'news', 'bookings', 'settings'];
    required.forEach(k => {
      if (read(k, null) === null) {
        const data = buildSeed();
        write(k, data[k]);
      }
    });
    migrateImagePaths();
  }

  /* ---------------- 用户与会话 ---------------- */
  function getUsers() { return read(KEYS.users, []); }
  function saveUsers(list) { write(KEYS.users, list); }

  function getCurrentUser() {
    const session = read(KEYS.session, null);
    if (!session || !session.id) return null;
    const user = getUsers().find(u => u.id === session.id);
    if (!user || user.status !== '正常') return null;
    return clone(user);
  }
  function isAdmin() { const u = getCurrentUser(); return !!u && u.role === 'admin'; }

  function login(account, password) {
    account = normalize(account);
    password = String(password || '');
    if (!account || !password) return { ok: false, message: '请输入账号和密码' };
    const user = getUsers().find(u => u.username === account || u.phone === account);
    if (!user) return { ok: false, message: '账号不存在，请先注册' };
    if (user.password !== password) return { ok: false, message: '密码错误，请重新输入' };
    if (user.status !== '正常') return { ok: false, message: '该账号已被停用，请联系管理员' };
    write(KEYS.session, { id: user.id, role: user.role, loginAt: nowISO() });
    mergeGuestCart(user.id);
    return { ok: true, user: clone(user) };
  }

  function loginAdmin(account, password) {
    const res = login(account, password);
    if (!res.ok) return res;
    if (res.user.role !== 'admin') {
      logout();
      return { ok: false, message: '该账号不是管理员，请使用管理员账号登录' };
    }
    return res;
  }

  function register(payload) {
    const username = normalize(payload.username);
    const name = normalize(payload.name);
    const phone = normalize(payload.phone);
    const password = String(payload.password || '');
    if (!/^[a-zA-Z0-9_]{3,18}$/.test(username)) return { ok: false, message: '用户名需为 3—18 位字母、数字或下划线' };
    if (!/^1[3-9]\d{9}$/.test(phone)) return { ok: false, message: '请输入正确的 11 位手机号' };
    if (name.length < 2 || name.length > 20) return { ok: false, message: '姓名长度需为 2—20 个字符' };
    if (password.length < 6) return { ok: false, message: '密码至少 6 位' };
    const users = getUsers();
    if (users.some(u => u.username === username)) return { ok: false, message: '用户名已被占用' };
    if (users.some(u => u.phone === phone)) return { ok: false, message: '该手机号已注册' };
    const user = {
      id: uid('U'), username, password, name, phone,
      email: normalize(payload.email), role: 'user', status: '正常',
      address: normalize(payload.address), createdAt: nowISO()
    };
    users.push(user);
    saveUsers(users);
    write(KEYS.session, { id: user.id, role: user.role, loginAt: nowISO() });
    mergeGuestCart(user.id);
    return { ok: true, user: clone(user) };
  }

  function logout() { rawRemove(KEYS.session); }

  function updateProfile(payload) {
    const current = getCurrentUser();
    if (!current) return { ok: false, message: '请先登录' };
    const users = getUsers();
    const user = users.find(u => u.id === current.id);
    if (!user) return { ok: false, message: '用户不存在' };
    const name = normalize(payload.name);
    const phone = normalize(payload.phone);
    if (name.length < 2 || name.length > 20) return { ok: false, message: '姓名长度需为 2—20 个字符' };
    if (!/^1[3-9]\d{9}$/.test(phone)) return { ok: false, message: '请输入正确的 11 位手机号' };
    if (users.some(u => u.id !== user.id && u.phone === phone)) return { ok: false, message: '该手机号已被其他账号使用' };
    user.name = name;
    user.phone = phone;
    user.email = normalize(payload.email);
    user.address = normalize(payload.address);
    saveUsers(users);
    return { ok: true, user: clone(user) };
  }

  function changePassword(oldPwd, newPwd) {
    const current = getCurrentUser();
    if (!current) return { ok: false, message: '请先登录' };
    const users = getUsers();
    const user = users.find(u => u.id === current.id);
    if (user.password !== String(oldPwd || '')) return { ok: false, message: '原密码不正确' };
    if (String(newPwd || '').length < 6) return { ok: false, message: '新密码至少 6 位' };
    user.password = String(newPwd);
    saveUsers(users);
    return { ok: true, message: '密码修改成功' };
  }

  function setUserStatus(id, status) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return { ok: false, message: '用户不存在' };
    if (user.role === 'admin') return { ok: false, message: '不能停用管理员账号' };
    user.status = status === '正常' ? '正常' : '停用';
    saveUsers(users);
    return { ok: true };
  }

  function resetUserPassword(id, newPwd) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return { ok: false, message: '用户不存在' };
    user.password = String(newPwd || '123456');
    saveUsers(users);
    return { ok: true };
  }

  /* ---------------- 购物车 ---------------- */
  function cartKey() {
    const u = getCurrentUser();
    return u ? KEYS.cartUser + u.id : KEYS.cartGuest;
  }
  function getCart() { return read(cartKey(), []); }
  function setCart(items) { write(cartKey(), items); }
  function cartCount() { return getCart().reduce((s, it) => s + Number(it.qty || 0), 0); }
  function addToCart(productId, qty) {
    const p = getProduct(productId);
    if (!p || p.status !== '上架') return { ok: false, message: '产品已下架' };
    if (p.stock <= 0) return { ok: false, message: '该产品暂时售罄' };
    qty = Math.max(1, parseInt(qty, 10) || 1);
    const cart = getCart();
    const exist = cart.find(it => it.productId === productId);
    const current = exist ? exist.qty : 0;
    if (current + qty > p.stock) return { ok: false, message: `库存仅剩 ${p.stock} ${p.unit}` };
    if (exist) exist.qty += qty;
    else cart.push({ productId, qty });
    setCart(cart);
    return { ok: true, count: cartCount() };
  }
  function updateCartQty(productId, qty) {
    const cart = getCart();
    const item = cart.find(it => it.productId === productId);
    if (!item) return { ok: false, message: '购物车中没有该产品' };
    const p = getProduct(productId);
    qty = parseInt(qty, 10) || 1;
    if (qty <= 0) return removeCartItem(productId);
    if (!p) return { ok: false, message: '产品不存在' };
    if (qty > p.stock) return { ok: false, message: `库存仅剩 ${p.stock} ${p.unit}` };
    item.qty = qty;
    setCart(cart);
    return { ok: true };
  }
  function removeCartItem(productId) {
    setCart(getCart().filter(it => it.productId !== productId));
    return { ok: true };
  }
  function clearCart() { setCart([]); }
  function getCartDetailed() {
    const cart = getCart();
    return cart.map(it => {
      const p = getProduct(it.productId);
      return p ? { ...it, product: p, subtotal: round2(p.price * it.qty) } : null;
    }).filter(Boolean);
  }
  function cartTotal() { return round2(getCartDetailed().reduce((s, it) => s + it.subtotal, 0)); }
  function mergeGuestCart(userId) {
    const guest = read(KEYS.cartGuest, []);
    if (!guest.length) return;
    const key = KEYS.cartUser + userId;
    const mine = read(key, []);
    guest.forEach(g => {
      const hit = mine.find(m => m.productId === g.productId);
      if (hit) hit.qty += g.qty;
      else mine.push(g);
    });
    write(key, mine);
    rawRemove(KEYS.cartGuest);
  }

  /* ---------------- 商品 ---------------- */
  function getProducts() { return read(KEYS.products, []); }
  function getProduct(id) { return getProducts().find(p => p.id === id) || null; }
  function saveProducts(list) { write(KEYS.products, list); }
  function saveProduct(data) {
    const list = getProducts();
    const name = normalize(data.name);
    const price = Number(data.price);
    if (!name) return { ok: false, message: '请填写产品名称' };
    if (!Number.isFinite(price) || price <= 0) return { ok: false, message: '请输入正确的价格' };
    if (data.id) {
      const idx = list.findIndex(p => p.id === data.id);
      if (idx < 0) return { ok: false, message: '产品不存在' };
      list[idx] = {
        ...list[idx], ...data, price: round2(price),
        stock: Math.max(0, parseInt(data.stock, 10) || 0),
        featured: typeof data.featured === 'boolean' ? data.featured : !!list[idx].featured,
        tags: Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(/[,，]/).map(s => s.trim()).filter(Boolean),
        updatedAt: nowISO()
      };
      saveProducts(list);
      return { ok: true, item: clone(list[idx]) };
    }
    const item = {
      id: uid('P'), name, category: data.category || '鲜果', price: round2(price),
      unit: data.unit || '斤', spec: data.spec || '', stock: Math.max(0, parseInt(data.stock, 10) || 0),
      sales: 0, orchardId: data.orchardId || '', origin: data.origin || '', image: data.image || 'assets/img/product-kiwi.jpg',
      tags: Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(/[,，]/).map(s => s.trim()).filter(Boolean),
      featured: !!data.featured, status: data.status || '上架', description: data.description || '', detail: data.detail || '',
      createdAt: nowISO()
    };
    list.unshift(item);
    saveProducts(list);
    return { ok: true, item: clone(item) };
  }
  function deleteProduct(id) {
    const list = getProducts();
    if (!list.some(p => p.id === id)) return { ok: false, message: '产品不存在' };
    saveProducts(list.filter(p => p.id !== id));
    setCart(getCart().filter(it => it.productId !== id));
    return { ok: true };
  }
  function productsByOrchard(id) { return getProducts().filter(p => p.orchardId === id); }

  /* ---------------- 果园 ---------------- */
  function getOrchards() { return read(KEYS.orchards, []); }
  function getOrchard(id) { return getOrchards().find(o => o.id === id) || null; }
  function saveOrchards(list) { write(KEYS.orchards, list); }
  function saveOrchard(data) {
    const list = getOrchards();
    const name = normalize(data.name);
    if (!name) return { ok: false, message: '请填写果园名称' };
    if (data.id) {
      const idx = list.findIndex(o => o.id === data.id);
      if (idx < 0) return { ok: false, message: '果园不存在' };
      list[idx] = {
        ...list[idx], ...data, name,
        area: Number(data.area) || 0, altitude: Number(data.altitude) || 0,
        varieties: Array.isArray(data.varieties) ? data.varieties : String(data.varieties || '').split(/[,，]/).map(s => s.trim()).filter(Boolean),
        tags: Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(/[,，]/).map(s => s.trim()).filter(Boolean),
        updatedAt: nowISO()
      };
      saveOrchards(list);
      return { ok: true, item: clone(list[idx]) };
    }
    const item = {
      id: uid('O'), name, region: data.region || '', village: data.village || '', area: Number(data.area) || 0,
      altitude: Number(data.altitude) || 0, manager: data.manager || '', phone: data.phone || '',
      image: data.image || 'assets/img/orchard-1.jpg',
      varieties: Array.isArray(data.varieties) ? data.varieties : String(data.varieties || '').split(/[,，]/).map(s => s.trim()).filter(Boolean),
      tags: Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(/[,，]/).map(s => s.trim()).filter(Boolean),
      intro: data.intro || '', detail: data.detail || '', status: data.status || '正常', createdAt: nowISO()
    };
    list.unshift(item);
    saveOrchards(list);
    return { ok: true, item: clone(item) };
  }
  function deleteOrchard(id) {
    const list = getOrchards();
    if (!list.some(o => o.id === id)) return { ok: false, message: '果园不存在' };
    if (getProducts().some(p => p.orchardId === id)) return { ok: false, message: '该果园下仍有产品，请先调整产品归属' };
    saveOrchards(list.filter(o => o.id !== id));
    return { ok: true };
  }

  /* ---------------- 订单 ---------------- */
  function getOrders() { return read(KEYS.orders, []); }
  function saveOrders(list) { write(KEYS.orders, list); }
  function getOrder(id) { return getOrders().find(o => o.id === id || o.orderNo === id) || null; }
  function getOrdersByUser(userId) { return getOrders().filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }

  function createOrder(payload) {
    const user = getCurrentUser();
    if (!user) return { ok: false, message: '请先登录后再结算' };
    const name = normalize(payload.name);
    const phone = normalize(payload.phone);
    const address = normalize(payload.address);
    if (name.length < 2) return { ok: false, message: '请填写收货人姓名' };
    if (!/^1[3-9]\d{9}$/.test(phone)) return { ok: false, message: '请填写正确的手机号' };
    if (address.length < 5) return { ok: false, message: '请填写详细收货地址' };
    const items = getCartDetailed();
    if (!items.length) return { ok: false, message: '购物车为空，请先选购产品' };
    for (const it of items) {
      if (it.product.status !== '上架') return { ok: false, message: `“${it.product.name}”已下架` };
      if (it.qty > it.product.stock) return { ok: false, message: `“${it.product.name}”库存不足，仅剩 ${it.product.stock} ${it.product.unit}` };
    }
    const products = getProducts();
    const orderItems = items.map(it => {
      const p = products.find(x => x.id === it.productId);
      p.stock -= it.qty;
      p.sales += it.qty;
      return { productId: p.id, name: p.name, price: p.price, qty: it.qty, unit: p.unit, spec: p.spec, image: p.image, category: p.category, orchardId: p.orchardId };
    });
    saveProducts(products);
    const subtotal = round2(orderItems.reduce((s, it) => s + it.price * it.qty, 0));
    const shippingFee = subtotal >= 99 ? 0 : 10;
    const total = round2(subtotal + shippingFee);
    const orders = getOrders();
    const seq = String(orders.length + 1).padStart(4, '0');
    let no = orderNo(seq);
    let guard = 0;
    while (orders.some(o => o.orderNo === no) && guard < 20) { no = orderNo(Math.floor(Math.random() * 9000) + 1000); guard++; }
    const createdAt = nowISO();
    const order = {
      id: uid('ORD'), orderNo: no, userId: user.id, customerName: name, phone, address,
      items: orderItems, subtotal, shippingFee, total, status: '待发货', payMethod: payload.payMethod || '微信支付',
      remark: normalize(payload.remark), createdAt, updatedAt: createdAt,
      timeline: [
        { status: '待付款', time: createdAt, note: '订单提交成功' },
        { status: '待发货', time: createdAt, note: '演示环境已模拟支付成功，商家备货中' }
      ]
    };
    orders.unshift(order);
    saveOrders(orders);
    clearCart();
    return { ok: true, order: clone(order) };
  }

  function cancelOrder(id, reason, byAdmin) {
    const orders = getOrders();
    const order = orders.find(o => o.id === id || o.orderNo === id);
    if (!order) return { ok: false, message: '订单不存在' };
    if (!['待付款', '待发货'].includes(order.status)) return { ok: false, message: '当前状态不可取消' };
    const products = getProducts();
    order.items.forEach(it => {
      const p = products.find(x => x.id === it.productId);
      if (p) { p.stock += it.qty; p.sales = Math.max(0, p.sales - it.qty); }
    });
    saveProducts(products);
    order.status = '已取消';
    order.updatedAt = nowISO();
    order.timeline.push({ status: '已取消', time: order.updatedAt, note: byAdmin ? (reason || '管理员取消订单') : (reason || '用户取消订单，库存已释放') });
    saveOrders(orders);
    return { ok: true, order: clone(order) };
  }

  function updateOrderStatus(id, status, note) {
    const orders = getOrders();
    const order = orders.find(o => o.id === id || o.orderNo === id);
    if (!order) return { ok: false, message: '订单不存在' };
    const flow = ['待付款', '待发货', '已发货', '已完成'];
    if (status === '已取消') return cancelOrder(id, note || '管理员取消订单', true);
    if (!flow.includes(status)) return { ok: false, message: '无效的订单状态' };
    order.status = status;
    order.updatedAt = nowISO();
    order.timeline.push({ status, time: order.updatedAt, note: note || `订单状态更新为${status}` });
    saveOrders(orders);
    return { ok: true, order: clone(order) };
  }

  function confirmOrder(id) {
    const user = getCurrentUser();
    if (!user) return { ok: false, message: '请先登录' };
    const order = getOrder(id);
    if (!order || order.userId !== user.id) return { ok: false, message: '订单不存在' };
    if (order.status !== '已发货') return { ok: false, message: '当前状态不可确认收货' };
    return updateOrderStatus(id, '已完成', '用户确认收货');
  }

  /* ---------------- 留言 ---------------- */
  function getMessages() { return read(KEYS.messages, []); }
  function saveMessages(list) { write(KEYS.messages, list); }
  function addMessage(payload) {
    const name = normalize(payload.name);
    const phone = normalize(payload.phone);
    const content = normalize(payload.content);
    if (name.length < 2) return { ok: false, message: '请填写您的称呼' };
    if (!/^1[3-9]\d{9}$/.test(phone)) return { ok: false, message: '请填写正确的手机号' };
    if (content.length < 5) return { ok: false, message: '留言内容至少 5 个字' };
    const list = getMessages();
    const item = { id: uid('M'), name, phone, email: normalize(payload.email), content, status: '待回复', reply: '', createdAt: nowISO(), repliedAt: '' };
    list.unshift(item);
    saveMessages(list);
    return { ok: true, item: clone(item) };
  }
  function replyMessage(id, reply) {
    const list = getMessages();
    const item = list.find(m => m.id === id);
    if (!item) return { ok: false, message: '留言不存在' };
    if (!normalize(reply)) return { ok: false, message: '请输入回复内容' };
    item.reply = normalize(reply);
    item.status = '已回复';
    item.repliedAt = nowISO();
    saveMessages(list);
    return { ok: true };
  }
  function deleteMessage(id) {
    saveMessages(getMessages().filter(m => m.id !== id));
    return { ok: true };
  }

  /* ---------------- 资讯 ---------------- */
  function getNews() { return read(KEYS.news, []); }
  function saveNewsList(list) { write(KEYS.news, list); }
  function getNewsItem(id) { return getNews().find(n => n.id === id) || null; }
  function saveNews(data) {
    const list = getNews();
    const title = normalize(data.title);
    if (!title) return { ok: false, message: '请填写资讯标题' };
    if (data.id) {
      const idx = list.findIndex(n => n.id === data.id);
      if (idx < 0) return { ok: false, message: '资讯不存在' };
      list[idx] = { ...list[idx], ...data, title, updatedAt: nowISO() };
      saveNewsList(list);
      return { ok: true, item: clone(list[idx]) };
    }
    const item = {
      id: uid('N'), title, category: data.category || '平台动态', cover: data.cover || 'assets/img/orchard-1.jpg',
      summary: data.summary || '', content: data.content || '', author: data.author || '平台运营组',
      views: 0, status: data.status || '已发布', createdAt: nowISO()
    };
    list.unshift(item);
    saveNewsList(list);
    return { ok: true, item: clone(item) };
  }
  function deleteNews(id) {
    saveNewsList(getNews().filter(n => n.id !== id));
    return { ok: true };
  }
  function increaseNewsViews(id) {
    const list = getNews();
    const item = list.find(n => n.id === id);
    if (item) { item.views = (item.views || 0) + 1; saveNewsList(list); }
  }

  /* ---------------- 采摘预约 ---------------- */
  function getBookings() { return read(KEYS.bookings, []); }
  function saveBookings(list) { write(KEYS.bookings, list); }
  function addBooking(payload) {
    const user = getCurrentUser();
    if (!user) return { ok: false, message: '请先登录后再预约' };
    const orchard = getOrchard(payload.orchardId);
    if (!orchard) return { ok: false, message: '果园不存在' };
    const name = normalize(payload.name);
    const phone = normalize(payload.phone);
    const date = normalize(payload.date);
    const people = parseInt(payload.people, 10) || 1;
    if (!name) return { ok: false, message: '请填写联系人' };
    if (!/^1[3-9]\d{9}$/.test(phone)) return { ok: false, message: '请填写正确的手机号' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: '请选择预约日期' };
    if (date < todayKey()) return { ok: false, message: '预约日期不能早于今天' };
    if (people < 1 || people > 20) return { ok: false, message: '预约人数需在 1—20 人之间' };
    const list = getBookings();
    if (list.some(b => b.userId === user.id && b.orchardId === orchard.id && b.date === date && b.status !== '已取消')) {
      return { ok: false, message: '您当天已预约过该果园，请勿重复提交' };
    }
    const item = {
      id: uid('B'), userId: user.id, orchardId: orchard.id, orchardName: orchard.name,
      name, phone, date, people, remark: normalize(payload.remark), status: '待确认', createdAt: nowISO()
    };
    list.unshift(item);
    saveBookings(list);
    return { ok: true, item: clone(item) };
  }
  function updateBookingStatus(id, status) {
    const list = getBookings();
    const item = list.find(b => b.id === id);
    if (!item) return { ok: false, message: '预约不存在' };
    if (!['待确认', '已确认', '已完成', '已取消'].includes(status)) return { ok: false, message: '无效状态' };
    item.status = status;
    item.updatedAt = nowISO();
    saveBookings(list);
    return { ok: true };
  }
  function cancelBooking(id) {
    const user = getCurrentUser();
    const list = getBookings();
    const item = list.find(b => b.id === id);
    if (!item) return { ok: false, message: '预约不存在' };
    if (!user || (item.userId !== user.id && user.role !== 'admin')) return { ok: false, message: '无权操作' };
    if (item.status === '已完成') return { ok: false, message: '已完成的预约不可取消' };
    item.status = '已取消';
    item.updatedAt = nowISO();
    saveBookings(list);
    return { ok: true };
  }
  function deleteBooking(id) {
    saveBookings(getBookings().filter(b => b.id !== id));
    return { ok: true };
  }

  /* ---------------- 设置 / 导入导出 ---------------- */
  function getSettings() {
    return read(KEYS.settings, {
      siteName: '武陵山区果园管理系统', shortName: '武陵果园', phone: '0743-8888666',
      mobile: '139-0743-0001', email: 'service@wuling-orchard.cn', address: '',
      workTime: '周一至周日 08:30—18:00', notice: '高山生态种植 · 产地直供', wechat: '', shipping: '', icp: ''
    });
  }
  function saveSettings(data) {
    const settings = { ...getSettings(), ...data, updateAt: nowISO() };
    write(KEYS.settings, settings);
    return { ok: true, settings };
  }

  function exportData() {
    const data = {};
    ['users', 'products', 'orchards', 'orders', 'messages', 'news', 'bookings', 'settings'].forEach(k => {
      data[k] = read(k, null);
    });
    return { app: '武陵山区果园管理系统', version: VERSION, exportedAt: nowISO(), data };
  }
  function importData(obj) {
    if (!obj || !obj.data || typeof obj.data !== 'object') return { ok: false, message: '数据文件格式不正确' };
    const allowed = ['users', 'products', 'orchards', 'orders', 'messages', 'news', 'bookings', 'settings'];
    const missing = allowed.filter(k => !Array.isArray(obj.data[k]) && k !== 'settings');
    if (missing.length) return { ok: false, message: '数据文件缺少字段：' + missing.join('、') };
    allowed.forEach(k => { if (obj.data[k] !== undefined) write(k, obj.data[k]); });
    write(KEYS.initialized, { version: VERSION, at: nowISO() });
    return { ok: true };
  }
  function resetDemo() {
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
    Object.keys(memory).forEach(k => delete memory[k]);
    seed(false);
    return { ok: true };
  }

  /* ---------------- 统计 ---------------- */
  function getStats() {
    const orders = getOrders();
    const products = getProducts();
    const valid = orders.filter(o => !['待付款', '已取消'].includes(o.status));
    const revenue = round2(valid.reduce((s, o) => s + o.total, 0));
    const today = todayKey();
    const todayOrders = orders.filter(o => localDateKey(o.createdAt) === today).length;
    const pending = orders.filter(o => o.status === '待发货').length;
    const lowStock = products.filter(p => p.stock <= 100);
    const statusCounts = { 待付款: 0, 待发货: 0, 已发货: 0, 已完成: 0, 已取消: 0 };
    orders.forEach(o => { if (statusCounts[o.status] !== undefined) statusCounts[o.status]++; });
    const monthly = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      const monthOrders = orders.filter(o => localDateKey(o.createdAt).slice(0, 7) === key && !['待付款', '已取消'].includes(o.status));
      monthly.push({
        key, label: `${d.getMonth() + 1}月`,
        revenue: round2(monthOrders.reduce((s, o) => s + o.total, 0)),
        count: monthOrders.length
      });
    }
    const catMap = {};
    valid.forEach(o => o.items.forEach(it => {
      catMap[it.category] = (catMap[it.category] || 0) + it.price * it.qty;
    }));
    const categories = Object.keys(catMap).map(k => ({ name: k, value: round2(catMap[k]) })).sort((a, b) => b.value - a.value);
    const productSales = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
    return {
      revenue, orderCount: orders.length, todayOrders, pending,
      userCount: getUsers().filter(u => u.role === 'user').length,
      productCount: products.filter(p => p.status === '上架').length,
      orchardCount: getOrchards().length,
      messagePending: getMessages().filter(m => m.status === '待回复').length,
      bookingPending: getBookings().filter(b => b.status === '待确认').length,
      lowStock, statusCounts, monthly, categories, productSales,
      recentOrders: orders.slice(0, 5)
    };
  }

  /* ---------------- 对外 API ---------------- */
  const API = {
    VERSION, KEYS, storageOK,
    init, seed, resetDemo, exportData, importData,
    getUsers, login, loginAdmin, register, logout, getCurrentUser, isAdmin,
    updateProfile, changePassword, setUserStatus, resetUserPassword,
    getCart, cartCount, addToCart, updateCartQty, removeCartItem, clearCart, getCartDetailed, cartTotal,
    getProducts, getProduct, saveProduct, deleteProduct, productsByOrchard,
    getOrchards, getOrchard, saveOrchard, deleteOrchard,
    getOrders, getOrder, getOrdersByUser, createOrder, cancelOrder, updateOrderStatus, confirmOrder,
    getMessages, addMessage, replyMessage, deleteMessage,
    getNews, getNewsItem, saveNews, deleteNews, increaseNewsViews,
    getBookings, addBooking, updateBookingStatus, cancelBooking, deleteBooking,
    getSettings, saveSettings, getStats,
    formatDate, formatShortDate, localDateKey, todayKey, money, uid, orderNo, clone
  };

  global.DB = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
