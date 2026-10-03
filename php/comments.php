<?php
/**
 * /api/comments.php
 * GET  ?thread_id=N          -> list comments
 * POST {thread_id, content}  -> create anonymous comment
 */

require_once __DIR__ . '/config.php';

if (!check_rate_limit('comments', 20, 60)) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded. Try again later.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db();

if ($method === 'GET') {
    $thread_id = isset($_GET['thread_id']) ? (int)$_GET['thread_id'] : 0;
    if ($thread_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'thread_id required']);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT id, thread_id, username, content, created_at, is_demo
         FROM comments WHERE thread_id = ? ORDER BY created_at ASC'
    );
    $stmt->execute([$thread_id]);
    $rows = $stmt->fetchAll();

    // Escape content for safe rendering
    foreach ($rows as &$r) {
        $r['content'] = h($r['content']);
        $r['username'] = h($r['username']);
    }

    echo json_encode(['comments' => $rows]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $thread_id = isset($input['thread_id']) ? (int)$input['thread_id'] : 0;
    $content = clean($input['content'] ?? '', 2000);

    if ($thread_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid thread_id required']);
        exit;
    }
    if ($content === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Comment content cannot be empty']);
        exit;
    }

    // Verify thread exists
    $check = $pdo->prepare('SELECT id FROM threads WHERE id = ?');
    $check->execute([$thread_id]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Thread not found']);
        exit;
    }

    // Always force username to Anonymous – never allow user-supplied name
    $username = 'Anonymous';

    $stmt = $pdo->prepare(
        'INSERT INTO comments (thread_id, username, content, created_at, is_demo)
         VALUES (?, ?, ?, datetime("now"), 0)'
    );
    $stmt->execute([$thread_id, $username, $content]);
    $id = (int)$pdo->lastInsertId();

    // Update reply count
    $pdo->prepare('UPDATE threads SET replies = replies + 1 WHERE id = ?')->execute([$thread_id]);

    echo json_encode([
        'success' => true,
        'comment' => [
            'id' => $id,
            'thread_id' => $thread_id,
            'username' => $username,
            'content' => h($content),
            'created_at' => date('c'),
            'is_demo' => 0,
        ],
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
