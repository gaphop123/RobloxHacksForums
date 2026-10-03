<?php
/**
 * /api/threads.php
 * GET                -> list threads (optional category, page, limit)
 * GET ?id=N          -> single thread + increment views
 * POST               -> create thread (demo mode, forced author)
 */

require_once __DIR__ . '/config.php';

if (!check_rate_limit('threads', 30, 60)) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = get_db();

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $stmt = $pdo->prepare(
            'SELECT id, title, author, content, category, tags, views, replies, created_at, is_demo
             FROM threads WHERE id = ?'
        );
        $stmt->execute([$id]);
        $thread = $stmt->fetch();
        if (!$thread) {
            http_response_code(404);
            echo json_encode(['error' => 'Thread not found']);
            exit;
        }
        // Increment views
        $pdo->prepare('UPDATE threads SET views = views + 1 WHERE id = ?')->execute([$id]);
        $thread['views'] = (int)$thread['views'] + 1;

        // Escape for safety
        $thread['title'] = h($thread['title']);
        $thread['author'] = h($thread['author']);
        $thread['content'] = h($thread['content']);
        $thread['category'] = h($thread['category']);
        $thread['tags'] = h($thread['tags']);

        echo json_encode(['thread' => $thread]);
        exit;
    }

    // List
    $category = isset($_GET['category']) ? clean($_GET['category'], 50) : '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(5, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;

    $where = '';
    $params = [];
    if ($category !== '') {
        $where = 'WHERE category = ?';
        $params[] = $category;
    }

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM threads $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $sql = "SELECT id, title, author, category, tags, views, replies, created_at, is_demo
            FROM threads $where
            ORDER BY created_at DESC
            LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['title'] = h($r['title']);
        $r['author'] = h($r['author']);
        $r['category'] = h($r['category']);
        $r['tags'] = h($r['tags']);
    }

    echo json_encode([
        'threads' => $rows,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => (int)ceil($total / $limit),
        ],
    ]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $title = clean($input['title'] ?? '', 200);
    $content = clean($input['content'] ?? '', 5000);
    $category = clean($input['category'] ?? 'General', 50);
    $tags = clean($input['tags'] ?? '', 200);

    $allowed_cats = ['General', 'Roblox', 'Exploit Research', 'Compatibility', 'Scripts', 'Development', 'Off Topic', 'Announcements'];
    if (!in_array($category, $allowed_cats, true)) {
        $category = 'General';
    }

    if ($title === '' || $content === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Title and content are required']);
        exit;
    }

    // Force demo anonymous author – never trust client username
    $author = '[DEMO] Anonymous';

    $stmt = $pdo->prepare(
        'INSERT INTO threads (title, author, content, category, tags, views, replies, created_at, is_demo)
         VALUES (?, ?, ?, ?, ?, 0, 0, datetime("now"), 1)'
    );
    $stmt->execute([$title, $author, $content, $category, $tags]);
    $id = (int)$pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'thread' => [
            'id' => $id,
            'title' => h($title),
            'author' => $author,
            'category' => $category,
        ],
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
