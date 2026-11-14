-- ============================================================
-- 武陵山区果园管理系统 · MySQL 8.0 数据库脚本
-- 说明：
--   1. 演示版使用浏览器 localStorage 模拟数据持久层；
--   2. 本脚本为同一数据模型的关系型数据库落地版本，
--      字段与 assets/js/store.js 中的实体保持一致；
--   3. 生产环境请将密码字段改为 BCrypt/Argon2 哈希存储。
-- ============================================================

CREATE DATABASE IF NOT EXISTS wuling_orchard
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE wuling_orchard;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS order_logs;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS orchards;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS site_settings;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. 用户表
-- ------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户主键',
  username      VARCHAR(50)     NOT NULL                COMMENT '登录用户名',
  password      VARCHAR(100)    NOT NULL                COMMENT '密码（演示为明文，生产请哈希）',
  name          VARCHAR(50)     NOT NULL                COMMENT '姓名/昵称',
  phone         VARCHAR(20)     NOT NULL                COMMENT '手机号',
  email         VARCHAR(120)    DEFAULT NULL            COMMENT '邮箱',
  role          ENUM('admin','user') NOT NULL DEFAULT 'user' COMMENT '角色',
  status        ENUM('正常','停用') NOT NULL DEFAULT '正常' COMMENT '账号状态',
  address       VARCHAR(255)    DEFAULT NULL            COMMENT '默认收货地址',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_phone (phone),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB COMMENT='用户与管理员账号表';

-- ------------------------------------------------------------
-- 2. 果园表
-- ------------------------------------------------------------
CREATE TABLE orchards (
  id            VARCHAR(20)     NOT NULL                COMMENT '果园编号，如 O001',
  name          VARCHAR(100)    NOT NULL                COMMENT '果园名称',
  region        VARCHAR(30)     NOT NULL                COMMENT '所属产区：湘西/张家界/怀化/铜仁/恩施/黔江',
  village       VARCHAR(150)    NOT NULL                COMMENT '详细地址',
  area          DECIMAL(10,1)   NOT NULL DEFAULT 0      COMMENT '种植面积（亩）',
  altitude      INT             NOT NULL DEFAULT 0      COMMENT '平均海拔（米）',
  manager       VARCHAR(50)     DEFAULT NULL            COMMENT '负责人',
  phone         VARCHAR(20)     DEFAULT NULL            COMMENT '负责人电话',
  image         VARCHAR(255)    DEFAULT NULL            COMMENT '封面图路径',
  varieties     JSON            DEFAULT NULL            COMMENT '主栽品种数组',
  tags          JSON            DEFAULT NULL            COMMENT '标签数组',
  intro         VARCHAR(500)    DEFAULT NULL            COMMENT '简介',
  detail        TEXT            DEFAULT NULL            COMMENT '详细介绍',
  status        ENUM('正常','暂停合作') NOT NULL DEFAULT '正常',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orchards_region (region),
  KEY idx_orchards_status (status)
) ENGINE=InnoDB COMMENT='合作果园档案表';

