"""
Roblox Public API client.
Only uses publicly documented / available endpoints.
No authentication, no private data, no scraping of private profiles.
"""

import requests
import time
from typing import Optional, Dict, Any

# Official-ish public endpoints
USERS_API = "https://users.roblox.com/v1"
THUMBNAILS_API = "https://thumbnails.roblox.com/v1"
PRESENCE_API = "https://presence.roblox.com/v1"

# Simple in-memory rate limit awareness
_last_request = 0.0
MIN_INTERVAL = 0.3  # seconds between calls


def _throttle():
    global _last_request
    elapsed = time.time() - _last_request
    if elapsed < MIN_INTERVAL:
        time.sleep(MIN_INTERVAL - elapsed)
    _last_request = time.time()


def lookup_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Resolve username -> user info via public users API.
    Returns None if not found, raises on network/API errors that should surface as unavailable.
    """
    _throttle()
    # First get user id from username
    url = f"{USERS_API}/usernames/users"
    payload = {"usernames": [username], "excludeBannedUsers": False}
    try:
        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code == 429:
            raise RuntimeError("Roblox API rate limited")
        resp.raise_for_status()
        data = resp.json()
        if not data.get("data"):
            return None  # player not found
        user = data["data"][0]
        user_id = user["id"]
        return _enrich_user(user_id, user.get("name"), user.get("displayName"))
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Roblox API unavailable: {e}") from e


def lookup_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Lookup by numeric User ID."""
    _throttle()
    url = f"{USERS_API}/users/{user_id}"
    try:
        resp = requests.get(url, timeout=8)
        if resp.status_code == 404:
            return None
        if resp.status_code == 429:
            raise RuntimeError("Roblox API rate limited")
        resp.raise_for_status()
        user = resp.json()
        return _enrich_user(user["id"], user.get("name"), user.get("displayName"), user.get("created"))
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Roblox API unavailable: {e}") from e


def _enrich_user(user_id: int, username: str, display_name: str, created: str = None) -> Dict[str, Any]:
    """Add avatar headshot and profile URL. Presence is best-effort and may be empty."""
    result = {
        "user_id": user_id,
        "username": username,
        "display_name": display_name or username,
        "created": created,  # may be None if not returned by username endpoint
        "profile_url": f"https://www.roblox.com/users/{user_id}/profile",
        "avatar_url": None,
        "presence": None,
    }

    # Avatar (public thumbnail endpoint)
    try:
        _throttle()
        thumb_url = f"{THUMBNAILS_API}/users/avatar-headshot"
        params = {
            "userIds": user_id,
            "size": "150x150",
            "format": "Png",
            "isCircular": "false",
        }
        r = requests.get(thumb_url, params=params, timeout=6)
        if r.ok:
            data = r.json()
            if data.get("data") and data["data"][0].get("imageUrl"):
                result["avatar_url"] = data["data"][0]["imageUrl"]
    except Exception:
        pass  # avatar is optional

    # Presence (public, may return limited info)
    try:
        _throttle()
        r = requests.post(
            f"{PRESENCE_API}/presence/users",
            json={"userIds": [user_id]},
            timeout=6,
        )
        if r.ok:
            data = r.json()
            if data.get("userPresences"):
                p = data["userPresences"][0]
                result["presence"] = {
                    "userPresenceType": p.get("userPresenceType"),  # 0 offline, 1 online, 2 in-game, etc.
                    "lastLocation": p.get("lastLocation"),
                    "placeId": p.get("placeId"),
                }
    except Exception:
        pass

    # If created missing, try full user endpoint
    if not result["created"]:
        try:
            _throttle()
            r = requests.get(f"{USERS_API}/users/{user_id}", timeout=6)
            if r.ok:
                result["created"] = r.json().get("created")
        except Exception:
            pass

    return result
