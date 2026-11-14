# -*- coding: utf-8 -*-
"""Build the graduation-design DOCX deliverables from the Markdown sources."""
from __future__ import annotations

import html
import re
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
SHOTS = DOCS / "screenshots"
FONT_BODY = "宋体"
FONT_HEAD = "黑体"
FONT_TITLE = "宋体"
FONT_MONO = "Consolas"
GREEN = RGBColor(0x16, 0x3B, 0x2B)
GREEN_LIGHT = "1F4D35"
ORANGE = RGBColor(0xB7, 0x64, 0x24)
MUTED = RGBColor(0x6D, 0x7C, 0x72)
CONTENT_WIDTH_CM = 15.5


def set_eastasia(run, name):
    run.font.name = name
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    rFonts.set(qn("w:ascii"), name)
    rFonts.set(qn("w:hAnsi"), name)
    rFonts.set(qn("w:eastAsia"), name)


def style_font(style, name, size, bold=False, color=None):
    style.font.name = name
    style.font.size = Pt(size)
    style.font.bold = bold
    if color:
        style.font.color.rgb = color
    rPr = style.element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    rFonts.set(qn("w:ascii"), name)
    rFonts.set(qn("w:hAnsi"), name)
    rFonts.set(qn("w:eastAsia"), name)


def shade_cell(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)


def shade_paragraph(paragraph, fill):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    pPr.append(shd)


def border_paragraph(paragraph, side="left", color="E58B36", size="18"):
    pPr = paragraph._p.get_or_add_pPr()
    pBdr = pPr.find(qn("w:pBdr"))
    if pBdr is None:
        pBdr = OxmlElement("w:pBdr")
        pPr.append(pBdr)
    el = OxmlElement(f"w:{side}")
    el.set(qn("w:val"), "single")
    el.set(qn("w:sz"), size)
    el.set(qn("w:space"), "6")
    el.set(qn("w:color"), color)
    pBdr.append(el)


def add_field(paragraph, instr, placeholder=""):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    run._r.append(fld_begin)
    run2 = paragraph.add_run()
    instr_el = OxmlElement("w:instrText")
    instr_el.set(qn("xml:space"), "preserve")
    instr_el.text = instr
    run2._r.append(instr_el)
    run3 = paragraph.add_run()
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    run3._r.append(fld_sep)
    run4 = paragraph.add_run(placeholder)
    set_eastasia(run4, FONT_BODY)
    run5 = paragraph.add_run()
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run5._r.append(fld_end)


def add_page_number_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("第 ")
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(9)
    add_field(p, "PAGE", "1")
    run = p.add_run(" 页")
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(9)
    for r in p.runs:
        r.font.size = Pt(9)
        r.font.color.rgb = MUTED


def add_header(section, text="武陵山区果园管理系统毕业设计"):
    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(8.5)
    run.font.color.rgb = MUTED
    tab_stops = p.paragraph_format.tab_stops
    tab_stops.clear_all()
    tab_stops.add_tab_stop(Cm(15.5), alignment=WD_TAB_ALIGNMENT.RIGHT)
    run2 = p.add_run("\t计算机应用技术")
    set_eastasia(run2, FONT_BODY)
    run2.font.size = Pt(8.5)
    run2.font.color.rgb = MUTED
    border_paragraph(p, "bottom", "D8DDCD", "6")


def setup_document() -> Document:
    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin = Cm(3.0)
    section.right_margin = Cm(2.5)
    section.header_distance = Cm(1.4)
    section.footer_distance = Cm(1.4)
    section.different_first_page_header_footer = True
    add_header(section)
    add_page_number_footer(section)

    # Ask Word to refresh TOC / PAGE fields when the document is opened.
    settings = doc.settings.element
    update = OxmlElement("w:updateFields")
    update.set(qn("w:val"), "true")
    settings.append(update)

    normal = doc.styles["Normal"]
    style_font(normal, FONT_BODY, 10.5)
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_after = Pt(3)
    normal.paragraph_format.space_before = Pt(0)

    style_font(doc.styles["Heading 1"], FONT_HEAD, 16, True, GREEN)
    doc.styles["Heading 1"].paragraph_format.space_before = Pt(6)
    doc.styles["Heading 1"].paragraph_format.space_after = Pt(12)
    style_font(doc.styles["Heading 2"], FONT_HEAD, 14, True, GREEN)
    doc.styles["Heading 2"].paragraph_format.space_before = Pt(14)
    doc.styles["Heading 2"].paragraph_format.space_after = Pt(6)
    style_font(doc.styles["Heading 3"], FONT_HEAD, 12, True, GREEN)
    doc.styles["Heading 3"].paragraph_format.space_before = Pt(10)
    doc.styles["Heading 3"].paragraph_format.space_after = Pt(4)
    return doc


