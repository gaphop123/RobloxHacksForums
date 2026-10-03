"""
Database utilities for RobloxHacksForums (SQLite).
Handles schema creation, seeding demo data, and basic queries.
"""

import sqlite3
import os
from datetime import datetime, timedelta
import random

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "forum.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they do not exist and seed demo data."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_connection()
    cur = conn.cursor()

    # Users (demo only)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT,
            is_demo INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Threads
    cur.execute("""
        CREATE TABLE IF NOT EXISTS threads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT,
            views INTEGER DEFAULT 0,
            replies INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_demo INTEGER DEFAULT 1
        )
    """)

    # Comments (anonymous)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id INTEGER NOT NULL,
            username TEXT DEFAULT 'Anonymous',
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_demo INTEGER DEFAULT 0,
            FOREIGN KEY (thread_id) REFERENCES threads(id)
        )
    """)

    # Player cache (from real Roblox API)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS player_cache (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            display_name TEXT,
            created TEXT,
            avatar_url TEXT,
            profile_url TEXT,
            cached_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Exploit database (SIMULATED only)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS exploit_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exploit_name TEXT NOT NULL,
            version TEXT,
            supported_games TEXT,
            simulated_status TEXT DEFAULT 'SIMULATED',
            last_simulated_test TEXT,
            notes TEXT,
            is_demo INTEGER DEFAULT 1
        )
    """)

    # Rate limiting simple table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS rate_limits (
            ip TEXT,
            endpoint TEXT,
            count INTEGER DEFAULT 1,
            window_start TEXT,
            PRIMARY KEY (ip, endpoint)
        )
    """)

    conn.commit()

    # Seed only if empty
    cur.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        seed_demo_data(conn)

    conn.close()
    print(f"Database initialized at {DB_PATH}")


def seed_demo_data(conn):
    cur = conn.cursor()
    now = datetime.utcnow()

    # Demo users
    demo_users = [
        ("[DEMO] Anonymous", "Anonymous"),
        ("[SIMULATION] RobloxResearcher", "RobloxResearcher"),
        ("[DEMO] Guest", "Guest"),
        ("[DEMO] Moderator", "Moderator"),
        ("[SIMULATION] ScriptDev", "ScriptDev"),
    ]
    for u, d in demo_users:
        cur.execute(
            "INSERT OR IGNORE INTO users (username, display_name, is_demo) VALUES (?, ?, 1)",
            (u, d)
        )

    # Demo threads
    categories = ["General", "Roblox", "Exploit Research", "Compatibility", "Scripts", "Development", "Off Topic", "Announcements"]
    sample_threads = [
        ("Welcome to RobloxHacksForums (Demo)", "[DEMO] Moderator",
         "This is a fictional community/demo project for UI and backend research.\n\nAll exploit compatibility results are SIMULATED.\nDo not treat any data as verified security information.",
         "Announcements", "welcome,demo,important", 128, 5),
        ("How does the player lookup work?", "[SIMULATION] RobloxResearcher",
         "The frontend sends username/UserID to the Python backend which calls public Roblox APIs.\nNo private data is scraped. Results are cached briefly.",
         "Roblox", "api,lookup,public", 89, 3),
        ("Simulated Compatibility Checker explained", "[DEMO] Guest",
         "Select Player / Exploit / Game / Version. The system returns a DEMO status only:\nSIMULATED, UNKNOWN, NOT TESTED, DEMO PASS, DEMO FAIL.\nNo real exploit testing is performed.",
         "Compatibility", "simulation,demo", 67, 2),
        ("Example Executor v1.0 notes (demo)", "[SIMULATION] ScriptDev",
         "This record is purely for demonstration of the Exploit Database UI.\nStatus is always marked SIMULATED.",
         "Exploit Research", "executor,demo", 45, 1),
        ("UI feedback and responsive design", "[DEMO] Anonymous",
         "Dark mode, cards, badges, skeleton loaders, toasts, modals – all pure frontend.\nFeel free to comment anonymously.",
         "Development", "ui,css,js", 34, 4),
        ("Off-topic: best Roblox experiences?", "[DEMO] Guest",
         "Just chatting – remember this whole site is a simulation.",
         "Off Topic", "chat", 22, 0),
        ("Script sharing guidelines (demo)", "[SIMULATION] RobloxResearcher",
         "No real scripts that claim to bypass security are hosted here.\nEverything is educational / UI demo.",
         "Scripts", "guidelines", 56, 2),
        ("Pagination and search test thread", "[DEMO] Moderator",
         "Used to demonstrate search across threads and pagination.",
         "General", "search,test", 15, 0),
    ]

    for i, (title, author, content, cat, tags, views, replies) in enumerate(sample_threads):
        created = (now - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23))).isoformat() + "Z"
        cur.execute(
            """INSERT INTO threads (title, author, content, category, tags, views, replies, created_at, is_demo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)""",
            (title, author, content, cat, tags, views, replies, created)
        )
        thread_id = cur.lastrowid

        # A few demo comments
        if replies > 0:
            for j in range(min(replies, 3)):
                c_created = (now - timedelta(days=random.randint(0, 10))).isoformat() + "Z"
                cur.execute(
                    """INSERT INTO comments (thread_id, username, content, created_at, is_demo)
                       VALUES (?, ?, ?, ?, 1)""",
                    (thread_id, "[DEMO] Anonymous", f"Demo comment #{j+1} on this thread. All content is simulated.", c_created)
                )

    # Demo exploit records (SIMULATED)
    exploits = [
        ("ExampleExecutor", "v1.0", "Demo Game, Example Place", "SIMULATED", "2026-10-03", "Demo compatibility record only"),
        ("DemoScriptHub", "v2.3", "Multiple demo experiences", "DEMO PASS", "2026-09-28", "Simulated test – not real"),
        ("TestInjector", "v0.9-beta", "None (demo)", "NOT TESTED", "2026-09-15", "Placeholder for UI"),
        ("SimExecutor", "v1.2", "Roblox Studio demo", "UNKNOWN", "2026-10-01", "No verified data"),
        ("FakeBypass", "v3.0", "N/A", "DEMO FAIL", "2026-08-20", "Intentionally fails for demo"),
    ]
    for name, ver, games, status, last, notes in exploits:
        cur.execute(
            """INSERT INTO exploit_results
               (exploit_name, version, supported_games, simulated_status, last_simulated_test, notes, is_demo)
               VALUES (?, ?, ?, ?, ?, ?, 1)""",
            (name, ver, games, status, last, notes)
        )

    conn.commit()
    print("Demo data seeded.")


if __name__ == "__main__":
    init_db()