-- ------------------------------------------------------------
-- 3. 产品表
-- ------------------------------------------------------------
CREATE TABLE products (
  id            VARCHAR(20)     NOT NULL                COMMENT '产品编号，如 P001',
  orchard_id    VARCHAR(20)     DEFAULT NULL            COMMENT '所属果园',
  name          VARCHAR(100)    NOT NULL                COMMENT '产品名称',
  category      ENUM('鲜果','山货','茶叶') NOT NULL DEFAULT '鲜果',
  price         DECIMAL(10,2)   NOT NULL                COMMENT '单价（元）',
  unit          VARCHAR(10)     NOT NULL DEFAULT '斤'   COMMENT '计价单位',
  spec          VARCHAR(50)     DEFAULT NULL            COMMENT '规格，如 净重5斤/箱',
  stock         INT UNSIGNED    NOT NULL DEFAULT 0      COMMENT '库存',
  sales         INT UNSIGNED    NOT NULL DEFAULT 0      COMMENT '累计销量',
  origin        VARCHAR(100)    DEFAULT NULL            COMMENT '产地展示名',
  image         VARCHAR(255)    DEFAULT NULL            COMMENT '产品图路径',
  tags          JSON            DEFAULT NULL            COMMENT '产品标签数组',
  featured      TINYINT(1)      NOT NULL DEFAULT 0      COMMENT '是否首页推荐',
  status        ENUM('上架','下架') NOT NULL DEFAULT '上架',
  description   VARCHAR(500)    DEFAULT NULL            COMMENT '简短描述',
  detail        TEXT            DEFAULT NULL            COMMENT '详情介绍',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_orchard (orchard_id),
  KEY idx_products_category_status (category, status),
  KEY idx_products_featured (featured),
  CONSTRAINT fk_products_orchard FOREIGN KEY (orchard_id) REFERENCES orchards (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='产品/商品表';

-- ------------------------------------------------------------
-- 4. 订单主表
-- ------------------------------------------------------------
CREATE TABLE orders (
  id            VARCHAR(30)     NOT NULL                COMMENT '订单主键',
  order_no      VARCHAR(30)     NOT NULL                COMMENT '订单编号',
  user_id       BIGINT UNSIGNED NOT NULL                COMMENT '下单用户',
  customer_name VARCHAR(50)     NOT NULL                COMMENT '收货人',
  phone         VARCHAR(20)     NOT NULL                COMMENT '收货手机号',
  address       VARCHAR(255)    NOT NULL                COMMENT '收货地址',
  subtotal      DECIMAL(10,2)   NOT NULL DEFAULT 0      COMMENT '商品金额',
  shipping_fee  DECIMAL(10,2)   NOT NULL DEFAULT 0      COMMENT '运费',
  total         DECIMAL(10,2)   NOT NULL DEFAULT 0      COMMENT '应付总额',
  status        ENUM('待付款','待发货','已发货','已完成','已取消')
                                NOT NULL DEFAULT '待付款',
  pay_method    VARCHAR(30)     DEFAULT NULL            COMMENT '支付方式',
  remark        VARCHAR(255)    DEFAULT NULL            COMMENT '订单备注',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_no (order_no),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status_created (status, created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='订单主表';

-- ------------------------------------------------------------
-- 5. 订单明细表（商品快照）
-- ------------------------------------------------------------
CREATE TABLE order_items (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      VARCHAR(30)     NOT NULL                COMMENT '订单主键',
  product_id    VARCHAR(20)     DEFAULT NULL            COMMENT '产品编号（允许产品删除后保留快照）',
  product_name  VARCHAR(100)    NOT NULL                COMMENT '下单时产品名称',
  price         DECIMAL(10,2)   NOT NULL                COMMENT '下单时单价',
  qty           INT UNSIGNED    NOT NULL                COMMENT '数量',
  unit          VARCHAR(10)     DEFAULT NULL            COMMENT '单位',
  spec          VARCHAR(50)     DEFAULT NULL            COMMENT '规格',
  image         VARCHAR(255)    DEFAULT NULL            COMMENT '图片快照',
  category      VARCHAR(20)     DEFAULT NULL            COMMENT '品类快照',
  orchard_id    VARCHAR(20)     DEFAULT NULL            COMMENT '果园快照',
  subtotal      DECIMAL(10,2)   GENERATED ALWAYS AS (price * qty) STORED COMMENT '小计',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_items_order (order_id),
  KEY idx_items_product (product_id),
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='订单商品明细表';

-- ------------------------------------------------------------
-- 6. 订单状态日志表
-- ------------------------------------------------------------
CREATE TABLE order_logs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      VARCHAR(30)     NOT NULL,
  status        VARCHAR(20)     NOT NULL                COMMENT '状态名称',
  note          VARCHAR(255)    DEFAULT NULL            COMMENT '说明',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_logs_order_time (order_id, created_at),
  CONSTRAINT fk_logs_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='订单状态流转日志表';

-- ------------------------------------------------------------
-- 7. 资讯表
-- ------------------------------------------------------------
CREATE TABLE news (
  id            VARCHAR(20)     NOT NULL,
  title         VARCHAR(200)    NOT NULL,
  category      ENUM('平台动态','基地动态','种植知识','活动公告','行业资讯')
                                NOT NULL DEFAULT '平台动态',
  cover         VARCHAR(255)    DEFAULT NULL,
  summary       VARCHAR(500)    DEFAULT NULL,
  content       MEDIUMTEXT      DEFAULT NULL,
  author        VARCHAR(50)     DEFAULT NULL,
  views         INT UNSIGNED    NOT NULL DEFAULT 0,
  status        ENUM('已发布','草稿') NOT NULL DEFAULT '已发布',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_news_category_status (category, status),
  KEY idx_news_created (created_at)
) ENGINE=InnoDB COMMENT='资讯/内容表';

-- ------------------------------------------------------------
-- 8. 留言表
-- ------------------------------------------------------------
CREATE TABLE messages (
  id            VARCHAR(20)     NOT NULL,
  name          VARCHAR(50)     NOT NULL,
  phone         VARCHAR(20)     NOT NULL,
  email         VARCHAR(120)    DEFAULT NULL,
  content       TEXT            NOT NULL,
  status        ENUM('待回复','已回复') NOT NULL DEFAULT '待回复',
  reply         TEXT            DEFAULT NULL,
  replied_at    DATETIME        DEFAULT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_status_created (status, created_at)
) ENGINE=InnoDB COMMENT='前台留言咨询表';

-- ------------------------------------------------------------
-- 9. 采摘预约表
-- ------------------------------------------------------------
CREATE TABLE bookings (
  id            VARCHAR(20)     NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  orchard_id    VARCHAR(20)     NOT NULL,
  orchard_name  VARCHAR(100)    DEFAULT NULL            COMMENT '果园名称快照',
  name          VARCHAR(50)     NOT NULL                COMMENT '预约联系人',
  phone         VARCHAR(20)     NOT NULL,
  visit_date    DATE            NOT NULL                COMMENT '到访日期',
  people        TINYINT UNSIGNED NOT NULL DEFAULT 1    COMMENT '人数',
  remark        VARCHAR(255)    DEFAULT NULL,
  status        ENUM('待确认','已确认','已完成','已取消') NOT NULL DEFAULT '待确认',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_user (user_id),
  KEY idx_bookings_orchard_date (orchard_id, visit_date),
  KEY idx_bookings_status (status),
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_bookings_orchard FOREIGN KEY (orchard_id) REFERENCES orchards (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='果园采摘预约表';

-- ------------------------------------------------------------
-- 10. 站点配置表
-- ------------------------------------------------------------
CREATE TABLE site_settings (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  site_key      VARCHAR(50)     NOT NULL                COMMENT '配置键',
  site_value    TEXT            DEFAULT NULL            COMMENT '配置值',
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settings_key (site_key)
) ENGINE=InnoDB COMMENT='站点配置表';

-- ------------------------------------------------------------
-- 11. 初始化数据（演示用）
-- ------------------------------------------------------------
INSERT INTO users (username, password, name, phone, email, role, status, address)
VALUES
  ('admin', 'admin123', '平台管理员', '13800000000', 'admin@wuling-orchard.cn', 'admin', '正常', '湖南省湘西州吉首市武陵山现代农业产业园'),
  ('test',  '123456',   '陈小满',     '13907430001', 'chenxm@example.com',      'user',  '正常', '湖南省长沙市岳麓区麓山南路 18 号');

INSERT INTO orchards (id, name, region, village, area, altitude, manager, phone, image, varieties, tags, intro, detail, status)
VALUES
  ('O001', '十八洞高山猕猴桃基地', '湘西', '湖南省湘西州花垣县十八洞村', 680, 850, '石建国', '13907430011',
   'assets/img/orchard-1.jpg',
   JSON_ARRAY('米良1号猕猴桃', '高山黄桃'), JSON_ARRAY('生态种植', '富硒土壤', '数字果园'),
   '基地位于武陵山脉腹地，海拔 850 米，昼夜温差大、云雾时间长。',
   '十八洞高山猕猴桃基地建于 2016 年，现有连片种植面积 680 亩。',
   '正常'),
  ('O002', '张家界金秋梨园', '张家界', '湖南省张家界市永定区王家坪镇', 420, 620, '龚春梅', '13907430012',
   'assets/img/orchard-2.jpg',
   JSON_ARRAY('金秋梨', '五倍子蜂蜜'), JSON_ARRAY('林下养蜂', '绿色防控', '采摘体验'),
   '梨园依山而建，引用山泉水灌溉，林下放置蜂箱发展“果园 + 蜂蜜”循环农业。',
   '金秋梨园海拔 620 米，种植面积 420 亩，主栽品种为金秋梨。',
   '正常');

INSERT INTO products (id, orchard_id, name, category, price, unit, spec, stock, sales, origin, image, tags, featured, status, description, detail)
VALUES
  ('P001', 'O001', '米良1号猕猴桃', '鲜果', 18.80, '斤', '净重5斤/箱', 320, 1260, '湘西·十八洞',
   'assets/img/product-kiwi.jpg', JSON_ARRAY('高山种植', '现摘现发'), 1, '上架',
   '生长在海拔 850 米的云雾果园，果肉翠绿、酸甜适中。',
   '米良1号是武陵山区主栽猕猴桃品种之一，果形端正、耐贮藏。'),
  ('P002', 'O002', '张家界金秋梨', '鲜果', 9.90, '斤', '净重8斤/箱', 280, 860, '张家界·永定',
   'assets/img/product-pear.jpg', JSON_ARRAY('山泉灌溉', '清甜多汁'), 0, '上架',
   '山泉水灌溉，果皮薄、汁水足，咬一口清甜爽脆。',
   '金秋梨是张家界地方优良品种，果肉乳白、石细胞少。');

INSERT INTO site_settings (site_key, site_value) VALUES
  ('siteName', '武陵山区果园管理系统'),
  ('shortName', '武陵果园'),
  ('phone', '0743-8888666'),
  ('email', 'service@wuling-orchard.cn'),
  ('address', '湖南省湘西土家族苗族自治州吉首市武陵山现代农业产业园 8 号'),
  ('notice', '高山生态种植 · 产地直供 · 48 小时内发货');