def add_body_paragraph(doc, text, indent=True, size=10.5, color=None, align=None, space_after=3):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.6
    p.paragraph_format.space_after = Pt(space_after)
    if indent:
        p.paragraph_format.first_line_indent = Pt(21)
    if align is not None:
        p.alignment = align
    add_inline(p, text, size=size, color=color)
    return p


def add_inline(paragraph, text, size=10.5, bold=False, color=None):
    text = html.unescape(str(text or ""))
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    pattern = re.compile(r"(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))")
    tokens = pattern.split(text)
    for token in tokens:
        if not token:
            continue
        is_bold = bold
        is_code = False
        if token.startswith("**") and token.endswith("**") and len(token) > 4:
            token = token[2:-2]
            is_bold = True
        elif token.startswith("`") and token.endswith("`") and len(token) > 2:
            token = token[1:-1]
            is_code = True
        elif token.startswith("[") and "](" in token:
            m = re.match(r"\[([^\]]+)\]\(([^)]+)\)", token)
            if m:
                token = m.group(1)
        run = paragraph.add_run(token)
        if is_code:
            set_eastasia(run, FONT_MONO)
            run.font.size = Pt(max(8.5, size - 1))
            run.font.color.rgb = RGBColor(0x8B, 0x3A, 0x2E)
        else:
            set_eastasia(run, FONT_BODY)
            run.font.size = Pt(size)
            if is_bold:
                run.bold = True
            if color:
                run.font.color.rgb = color


def add_bullet(doc, text, numbered=False, marker=None):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.74)
    p.paragraph_format.first_line_indent = Cm(-0.37)
    p.paragraph_format.line_spacing = 1.55
    p.paragraph_format.space_after = Pt(2)
    prefix = marker if marker else ("• " if not numbered else "1. ")
    run = p.add_run(prefix)
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(10.5)
    add_inline(p, text, size=10.5)
    return p


def add_quote(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.6)
    p.paragraph_format.right_indent = Cm(0.4)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.5
    shade_paragraph(p, "F4F5EE")
    border_paragraph(p, "left", "E58B36", "20")
    add_inline(p, text, size=9.5, color=RGBColor(0x4D, 0x5D, 0x52))


def add_code_block(doc, lines):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0)
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(7)
    p.paragraph_format.line_spacing = 1.0
    shade_paragraph(p, "F5F5EF")
    border_paragraph(p, "left", "9DBE8D", "14")
    for i, line in enumerate(lines):
        run = p.add_run(line)
        set_eastasia(run, FONT_MONO)
        run.font.size = Pt(8.3)
        run.font.color.rgb = RGBColor(0x33, 0x45, 0x3A)
        if i < len(lines) - 1:
            run.add_break(WD_BREAK.LINE)


def set_cell_margins(table, top=45, bottom=45, left=75, right=75):
    tblPr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for side, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tblPr.append(mar)


def add_table(doc, rows, header=True, font_size=8.6):
    if not rows:
        return
    cols = max(len(r) for r in rows)
    table = doc.add_table(rows=len(rows), cols=cols)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    set_cell_margins(table)
    for i, row in enumerate(rows):
        for j in range(cols):
            cell = table.cell(i, j)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            text = row[j] if j < len(row) else ""
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.line_spacing = 1.25
            if i == 0 and header:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                shade_cell(cell, GREEN_LIGHT)
                add_inline(p, text, size=font_size, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))
            else:
                add_inline(p, text, size=font_size)
    # repeat header row
    if header and len(table.rows):
        trPr = table.rows[0]._tr.get_or_add_trPr()
        tblHeader = OxmlElement("w:tblHeader")
        tblHeader.set(qn("w:val"), "true")
        trPr.append(tblHeader)
    # spacing after table
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.0
    return table


