"""
Simulated Exploit Compatibility Checker.
All results are DEMO / SIMULATED. No real testing is performed.
"""

from datetime import datetime
from typing import Dict, Any
import hashlib
import random

# Possible demo statuses
STATUSES = ["SIMULATED", "UNKNOWN", "NOT TESTED", "DEMO PASS", "DEMO FAIL"]


def simulate_compatibility(
    player: str,
    exploit: str,
    game: str,
    version: str = "any",
) -> Dict[str, Any]:
    """
    Generate a deterministic-looking but purely simulated result.
    Uses a hash of inputs so the same combination always yields the same demo status.
    """
    key = f"{player}|{exploit}|{game}|{version}".lower().strip()
    h = hashlib.md5(key.encode()).hexdigest()
    # Map hash to status index
    idx = int(h[:8], 16) % len(STATUSES)
    status = STATUSES[idx]

    confidence = "Demo"
    if status in ("DEMO PASS", "DEMO FAIL"):
        confidence = "Simulated only"
    elif status == "NOT TESTED":
        confidence = "No data"

    return {
        "player": player or "Unknown",
        "exploit": exploit or "Unknown",
        "game": game or "Unknown",
        "version": version or "any",
        "compatibility": "Simulated",
        "status": status,
        "confidence": confidence,
        "message": "No verified data available. Simulation result only.",
        "last_simulated_test": datetime.utcnow().strftime("%Y-%m-%d"),
        "is_demo": True,
        "disclaimer": (
            "This is a fictional / demo result. "
            "RobloxHacksForums does not verify whether any exploit actually works."
        ),
    }


def list_exploits(conn) -> list:
    """Return all records from exploit_results table (all marked demo)."""
    cur = conn.cursor()
    cur.execute(
        """SELECT id, exploit_name, version, supported_games,
                  simulated_status, last_simulated_test, notes
           FROM exploit_results ORDER BY exploit_name"""
    )
    rows = cur.fetchall()
    return [dict(r) for r in rows]
