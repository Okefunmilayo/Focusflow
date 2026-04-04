from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "FocusFlow_Project_Plan.pdf")

DARK_BG      = colors.HexColor("#0F172A")
ACCENT_BLUE  = colors.HexColor("#3B82F6")
ACCENT_CYAN  = colors.HexColor("#06B6D4")
ACCENT_GREEN = colors.HexColor("#10B981")
ACCENT_AMBER = colors.HexColor("#F59E0B")
ACCENT_RED   = colors.HexColor("#EF4444")
LIGHT_GRAY   = colors.HexColor("#F8FAFC")
MID_GRAY     = colors.HexColor("#E2E8F0")
TEXT_DARK    = colors.HexColor("#1E293B")
TEXT_MID     = colors.HexColor("#475569")
WHITE        = colors.white


def build_styles():
    styles = {}
    styles["cover_title"] = ParagraphStyle("cover_title", fontSize=40, leading=48,
        textColor=WHITE, alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=6)
    styles["cover_sub"] = ParagraphStyle("cover_sub", fontSize=16, leading=22,
        textColor=ACCENT_CYAN, alignment=TA_CENTER, fontName="Helvetica", spaceAfter=4)
    styles["cover_tag"] = ParagraphStyle("cover_tag", fontSize=11, leading=16,
        textColor=colors.HexColor("#94A3B8"), alignment=TA_CENTER, fontName="Helvetica")
    styles["section_heading"] = ParagraphStyle("section_heading", fontSize=18, leading=24,
        textColor=ACCENT_BLUE, fontName="Helvetica-Bold", spaceBefore=18, spaceAfter=8)
    styles["sub_heading"] = ParagraphStyle("sub_heading", fontSize=13, leading=18,
        textColor=TEXT_DARK, fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4)
    styles["body"] = ParagraphStyle("body", fontSize=10.5, leading=16,
        textColor=TEXT_DARK, fontName="Helvetica", alignment=TA_JUSTIFY, spaceAfter=6)
    styles["body_mid"] = ParagraphStyle("body_mid", fontSize=10.5, leading=16,
        textColor=TEXT_MID, fontName="Helvetica", alignment=TA_JUSTIFY, spaceAfter=4)
    styles["bullet"] = ParagraphStyle("bullet", fontSize=10.5, leading=15,
        textColor=TEXT_DARK, fontName="Helvetica", leftIndent=14, spaceAfter=3, bulletIndent=4)
    styles["footer_note"] = ParagraphStyle("footer_note", fontSize=8, leading=12,
        textColor=TEXT_MID, fontName="Helvetica", alignment=TA_CENTER)
    styles["toc_item"] = ParagraphStyle("toc_item", fontSize=11, leading=18,
        textColor=ACCENT_BLUE, fontName="Helvetica", leftIndent=10)
    return styles


def hr(color=ACCENT_BLUE):
    return HRFlowable(width="100%", thickness=1, color=color, spaceAfter=6, spaceBefore=4)


def section_box(label, color=ACCENT_BLUE):
    data = [[Paragraph(f"<b>{label}</b>",
                       ParagraphStyle("sl", fontSize=14, textColor=WHITE,
                                      fontName="Helvetica-Bold", leading=18))]]
    t = Table(data, colWidths=["100%"])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
    ]))
    return t