def add_image(doc, path: Path, caption: str | None = None):
    if not path.exists():
        print("  ! missing image", path)
        return
    try:
        with Image.open(path) as im:
            w, h = im.size
    except Exception:
        w, h = 1440, 1000
    width_cm = CONTENT_WIDTH_CM
    height_cm = width_cm * h / max(w, 1)
    if height_cm > 18.5:
        height_cm = 18.5
        width_cm = height_cm * w / max(h, 1)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(3)
    p.add_run().add_picture(str(path), width=Cm(width_cm), height=Cm(height_cm))
    if caption:
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.paragraph_format.first_line_indent = Cm(0)
        cp.paragraph_format.space_after = Pt(8)
        run = cp.add_run(caption)
        set_eastasia(run, FONT_BODY)
        run.font.size = Pt(9)
        run.font.color.rgb = MUTED


def parse_html_table(block: str):
    rows = []
    spans = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", block, flags=re.S | re.I):
        row, row_spans = [], []
        for m in re.finditer(r"<t[dh]([^>]*)>(.*?)</t[dh]>", tr, flags=re.S | re.I):
            attrs, content = m.group(1), m.group(2)
            content = re.sub(r"<br\s*/?>", "\n", content, flags=re.I)
            content = re.sub(r"<[^>]+>", "", content)
            content = html.unescape(content).strip()
            span_m = re.search(r'colspan\s*=\s*["\']?(\d+)', attrs, flags=re.I)
            row.append(re.sub(r"\s+", " ", content))
            row_spans.append(int(span_m.group(1)) if span_m else 1)
        if row:
            rows.append(row)
            spans.append(row_spans)
    return rows, spans


def add_html_table(doc, block):
    rows, spans = parse_html_table(block)
    if not rows:
        return
    cols = max(sum(s) for s in spans)
    table = doc.add_table(rows=len(rows), cols=cols)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    set_cell_margins(table)
    for i, row in enumerate(rows):
        col = 0
        for j, text in enumerate(row):
            span = spans[i][j] if j < len(spans[i]) else 1
            cell = table.cell(i, col)
            if span > 1:
                try:
                    cell = cell.merge(table.cell(i, min(cols - 1, col + span - 1)))
                except Exception:
                    pass
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.3
            if i == 0:
                shade_cell(cell, GREEN_LIGHT)
                add_inline(p, text, size=9.5, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))
            else:
                add_inline(p, text, size=9.5)
            col += span
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.0


def parse_markdown_table(lines, start):
    rows = []
    i = start
    while i < len(lines) and lines[i].strip().startswith("|"):
        raw = lines[i].strip().strip("|")
        cells = [c.strip() for c in raw.split("|")]
        if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
            rows.append(cells)
        i += 1
    return rows, i


