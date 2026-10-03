<?php
/**
 * Configuration for RobloxHacksForums PHP backend.
 * Uses SQLite for simplicity (no external MySQL required).
 */

define('DB_PATH', dirname(__DIR__) . '/database/forum.db');
define('PYTHON_API', getenv('PYTHON_API') ?: 'http://127.0.0.1:5000');

// Simple CORS for local development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

function get_db() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    return $pdo;
}

/**
 * Basic rate limiting by IP + endpoint (very simple sliding window).
 */
function check_rate_limit($endpoint, $max = 30, $window_seconds = 60) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $pdo = get_db();
    $now = time();

    $stmt = $pdo->prepare('SELECT count, window_start FROM rate_limits WHERE ip = ? AND endpoint = ?');
    $stmt->execute([$ip, $endpoint]);
    $row = $stmt->fetch();

    if (!$row) {
        $pdo->prepare('INSERT INTO rate_limits (ip, endpoint, count, window_start) VALUES (?, ?, 1, ?)')
            ->execute([$ip, $endpoint, date('c', $now)]);
        return true;
    }

    $start = strtotime($row['window_start']);
    if ($now - $start > $window_seconds) {
        $pdo->prepare('UPDATE rate_limits SET count = 1, window_start = ? WHERE ip = ? AND endpoint = ?')
            ->execute([date('c', $now), $ip, $endpoint]);
        return true;
    }

    if ((int)$row['count'] >= $max) {
        return false;
    }

    $pdo->prepare('UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND endpoint = ?')
        ->execute([$ip, $endpoint]);
    return true;
}

/**
 * Escape HTML for safe output (XSS prevention).
 */
function h($str) {
    return htmlspecialchars((string)$str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Sanitize plain text input (strip tags, trim).
 */
function clean($str, $maxLen = 2000) {
    $str = trim(strip_tags((string)$str));
    if (mb_strlen($str) > $maxLen) {
        $str = mb_substr($str, 0, $maxLen);
    }
    return $str;
}