def info_card(items, header_color=ACCENT_BLUE):
    table_data = [[
        Paragraph(f"<b>{k}</b>", ParagraphStyle("k", fontSize=10, textColor=WHITE,
                                                  fontName="Helvetica-Bold", leading=14)),
        Paragraph(str(v),         ParagraphStyle("v", fontSize=10, textColor=TEXT_DARK,
                                                  fontName="Helvetica", leading=14))
    ] for k, v in items]
    t = Table(table_data, colWidths=[5*cm, 11.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), header_color),
        ("BACKGROUND",    (1, 0), (1, -1), LIGHT_GRAY),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def phase_table(phases):
    header = [
        Paragraph("<b>Phase</b>",            ParagraphStyle("h", fontSize=10, textColor=WHITE, fontName="Helvetica-Bold")),
        Paragraph("<b>Duration</b>",         ParagraphStyle("h", fontSize=10, textColor=WHITE, fontName="Helvetica-Bold")),
        Paragraph("<b>Key Deliverables</b>", ParagraphStyle("h", fontSize=10, textColor=WHITE, fontName="Helvetica-Bold")),
    ]
    rows = [header]
    for ph, wk, deliv, col in phases:
        rows.append([
            Paragraph(ph,    ParagraphStyle("c", fontSize=9.5, textColor=WHITE,     fontName="Helvetica-Bold", backColor=col, leading=14)),
            Paragraph(wk,    ParagraphStyle("c", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14)),
            Paragraph(deliv, ParagraphStyle("c", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14)),
        ])
    bg = [("BACKGROUND", (0, 0), (-1, 0), DARK_BG)]
    for i, (_, _, _, col) in enumerate(phases, 1):
        bg.append(("BACKGROUND", (0, i), (0, i), col))
        bg.append(("BACKGROUND", (1, i), (2, i), LIGHT_GRAY if i % 2 == 0 else WHITE))
    t = Table(rows, colWidths=[4.5*cm, 3*cm, 9*cm])
    t.setStyle(TableStyle([
        *bg,
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def revenue_table(rows_data):
    header = [
        Paragraph(f"<b>{c}</b>", ParagraphStyle("h", fontSize=10, textColor=WHITE, fontName="Helvetica-Bold"))
        for c in ["Revenue Stream", "Target Segment", "Est. Monthly", "Notes"]
    ]
    rows = [header] + [
        [Paragraph(c, ParagraphStyle("c", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14))
         for c in row]
        for row in rows_data
    ]
    t = Table(rows, colWidths=[4*cm, 3.5*cm, 3*cm, 6*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), DARK_BG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("TOPPADDING",     (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 6),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 7),
        ("GRID",           (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def tech_stack_table(rows_data):
    header = [
        Paragraph(f"<b>{c}</b>", ParagraphStyle("h", fontSize=10, textColor=WHITE, fontName="Helvetica-Bold"))
        for c in ["Layer", "Technology", "Purpose"]
    ]
    rows = [header] + [
        [Paragraph(c, ParagraphStyle("c", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14))
         for c in row]
        for row in rows_data
    ]
    t = Table(rows, colWidths=[3.5*cm, 5*cm, 8*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), DARK_BG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("TOPPADDING",     (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 6),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 7),
        ("GRID",           (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def on_page(canvas, doc):
    w, h = A4
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, h - 1.1*cm, w, 1.1*cm, fill=1, stroke=0)
    canvas.setFillColor(ACCENT_CYAN)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(1.5*cm, h - 0.75*cm, "FocusFlow — AI Productivity & Study Planner")
    canvas.setFillColor(colors.HexColor("#94A3B8"))
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 1.5*cm, h - 0.75*cm, "Confidential Project Plan  |  2026")
    canvas.setFillColor(MID_GRAY)
    canvas.rect(0, 0, w, 0.9*cm, fill=1, stroke=0)
    canvas.setFillColor(TEXT_MID)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(w / 2, 0.35*cm, f"Page {doc.page}")


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        topMargin=1.6*cm, bottomMargin=1.4*cm,
        leftMargin=1.8*cm, rightMargin=1.8*cm,
        title="FocusFlow — Project Plan", author="FocusFlow Founder",
    )
    S = build_styles()
    story = []

    # ── COVER ──────────────────────────────────────────────────────────────
    cover_bg = Table([[Paragraph("", S["body"])]], colWidths=["100%"], rowHeights=[22*cm])
    cover_bg.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), DARK_BG)]))
    story.append(cover_bg)
    story.append(Spacer(1, -22*cm))
    story.append(Spacer(1, 3.5*cm))
    story.append(Paragraph("FocusFlow", S["cover_title"]))
    story.append(Paragraph("AI-Powered Productivity &amp; Study Planner", S["cover_sub"]))
    story.append(Spacer(1, 0.5*cm))

    badge_row = [[Paragraph(x, ParagraphStyle("b", fontSize=9, textColor=WHITE,
                                               fontName="Helvetica-Bold", alignment=TA_CENTER))
                  for x in ["Full-Stack Web App", "Claude API Powered", "SaaS / Freemium", "Students + Corporate"]]]
    badge_t = Table(badge_row, colWidths=[4*cm]*4)
    badge_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), ACCENT_BLUE),
        ("BACKGROUND", (1, 0), (1, 0), ACCENT_CYAN),
        ("BACKGROUND", (2, 0), (2, 0), ACCENT_GREEN),
        ("BACKGROUND", (3, 0), (3, 0), ACCENT_AMBER),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(badge_t)
    story.append(Spacer(1, 0.8*cm))
    story.append(Paragraph("Complete Founder's Blueprint  |  April 2026", S["cover_tag"]))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph("Prepared by the FocusFlow founding team. This document is confidential.", S["cover_tag"]))
    story.append(PageBreak())

    # ── TOC ────────────────────────────────────────────────────────────────
    story.append(section_box("Table of Contents", DARK_BG))
    story.append(Spacer(1, 0.4*cm))
    for item in [
        "1. Executive Summary",                         "2. Problem Statement",
        "3. Solution Overview",                         "4. Target Users & Market Opportunity",
        "5. Core Features (Detailed)",                  "6. Technology Stack",
        "7. System Architecture",                       "8. Step-by-Step Execution Plan (Week-by-Week)",
        "9. Everything You Need to Build This",         "10. How Users Will Access FocusFlow",
        "11. Web App vs. Native App — Decision",        "12. Revenue Model & Pricing",
        "13. Benefits to Students",                     "14. Benefits to Corporate Workers",
        "15. Benefits to Society",                      "16. Competitive Landscape",
        "17. Risk Analysis & Mitigation",               "18. Launch Strategy & Marketing",
        "19. 12-Month Growth Roadmap",                  "20. Conclusion & Call to Action",
    ]:
        story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;{item}", S["toc_item"]))
    story.append(PageBreak())

    # ── 1. EXECUTIVE SUMMARY ───────────────────────────────────────────────
    story.append(section_box("1. Executive Summary", ACCENT_BLUE))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "<b>FocusFlow</b> is an AI-powered, full-stack web application designed to become the most intelligent "
        "productivity and study planner on the market. It serves two primary audiences — students managing "
        "academic workloads and corporate professionals juggling deadlines and projects — and supercharges their "
        "daily planning with the Anthropic Claude API.",
        S["body"]
    ))
    story.append(Paragraph(
        "At its core, FocusFlow eliminates the two biggest reasons people fail at personal productivity: "
        "<b>goal paralysis</b> and <b>motivation decay</b>. The AI Goal Breakdown engine (powered by "
        "Claude Sonnet 4.6) converts any large ambition into a clear, daily action plan. The Pomodoro Timer "
        "with streaks keeps focus alive. The Weekly AI Digest holds users accountable and continuously improves "
        "their strategy.",
        S["body"]
    ))
    story.append(Paragraph(
        "Claude was chosen over other AI providers for its superior 200K token context window (ideal for "
        "the Document Summariser), exceptional instruction-following for structured JSON output, and its "
        "Constitutional AI safety layer — important for handling student and professional content responsibly.",
        S["body"]
    ))
    story.append(Spacer(1, 0.3*cm))
    story.append(info_card([
        ("Product Name",   "FocusFlow — AI Productivity & Study Planner"),
        ("Type",           "Full-Stack SaaS Web Application (PWA)"),
        ("AI Engine",      "Anthropic Claude API — Sonnet 4.6 + Haiku 4.5"),
        ("Monetisation",   "Freemium + Pro Subscription (£7.99/mo) + Institution Licensing"),
        ("Total Dev Time", "16 Weeks (4 months) for full MVP launch"),
        ("Monthly Dev Cost","~£15/month (Claude API dev usage only; hosting is free tier)"),
        ("Target Launch",  "August 2026"),
    ]))
    story.append(PageBreak())

    # ── 2. PROBLEM STATEMENT ───────────────────────────────────────────────
    story.append(section_box("2. Problem Statement", ACCENT_CYAN))
    story.append(Spacer(1, 0.3*cm))
    for group, pts in [
        ("Students", [
            "Overwhelmed by multiple subjects, assignment deadlines, and exam schedules simultaneously.",
            "No personalised study plan — generic to-do apps don't understand academic context.",
            "Long documents (PDFs, lecture notes) are time-consuming to review.",
            "No insight into how productively they are using their study time.",
        ]),
        ("Corporate Workers", [
            "Big quarterly goals rarely translate into concrete daily actions.",
            "No AI-assisted weekly retrospective to course-correct strategy.",
            "Meeting overload reduces deep work time with no tracking.",
            "Scattered across 5+ tools with no unified productivity hub.",
        ]),
    ]:
        story.append(Paragraph(f"<b>{group}</b>", S["sub_heading"]))
        for pt in pts:
            story.append(Paragraph(f"• {pt}", S["bullet"]))
        story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "Existing tools like Notion, Todoist, and Google Calendar are powerful but <b>generic</b>. "
        "None offer AI-native planning, document intelligence, or adaptive weekly coaching. "
        "<b>FocusFlow fills this gap — powered by Claude.</b>",
        S["body"]
    ))
    story.append(PageBreak())

    # ── 3. SOLUTION OVERVIEW ───────────────────────────────────────────────
    story.append(section_box("3. Solution Overview — What is FocusFlow?", ACCENT_GREEN))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "FocusFlow is a single, beautifully designed web application that combines seven powerful modules "
        "into one seamless experience. Every feature is connected — tasks feed analytics, focus sessions "
        "update streaks, uploaded documents generate flashcards, and Claude reads all of it at week's end "
        "to deliver personalised coaching.",
        S["body"]
    ))
    for icon_name, desc in [
        ("🔐 Auth System",          "Secure JWT-based registration, login, and session management."),
        ("✅ Task Manager",          "Full CRUD tasks with priorities, categories, due dates, and status tracking."),
        ("🤖 AI Goal Breakdown",     "Type any goal — Claude Sonnet 4.6 returns a structured daily plan auto-saved as tasks."),
        ("📄 Document Summariser",   "Upload PDFs; Claude returns a summary, key bullets, and Q&A flashcards."),
        ("⏱ Pomodoro Focus Timer",  "25/5 cycles with session logging, productivity streaks, and desktop notifications."),
        ("📊 Analytics Dashboard",  "Charts showing task completion rates, focus hours, and weekly performance."),
        ("📬 Weekly AI Digest",      "Every Sunday, Claude reviews your week and delivers personalised coaching."),
    ]:
        story.append(Paragraph(f"<b>{icon_name}</b> — {desc}", S["bullet"]))
    story.append(PageBreak())

    # ── 4. TARGET USERS ────────────────────────────────────────────────────
    story.append(section_box("4. Target Users & Market Opportunity", ACCENT_AMBER))
    story.append(Spacer(1, 0.3*cm))
    story.append(info_card([
        ("Global Student Population",      "~220 million university students worldwide"),
        ("Remote/Hybrid Workers",           "~1.3 billion knowledge workers globally"),
        ("Productivity App Market (2024)",  "USD $102 billion — growing at 13% CAGR"),
        ("AI Productivity Tools (2026)",    "Projected USD $24 billion sub-segment"),
        ("Addressable Niche (Year 1)",      "50,000 users (students + junior professionals)"),
        ("Realistic Paid Conversion",       "5–10% → 2,500–5,000 paying users in Year 1"),
    ], ACCENT_AMBER))
    story.append(PageBreak())

    # ── 5. CORE FEATURES ───────────────────────────────────────────────────
    story.append(section_box("5. Core Features — Detailed Specification", ACCENT_BLUE))
    story.append(Spacer(1, 0.3*cm))
    feat_details = [
        ("Feature 1: User Authentication", ACCENT_BLUE, [
            "JWT access token (15 min) + refresh token (7 days), bcrypt password hashing.",
            "httpOnly cookie storage — XSS protected.",
            "Optional Google OAuth 2.0 sign-in.",
            "Password reset via SendGrid email.",
        ]),
        ("Feature 2: Task Manager", ACCENT_CYAN, [
            "Create tasks: title, description, due date, priority (High/Medium/Low), category, status.",
            "Drag-and-drop Kanban board (To-Do / In-Progress / Done).",
            "Bulk actions, sub-tasks, recurring tasks.",
        ]),
        ("Feature 3: AI Goal Breakdown — Claude Sonnet 4.6", ACCENT_GREEN, [
            "User enters a high-level goal with optional deadline and context.",
            "Claude Sonnet 4.6 uses chain-of-thought reasoning to return: phases, weekly milestones, daily actions.",
            "Generated plan auto-saved as tasks. User can regenerate, edit, or accept individual steps.",
            "Rate-limited per tier (3/month free · unlimited Pro).",
        ]),
        ("Feature 4: Document Summariser — Claude Sonnet 4.6 (200K Context)", ACCENT_AMBER, [
            "Upload PDF or paste text — Claude's 200K context window handles full textbooks without chunking.",
            "Returns: 300-word summary, 5–10 key bullet points, and Q&A flashcards.",
            "Flashcard study mode with flip-card UI. Export to PDF or Anki format.",
        ]),
        ("Feature 5: Pomodoro Focus Timer", ACCENT_RED, [
            "Classic 25/5 cycles with customisable intervals (Pro).",
            "Each session logged with linked task, duration, and timestamp.",
            "Productivity streak counter + focus heatmap.",
        ]),
        ("Feature 6: Analytics Dashboard", ACCENT_BLUE, [
            "Weekly completion bar chart, category pie chart, GitHub-style focus heatmap.",
            "Month-over-month productivity trend line chart.",
        ]),
        ("Feature 7: Weekly AI Digest — Claude Sonnet 4.6", ACCENT_GREEN, [
            "node-cron job runs every Sunday at 8:00 PM.",
            "Claude reads: tasks completed, focus hours, missed tasks, category breakdown.",
            "Returns personalised coaching: what went well, what to improve, 3 specific next-week recommendations.",
            "Delivered in-app + optional SendGrid email. Digest history saved for tracking.",
        ]),
    ]
    for title, color, points in feat_details:
        story.append(KeepTogether([
            Paragraph(f"<b>{title}</b>",
                      ParagraphStyle("fh", fontSize=12, textColor=color,
                                     fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=4)),
            *[Paragraph(f"• {p}", S["bullet"]) for p in points],
            Spacer(1, 0.15*cm),
        ]))
    story.append(PageBreak())

    # ── 6. TECHNOLOGY STACK ────────────────────────────────────────────────
    story.append(section_box("6. Technology Stack", DARK_BG))
    story.append(Spacer(1, 0.3*cm))
    stack = [
        ("Frontend",    "React 18 + TypeScript",         "Component-based UI with strict typing"),
        ("Frontend",    "Tailwind CSS + shadcn/ui",       "Rapid, consistent, accessible styling"),
        ("Frontend",    "Zustand + React Query",          "Global state + server state caching"),
        ("Frontend",    "Recharts",                       "Analytics charts and visualisation"),
        ("Backend",     "Node.js + Express.js",           "Stateless REST API with versioned routes"),
        ("Backend",     "JWT + bcrypt",                   "Authentication and password security"),
        ("Backend",     "Multer + node-cron",             "File uploads + scheduled cron jobs"),
        ("Backend",     "SendGrid",                       "Transactional emails + Weekly Digest delivery"),
        ("Database",    "PostgreSQL + Prisma ORM",        "Relational DB with type-safe queries"),
        ("Database",    "Supabase (managed)",             "Free-tier hosted PostgreSQL"),
        ("AI Layer",    "Anthropic Claude API",           "claude-sonnet-4-6 (complex AI) + claude-haiku-4-5 (fast/cheap tasks)"),
        ("AI Layer",    "LangChain.js",                   "Document loading, chunking, Claude chains"),
        ("Infra",       "Docker + Render",                "Containerised dev + free-tier production"),
        ("Infra",       "Cloudinary / AWS S3",            "PDF and file storage with signed URLs"),
        ("Infra",       "GitHub Actions",                 "CI/CD: test → build → deploy"),
        ("Testing",     "Jest + Supertest",               "Backend unit and integration tests"),
        ("Testing",     "Vitest + RTL",                   "Frontend component tests"),
        ("Billing",     "Stripe",                         "Pro subscriptions + team plan billing"),
    ]
    story.append(tech_stack_table(stack))

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("<b>Claude API Model Routing Strategy</b>", S["sub_heading"]))
    routing = [
        ("AI Goal Breakdown",      "claude-sonnet-4-6", "Deep reasoning + strict structured JSON output"),
        ("Document Summariser",    "claude-sonnet-4-6", "200K token context — handles full textbooks natively"),
        ("Flashcard Generation",   "claude-haiku-4-5",  "Fast & cheap — simple Q&A format, high volume"),
        ("Weekly AI Digest",       "claude-sonnet-4-6", "Personalised coaching quality matters here"),
        ("Task suggestions / tips","claude-haiku-4-5",  "Low complexity — keeps API costs minimal"),
    ]
    routing_header = [
        Paragraph(f"<b>{c}</b>", ParagraphStyle("rh", fontSize=10, textColor=WHITE, fontName="Helvetica-Bold"))
        for c in ["Feature", "Model", "Reason"]
    ]
    routing_rows = [routing_header] + [
        [Paragraph(c, ParagraphStyle("rc", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14))
         for c in row]
        for row in routing
    ]
    rt = Table(routing_rows, colWidths=[5*cm, 4.5*cm, 7*cm])
    rt.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), ACCENT_BLUE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("TOPPADDING",     (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7), ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("GRID",           (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(rt)
    story.append(PageBreak())

    # ── 7. ARCHITECTURE ────────────────────────────────────────────────────
    story.append(section_box("7. System Architecture Overview", ACCENT_CYAN))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "FocusFlow follows a clean three-tier architecture: <b>Client → API Server → Database + Claude API + Storage</b>.",
        S["body"]
    ))
    for layer, desc in [
        ("Client (React PWA)",
         "React SPA served via CDN. Communicates with backend via REST API using Axios. JWT stored in httpOnly cookies."),
        ("API Server (Express.js on Render)",
         "Stateless REST API with versioned routes (/api/v1/...). Handles auth, task CRUD, file uploads, Claude proxy calls, and cron scheduling."),
        ("Database (PostgreSQL on Supabase)",
         "Managed PostgreSQL. Prisma ORM for all queries. Tables: users, tasks, pomodoro_sessions, documents, flashcards, digests."),
        ("Claude AI Service Layer",
         "Node.js service module wrapping the Anthropic SDK. Routes requests to claude-sonnet-4-6 or claude-haiku-4-5 based on task complexity. Rate-limited and response-cached."),
        ("File Storage (Cloudinary / S3)",
         "Uploaded PDFs stored with signed URLs for secure retrieval by the Claude Document Summariser."),
        ("Cron Jobs",
         "node-cron runs inside the server. Weekly Digest job queries DB, calls Claude Sonnet 4.6, fires SendGrid email every Sunday at 8 PM."),
    ]:
        story.append(Paragraph(f"<b>{layer}</b>", S["sub_heading"]))
        story.append(Paragraph(desc, S["body_mid"]))
    story.append(PageBreak())

    # ── 8. EXECUTION PLAN ──────────────────────────────────────────────────
    story.append(section_box("8. Step-by-Step Execution Plan (16 Weeks)", ACCENT_GREEN))
    story.append(Spacer(1, 0.3*cm))
    phases = [
        ("Phase 1\nFoundation\n(Weeks 1–2)",     "Weeks 1–2",
         "• Monorepo structure (client/ + server/)\n• TypeScript, ESLint, Prettier config\n• PostgreSQL + Prisma schema\n• Docker Compose + GitHub repo + CI",
         ACCENT_BLUE),
        ("Phase 2\nAuth\n(Weeks 3–4)",           "Weeks 3–4",
         "• Register/Login/Logout API\n• JWT + refresh token logic\n• Password reset via SendGrid\n• React auth screens + protected routes",
         ACCENT_CYAN),
        ("Phase 3\nTask Manager\n(Weeks 5–6)",   "Weeks 5–6",
         "• Full CRUD task API\n• Kanban drag-and-drop board\n• Sub-tasks + recurring tasks\n• Integration tests",
         ACCENT_GREEN),
        ("Phase 4\nClaude AI Goals\n(Weeks 7–8)","Weeks 7–8",
         "• Anthropic SDK integration\n• claude-sonnet-4-6 prompt engineering\n• Goal input → task auto-creation\n• Per-tier rate limiting",
         ACCENT_AMBER),
        ("Phase 5\nDoc Summariser\n(Weeks 9–10)","Weeks 9–10",
         "• Multer file upload + Cloudinary\n• LangChain + Claude 200K context\n• Summary + flashcard generation\n• Study mode UI + Anki export",
         ACCENT_RED),
        ("Phase 6\nPomodoro + Analytics\n(Weeks 11–12)", "Weeks 11–12",
         "• Pomodoro timer + session logging\n• Streak calculation logic\n• Analytics aggregation endpoints\n• Recharts dashboard UI",
         colors.HexColor("#8B5CF6")),
        ("Phase 7\nWeekly Digest\n(Weeks 13–14)","Weeks 13–14",
         "• node-cron Sunday job\n• Claude Sonnet 4.6 coaching prompt\n• SendGrid email template\n• In-app notification + digest history",
         colors.HexColor("#EC4899")),
        ("Phase 8\nLaunch\n(Weeks 15–16)",       "Weeks 15–16",
         "• Full test coverage (Jest + Vitest)\n• Performance + code splitting\n• Render production deploy\n• Stripe billing + Product Hunt launch",
         ACCENT_GREEN),
    ]
    story.append(phase_table(phases))
    story.append(PageBreak())

    # ── 9. EVERYTHING YOU NEED ─────────────────────────────────────────────
    story.append(section_box("9. Everything You Need to Build FocusFlow", DARK_BG))
    story.append(Spacer(1, 0.3*cm))
    for section_title, pts in [
        ("Skills / Knowledge", [
            "JavaScript / TypeScript (intermediate–advanced)",
            "React fundamentals + Node.js + Express REST API design",
            "SQL basics and Prisma ORM usage",
            "Basic understanding of JWT and auth flows",
            "Anthropic Claude API / prompt engineering (learn as you go)",
        ]),
        ("Accounts & API Keys", [
            "Anthropic Console account — Claude API key (pay-per-use, ~£15/month for dev)",
            "SendGrid account — free tier (100 emails/day)",
            "Cloudinary account — free tier for file storage",
            "Render account — free tier for backend + frontend hosting",
            "Supabase account — free tier for managed PostgreSQL",
            "Stripe account — for Pro subscription billing",
            "GitHub account — repo hosting + Actions CI/CD",
        ]),
        ("Software Tools (You Already Have Most of These)", [
            "VS Code ✓   |   Docker Desktop ✓   |   Postman ✓   |   Windows 11 ✓",
            "Node.js v20+, Git, PostgreSQL client (DBeaver or TablePlus)",
        ]),
        ("Monthly Costs (Dev Phase — 0 to 100 users)", [
            "Render free tier: £0  |  Supabase free tier: £0  |  SendGrid free tier: £0",
            "Cloudinary free tier: £0  |  Anthropic Claude API (dev): ~£15/month",
            "TOTAL: ~£15/month to build and run the full MVP",
        ]),
    ]:
        story.append(Paragraph(f"<b>{section_title}</b>", S["sub_heading"]))
        for pt in pts:
            story.append(Paragraph(f"• {pt}", S["bullet"]))
        story.append(Spacer(1, 0.2*cm))
    story.append(PageBreak())

    # ── 10. HOW USERS ACCESS ───────────────────────────────────────────────
    story.append(section_box("10. How People Will Access FocusFlow", ACCENT_BLUE))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "FocusFlow is a <b>Progressive Web Application (PWA)</b> — accessed via any modern web browser "
        "and installable on any device like a native app.",
        S["body"]
    ))
    for method, desc in [
        ("Browser (Desktop & Mobile)",   "Visit focusflow.app in Chrome, Firefox, Safari, or Edge. Full functionality, zero install."),
        ("Installed PWA",                "Add to home screen on iOS/Android or desktop Chrome. Launches standalone with offline support."),
        ("Email Notifications",          "Weekly AI Digest every Sunday. Password reset. Optional daily task reminders via SendGrid."),
        ("Push Notifications",           "Pomodoro alerts, deadline reminders, streak notifications via Web Push API."),
        ("Future: React Native App",     "Post-MVP — same Express API reused for iOS + Android native app (Month 11 of roadmap)."),
    ]:
        story.append(Paragraph(f"<b>{method}</b>", S["sub_heading"]))
        story.append(Paragraph(desc, S["body_mid"]))
    story.append(PageBreak())

    # ── 11. WEB APP VS NATIVE ──────────────────────────────────────────────
    story.append(section_box("11. Web App vs. Native App — The Decision", ACCENT_CYAN))
    story.append(Spacer(1, 0.3*cm))
    comparison = [
        ("Criterion",           "Web App (PWA) ✅",                    "Native Mobile App"),
        ("Build time",          "Faster — 1 codebase",                  "Slower — separate iOS + Android"),
        ("Distribution",        "No app store needed",                  "App Store + Play Store approval"),
        ("Launch cost",         "Near zero",                            "$99/year Apple Developer + time"),
        ("Cross-platform",      "All devices",                          "Platform-specific builds"),
        ("Offline support",     "Yes — Service Workers",                "Yes — native"),
        ("Push notifications",  "Yes — Web Push API",                   "Yes — native"),
        ("SEO / Discovery",     "Yes — Google-indexable",               "No"),
        ("Recommended MVP",     "✅ YES",                               "Post-MVP milestone"),
    ]
    ch = ParagraphStyle("ch", fontSize=9.5, textColor=WHITE,       fontName="Helvetica-Bold", leading=14)
    cb = ParagraphStyle("cb", fontSize=9.5, textColor=TEXT_DARK,   fontName="Helvetica",      leading=14)
    cg = ParagraphStyle("cg", fontSize=9.5, textColor=ACCENT_GREEN,fontName="Helvetica-Bold", leading=14)
    cmp_rows = [
        [Paragraph(c, ch) for c in comparison[0]]
    ] + [
        [Paragraph(row[0], cb),
         Paragraph(row[1], cg if "✅" in row[1] else cb),
         Paragraph(row[2], cb)]
        for row in comparison[1:]
    ]
    cmp_t = Table(cmp_rows, colWidths=[4.5*cm, 6.5*cm, 5.5*cm])
    cmp_t.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), DARK_BG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("TOPPADDING",     (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7), ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("GRID",           (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(cmp_t)
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "<b>Verdict:</b> Build FocusFlow as a PWA first. Faster, cheaper, accessible on every device. "
        "Add a React Native mobile app as a post-launch milestone at Month 11.",
        S["body"]
    ))
    story.append(PageBreak())

    # ── 12. REVENUE MODEL ─────────────────────────────────────────────────
    story.append(section_box("12. Revenue Model & Pricing", ACCENT_AMBER))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("<b>Pricing Tiers</b>", S["sub_heading"]))
    pricing_data = [
        [Paragraph("<b>Free</b>",  ParagraphStyle("pt", fontSize=11, textColor=WHITE, fontName="Helvetica-Bold", leading=14)),
         Paragraph("£0/month",     ParagraphStyle("pp", fontSize=11, textColor=ACCENT_AMBER, fontName="Helvetica-Bold", leading=14)),
         Paragraph("5 active tasks · 1 AI goal/month · 3 Pomodoros/day · Basic analytics",
                   ParagraphStyle("pf", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14))],
        [Paragraph("<b>Pro</b>",   ParagraphStyle("pt", fontSize=11, textColor=WHITE, fontName="Helvetica-Bold", leading=14)),
         Paragraph("£7.99/month",  ParagraphStyle("pp", fontSize=11, textColor=ACCENT_AMBER, fontName="Helvetica-Bold", leading=14)),
         Paragraph("Unlimited tasks & AI · Document summariser · Weekly Digest · Full analytics",
                   ParagraphStyle("pf", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14))],
        [Paragraph("<b>Team</b>",  ParagraphStyle("pt", fontSize=11, textColor=WHITE, fontName="Helvetica-Bold", leading=14)),
         Paragraph("£19.99/user/mo",ParagraphStyle("pp", fontSize=11, textColor=ACCENT_AMBER, fontName="Helvetica-Bold", leading=14)),
         Paragraph("All Pro + team workspaces · manager dashboard · bulk invite · priority support",
                   ParagraphStyle("pf", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14))],
    ]
    pt = Table(pricing_data, colWidths=[2.5*cm, 3*cm, 11*cm])
    pt.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), DARK_BG),
        ("BACKGROUND",    (1, 0), (2, 0), colors.HexColor("#FEF3C7")),
        ("BACKGROUND",    (1, 1), (2, 1), WHITE),
        ("BACKGROUND",    (1, 2), (2, 2), LIGHT_GRAY),
        ("TOPPADDING",    (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),  ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(pt)
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph("<b>Revenue Streams</b>", S["sub_heading"]))
    story.append(revenue_table([
        ["Pro Subscriptions",     "Students & freelancers",   "£7.99/user/mo",   "2,500 users × £7.99 = £19,975/mo at scale"],
        ["Team Licenses",          "SMEs & remote teams",      "£19.99/user/mo",  "50 teams × 5 users = £4,997/mo at scale"],
        ["University Licensing",   "HEIs & schools",           "£500–£2,000/yr",  "Bulk institutional access deal"],
        ["Corporate Partnerships", "HR / L&D departments",     "Custom pricing",  "White-label deal for onboarding tools"],
    ]))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("<b>Founder Earnings Projection</b>", S["sub_heading"]))
    story.append(info_card([
        ("Month 1–3 (Beta)",      "£0 — building audience, collecting feedback"),
        ("Month 4–6 (100 Pro)",   "~£799/month — covers Claude API + hosting costs"),
        ("Month 7–9 (500 Pro)",   "~£3,995/month — salary-level income"),
        ("Month 10–12 (1,500 Pro)","~£11,985/month — strong SaaS revenue"),
        ("Year 2 (5,000 Pro)",     "~£23,000+/month — sustainable business"),
    ], ACCENT_AMBER))
    story.append(PageBreak())

    # ── 13. BENEFITS TO STUDENTS ───────────────────────────────────────────
    story.append(section_box("13. Benefits to Students", ACCENT_BLUE))
    story.append(Spacer(1, 0.3*cm))
    for title, desc in [
        ("Instant AI Study Plans",       "Type 'Pass my chemistry final in 3 weeks' — Claude Sonnet 4.6 returns a day-by-day revision plan in seconds."),
        ("PDF Summariser Saves Hours",   "A 200-page textbook becomes a 500-word summary + 20 flashcards in under 60 seconds thanks to Claude's 200K context."),
        ("Pomodoro Keeps Focus Honest",  "Evidence-backed study cycles tracked over time — students see exactly how many hours they studied per subject."),
        ("Streak Gamification",          "Daily study streaks are surprisingly motivating. Same psychology as Duolingo but applied to real academic work."),
        ("Free Weekly AI Coaching",      "The Sunday Digest is like a personal tutor reviewing your week — available to every student, completely free."),
        ("Exam Stress Reduction",        "Organised plans + small daily steps dramatically reduce the psychological burden of exam season."),
    ]:
        story.append(Paragraph(f"<b>{title}</b>", S["sub_heading"]))
        story.append(Paragraph(desc, S["body_mid"]))
    story.append(PageBreak())

    # ── 14. BENEFITS TO CORPORATE ──────────────────────────────────────────
    story.append(section_box("14. Benefits to Corporate Workers", ACCENT_GREEN))
    story.append(Spacer(1, 0.3*cm))
    for title, desc in [
        ("OKRs → Daily Actions",         "Claude converts vague quarterly goals like 'Grow Q2 revenue 15%' into concrete weekly and daily tasks."),
        ("Deep Work Tracking",            "Pomodoro session logging gives professionals hard data on focus hours — valuable for WFH accountability."),
        ("Document Intelligence",         "Upload a 40-page board report — get an executive summary in seconds. Claude handles length effortlessly."),
        ("Private Weekly Retrospective",  "Sunday Digest catches strategic drift before it becomes a crisis — automatically, without a manager."),
        ("Task Priority Clarity",         "High/Medium/Low tags always answer 'what is the single most important thing to do right now?'"),
        ("One Hub — Five Tools Replaced", "FocusFlow replaces separate Pomodoro apps, note tools, task managers, and AI chat tools in one login."),
    ]:
        story.append(Paragraph(f"<b>{title}</b>", S["sub_heading"]))
        story.append(Paragraph(desc, S["body_mid"]))
    story.append(PageBreak())

    # ── 15. SOCIETAL BENEFITS ─────────────────────────────────────────────
    story.append(section_box("15. Benefits to Society", ACCENT_CYAN))
    story.append(Spacer(1, 0.3*cm))
    for b in [
        "Democratises AI coaching: Students from low-income backgrounds get Claude-powered academic guidance for free.",
        "Reduces cognitive overload: Structured planning reduces anxiety, burnout, and decision fatigue — real mental health benefits.",
        "Supports neurodivergent users: Structured Pomodoro system, visual boards, and Claude's step-by-step plans benefit users with ADHD or dyslexia.",
        "Accelerates lifelong learning: The Document Summariser + Flashcard generator makes self-education dramatically faster.",
        "Reduces educational inequality: A student anywhere in the world gets the same quality of AI-powered planning as one at a top institution.",
    ]:
        story.append(Paragraph(f"• {b}", S["bullet"]))
        story.append(Spacer(1, 0.1*cm))
    story.append(PageBreak())

    # ── 16. COMPETITIVE LANDSCAPE ─────────────────────────────────────────
    story.append(section_box("16. Competitive Landscape", ACCENT_AMBER))
    story.append(Spacer(1, 0.3*cm))
    comp_data = [
        ["Competitor",          "Strengths",                         "Gap vs FocusFlow"],
        ["Notion",              "Flexible, powerful, popular",       "No AI goals, no Pomodoro, no digest"],
        ["Todoist",             "Clean task management",             "No AI, no doc summariser, no focus timer"],
        ["Motion",              "AI scheduling",                     "Expensive, no study features, no document AI"],
        ["MyStudyLife",         "Student-specific calendar",         "No AI, no focus timer, no document tools"],
        ["Forest / Be Focused", "Pomodoro gamification",            "Single-feature, no AI, no task management"],
        ["FocusFlow + Claude ✅","All of the above — unified + AI",  "New entrant — needs brand building"],
    ]
    ch2 = ParagraphStyle("ch2", fontSize=9.5, textColor=WHITE,        fontName="Helvetica-Bold", leading=14)
    cb2 = ParagraphStyle("cb2", fontSize=9.5, textColor=TEXT_DARK,    fontName="Helvetica",      leading=14)
    cg2 = ParagraphStyle("cg2", fontSize=9.5, textColor=ACCENT_GREEN, fontName="Helvetica-Bold", leading=14)
    comp_rows = [[Paragraph(c, ch2) for c in comp_data[0]]]
    for row in comp_data[1:]:
        style = cg2 if "FocusFlow" in row[0] else cb2
        comp_rows.append([Paragraph(c, style) for c in row])
    comp_t = Table(comp_rows, colWidths=[4.5*cm, 5.5*cm, 6.5*cm])
    comp_t.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), DARK_BG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("BACKGROUND",     (0, -1), (-1, -1), colors.HexColor("#ECFDF5")),
        ("TOPPADDING",     (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7), ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("GRID",           (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(comp_t)
    story.append(PageBreak())

    # ── 17. RISK ANALYSIS ─────────────────────────────────────────────────
    story.append(section_box("17. Risk Analysis & Mitigation", ACCENT_RED))
    story.append(Spacer(1, 0.3*cm))
    risks = [
        ("Claude API cost spiral",        "High",   "Medium",
         "Cache responses, rate-limit per user tier, route simple tasks to claude-haiku-4-5 (much cheaper)."),
        ("Low free→paid conversion",       "Medium", "Medium",
         "14-day Pro trial, in-app nudges at natural friction points, compelling onboarding."),
        ("Big tech builds same feature",   "Low",    "High",
         "Niche focus (students + corporate) and community loyalty are the moat. Move fast."),
        ("Solo dev burnout",               "Medium", "High",
         "Follow the 16-week phased plan strictly. One feature per phase. Avoid scope creep."),
        ("Data privacy concerns",          "Medium", "Low",
         "GDPR compliance, clear privacy policy, encrypted storage, no selling user data."),
        ("Low organic discovery",          "Medium", "Medium",
         "Student communities (Reddit, Discord, TikTok) + SEO-optimised landing page."),
    ]
    risk_header = [
        Paragraph(c, ParagraphStyle("rh", fontSize=9.5, textColor=WHITE, fontName="Helvetica-Bold", leading=14))
        for c in ["Risk", "Likelihood", "Impact", "Mitigation"]
    ]
    risk_rows = [risk_header]
    for r, l, i, m in risks:
        lc = ACCENT_RED if l == "High" else ACCENT_AMBER if l == "Medium" else ACCENT_GREEN
        ic = ACCENT_RED if i == "High" else ACCENT_AMBER if i == "Medium" else ACCENT_GREEN
        risk_rows.append([
            Paragraph(r, ParagraphStyle("rb", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14)),
            Paragraph(f"<b>{l}</b>", ParagraphStyle("rl", fontSize=9.5, textColor=lc, fontName="Helvetica-Bold", leading=14)),
            Paragraph(f"<b>{i}</b>", ParagraphStyle("ri", fontSize=9.5, textColor=ic, fontName="Helvetica-Bold", leading=14)),
            Paragraph(m, ParagraphStyle("rm", fontSize=9.5, textColor=TEXT_DARK, fontName="Helvetica", leading=14)),
        ])
    risk_t = Table(risk_rows, colWidths=[4*cm, 2.5*cm, 2*cm, 8*cm])
    risk_t.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), DARK_BG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("TOPPADDING",     (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7), ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("GRID",           (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(risk_t)
    story.append(PageBreak())

    # ── 18. LAUNCH STRATEGY ────────────────────────────────────────────────
    story.append(section_box("18. Launch Strategy & Marketing", ACCENT_GREEN))
    story.append(Spacer(1, 0.3*cm))
    for phase_title, pts in [
        ("Pre-Launch (Weeks 13–16)", [
            "Landing page with email waitlist (Mailchimp or ConvertKit).",
            "Build-in-public weekly updates on Twitter/X and LinkedIn with screenshots.",
            "Student subreddits (r/GetStudying, r/productivity) — contribute genuinely.",
            "2-minute demo video on TikTok, YouTube Shorts, Instagram Reels.",
            "Reach out to university student unions for beta testers.",
        ]),
        ("Launch Week", [
            "Product Hunt (Tuesday, 12:01 AM PST).",
            "Personal founder email to entire waitlist.",
            "Indie Hackers story: 'I built a Claude-powered study app in 16 weeks'.",
            "First 100 sign-ups: lifetime 50% off Pro.",
        ]),
        ("Post-Launch Growth", [
            "SEO content: 'Best AI study planner 2026', 'Claude API productivity tools'.",
            "Partner with student YouTubers and productivity creators for reviews.",
            "Referral programme: 1 free Pro month per referred paid user.",
            "University bulk licensing pitch.",
        ]),
    ]:
        story.append(Paragraph(f"<b>{phase_title}</b>", S["sub_heading"]))
        for pt in pts:
            story.append(Paragraph(f"• {pt}", S["bullet"]))
        story.append(Spacer(1, 0.15*cm))
    story.append(PageBreak())

    # ── 19. 12-MONTH ROADMAP ───────────────────────────────────────────────
    story.append(section_box("19. 12-Month Growth Roadmap", ACCENT_BLUE))
    story.append(Spacer(1, 0.3*cm))
    roadmap = [
        ("Months 1–4",  "MVP Build",             "All 7 features built, internal testing, private beta with 20 users"),
        ("Month 5",     "Public Beta",            "Product Hunt, waitlist email, free tier open to all"),
        ("Month 6",     "Pro Launch",             "Stripe billing live — target 100 paying users"),
        ("Months 7–8",  "Feature Polish",         "Performance, mobile PWA, user-requested features"),
        ("Month 9",     "Team Plan",              "Workspace sharing, manager dashboard, bulk invite"),
        ("Month 10",    "University Outreach",    "First institutional licensing deal closed"),
        ("Month 11",    "React Native App",       "iOS + Android app on app stores"),
        ("Month 12",    "1,000 Pro Users",        "Sustainable MRR — consider hiring first part-time developer"),
    ]
    rm_data = [[
        Paragraph(f"<b>{m}</b>", ParagraphStyle("rm", fontSize=9.5, textColor=WHITE,       fontName="Helvetica-Bold", leading=14)),
        Paragraph(f"<b>{t}</b>", ParagraphStyle("rt", fontSize=9.5, textColor=ACCENT_CYAN, fontName="Helvetica-Bold", leading=14)),
        Paragraph(d,             ParagraphStyle("rd", fontSize=9.5, textColor=TEXT_DARK,   fontName="Helvetica",      leading=14)),
    ] for m, t, d in roadmap]
    rm_t = Table(rm_data, colWidths=[3*cm, 4*cm, 9.5*cm])
    rm_t.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (1, -1), DARK_BG),
        ("ROWBACKGROUNDS", (2, 0), (2, -1), [WHITE, LIGHT_GRAY]),
        ("TOPPADDING",  (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#334155")),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(rm_t)
    story.append(PageBreak())

    # ── 20. CONCLUSION ────────────────────────────────────────────────────
    story.append(section_box("20. Conclusion & Call to Action", ACCENT_GREEN))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "FocusFlow is not just another to-do list. It is a category-defining AI productivity companion "
        "powered by the Anthropic Claude API — the most capable and context-rich LLM available. "
        "Every design decision — freemium pricing, PWA architecture, Claude Sonnet 4.6 for heavy AI tasks, "
        "claude-haiku-4-5 for lightweight tasks — has been made to maximise user value and sustainable "
        "revenue for you as the founder.",
        S["body"]
    ))
    story.append(Paragraph(
        "The competitive window is open. AI-native productivity tools are a nascent category. "
        "FocusFlow with Claude API can be live, subscription-funded, and growing within 5 months.",
        S["body"]
    ))
    story.append(Spacer(1, 0.5*cm))
    cta_t = Table([[Paragraph(
        "Start Week 1 today. Build the repo. Ship the auth. The rest follows.",
        ParagraphStyle("cta", fontSize=13, textColor=WHITE, fontName="Helvetica-Bold",
                       alignment=TA_CENTER, leading=20)
    )]], colWidths=["100%"])
    cta_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), ACCENT_GREEN),
        ("TOPPADDING",    (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
        ("LEFTPADDING",   (0, 0), (-1, -1), 20),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 20),
    ]))
    story.append(cta_t)
    story.append(Spacer(1, 0.5*cm))
    story.append(hr(MID_GRAY))
    story.append(Paragraph(
        "FocusFlow Project Plan  |  Powered by Anthropic Claude API  |  Confidential  |  April 2026",
        S["footer_note"]
    ))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