def render_markdown(doc, md_path: Path, figure_counter=None, add_page_break=True, skip_h1=False):
    if figure_counter is None:
        figure_counter = [0]
    lines = md_path.read_text(encoding="utf-8").splitlines()
    i = 0
    first_h1 = True
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            i += 1
            continue

        # fenced code
        if stripped.startswith("```"):
            i += 1
            code = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i].rstrip("\n"))
                i += 1
            i += 1
            joined = "\n".join(code)
            # ASCII architecture / state / E-R sketches are replaced by the
            # higher-quality figures in the Word edition.
            if any(ch in joined for ch in "┌└│▼") or "──────" in joined:
                continue
            add_code_block(doc, code)
            continue

        # HTML table
        if stripped.lower().startswith("<table"):
            block = []
            while i < len(lines) and "</table>" not in lines[i].lower():
                block.append(lines[i])
                i += 1
            if i < len(lines):
                block.append(lines[i])
                i += 1
            add_html_table(doc, "\n".join(block))
            continue

        # image
        m = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", stripped)
        if m:
            path = (md_path.parent / m.group(2)).resolve()
            figure_counter[0] += 1
            add_image(doc, path, f"图 {figure_counter[0]}  {m.group(1)}")
            i += 1
            continue

        # headings
        m = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            text = m.group(2).strip()
            text = re.sub(r"`([^`]+)`", r"\1", text)
            text = text.replace("**", "")
            if level == 1:
                if skip_h1 and first_h1:
                    first_h1 = False
                    i += 1
                    continue
                if not first_h1 and add_page_break:
                    doc.add_page_break()
                first_h1 = False
                doc.add_heading(text, level=1)
            elif level == 2:
                doc.add_heading(text, level=2)
            elif level == 3:
                doc.add_heading(text, level=3)
            else:
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.space_after = Pt(3)
                run = p.add_run(text)
                set_eastasia(run, FONT_HEAD)
                run.bold = True
                run.font.size = Pt(11)
                run.font.color.rgb = GREEN
            i += 1
            continue

        # horizontal rule
        if re.fullmatch(r"-{3,}", stripped):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(4)
            border_paragraph(p, "bottom", "E4E2D5", "6")
            i += 1
            continue

        # markdown table
        if stripped.startswith("|") and i + 1 < len(lines) and re.match(r"^\|?[\s:|-]+\|?$", lines[i + 1].strip()):
            rows, i = parse_markdown_table(lines, i)
            # drop separator already handled
            add_table(doc, rows)
            continue

        # blockquote
        if stripped.startswith(">"):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(re.sub(r"^>\s?", "", lines[i].strip()))
                i += 1
            add_quote(doc, " ".join(quote_lines))
            continue

        # bullets / numbered
        m = re.match(r"^[-*]\s+(.*)$", stripped)
        if m:
            add_bullet(doc, m.group(1), numbered=False)
            i += 1
            continue
        m = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if m:
            add_bullet(doc, m.group(2), numbered=True, marker=f"{m.group(1)}. ")
            i += 1
            continue

        # signature / plain line with many underscores: keep centered spacing
        if re.fullmatch(r"[_\-—\s]{8,}", stripped):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(24)
            run = p.add_run(stripped)
            set_eastasia(run, FONT_BODY)
            run.font.size = Pt(10.5)
            i += 1
            continue

        # ordinary paragraph: collect consecutive plain lines into one paragraph
        para = [stripped]
        i += 1
        while i < len(lines):
            nxt = lines[i].strip()
            if not nxt or nxt.startswith(("#", "|", ">", "-", "*", "```", "![", "<table")):
                break
            if re.match(r"^\d+\.\s+", nxt):
                break
            para.append(nxt)
            i += 1
        add_body_paragraph(doc, " ".join(para))


