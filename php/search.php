<?php
/**
 * /api/search.php?q=...
 * Proxies player search to Python API and searches local threads/exploits.
 */

require_once __DIR__ . '/config.php';

if (!check_rate_limit('search', 20, 60)) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
}

$q = isset($_GET['q']) ? clean($_GET['q'], 100) : '';
if ($q === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing q parameter']);
    exit;
}

$results = [
    'query' => $q,
    'players' => [],
    'threads' => [],
    'exploits' => [],
];

// Call Python search endpoint
$pythonUrl = rtrim(PYTHON_API, '/') . '/api/search?q=' . urlencode($q);
$ctx = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 10,
        'ignore_errors' => true,
    ],
]);
$raw = @file_get_contents($pythonUrl, false, $ctx);
if ($raw !== false) {
    $data = json_decode($raw, true);
    if (is_array($data)) {
        $results['players'] = $data['players'] ?? [];
        $results['threads'] = $data['threads'] ?? [];
        $results['exploits'] = $data['exploits'] ?? [];
        if (isset($data['players_error'])) {
            $results['players_error'] = $data['players_error'];
        }
    }
} else {
    // Fallback: local-only search
    $pdo = get_db();
    $like = '%' . $q . '%';
    $stmt = $pdo->prepare(
        'SELECT id, title, author, category, tags, views, replies, created_at
         FROM threads
         WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? OR author LIKE ?
         ORDER BY created_at DESC LIMIT 20'
    );
    $stmt->execute([$like, $like, $like, $like]);
    $results['threads'] = $stmt->fetchAll();

    $stmt = $pdo->prepare(
        'SELECT id, exploit_name, version, supported_games, simulated_status, last_simulated_test
         FROM exploit_results
         WHERE exploit_name LIKE ? OR supported_games LIKE ? LIMIT 10'
    );
    $stmt->execute([$like, $like]);
    $results['exploits'] = $stmt->fetchAll();
    $results['players_error'] = 'Roblox API is temporarily unavailable (Python backend unreachable).';
}

echo json_encode($results);
