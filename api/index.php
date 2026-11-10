<?php
/**
 * Road To Halal - Native PHP REST API Engine for cPanel Hosting
 * Handles Auth, Workspaces, Modules, Stage Locks, File Uploads, and Backup
 * 100% Native PHP - Zero Node.js Required
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Determine DATA_DIR (Prefer outside public_html if possible)
$envDataDir = getenv('DATA_DIR');
if ($envDataDir && is_dir($envDataDir)) {
    $DATA_DIR = rtrim($envDataDir, '/\\');
} else {
    // Try /home/username/roadtohalal-data (outside public_html)
    $parentDir = dirname(__DIR__, 2); // /home/username/public_html -> /home/username
    $outsideData = $parentDir . '/roadtohalal-data';
    if (!is_dir($outsideData)) {
        @mkdir($outsideData, 0700, true);
    }
    if (is_dir($outsideData) && is_writable($outsideData)) {
        $DATA_DIR = $outsideData;
    } else {
        $DATA_DIR = __DIR__ . '/../../roadtohalal-data';
        if (!is_dir($DATA_DIR)) {
            @mkdir($DATA_DIR, 0700, true);
        }
    }
}

// Session Management
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400 * 30,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// Helper: Response
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Helper: Read JSON File
function readJson($filePath, $default = []) {
    if (!file_exists($filePath)) {
        return $default;
    }
    $content = @file_get_contents($filePath);
    if ($content === false) return $default;
    $data = json_decode($content, true);
    return is_array($data) ? $data : $default;
}

// Helper: Atomic Write JSON File
function writeJsonAtomic($filePath, $data) {
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $tmp = $filePath . '.tmp.' . bin2hex(random_bytes(4));
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if (@file_put_contents($tmp, $json) !== false) {
        if (file_exists($filePath)) {
            @copy($filePath, $filePath . '.bak');
        }
        @rename($tmp, $filePath);
        return true;
    }
    return false;
}

// Parse Route
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Strip base path leading up to /api/
$apiPos = strpos($uri, '/api/');
$route = '';
if ($apiPos !== false) {
    $route = trim(substr($uri, $apiPos + 5), '/');
} else if (isset($_GET['endpoint'])) {
    $route = trim($_GET['endpoint'], '/');
}

$method = $_SERVER['REQUEST_METHOD'];
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: [];

// Get Current User / Session
function getCurrentUser($DATA_DIR) {
    if (!empty($_SESSION['user_id'])) {
        $userFile = $DATA_DIR . '/users/' . $_SESSION['user_id'] . '/user.json';
        if (file_exists($userFile)) {
            return readJson($userFile);
        }
    }
    // Check fallback cookie
    if (!empty($_COOKIE['rth_uid'])) {
        $userFile = $DATA_DIR . '/users/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $_COOKIE['rth_uid']) . '/user.json';
        if (file_exists($userFile)) {
            $user = readJson($userFile);
            $_SESSION['user_id'] = $user['id'];
            return $user;
        }
    }
    return null;
}

// Route: /api/auth/me
if ($route === 'auth/me') {
    $user = getCurrentUser($DATA_DIR);
    if (!$user) {
        jsonResponse(['authenticated' => false, 'user' => null], 401);
    }
    jsonResponse(['authenticated' => true, 'user' => $user]);
}

// Route: /api/auth/login
if ($route === 'auth/login' && $method === 'POST') {
    $email = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        jsonResponse(['error' => 'Email dan kata sandi wajib diisi.'], 400);
    }

    // Scan users directory
    $usersDir = $DATA_DIR . '/users';
    if (!is_dir($usersDir)) @mkdir($usersDir, 0700, true);

    $matchedUser = null;
    $matchedAuth = null;
    $userFolders = glob($usersDir . '/*', GLOB_ONLYDIR) ?: [];

    foreach ($userFolders as $uf) {
        $uData = readJson($uf . '/user.json');
        if (!empty($uData['email']) && strtolower($uData['email']) === $email) {
            $matchedUser = $uData;
            $matchedAuth = readJson($uf . '/auth.json');
            break;
        }
    }

    // Default admin fallback if first run
    if (!$matchedUser && count($userFolders) === 0) {
        $userId = 'usr_' . bin2hex(random_bytes(6));
        $wsId = 'ws_' . bin2hex(random_bytes(6));
        $matchedUser = [
            'id' => $userId,
            'name' => 'Calon Pengantin',
            'email' => $email,
            'role' => 'user',
            'workspaceId' => $wsId,
            'status' => 'active',
            'createdAt' => date('c'),
            'updatedAt' => date('c')
        ];
        $matchedAuth = [
            'userId' => $userId,
            'passwordHash' => password_hash($password, PASSWORD_BCRYPT),
            'createdAt' => date('c')
        ];
        writeJsonAtomic($usersDir . '/' . $userId . '/user.json', $matchedUser);
        writeJsonAtomic($usersDir . '/' . $userId . '/auth.json', $matchedAuth);
    }

    if ($matchedUser && $matchedAuth) {
        if (password_verify($password, $matchedAuth['passwordHash'])) {
            $_SESSION['user_id'] = $matchedUser['id'];
            setcookie('rth_uid', $matchedUser['id'], time() + (86400 * 30), '/', '', isset($_SERVER['HTTPS']), true);
            jsonResponse(['success' => true, 'user' => $matchedUser]);
        }
    }

    jsonResponse(['error' => 'Email atau kata sandi tidak sesuai.'], 401);
}

// Route: /api/auth/register
if ($route === 'auth/register' && $method === 'POST') {
    $email = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    $name = trim($input['name'] ?? 'Calon Pengantin');

    if (empty($email) || strlen($password) < 6) {
        jsonResponse(['error' => 'Email wajib diisi dan kata sandi minimal 6 karakter.'], 400);
    }

    $usersDir = $DATA_DIR . '/users';
    if (!is_dir($usersDir)) @mkdir($usersDir, 0700, true);

    // Check duplicate
    $userFolders = glob($usersDir . '/*', GLOB_ONLYDIR) ?: [];
    foreach ($userFolders as $uf) {
        $uData = readJson($uf . '/user.json');
        if (!empty($uData['email']) && strtolower($uData['email']) === $email) {
            jsonResponse(['error' => 'Email ini sudah terdaftar. Silakan login.'], 400);
        }
    }

    $userId = 'usr_' . bin2hex(random_bytes(6));
    $wsId = 'ws_' . bin2hex(random_bytes(6));

    $user = [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => 'user',
        'workspaceId' => $wsId,
        'status' => 'active',
        'createdAt' => date('c'),
        'updatedAt' => date('c')
    ];

    $auth = [
        'userId' => $userId,
        'passwordHash' => password_hash($password, PASSWORD_BCRYPT),
        'createdAt' => date('c')
    ];

    // Initialize Workspace
    $wsDir = $DATA_DIR . '/workspaces/' . $wsId;
    @mkdir($wsDir, 0700, true);

    $workspace = [
        'id' => $wsId,
        'name' => 'Persiapan Pernikahan ' . $name,
        'ownerId' => $userId,
        'members' => [
            [
                'userId' => $userId,
                'name' => $name,
                'email' => $email,
                'access' => 'owner',
                'joinedAt' => date('c')
            ]
        ],
        'status' => 'in_progress',
        'createdAt' => date('c'),
        'updatedAt' => date('c')
    ];

    $routeInit = [
        'workspaceId' => $wsId,
        'currentStage' => 'persetujuan-taaruf',
        'status' => 'in_progress',
        'completed' => (object)[],
        'updatedAt' => date('c')
    ];

    writeJsonAtomic($usersDir . '/' . $userId . '/user.json', $user);
    writeJsonAtomic($usersDir . '/' . $userId . '/auth.json', $auth);
    writeJsonAtomic($wsDir . '/workspace.json', $workspace);
    writeJsonAtomic($wsDir . '/route.json', $routeInit);

    $_SESSION['user_id'] = $userId;
    setcookie('rth_uid', $userId, time() + (86400 * 30), '/', '', isset($_SERVER['HTTPS']), true);

    jsonResponse(['success' => true, 'user' => $user]);
}

// Route: /api/auth/logout
if ($route === 'auth/logout') {
    $_SESSION = [];
    session_destroy();
    setcookie('rth_uid', '', time() - 3600, '/');
    jsonResponse(['success' => true]);
}

// Protect all following routes with Auth
$user = getCurrentUser($DATA_DIR);
if (!$user) {
    jsonResponse(['error' => 'Sesi berakhir, silakan login kembali.'], 401);
}

$workspaceId = $user['workspaceId'] ?? 'ws_default';
$wsDir = $DATA_DIR . '/workspaces/' . $workspaceId;
if (!is_dir($wsDir)) @mkdir($wsDir, 0700, true);

// STAGE DEFINITIONS
$STAGE_ORDER = [
    'persetujuan-taaruf',
    'proses-taaruf',
    'kesepakatan-khitbah',
    'proses-khitbah',
    'kesepakatan-akad',
    'administrasi-kua',
    'persiapan-walimah',
    'hari-h',
    'halal'
];

$STAGE_DEFINITIONS = [
    'persetujuan-taaruf' => ['stepNumber' => 1, 'title' => 'Persetujuan Ta’aruf', 'shortTitle' => 'Persetujuan', 'subtitle' => 'Biodata, Riwayat, Kesepakatan Wali & Nadzor'],
    'proses-taaruf' => ['stepNumber' => 2, 'title' => 'Proses Ta’aruf', 'shortTitle' => 'Sesi Ta’aruf', 'subtitle' => 'Sesi Tanya Jawab Terbimbing, Visi Pernikahan & Komitmen'],
    'kesepakatan-khitbah' => ['stepNumber' => 3, 'title' => 'Kesepakatan Menuju Khitbah', 'shortTitle' => 'Kesepakatan Khitbah', 'subtitle' => 'Persetujuan Kedua Keluarga, Mahar & Waktu Lamaran'],
    'proses-khitbah' => ['stepNumber' => 4, 'title' => 'Proses Khitbah & Lamaran', 'shortTitle' => 'Hari Khitbah', 'subtitle' => 'Checklist Seserahan, Rundown & Pelaksanaan Lamaran'],
    'kesepakatan-akad' => ['stepNumber' => 5, 'title' => 'Kesepakatan Akad & Anggaran', 'shortTitle' => 'Akad & Budget', 'subtitle' => 'Tanggal & Lokasi Akad, Rincian Mahar & Target Tabungan'],
    'administrasi-kua' => ['stepNumber' => 6, 'title' => 'Administrasi & Berkas KUA', 'shortTitle' => 'Berkas KUA', 'subtitle' => 'Checklist N1-N4, Surat Rekomendasi, Cek Lab & Bimwin'],
    'persiapan-walimah' => ['stepNumber' => 7, 'title' => 'Persiapan Walimah', 'shortTitle' => 'Persiapan Walimah', 'subtitle' => 'Vendor Tracker, Undangan & Kuota Katering, Panitia Keluarga'],
    'hari-h' => ['stepNumber' => 8, 'title' => 'Hari-H (Akad & Walimah)', 'shortTitle' => 'Hari-H', 'subtitle' => 'Checklist H-1, Rundown Hari-H & Penutupan'],
    'halal' => ['stepNumber' => 9, 'title' => 'Halal', 'shortTitle' => 'Halal', 'subtitle' => 'Alhamdulillah, Resmi Suami Istri']
];

// Helper: Calculate Stage Requirements
function evaluateStage($wsDir, $stageKey) {
    if ($stageKey === 'persetujuan-taaruf') {
        $taaruf = readJson($wsDir . '/taaruf.json');
        $profile = readJson($wsDir . '/profile.json');

        $hasMyBio = !empty($profile['user']['fullName']) && !empty($profile['user']['birthDate']);
        $hasPartnerBio = !empty($profile['partner']['fullName']);
        $hasHealth = !empty($taaruf['myHealth']['bloodType']);
        $hasFamily = !empty($taaruf['myFamily']['fatherName']) && !empty($taaruf['myFamily']['guardianRelation']);
        $hasNadzor = !empty($taaruf['nadzor']['isConducted']) && $taaruf['nadzor']['isConducted'] === true;
        $hasIstikharah = !empty($taaruf['istikharah']['isConducted']) && $taaruf['istikharah']['isConducted'] === true;

        $items = [
            ['id' => 'bio_saya', 'label' => 'Biodata diri lengkap (nama, tanggal lahir, kontak)', 'isMet' => $hasMyBio],
            ['id' => 'bio_calon', 'label' => 'Biodata calon pasangan diisi', 'isMet' => $hasPartnerBio],
            ['id' => 'kesehatan', 'label' => 'Riwayat kesehatan diri dicatat', 'isMet' => $hasHealth],
            ['id' => 'keluarga_wali', 'label' => 'Data keluarga & wali nasab ditentukan', 'isMet' => $hasFamily],
            ['id' => 'nadzor', 'label' => 'Nadzor (pertemuan langsung didampingi mahram) selesai', 'isMet' => $hasNadzor],
            ['id' => 'istikharah', 'label' => 'Shalat istikharah & kemantapan hati dilakukan', 'isMet' => $hasIstikharah],
        ];

        $metCount = count(array_filter($items, fn($i) => $i['isMet']));
        return [
            'canComplete' => $metCount === count($items),
            'totalRequirements' => count($items),
            'metRequirements' => $metCount,
            'items' => $items
        ];
    }

    if ($stageKey === 'proses-taaruf') {
        $taaruf = readJson($wsDir . '/taaruf.json');
        $qaCount = count($taaruf['qaAnswers'] ?? []);
        $isAgreementMet = !empty($taaruf['agreement']['isAgreed']) && $taaruf['agreement']['isAgreed'] === true;

        $items = [
            ['id' => 'qa_min5', 'label' => 'Minimal 5 kartu tanya-jawab ta\'aruf terjawab (terjawab: ' . $qaCount . ')', 'isMet' => $qaCount >= 5],
            ['id' => 'kesepakatan_lanjut', 'label' => 'Kedua pihak sepakat melanjutkan proses ke khitbah', 'isMet' => $isAgreementMet],
        ];
        $metCount = count(array_filter($items, fn($i) => $i['isMet']));
        return [
            'canComplete' => $metCount === count($items),
            'totalRequirements' => count($items),
            'metRequirements' => $metCount,
            'items' => $items
        ];
    }

    if ($stageKey === 'kesepakatan-khitbah') {
        $khitbah = readJson($wsDir . '/khitbah.json');
        $agreement = $khitbah['agreement'] ?? [];

        $hasTargetDate = !empty($agreement['khitbahDate']);
        $hasLocation = !empty($agreement['location']);
        $hasBothFamilies = !empty($agreement['groomFamilyApproved']) && !empty($agreement['brideFamilyApproved']);
        $hasDelegation = !empty($agreement['familyRepresentative']);

        $items = [
            ['id' => 'tanggal_khitbah', 'label' => 'Tanggal & waktu lamaran disepakati kedua keluarga', 'isMet' => $hasTargetDate],
            ['id' => 'lokasi_khitbah', 'label' => 'Lokasi acara khitbah ditentukan', 'isMet' => $hasLocation],
            ['id' => 'restu_keluarga', 'label' => 'Keluarga pria & wanita telah memberikan restu', 'isMet' => $hasBothFamilies],
            ['id' => 'juru_bicara', 'label' => 'Juru bicara / perwakilan keluarga ditetapkan', 'isMet' => $hasDelegation],
        ];
        $metCount = count(array_filter($items, fn($i) => $i['isMet']));
        return [
            'canComplete' => $metCount === count($items),
            'totalRequirements' => count($items),
            'metRequirements' => $metCount,
            'items' => $items
        ];
    }

    if ($stageKey === 'proses-khitbah') {
        $khitbah = readJson($wsDir . '/khitbah.json');
        $itemsList = $khitbah['seserahan'] ?? [];
        $totalItems = count($itemsList);
        $readyItems = count(array_filter($itemsList, fn($i) => !empty($i['isReady']) && $i['isReady'] === true));
        $allReady = $totalItems > 0 && $readyItems === $totalItems;
        $isExecuted = !empty($khitbah['execution']['isExecuted']) && $khitbah['execution']['isExecuted'] === true;

        $items = [
            ['id' => 'seserahan_siap', 'label' => 'Checklist seserahan siap (' . $readyItems . '/' . $totalItems . ' siap)', 'isMet' => $allReady],
            ['id' => 'khitbah_terlaksana', 'label' => 'Acara lamaran telah terlaksana dengan lancar', 'isMet' => $isExecuted],
        ];
        $metCount = count(array_filter($items, fn($i) => $i['isMet']));
        return [
            'canComplete' => $metCount === count($items),
            'totalRequirements' => count($items),
            'metRequirements' => $metCount,
            'items' => $items
        ];
    }

    // Default for stages 5-8
    return [
        'canComplete' => true,
        'totalRequirements' => 1,
        'metRequirements' => 1,
        'items' => [['id' => 'siap', 'label' => 'Tahap siap dilanjutkan', 'isMet' => true]]
    ];
}

// Route: /api/route (GET)
if ($route === 'route' && $method === 'GET') {
    $routeData = readJson($wsDir . '/route.json', [
        'workspaceId' => $workspaceId,
        'currentStage' => 'persetujuan-taaruf',
        'status' => 'in_progress',
        'completed' => (object)[],
    ]);

    $currentStage = $routeData['currentStage'] ?? 'persetujuan-taaruf';
    $completed = $routeData['completed'] ?? [];

    $stages = [];
    $foundCurrent = false;

    foreach ($STAGE_ORDER as $sKey) {
        if ($sKey === 'halal') continue;
        $def = $STAGE_DEFINITIONS[$sKey];

        $isDone = !empty($completed[$sKey]);
        $isCurrent = ($sKey === $currentStage);

        // Unlocked logic
        $unlocked = false;
        if ($isDone || $isCurrent) {
            $unlocked = true;
        } else if (!$foundCurrent) {
            $unlocked = true;
        }
        if ($isCurrent) {
            $foundCurrent = true;
        }

        $status = $isDone ? 'completed' : ($isCurrent ? 'in_progress' : 'locked');
        $eval = $unlocked ? evaluateStage($wsDir, $sKey) : null;

        $stages[] = [
            'key' => $sKey,
            'stepNumber' => $def['stepNumber'],
            'title' => $def['title'],
            'shortTitle' => $def['shortTitle'],
            'subtitle' => $def['subtitle'],
            'path' => '/tahap/' . $sKey,
            'status' => $status,
            'isUnlocked' => $unlocked,
            'requirements' => $eval
        ];
    }

    jsonResponse([
        'workspaceId' => $workspaceId,
        'currentStage' => $currentStage,
        'status' => $routeData['status'] ?? 'in_progress',
        'completed' => $completed,
        'access' => 'owner',
        'stages' => $stages
    ]);
}

// Route: /api/route/complete (POST)
if ($route === 'route/complete' && $method === 'POST') {
    $stageKey = $input['stageKey'] ?? '';
    if (empty($stageKey)) {
        jsonResponse(['error' => 'stageKey wajib diisi.'], 400);
    }

    $routeData = readJson($wsDir . '/route.json');
    $completed = $routeData['completed'] ?? [];
    $completed[$stageKey] = [
        'completedAt' => date('c'),
        'completedBy' => $user['id']
    ];

    // Find next stage
    $currentIndex = array_search($stageKey, $STAGE_ORDER);
    $nextStage = $stageKey;
    if ($currentIndex !== false && isset($STAGE_ORDER[$currentIndex + 1])) {
        $nextStage = $STAGE_ORDER[$currentIndex + 1];
    }

    $routeData['completed'] = $completed;
    $routeData['currentStage'] = $nextStage;
    $routeData['status'] = ($nextStage === 'halal') ? 'completed' : 'in_progress';
    $routeData['updatedAt'] = date('c');

    writeJsonAtomic($wsDir . '/route.json', $routeData);
    jsonResponse(['success' => true, 'route' => $routeData]);
}

// Route: /api/route/reopen (POST)
if ($route === 'route/reopen' && $method === 'POST') {
    $stageKey = $input['stageKey'] ?? '';
    $routeData = readJson($wsDir . '/route.json');
    if (!empty($routeData['completed'][$stageKey])) {
        unset($routeData['completed'][$stageKey]);
    }
    $routeData['currentStage'] = $stageKey;
    $routeData['status'] = 'in_progress';
    $routeData['updatedAt'] = date('c');

    writeJsonAtomic($wsDir . '/route.json', $routeData);
    jsonResponse(['success' => true, 'route' => $routeData]);
}

// Route: /api/m/{module}
if (preg_match('#^m/([a-zA-Z0-9_-]+)$#', $route, $matches)) {
    $module = $matches[1];
    $moduleFile = $wsDir . '/' . $module . '.json';

    if ($method === 'GET') {
        $data = readJson($moduleFile);
        jsonResponse($data);
    }

    if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
        $existing = readJson($moduleFile, []);
        $merged = array_replace_recursive($existing, $input);
        writeJsonAtomic($moduleFile, $merged);
        jsonResponse(['success' => true, 'data' => $merged]);
    }
}

// Route: /api/files (File Upload)
if ($route === 'files' && $method === 'POST') {
    if (empty($_FILES['file'])) {
        jsonResponse(['error' => 'File tidak ditemukan.'], 400);
    }

    $file = $_FILES['file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

    if (!in_array($ext, $allowed)) {
        jsonResponse(['error' => 'Format file tidak didukung.'], 400);
    }

    $uploadDir = $DATA_DIR . '/uploads/' . $workspaceId;
    if (!is_dir($uploadDir)) @mkdir($uploadDir, 0700, true);

    $fileId = bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = $uploadDir . '/' . $fileId;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        jsonResponse([
            'success' => true,
            'fileId' => $fileId,
            'url' => '/api/files?id=' . $fileId,
            'name' => $file['name'],
            'size' => $file['size']
        ]);
    }

    jsonResponse(['error' => 'Gagal mengunggah file.'], 500);
}

// Route: /api/files (File Retrieval)
if ($route === 'files' && $method === 'GET') {
    $fileId = preg_replace('/[^a-zA-Z0-9._-]/', '', $_GET['id'] ?? '');
    $filePath = $DATA_DIR . '/uploads/' . $workspaceId . '/' . $fileId;

    if (!file_exists($filePath)) {
        http_response_code(404);
        exit('File not found');
    }

    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'pdf' => 'application/pdf'
    ];
    header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

// Default 404
jsonResponse(['error' => 'Endpoint tidak ditemukan: ' . $route], 404);