def add_cover(doc):
    # top spacing + logo
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    if (SHOTS / "logo.png").exists():
        p.add_run().add_picture(str(SHOTS / "logo.png"), width=Cm(2.2))
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    run = p.add_run("__________________ 学 院")
    set_eastasia(run, FONT_HEAD)
    run.font.size = Pt(16)
    run.font.color.rgb = GREEN

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(42)
    run = p.add_run("毕 业 设 计（说 明 书）")
    set_eastasia(run, FONT_HEAD)
    run.bold = True
    run.font.size = Pt(26)
    run.font.color.rgb = GREEN

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(56)
    run = p.add_run("武陵山区果园管理系统的设计与实现")
    set_eastasia(run, FONT_TITLE)
    run.bold = True
    run.font.size = Pt(26)
    run.font.color.rgb = RGBColor(0x10, 0x29, 0x1F)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(14)
    run = p.add_run("—— 基于多页面 HTML5 的果园数字化管理平台")
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(13)
    run.font.color.rgb = RGBColor(0xB7, 0x64, 0x24)

    # divider
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(34)
    p.paragraph_format.space_after = Pt(20)
    border_paragraph(p, "bottom", "1F4D35", "12")

    info = [
        ("专    业", "计算机应用技术"),
        ("班    级", "__________________"),
        ("学生姓名", "__________________"),
        ("学    号", "__________________"),
        ("指导教师", "__________________"),
        ("完成日期", "二〇二六年十一月"),
    ]
    table = doc.add_table(rows=len(info), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    for i, (k, v) in enumerate(info):
        table.cell(i, 0).width = Cm(3.4)
        table.cell(i, 1).width = Cm(8.6)
        for j, text in enumerate((k, v)):
            cell = table.cell(i, j)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if j == 1 else WD_ALIGN_PARAGRAPH.RIGHT
            p.paragraph_format.space_before = Pt(5)
            p.paragraph_format.space_after = Pt(5)
            run = p.add_run(text)
            set_eastasia(run, FONT_BODY)
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor(0x33, 0x45, 0x3A)
    doc.add_page_break()


def add_abstract(doc):
    doc.add_heading("摘  要", level=1)
    abstract = (
        "武陵山区横跨湘、鄂、渝、黔四省市，是猕猴桃、柑橘、梨、李、莓茶等特色农产品的重要产区。"
        "针对当地中小果园信息分散、订单难管、采摘预约靠口头确认、客户咨询难以沉淀等问题，"
        "本课题设计并实现了一个“前台商城 + 后台管理”的轻量级果园管理系统。"
        "系统采用 HTML5、CSS3 和原生 JavaScript（ES6）开发，由 25 个 HTML 页面组成，"
        "使用 localStorage 模拟数据持久层，封装了统一的 store.js 数据访问层，"
        "实现了果园档案、产品管理、购物车、订单履约、采摘预约、资讯发布、留言回复、用户管理、"
        "经营看板和系统设置等功能。系统使用 CSS Grid/Flexbox 完成响应式布局，"
        "使用 Canvas 2D 手写经营趋势图和品类占比图，并配套 MySQL 8.0 数据库设计、"
        "Node.js 零依赖静态服务器和 Playwright 端到端测试。测试结果表明，"
        "系统核心业务闭环完整，65 项自动化检查全部通过，能够在桌面端和移动端稳定运行，"
        "可作为中小果园数字化管理的教学演示和原型参考。"
    )
    add_body_paragraph(doc, abstract)
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(14)
    run = p.add_run("关键词：")
    set_eastasia(run, FONT_HEAD)
    run.bold = True
    run.font.size = Pt(10.5)
    run = p.add_run("武陵山区；果园管理；多页面网站；电子商务；localStorage；MySQL")
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(10.5)
    doc.add_page_break()

    doc.add_heading("Abstract", level=1)
    abstract_en = (
        "Wuling Mountain, spanning Hunan, Hubei, Chongqing and Guizhou, is an important producing area "
        "for kiwifruit, citrus, pear, plum and berry tea. Small and medium-sized orchards in this region "
        "still rely on paper records, spreadsheets and chat messages, which makes product display, order "
        "fulfillment, picking reservations and customer communication inefficient. This project designs and "
        "implements a lightweight orchard management system with a customer-facing storefront and an "
        "administrative console. Built with HTML5, CSS3 and vanilla JavaScript (ES6), the system contains "
        "25 HTML pages and uses localStorage as a zero-configuration data layer. A unified store.js module "
        "encapsulates orchards, products, carts, orders, bookings, news, messages, users and statistics. "
        "The interface is responsive with CSS Grid/Flexbox, and the dashboards use native Canvas 2D charts. "
        "A MySQL 8.0 schema, a zero-dependency Node.js static server and Playwright end-to-end tests are also "
        "provided. All 65 automated checks pass, and the system runs smoothly on both desktop and mobile "
        "browsers. It can serve as a teaching demo and a prototype for digital orchard management."
    )
    add_body_paragraph(doc, abstract_en, indent=False)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    run = p.add_run("Keywords: ")
    set_eastasia(run, FONT_HEAD)
    run.bold = True
    run.font.size = Pt(10.5)
    run = p.add_run("Wuling Mountain; orchard management; multi-page website; e-commerce; localStorage; MySQL")
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(10.5)
    doc.add_page_break()


def add_toc(doc):
    doc.add_heading("目  录", level=1)
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_after = Pt(18)
    run = p.add_run("以下为本文档的一级目录；各章二级、三级标题见正文。")
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(9)
    run.font.color.rgb = MUTED

    entries = [
        ("摘要", 2, False),
        ("Abstract", 3, False),
        ("毕业设计任务书", 5, True),
        ("需求分析报告", 11, True),
        ("系统设计说明书", 23, True),
        ("数据库设计说明书", 40, True),
        ("系统测试报告", 54, True),
        ("毕业设计总结", 63, True),
    ]
    for title, page, main in entries:
        p = doc.add_paragraph()
        p.paragraph_format.first_line_indent = Cm(0)
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.35
        p.paragraph_format.tab_stops.add_tab_stop(Cm(15.2), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        run = p.add_run(title)
        set_eastasia(run, FONT_HEAD if main else FONT_BODY)
        run.font.size = Pt(12 if main else 11)
        run.bold = main
        run.font.color.rgb = GREEN if main else RGBColor(0x4D, 0x5D, 0x52)
        run = p.add_run("\t")
        set_eastasia(run, FONT_BODY)
        run.font.size = Pt(11)
        run = p.add_run(str(page))
        set_eastasia(run, FONT_BODY)
        run.font.size = Pt(11)
        run.font.color.rgb = MUTED

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(28)
    p.paragraph_format.space_after = Pt(10)
    border_paragraph(p, "bottom", "1F4D35", "8")
    run = p.add_run("文档结构说明")
    set_eastasia(run, FONT_HEAD)
    run.font.size = Pt(12)
    run.bold = True

    guide = [
        ("任务书", "明确选题背景、设计目标、任务内容、进度与成果要求。"),
        ("需求分析", "梳理用户角色、功能需求、业务流程、非功能需求与验收标准。"),
        ("系统设计与数据库设计", "说明总体架构、模块、页面、数据模型、表结构与迁移方案。"),
        ("测试与总结", "记录 65 项自动化检查、7 个缺陷修复，总结完成情况与后续展望。"),
    ]
    for k, v in guide:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.55)
        p.paragraph_format.first_line_indent = Cm(-0.55)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run("▪ ")
        set_eastasia(run, FONT_BODY)
        run.font.color.rgb = ORANGE
        run = p.add_run(k + "：")
        set_eastasia(run, FONT_BODY)
        run.font.size = Pt(9.5)
        run.bold = True
        run = p.add_run(v)
        set_eastasia(run, FONT_BODY)
        run.font.size = Pt(9.5)
        run.font.color.rgb = MUTED

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("6 份文档　·　25 个页面　·　10 张数据表　·　65 项自动化测试")
    set_eastasia(run, FONT_BODY)
    run.font.size = Pt(9)
    run.font.color.rgb = MUTED
    doc.add_page_break()


def build_main_docx():
    doc = setup_document()
    add_cover(doc)
    add_abstract(doc)
    add_toc(doc)
    figure_counter = [0]
    files = [
        "01-任务书.md",
        "02-需求分析.md",
        "03-系统设计.md",
        "04-数据库设计.md",
        "05-测试报告.md",
        "06-总结.md",
    ]
    for idx, name in enumerate(files):
        if idx > 0:
            doc.add_page_break()
        render_markdown(doc, DOCS / name, figure_counter=figure_counter, add_page_break=False)
    out = DOCS / "武陵山区果园管理系统-毕业设计说明书.docx"
    doc.save(out)
    print("saved", out)


def build_task_book_docx():
    doc = setup_document()
    # simple title block
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    if (SHOTS / "logo.png").exists():
        p.add_run().add_picture(str(SHOTS / "logo.png"), width=Cm(1.8))
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("毕业设计任务书")
    set_eastasia(run, FONT_HEAD)
    run.bold = True
    run.font.size = Pt(24)
    run.font.color.rgb = GREEN
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("武陵山区果园管理系统的设计与实现")
    set_eastasia(run, FONT_TITLE)
    run.font.size = Pt(16)
    run.font.color.rgb = RGBColor(0xB7, 0x64, 0x24)
    render_markdown(doc, DOCS / "01-任务书.md", skip_h1=True, add_page_break=False)
    out = DOCS / "武陵山区果园管理系统-任务书.docx"
    doc.save(out)
    print("saved", out)


if __name__ == "__main__":
    build_main_docx()
    build_task_book_docx()
