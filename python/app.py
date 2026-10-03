"""
Python backend (Flask) for RobloxHacksForums.
Handles:
  - Roblox player lookup (real public API)
  - Compatibility simulation
  - Exploit list
  - Simple cache via SQLite
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Ensure local imports work
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, get_connection
from roblox_api import lookup_by_username, lookup_by_id
from compatibility import simulate_compatibility, list_exploits

app = Flask(__name__)
CORS(app)  # allow frontend on different origin/port during dev

# Initialize DB on startup
init_db()


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "RobloxHacksForums Python API"})


@app.route("/api/player", methods=["GET", "POST"])
def player_lookup():
    """
    Lookup Roblox player by username or user_id.
    Query params / JSON body: username=... OR user_id=...
    """
    data = request.get_json(silent=True) or {}
    username = (request.args.get("username") or data.get("username") or "").strip()
    user_id_raw = request.args.get("user_id") or data.get("user_id")

    if not username and not user_id_raw:
        return jsonify({"error": "Provide username or user_id"}), 400

    try:
        if user_id_raw:
            try:
                uid = int(user_id_raw)
            except (TypeError, ValueError):
                return jsonify({"error": "user_id must be an integer"}), 400
            result = lookup_by_id(uid)
        else:
            result = lookup_by_username(username)

        if result is None:
            return jsonify({"error": "Player not found"}), 404

        # Cache in SQLite
        try:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                """INSERT OR REPLACE INTO player_cache
                   (user_id, username, display_name, created, avatar_url, profile_url, cached_at)
                   VALUES (?, ?, ?, ?, ?, ?, datetime('now'))""",
                (
                    result["user_id"],
                    result["username"],
                    result["display_name"],
                    result.get("created"),
                    result.get("avatar_url"),
                    result.get("profile_url"),
                ),
            )
            conn.commit()
            conn.close()
        except Exception:
            pass  # cache failure is non-fatal

        return jsonify({"player": result, "source": "roblox_public_api"})

    except RuntimeError as e:
        msg = str(e)
        if "unavailable" in msg.lower() or "rate" in msg.lower():
            return jsonify({"error": "Roblox API is temporarily unavailable."}), 503
        return jsonify({"error": msg}), 502
    except Exception as e:
        return jsonify({"error": "Roblox API is temporarily unavailable."}), 503


@app.route("/api/compatibility", methods=["POST"])
def compatibility():
    """
    Simulate exploit compatibility.
    Body JSON: { "player": "...", "exploit": "...", "game": "...", "version": "..." }
    """
    data = request.get_json(silent=True) or {}
    player = (data.get("player") or "").strip()
    exploit = (data.get("exploit") or "").strip()
    game = (data.get("game") or "").strip()
    version = (data.get("version") or "any").strip()

    if not any([player, exploit, game]):
        return jsonify({"error": "Provide at least player, exploit or game"}), 400

    result = simulate_compatibility(player, exploit, game, version)
    return jsonify(result)


@app.route("/api/exploits", methods=["GET"])
def exploits():
    """List all simulated exploit records."""
    try:
        conn = get_connection()
        items = list_exploits(conn)
        conn.close()
        return jsonify({"exploits": items, "note": "All records are SIMULATED / DEMO only"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/search", methods=["GET"])
def search():
    """
    Unified search:
      - If q looks like a number -> try player by ID
      - Else try player by username
      - Also search local threads & exploits
    """
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"error": "Missing q parameter"}), 400

    results = {"players": [], "threads": [], "exploits": [], "query": q}

    # Player lookup (real API)
    try:
        if q.isdigit():
            p = lookup_by_id(int(q))
        else:
            p = lookup_by_username(q)
        if p:
            results["players"].append(p)
    except Exception:
        results["players_error"] = "Roblox API is temporarily unavailable."

    # Local DB search
    try:
        conn = get_connection()
        cur = conn.cursor()
        like = f"%{q}%"
        cur.execute(
            """SELECT id, title, author, category, tags, views, replies, created_at
               FROM threads
               WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? OR author LIKE ?
               ORDER BY created_at DESC LIMIT 20""",
            (like, like, like, like),
        )
        results["threads"] = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """SELECT id, exploit_name, version, supported_games, simulated_status, last_simulated_test
               FROM exploit_results
               WHERE exploit_name LIKE ? OR supported_games LIKE ? OR notes LIKE ?
               LIMIT 10""",
            (like, like, like),
        )
        results["exploits"] = [dict(r) for r in cur.fetchall()]
        conn.close()
    except Exception as e:
        results["db_error"] = str(e)

    return jsonify(results)


if __name__ == "__main__":
    # Development server
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
