<?php
/**
 * /api/player.php
 * Thin proxy to Python Roblox lookup.
 * GET/POST username= or user_id=
 */

require_once __DIR__ . '/config.php';

if (!check_rate_limit('player', 15, 60)) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$username = clean($_GET['username'] ?? $input['username'] ?? '', 50);
$user_id  = $_GET['user_id'] ?? $input['user_id'] ?? '';

$query = [];
if ($username !== '') {
    $query['username'] = $username;
} elseif ($user_id !== '') {
    $query['user_id'] = $user_id;
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Provide username or user_id']);
    exit;
}

$url = rtrim(PYTHON_API, '/') . '/api/player?' . http_build_query($query);
$ctx = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 12,
        'ignore_errors' => true,
    ],
]);
$raw = @file_get_contents($url, false, $ctx);

if ($raw === false) {
    http_response_code(503);
    echo json_encode(['error' => 'Roblox API is temporarily unavailable.']);
    exit;
}

// Pass through status code if possible
$headers = $http_response_header ?? [];
$status = 200;
foreach ($headers as $h) {
    if (preg_match('#HTTP/\d\.\d\s+(\d+)#', $h, $m)) {
        $status = (int)$m[1];
        break;
    }
}
http_response_code($status);
echo $raw;
