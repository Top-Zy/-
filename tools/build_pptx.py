# -*- coding: utf-8 -*-
"""Build the graduation-design defense deck (16:9, editable shapes + local images)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "docs" / "screenshots"
OUT = ROOT / "docs" / "武陵山区果园管理系统-答辩PPT.pptx"

# palette
CREAM = RGBColor(0xFA, 0xF6, 0xEC)
PAPER = RGBColor(0xFF, 0xFF, 0xFF)
FOREST = RGBColor(0x16, 0x3B, 0x2B)
FOREST_2 = RGBColor(0x2F, 0x6B, 0x45)
LEAF = RGBColor(0x6F, 0x9F, 0x6C)
LEAF_LIGHT = RGBColor(0xE8, 0xF0, 0xDF)
CITRUS = RGBColor(0xE5, 0x8B, 0x36)
CITRUS_DEEP = RGBColor(0xC4, 0x65, 0x23)
CITRUS_LIGHT = RGBColor(0xFB, 0xED, 0xDC)
INK = RGBColor(0x23, 0x33, 0x2B)
MUTED = RGBColor(0x6D, 0x7C, 0x72)
LINE = RGBColor(0xE4, 0xE2, 0xD5)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

BODY_FONT = "Microsoft YaHei"
TITLE_FONT = "Microsoft YaHei"
SERIF_FONT = "SimSun"
TOTAL = 12


def set_run_font(run, font, size=None, color=None, bold=None, italic=None):
    run.font.name = font
    if size is not None:
        run.font.size = Pt(size)
    if color is not None:
        run.font.color.rgb = color
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic
    rPr = run._r.get_or_add_rPr()
    for tag in ("a:latin", "a:ea", "a:cs"):
        el = rPr.find(qn(tag))
        if el is None:
            el = rPr.makeelement(qn(tag), {})
            rPr.append(el)
        el.set("typeface", font)


def parse_runs(text, size, color, bold=False, font=BODY_FONT):
    """Add **bold** segments to a paragraph."""
    parts = text.split("**")
    runs = []
    for i, part in enumerate(parts):
        if not part:
            continue
        r = runs.append
        # caller creates run; return tokens instead
    return parts


def add_runs(paragraph, text, size, color, bold=False, font=BODY_FONT):
    parts = text.split("**")
    for i, part in enumerate(parts):
        if not part:
            continue
        run = paragraph.add_run()
        run.text = part
        set_run_font(run, font, size, color, bold or (i % 2 == 1))


def add_text(slide, text, x, y, w, h, size=14, color=INK, bold=False, font=BODY_FONT,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, line=1.15, margins=(0, 0, 0, 0),
             italic=False):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left, tf.margin_right, tf.margin_top, tf.margin_bottom = [Inches(m) for m in margins]
    lines = str(text).split("\n")
    for idx, line_text in enumerate(lines):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = line
        p.space_after = Pt(0)
        p.space_before = Pt(0)
        add_runs(p, line_text, size, color, bold, font)
        if italic:
            for r in p.runs:
                r.font.italic = True
    return tb


def add_rect(slide, x, y, w, h, fill, line=None, radius=0.08, line_width=0.75, shape=MSO_SHAPE.ROUNDED_RECTANGLE):
    sh = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(line_width)
    sh.shadow.inherit = False
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            sh.adjustments[0] = radius
        except Exception:
            pass
    return sh


def add_shape_text(sh, text, size=13, color=INK, bold=False, font=BODY_FONT, align=PP_ALIGN.CENTER,
                   anchor=MSO_ANCHOR.MIDDLE, margins=(0.08, 0.08, 0.06, 0.06), line=1.0):
    tf = sh.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left, tf.margin_right, tf.margin_top, tf.margin_bottom = [Inches(m) for m in margins]
    lines = str(text).split("\n")
    for idx, line_text in enumerate(lines):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = line
        p.space_after = Pt(0)
        p.space_before = Pt(0)
        add_runs(p, line_text, size, color, bold, font)
    return sh


def add_line(slide, x1, y1, x2, y2, color=LINE, width=1.0):
    from pptx.enum.shapes import MSO_CONNECTOR
    conn = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    conn.line.color.rgb = color
    conn.line.width = Pt(width)
    return conn


def add_picture_cover(slide, path, x, y, w, h, border=None):
    path = Path(path)
    if not path.exists():
        return None
    iw, ih = Image.open(path).size
    target_ratio = w / h
    image_ratio = iw / ih
    pic = slide.shapes.add_picture(str(path), Inches(x), Inches(y), Inches(w), Inches(h))
    if image_ratio > target_ratio:
        crop = (1 - target_ratio / image_ratio) / 2
        pic.crop_left = crop
        pic.crop_right = crop
    elif image_ratio < target_ratio:
        crop = (1 - image_ratio / target_ratio) / 2
        pic.crop_top = crop
        pic.crop_bottom = crop
    if border is not None:
        pic.line.color.rgb = border
        pic.line.width = Pt(0.8)
    return pic


def add_picture_top(slide, path, x, y, w, h, border=None):
    """Fill a box while keeping the top edge of a tall screenshot."""
    path = Path(path)
    if not path.exists():
        return None
    iw, ih = Image.open(path).size
    target_ratio = w / h
    image_ratio = iw / ih
    pic = slide.shapes.add_picture(str(path), Inches(x), Inches(y), Inches(w), Inches(h))
    if image_ratio > target_ratio:
        crop = (1 - target_ratio / image_ratio) / 2
        pic.crop_left = crop
        pic.crop_right = crop
    elif image_ratio < target_ratio:
        pic.crop_bottom = 1 - image_ratio / target_ratio
        pic.crop_top = 0
    if border is not None:
        pic.line.color.rgb = border
        pic.line.width = Pt(0.8)
    return pic


def add_logo(slide, x=12.35, y=0.35, w=0.5):
    logo = SHOTS / "logo.png"
    if logo.exists():
        slide.shapes.add_picture(str(logo), Inches(x), Inches(y), width=Inches(w), height=Inches(w))


def set_slide_bg(slide, color=CREAM):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def base_slide(prs, kicker, title, page, dark=False):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, FOREST if dark else CREAM)
    if not dark:
        # left accent
        add_rect(slide, 0, 0, 0.12, 7.5, CITRUS, None, 0)
        add_text(slide, kicker.upper(), 0.62, 0.43, 8.0, 0.3, 9.5, CITRUS_DEEP, True, BODY_FONT)
        add_text(slide, title, 0.62, 0.72, 11.0, 0.62, 28, FOREST, True, TITLE_FONT)
        add_rect(slide, 0.65, 1.36, 0.9, 0.045, CITRUS, None, 0)
        add_logo(slide)
        # footer
        add_line(slide, 0.62, 7.06, 12.7, 7.06, LINE, 0.75)
        add_text(slide, "武陵山区果园管理系统 · 毕业设计答辩", 0.62, 7.12, 8.0, 0.24, 8.5, MUTED)
        add_text(slide, f"{page:02d} / {TOTAL:02d}", 11.9, 7.12, 0.8, 0.24, 8.5, MUTED, align=PP_ALIGN.RIGHT)
    return slide


def add_bullets(slide, items, x, y, w, h, size=12.5, color=INK, gap=7, lead_color=FOREST):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0)
    tf.margin_top = tf.margin_bottom = Inches(0)
    for idx, item in enumerate(items):
        item = item.replace("**", "")
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.line_spacing = 1.25
        p.space_after = Pt(gap)
        p.space_before = Pt(0)
        r = p.add_run()
        r.text = "•  "
        set_run_font(r, BODY_FONT, size, CITRUS, True)
        if "：" in item and item.index("：") < 14:
            lead, rest = item.split("：", 1)
            r1 = p.add_run(); r1.text = lead + "："
            set_run_font(r1, BODY_FONT, size, lead_color, True)
            r2 = p.add_run(); r2.text = rest
            set_run_font(r2, BODY_FONT, size, color, False)
        else:
            add_runs(p, item, size, color)
    return tb


def add_pill(slide, text, x, y, w, h, fill, color, size=10, bold=True):
    sh = add_rect(slide, x, y, w, h, fill, None, 0.5)
    add_shape_text(sh, text, size, color, bold, margins=(0.04, 0.04, 0.02, 0.02))
    return sh


def add_notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def build():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # ---------------- 1. COVER ----------------
    s = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(s, FOREST)
    add_picture_cover(s, SHOTS / "hero-dark.png", 0, 0, 13.333, 7.5)
    # top brand
    add_logo(s, 0.62, 0.5, 0.52)
    add_text(s, "武陵果园  /  WULING ORCHARD", 1.28, 0.56, 6.0, 0.3, 10.5, WHITE, True)
    add_pill(s, "毕业设计答辩", 10.95, 0.5, 1.55, 0.38, CITRUS, WHITE, 10)
    add_text(s, "COMPUTER APPLICATION TECHNOLOGY  ·  2026", 0.66, 1.52, 8.0, 0.3, 10, RGBColor(0xF0, 0xC2, 0x7C), True)
    add_text(s, "武陵山区果园\n管理系统的设计与实现", 0.62, 1.92, 8.0, 2.2, 38, WHITE, True, TITLE_FONT, line=1.18)
    add_rect(s, 0.66, 4.35, 1.3, 0.06, CITRUS, None, 0)
    add_text(s, "前台商城 + 后台管理  ·  多页面 HTML5 实现  ·  65 项自动化测试", 0.66, 4.58, 8.2, 0.45, 14, RGBColor(0xE3, 0xEC, 0xDF), False)
    add_text(s, "答辩人：____________      指导教师：____________", 0.66, 6.35, 6.9, 0.32, 12, RGBColor(0xE6, 0xEE, 0xE2))
    add_text(s, "专业：计算机应用技术      2026 年 11 月", 0.66, 6.75, 6.9, 0.3, 10.5, RGBColor(0xB5, 0xC6, 0xB0))
    add_notes(s, "各位老师好，我是计算机应用技术专业的______，我的毕业设计题目是《武陵山区果园管理系统的设计与实现》。本项目是一个可以直接在浏览器中运行的多页面网站，包含前台商城和后台管理两个模块。下面我从选题背景、系统设计、功能演示和测试情况四个方面进行汇报。")

    # ---------------- 2. BACKGROUND ----------------
    s = base_slide(prs, "01 · BACKGROUND", "为什么做一套果园管理系统？", 2)
    cards = [
        ("01", "信息分散", "果园档案、产品规格、订单和客户信息散落在纸笔、微信群和 Excel 中，查询和交接困难。"),
        ("02", "产销脱节", "果园不清楚哪些产品受欢迎、库存还能支撑多少订单；消费者也难以了解果子的真实产地。"),
        ("03", "服务割裂", "展示、下单、采摘预约、售后咨询彼此割裂，缺少统一的前台入口和后台处理流程。"),
    ]
    for i, (num, title, desc) in enumerate(cards):
        y = 1.62 + i * 1.62
        add_rect(s, 0.65, y, 6.1, 1.38, PAPER, LINE, 0.06)
        add_text(s, num, 0.86, y + 0.18, 0.6, 0.45, 20, CITRUS, True, SERIF_FONT)
        add_text(s, title, 1.55, y + 0.18, 1.5, 0.36, 15, FOREST, True)
        add_text(s, desc, 1.55, y + 0.62, 4.95, 0.62, 10.8, MUTED, line=1.35)
    add_picture_cover(s, SHOTS / "orchard-clean-1.png", 7.12, 1.58, 5.6, 3.75, LINE)
    # stat band
    add_rect(s, 7.12, 5.48, 5.6, 1.28, FOREST, None, 0.08)
    stats = [("6", "座合作果园"), ("2,860", "亩种植面积"), ("4", "个核心产区")]
    for i, (num, lab) in enumerate(stats):
        x = 7.38 + i * 1.8
        add_text(s, num, x, 5.66, 1.45, 0.45, 22, WHITE, True, SERIF_FONT)
        add_text(s, lab, x, 6.12, 1.5, 0.25, 9.5, RGBColor(0xBF, 0xD2, 0xB9))
    add_text(s, "调研对象：果园负责人、合作社运营人员、城市消费者、指导教师", 0.66, 6.62, 6.2, 0.3, 9.5, MUTED)
    add_notes(s, "武陵山区横跨湘、鄂、渝、黔四省市，适合猕猴桃、柑橘、梨、李、莓茶生长。但很多中小果园仍然用纸笔、微信群和 Excel 管理业务：信息分散、库存滞后、订单靠手工记、预约靠口头确认。大型农业系统又太复杂、太贵。所以我想做一个轻量、够用、打开就能演示的系统。")

    # ---------------- 3. USERS & LOOPS ----------------
    s = base_slide(prs, "02 · REQUIREMENTS", "三类用户，两条业务闭环", 3)
    roles = [
        ("游客", "浏览 / 搜索 / 加购", "无需登录，先建立信任", LEAF_LIGHT, FOREST_2),
        ("普通用户", "下单 / 预约 / 留言", "登录后查看自己的订单与预约", CITRUS_LIGHT, CITRUS_DEEP),
        ("管理员", "上架 / 发货 / 回复", "后台维护数据、处理业务、查看看板", RGBColor(0xE9, 0xF1, 0xF6), RGBColor(0x3E, 0x6C, 0x8E)),
    ]
    for i, (role, action, desc, bg, accent) in enumerate(roles):
        x = 0.65 + i * 4.05
        add_rect(s, x, 1.58, 3.72, 1.62, bg, None, 0.08)
        add_text(s, role, x + 0.25, 1.76, 1.0, 0.38, 17, accent, True)
        add_text(s, action, x + 0.25, 2.21, 3.2, 0.28, 11.5, FOREST, True)
        add_text(s, desc, x + 0.25, 2.56, 3.2, 0.46, 9.8, MUTED, line=1.3)
    # transaction loop
    add_text(s, "交易闭环", 0.66, 3.55, 1.2, 0.3, 10.5, CITRUS_DEEP, True)
    steps1 = ["浏览商品", "加入购物车", "登录结算", "后台发货", "确认收货"]
    for i, step in enumerate(steps1):
        x = 1.72 + i * 2.18
        sh = add_rect(s, x, 3.48, 2.0, 0.64, FOREST if i < 4 else FOREST_2, None, 0.14, shape=MSO_SHAPE.CHEVRON if i else MSO_SHAPE.PENTAGON)
        add_shape_text(sh, step, 10.5, WHITE, True, margins=(0.04, 0.04, 0.02, 0.02))
    # service loop
    add_text(s, "服务闭环", 0.66, 4.55, 1.2, 0.3, 10.5, CITRUS_DEEP, True)
    steps2 = ["走进果园", "提交预约", "后台确认", "到访完成"]
    for i, step in enumerate(steps2):
        x = 1.72 + i * 2.72
        sh = add_rect(s, x, 4.48, 2.45, 0.64, CITRUS if i == 3 else CITRUS_DEEP, None, 0.14, shape=MSO_SHAPE.CHEVRON if i else MSO_SHAPE.PENTAGON)
        add_shape_text(sh, step, 10.5, WHITE, True, margins=(0.04, 0.04, 0.02, 0.02))
    add_rect(s, 0.65, 5.55, 12.0, 0.86, PAPER, LINE, 0.04)
    add_text(s, "25", 0.92, 5.68, 0.8, 0.42, 22, FOREST, True, SERIF_FONT)
    add_text(s, "个 HTML 页面", 1.55, 5.78, 1.5, 0.22, 9.5, MUTED)
    add_text(s, "10", 3.45, 5.68, 0.7, 0.42, 22, FOREST, True, SERIF_FONT)
    add_text(s, "张数据表", 4.0, 5.78, 1.2, 0.22, 9.5, MUTED)
    add_text(s, "65", 5.45, 5.68, 0.7, 0.42, 22, FOREST, True, SERIF_FONT)
    add_text(s, "项自动化检查", 6.0, 5.78, 1.5, 0.22, 9.5, MUTED)
    add_text(s, "目标：核心闭环完整、可运行、可演示、可扩展", 8.2, 5.74, 4.1, 0.42, 11, FOREST_2, True, align=PP_ALIGN.RIGHT)
    add_notes(s, "系统有三类用户：游客可以浏览、搜索、加购；普通用户可以下单、预约、留言、查看自己的订单；管理员负责产品、果园、订单、资讯、用户、留言和预约。核心是两条闭环：交易闭环和服务闭环。围绕它们设计了 25 个页面、10 张数据表和 65 项测试。")

    # ---------------- 4. ARCHITECTURE ----------------
    s = base_slide(prs, "03 · ARCHITECTURE", "前后台分离，数据层统一封装", 4)
    # left layer labels and boxes
    layers = [
        ("展示层", 1.55, 1.58, [
            ("前台页面", "15 个 HTML", 1.55, 3.55, FOREST),
            ("后台页面", "10 个 HTML", 5.2, 3.55, FOREST_2),
        ]),
        ("业务层", 1.55, 2.72, [
            ("front.js", "页面路由 / 表单 / 业务", 1.55, 2.55, PAPER),
            ("admin.js", "权限 / CRUD / 图表", 4.12, 2.55, PAPER),
            ("ui.js", "页头 / Toast / Modal", 6.69, 2.55, PAPER),
        ]),
        ("数据层", 1.55, 3.88, [
            ("store.js", "用户 / 果园 / 产品 / 订单 / 预约 / 资讯 / 留言 / 统计", 1.55, 7.7, FOREST),
        ]),
        ("存储层", 1.55, 5.12, [
            ("localStorage", "演示 · 零配置", 1.55, 2.35, CITRUS_LIGHT),
            ("MySQL 8.0", "生产 · 事务", 4.02, 2.35, RGBColor(0xE9, 0xF1, 0xF6)),
            ("Node.js", "静态服务器", 6.49, 2.35, PAPER),
        ]),
    ]
    for label, lx, ly, boxes in layers:
        add_pill(s, label, 0.65, ly + 0.22, 0.72, 0.34, FOREST, WHITE, 8.5)
        for text, sub, bx, bw, color in boxes:
            dark = color in (FOREST, FOREST_2)
            sh = add_rect(s, bx, ly, bw, 0.8, color, None if dark else LINE, 0.08)
            add_shape_text(sh, f"{text}\n{sub}", 11.5 if dark else 10.5, WHITE if dark else INK, True, margins=(0.08, 0.08, 0.05, 0.05), line=1.2)
    # flow arrows
    for cx in (3.2, 5.5, 8.0):
        add_text(s, "▼", cx, 2.38, 0.3, 0.25, 12, LEAF, False, align=PP_ALIGN.CENTER)
    add_text(s, "▼", 5.15, 4.69, 0.3, 0.25, 12, LEAF, False, align=PP_ALIGN.CENTER)
    # right panel
    add_rect(s, 9.42, 1.56, 3.28, 4.85, PAPER, LINE, 0.06)
    add_text(s, "技术选型", 9.62, 1.8, 2.0, 0.3, 14, FOREST, True)
    tech = ["HTML5 / CSS3", "JavaScript ES6", "Canvas 2D", "localStorage", "MySQL 8.0", "Playwright"]
    for i, t in enumerate(tech):
        add_pill(s, t, 9.62 + (i % 2) * 1.54, 2.23 + (i // 2) * 0.48, 1.4, 0.34, LEAF_LIGHT, FOREST_2, 8.2)
    add_text(s, "设计要点", 9.62, 3.92, 2.0, 0.3, 14, FOREST, True)
    add_bullets(s, [
        "页面不直接读写 localStorage",
        "所有实体操作走 store.js",
        "替换存储层即可迁移 MySQL",
        "后台每页校验管理员角色",
    ], 9.6, 4.34, 2.9, 1.4, 9.3, gap=5)
    add_line(s, 9.62, 5.72, 12.42, 5.72, LINE, 0.75)
    add_text(s, "运行方式", 9.62, 5.87, 1.3, 0.24, 9.5, CITRUS_DEEP, True)
    add_text(s, "start.bat / node server.js / Live Server", 9.62, 6.14, 2.9, 0.24, 8.2, MUTED)
    add_text(s, "页面层不直接读写 localStorage · 替换 store.js 即可迁移到 REST API / MySQL", 0.65, 6.55, 8.55, 0.3, 8.8, MUTED, False)
    add_notes(s, "系统采用 B/S 架构下的多页面应用。最上面是表示层，前台 15 页、后台 10 页；中间是公共 UI 层和业务逻辑层；下面是 store.js 数据访问层；最底层 localStorage 做演示，MySQL 做生产设计。页面不直接读写 localStorage，后续换数据库只需要改 store.js。")

    # ---------------- 5. MODULES ----------------
    s = base_slide(prs, "04 · MODULES", "前台 15 页 + 后台 10 页", 5)
    # top module cards
    add_rect(s, 0.65, 1.55, 6.0, 0.96, PAPER, LINE, 0.06)
    add_text(s, "前台商城", 0.9, 1.66, 1.8, 0.32, 15, FOREST, True)
    add_text(s, "首页 / 果园 / 商城 / 购物车 / 结算 / 个人中心 / 资讯", 0.9, 2.05, 5.45, 0.3, 9.8, MUTED, line=1.2)
    add_rect(s, 6.78, 1.55, 5.9, 0.96, PAPER, LINE, 0.06)
    add_text(s, "后台管理", 7.02, 1.66, 1.8, 0.32, 15, FOREST, True)
    add_text(s, "看板 / 订单 / 产品 / 果园 / 预约 / 资讯 / 用户 / 留言 / 设置", 7.02, 2.05, 5.4, 0.3, 9.8, MUTED, line=1.2)
    # screenshots
    add_picture_top(s, SHOTS / "slide-products.png", 0.65, 2.62, 6.0, 4.15, LINE)
    add_picture_top(s, SHOTS / "slide-dashboard.png", 6.78, 2.62, 5.9, 4.15, LINE)
    add_notes(s, "前台共 15 个页面，从首页、果园、商城到购物车、结算、个人中心；后台共 10 个页面，包含看板、订单、产品、果园、预约、资讯、用户、留言和设置。左边是商城，右边是后台看板。")

    # ---------------- 6. DATABASE ----------------
    s = base_slide(prs, "05 · DATABASE", "订单快照 + 状态日志，历史可追溯", 6)
    add_picture_cover(s, SHOTS / "er.png", 0.55, 1.5, 7.15, 5.35, LINE)
    add_text(s, "10", 8.12, 1.55, 0.9, 0.8, 44, CITRUS, True, SERIF_FONT)
    add_text(s, "张核心数据表", 8.95, 1.79, 2.6, 0.3, 11, FOREST, True)
    add_text(s, "users / orchards / products / orders / order_items\norder_logs / news / messages / bookings / settings", 8.12, 2.42, 4.55, 0.75, 9.5, MUTED, line=1.5)
    add_bullets(s, [
        "**订单快照**：明细保存商品名、单价、规格、图片",
        "**状态日志**：每次变化写入 order_logs / timeline",
        "**外键与索引**：订单用户、果园产品、状态时间",
        "**迁移思路**：localStorage 字段与 MySQL 表对应",
    ], 8.12, 3.38, 4.6, 2.4, 10.2, gap=8)
    add_rect(s, 8.12, 5.92, 4.35, 0.62, LEAF_LIGHT, None, 0.08)
    add_text(s, "生产环境：InnoDB 事务 + 行锁，保证并发库存一致", 8.27, 6.06, 4.1, 0.28, 9.2, FOREST_2, True)
    add_notes(s, "数据库有 10 张表。核心设计是订单快照和状态日志：订单明细保存下单时的商品名称、单价、规格和图片，产品后续改价或删除不影响历史订单；订单日志记录每次状态变化，支撑个人中心和后台的时间线。演示版 localStorage 的字段和 MySQL 表一一对应。")

    # ---------------- 7. TECH HIGHLIGHTS ----------------
    s = base_slide(prs, "06 · TECHNOLOGY", "四个关键技术点", 7)
    tech_cards = [
        ("01", "数据层统一封装", "页面不直接操作 localStorage，所有实体、库存和统计走 store.js，便于替换为 REST API / MySQL。", FOREST),
        ("02", "库存一致性", "下单前逐项校验，校验通过后统一扣减；取消订单恢复库存与销量，并写入状态日志。", CITRUS_DEEP),
        ("03", "Canvas 原生图表", "手写折线图、环形图，按 devicePixelRatio 缩放，窗口变化防抖重绘，不依赖图表库。", RGBColor(0x4F, 0x77, 0x55)),
        ("04", "响应式与权限", "四级断点、移动抽屉、表格横向滚动；后台每页校验 role，非管理员自动跳转。", RGBColor(0x3E, 0x6C, 0x8E)),
    ]
    for i, (num, title, desc, accent) in enumerate(tech_cards):
        x = 0.65 + (i % 2) * 6.2
        y = 1.58 + (i // 2) * 1.78
        add_rect(s, x, y, 5.95, 1.58, PAPER, LINE, 0.06)
        add_text(s, num, x + 0.18, y + 0.18, 0.6, 0.38, 16, accent, True, SERIF_FONT)
        add_text(s, title, x + 0.82, y + 0.18, 4.4, 0.32, 14, FOREST, True)
        add_text(s, desc, x + 0.82, y + 0.62, 4.8, 0.78, 9.6, MUTED, line=1.35)
    # order state strip
    add_text(s, "订单状态机", 0.66, 5.18, 1.3, 0.28, 10.5, CITRUS_DEEP, True)
    states = ["待付款", "待发货", "已发货", "已完成"]
    for i, st in enumerate(states):
        x = 1.75 + i * 2.35
        sh = add_rect(s, x, 5.1, 2.1, 0.58, FOREST if i < 3 else FOREST_2, None, 0.14, shape=MSO_SHAPE.CHEVRON if i else MSO_SHAPE.PENTAGON)
        add_shape_text(sh, st, 10.5, WHITE, True, margins=(0.04, 0.04, 0.02, 0.02))
    add_pill(s, "取消：待付款 / 待发货 → 库存恢复", 1.75, 5.94, 3.7, 0.38, CITRUS_LIGHT, CITRUS_DEEP, 8.5)
    add_text(s, "每次状态变化写入时间线，个人中心与后台同步展示", 5.8, 6.0, 5.8, 0.28, 9.5, MUTED)
    add_notes(s, "四个技术点：第一，数据层统一封装；第二，库存一致性，先校验后扣减、取消恢复；第三，Canvas 原生图表；第四，响应式布局和后台权限控制。下面是订单状态机，待付款和待发货可以取消，取消后恢复库存。")

    # ---------------- 8. FRONT DEMO ----------------
    s = base_slide(prs, "07 · DEMO / STOREFRONT", "前台：从浏览到下单", 8)
    add_picture_cover(s, SHOTS / "slide-products.png", 0.62, 1.52, 8.05, 5.38, LINE)
    steps = [
        ("01", "筛选与搜索", "按鲜果、山货、茶叶分类，按价格或销量排序。"),
        ("02", "加入购物车", "卡片快速加购，数量受库存限制，角标实时更新。"),
        ("03", "登录与结算", "自动带出姓名、手机号、地址，计算运费。"),
        ("04", "提交订单", "再次校验库存，生成订单号，清空购物车。"),
    ]
    for i, (num, title, desc) in enumerate(steps):
        y = 1.58 + i * 1.24
        add_text(s, num, 8.9, y, 0.55, 0.36, 14, CITRUS, True, SERIF_FONT)
        add_text(s, title, 9.48, y, 2.6, 0.3, 12.5, FOREST, True)
        add_text(s, desc, 9.48, y + 0.34, 3.15, 0.56, 9.4, MUTED, line=1.3)
    add_rect(s, 8.88, 6.42, 3.82, 0.5, LEAF_LIGHT, None, 0.08)
    add_text(s, "购物车按用户隔离 · 登录自动合并游客购物车", 9.02, 6.55, 3.55, 0.25, 8.8, FOREST_2, True, line=1.2)
    add_notes(s, "前台演示：进入商城，可以按分类筛选、搜索、排序；点击加号加入购物车；进入购物车调整数量；去结算，未登录会跳登录，登录后回到结算页；提交订单生成订单号。购物车按用户隔离，登录时自动合并游客购物车。")

    # ---------------- 9. ADMIN DEMO ----------------
    s = base_slide(prs, "08 · DEMO / ADMIN", "后台：从看板到履约", 9)
    add_picture_cover(s, SHOTS / "slide-dashboard.png", 0.62, 1.52, 8.05, 5.38, LINE)
    add_bullets(s, [
        "**数据看板**：销售额、订单量、待发货、库存预警",
        "**趋势与占比**：近 6 个月销售额、品类销售占比",
        "**订单履约**：待发货 → 已发货 → 已完成，时间线可查",
        "**库存与待办**：低库存提醒、待回复留言、待确认预约",
    ], 8.9, 1.62, 3.8, 2.9, 9.8, gap=9)
    # order process panel (instead of a tiny unreadable screenshot)
    add_rect(s, 8.9, 4.38, 3.82, 2.35, LEAF_LIGHT, None, 0.08)
    add_text(s, "订单管理", 9.1, 4.55, 1.6, 0.3, 12, FOREST, True)
    add_text(s, "待付款  →  待发货  →  已发货  →  已完成", 9.1, 4.98, 3.45, 0.28, 8.8, FOREST_2, True)
    add_text(s, "订单详情：商品快照 / 收货信息 / 状态时间线", 9.1, 5.44, 3.4, 0.28, 8.4, MUTED)
    add_text(s, "取消待付款 / 待发货订单，库存自动恢复", 9.1, 5.82, 3.4, 0.28, 8.4, CITRUS_DEEP, True)
    add_text(s, "分页、搜索、状态筛选", 9.1, 6.22, 3.4, 0.25, 8.4, MUTED)
    add_notes(s, "后台演示：管理员登录后先看到数据看板，有销售额、订单量、待发货、库存预警，还有近 6 个月趋势和品类占比。进入订单管理，找到刚才的订单，点击发货，状态变成已发货；用户确认收货后变成已完成。下面这张小图是订单管理页面。")

    # ---------------- 10. TESTING ----------------
    s = base_slide(prs, "09 · QUALITY", "65 项自动化检查，0 项失败", 10)
    add_text(s, "65", 0.72, 1.62, 2.5, 1.6, 92, CITRUS, True, SERIF_FONT)
    add_text(s, "项自动化检查全部通过", 2.85, 2.02, 3.4, 0.4, 13, FOREST, True)
    add_text(s, "43 主流程  +  17 深度业务  +  5 安全与幂等", 2.85, 2.48, 4.0, 0.3, 10, MUTED)
    # breakdown cards
    for i, (num, lab) in enumerate([("43", "主流程"), ("17", "深度业务"), ("5", "安全/幂等"), ("7", "缺陷修复")]):
        x = 0.7 + i * 1.55
        add_rect(s, x, 3.45, 1.38, 1.07, PAPER, LINE, 0.06)
        add_text(s, num, x, 3.55, 1.38, 0.5, 22, FOREST, True, SERIF_FONT, align=PP_ALIGN.CENTER)
        add_text(s, lab, x, 4.08, 1.38, 0.25, 8.5, MUTED, align=PP_ALIGN.CENTER)
    # code output
    add_rect(s, 0.7, 4.85, 6.0, 1.62, RGBColor(0x15, 0x2E, 0x23), None, 0.05)
    add_text(s, "tests/e2e.js            43 passed\n tests/e2e-deep.js       17 passed\n tests/e2e-security.js    5 passed\n result                   0 failed", 0.95, 5.02, 5.5, 1.3, 9.5, RGBColor(0xCF, 0xE0, 0xC8), False, "Consolas", line=1.45)
    # pipeline
    add_text(s, "测试闭环", 7.12, 1.68, 1.5, 0.3, 11, CITRUS_DEEP, True)
    pipe = ["语法与链接检查", "Playwright 主流程", "深度业务回归", "安全与重复提交", "修复后全量重跑"]
    for i, p in enumerate(pipe):
        y = 2.1 + i * 0.82
        add_rect(s, 7.12, y, 0.32, 0.32, FOREST if i < 4 else CITRUS, None, 0.5, shape=MSO_SHAPE.OVAL)
        add_text(s, str(i + 1), 7.12, y + 0.03, 0.32, 0.24, 9, WHITE, True, align=PP_ALIGN.CENTER)
        add_text(s, p, 7.62, y + 0.02, 3.9, 0.28, 10.5, FOREST, True)
    add_rect(s, 7.12, 6.2, 4.9, 0.55, CITRUS_LIGHT, None, 0.08)
    add_text(s, "BUG-01：确认弹窗 Promise 结算顺序 → settled 标志修复", 7.28, 6.32, 4.6, 0.28, 8.6, CITRUS_DEEP, True)
    add_notes(s, "测试分三层：语法和链接检查、Playwright 端到端、手工响应式和兼容性检查。三套脚本共 65 项，43 项主流程、17 项深度业务、5 项安全和幂等，最终全部通过。测试中发现并修复了 7 个缺陷，最严重的是确认弹窗的 Promise 结算顺序问题，导致删除、取消订单、停用用户全部失效；修复后全量重跑通过。")

    # ---------------- 11. CHALLENGES ----------------
    s = base_slide(prs, "10 · CHALLENGES", "最难的三件事", 11)
    challenges = [
        ("01", "多页面状态共享", "每次跳转都会重新加载脚本，登录、购物车、筛选条件不能在内存中保存。", "统一放 localStorage；购物车按用户隔离；登录时合并游客购物车。"),
        ("02", "订单与库存一致性", "校验、订单、扣减、销量、清空购物车，任何一步顺序错了都会不一致。", "集中在 createOrder 顺序执行；先校验后写入；取消按明细恢复并记日志。"),
        ("03", "无框架组件复用", "没有 Vue/React，页头页脚、Toast、弹窗容易在 25 个页面重复。", "模板字符串封装 header/footer/modal/toast；页面只保留占位节点。"),
    ]
    for i, (num, title, problem, solution) in enumerate(challenges):
        y = 1.58 + i * 1.72
        add_rect(s, 0.65, y, 12.0, 1.48, PAPER, LINE, 0.05)
        add_text(s, num, 0.9, y + 0.2, 0.7, 0.4, 17, CITRUS, True, SERIF_FONT)
        add_text(s, title, 1.62, y + 0.18, 2.8, 0.32, 14, FOREST, True)
        add_text(s, "问题", 1.62, y + 0.66, 0.5, 0.24, 8.5, MUTED, True)
        add_text(s, problem, 2.12, y + 0.64, 4.3, 0.58, 9.3, MUTED, line=1.28)
        add_text(s, "做法", 6.72, y + 0.66, 0.5, 0.24, 8.5, CITRUS_DEEP, True)
        add_text(s, solution, 7.22, y + 0.62, 5.1, 0.64, 9.3, FOREST_2, line=1.28)
    add_text(s, "“页面能点”不等于“逻辑正确”。", 0.65, 6.82, 8.0, 0.3, 11, CITRUS_DEEP, True, SERIF_FONT)
    add_notes(s, "最难的三件事：第一，多页面下的状态共享；第二，订单和库存的一致性；第三，没有框架时如何复用组件。我的做法分别是 localStorage + 用户隔离、createOrder 统一顺序执行、模板字符串封装公共组件。")

    # ---------------- 12. SUMMARY ----------------
    s = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(s, FOREST)
    add_picture_cover(s, SHOTS / "orchard-clean-2.png", 7.35, 0, 5.98, 7.5)
    # dark gradient-ish left panel
    add_rect(s, 0, 0, 7.5, 7.5, FOREST, None, 0)
    add_text(s, "11 · SUMMARY", 0.66, 0.55, 4.0, 0.3, 10, RGBColor(0xF0, 0xC2, 0x7C), True)
    add_text(s, "从“能跑”到“敢演示”", 0.62, 1.02, 6.4, 0.75, 32, WHITE, True, TITLE_FONT)
    add_rect(s, 0.66, 1.86, 1.1, 0.055, CITRUS, None, 0)
    add_bullets(s, [
        "**完成**：25 个页面、两条业务闭环、10 张数据表",
        "**质量**：65 项自动化检查、7 个缺陷修复",
        "**收获**：需求取舍、数据设计、测试与表达",
        "**展望**：服务端 + MySQL、支付物流、农事溯源",
    ], 0.68, 2.25, 5.9, 2.6, 12, RGBColor(0xE3, 0xEC, 0xDF), gap=12, lead_color=RGBColor(0xF0, 0xC2, 0x7C))
    add_text(s, "谢谢各位老师，请批评指正。", 0.66, 5.55, 6.0, 0.55, 22, WHITE, True, SERIF_FONT)
    add_text(s, "演示入口  http://localhost:8080/index.html", 0.66, 6.32, 6.3, 0.3, 10, RGBColor(0xB5, 0xC6, 0xB0))
    add_text(s, "答辩人：____________    2026.11", 0.66, 6.72, 6.3, 0.3, 10, RGBColor(0x8F, 0xA6, 0x8A))
    add_notes(s, "最后总结：完成 25 个页面、两条业务闭环、10 张数据表；65 项自动化检查、7 个缺陷修复；我最大的收获是需求取舍、数据设计、测试和表达。系统还有不足，后续会接服务端、MySQL、支付物流和农事溯源。我的汇报完毕，请各位老师批评指正，谢谢！")

    prs.save(OUT)
    print("saved", OUT, "slides", len(prs.slides))


if __name__ == "__main__":
    build()
