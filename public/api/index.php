<?php
error_reporting(0);
ini_set('display_errors', '0');
ob_start();
/**
 * Road To Halal - Native PHP REST API Engine for cPanel Hosting
 * Handles Auth, Workspaces, Modules, Stage Locks, File Uploads, Members, and Backup
 * 100% Native PHP - Zero Node.js Daemon Process Required
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Determine DATA_DIR (Prefer roadtohalal-data folder, protect via .htaccess)
$envDataDir = getenv('DATA_DIR');
if ($envDataDir && is_dir($envDataDir)) {
    $DATA_DIR = rtrim($envDataDir, '/\\');
} else {
    // Try parent directory (/home/username/public_html or /home/username)
    $parentDir = dirname(__DIR__, 2);
    $outsideData = $parentDir . '/roadtohalal-data';
    if (!is_dir($outsideData)) {
        @mkdir($outsideData, 0755, true);
    }
    if (is_dir($outsideData) && is_writable($outsideData)) {
        $DATA_DIR = $outsideData;
    } else {
        $DATA_DIR = __DIR__ . '/../../roadtohalal-data';
        if (!is_dir($DATA_DIR)) {
            @mkdir($DATA_DIR, 0755, true);
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

// Helper: Ensure directory exists with 0755
function ensureDir($dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
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
    ensureDir($dir);
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

// Helper: Set Multi-Token Session Cookies for Frontend Compatibility
function setUserSessionCookies($userId) {
    $_SESSION['user_id'] = $userId;
    $expire = time() + (86400 * 30);
    $isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    setcookie('rth_uid', $userId, $expire, '/', '', $isSecure, true);
    setcookie('roadtohalal_session', $userId, $expire, '/', '', $isSecure, true);
    setcookie('nikahku_session', $userId, $expire, '/', '', $isSecure, true);
}

// Helper: Clear Session Cookies
function clearUserSessionCookies() {
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    setcookie('rth_uid', '', time() - 3600, '/');
    setcookie('roadtohalal_session', '', time() - 3600, '/');
    setcookie('nikahku_session', '', time() - 3600, '/');
}

// Helper: Default Module Structure
function getDefaultModuleData($module, $user = null) {
    $now = date('c');
    $name = $user['name'] ?? 'Calon Pengantin';
    $nickname = explode(' ', $name)[0];

    if ($module === 'profile') {
        return [
            'schemaVersion' => 1,
            'rev' => 1,
            'updatedAt' => $now,
            'self' => [
                'fullName' => $name,
                'nickname' => $nickname,
                'status' => 'lajang',
                'education' => '',
                'occupation' => '',
                'dob' => '',
                'birthDate' => '',
                'domicile' => '',
                'phone' => '',
                'whatsapp' => '',
                'hobbies' => '',
                'notes' => ''
            ],
            'partner' => [
                'fullName' => '',
                'nickname' => '',
                'status' => 'lajang',
                'education' => '',
                'occupation' => '',
                'dob' => '',
                'birthDate' => '',
                'domicile' => '',
                'phone' => '',
                'whatsapp' => '',
                'hobbies' => '',
                'notes' => ''
            ]
        ];
    }

    if ($module === 'taaruf') {
        return [
            'schemaVersion' => 1,
            'rev' => 1,
            'updatedAt' => $now,
            'mediator' => [
                'name' => '',
                'phone' => '',
                'relation' => ''
            ],
            'nadzor' => [
                'checked' => false,
                'date' => '',
                'notes' => ''
            ],
            'istikharah' => [
                'checked' => false,
                'date' => '',
                'notes' => ''
            ],
            'healthExchanged' => false,
            'familyExchanged' => false,
            'healthSelf' => [
                'bloodType' => '',
                'rhesus' => '',
                'allergies' => '',
                'chronicIllness' => '',
                'surgeries' => '',
                'routineMeds' => '',
                'notes' => ''
            ],
            'healthPartner' => [
                'bloodType' => '',
                'rhesus' => '',
                'allergies' => '',
                'chronicIllness' => '',
                'surgeries' => '',
                'routineMeds' => '',
                'notes' => ''
            ],
            'familySelf' => [
                'fatherName' => '',
                'motherName' => '',
                'guardianRelation' => '',
                'parentStatus' => '',
                'familyNotes' => ''
            ],
            'familyPartner' => [
                'fatherName' => '',
                'motherName' => '',
                'guardianRelation' => '',
                'parentStatus' => '',
                'familyNotes' => ''
            ],
            'decisions' => [
                'selfDecision' => 'belum',
                'partnerDecision' => 'belum',
                'notes' => ''
            ],
            'privacyBlurEnabled' => false
        ];
    }

    if ($module === 'settings') {
        return [
            'schemaVersion' => 1,
            'rev' => 1,
            'updatedAt' => $now,
            'targetDate' => '',
            'weddingLocation' => '',
            'timezone' => 'Asia/Jakarta',
            'emailNotifications' => true,
            'reminderDaysBefore' => [7, 3, 1]
        ];
    }

    if ($module === 'khitbah') {
        return [
            'schemaVersion' => 1,
            'rev' => 1,
            'updatedAt' => $now,
            'summaryReviewed' => false,
            'familyConsent' => [
                'selfFamilyAgreed' => false,
                'partnerFamilyAgreed' => false
            ],
            'eventDate' => '',
            'eventStartTime' => '',
            'locationName' => '',
            'locationAddress' => '',
            'decisions' => [
                'selfDecision' => 'belum',
                'partnerDecision' => 'belum'
            ],
            'gifts' => [],
            'prepChecklist' => [],
            'execution' => [
                'completed' => false,
                'executionDate' => '',
                'weddingTargetDate' => ''
            ]
        ];
    }

    if ($module === 'budget') {
        return [
            'schemaVersion' => 1,
            'rev' => 1,
            'updatedAt' => $now,
            'agreement' => [
                'akadDate' => '',
                'waliNasab' => '',
                'familyConsent' => false
            ],
            'mahar' => [
                'description' => '',
                'value' => 0
            ],
            'categories' => [
                ['id' => 'mahar', 'name' => 'Mahar', 'targetBudget' => 0],
                ['id' => 'akad_walimah', 'name' => 'Akad & Walimah', 'targetBudget' => 0]
            ],
            'fundingSources' => [],
            'items' => []
        ];
    }

    if ($module === 'kua') {
        return [
            'schemaVersion' => 1,
            'rev' => 1,
            'updatedAt' => $now,
            'documents' => [],
            'registeredDate' => '',
            'recommendationLetter' => ['isRequired' => false, 'status' => ''],
            'ttInjections' => [],
            'healthCheckups' => [],
            'bimwin' => ['status' => 'belum', 'certificateNumber' => '', 'notes' => '']
        ];
    }

    if ($module === 'harih') {
        return [
            'schemaVersion' => 1,
            'rev' => 1,
            'updatedAt' => $now,
            'rundown' => [],
            'checklists' => []
        ];
    }

    if ($module === 'extra') {
        return [
            'schemaVersion' => 1,
            'rev' => 1,
            'updatedAt' => $now,
            'prayers' => [],
            'tasks' => [],
            'householdChecklist' => []
        ];
    }

    return ['schemaVersion' => 1, 'rev' => 1, 'updatedAt' => $now];
}

// Parse Route
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$apiPos = strpos($uri, '/api/');
$route = '';
if ($apiPos !== false) {
    $route = trim(substr($uri, $apiPos + 5), '/');
} else if (isset($_GET['endpoint'])) {
    $route = trim($_GET['endpoint'], '/');
}

$method = $_SERVER['REQUEST_METHOD'];
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input) || empty($input)) {
    $input = $_POST;
}

// Helper: Get Current User / Session
function getCurrentUser($DATA_DIR) {
    $uid = null;
    if (!empty($_SESSION['user_id'])) {
        $uid = $_SESSION['user_id'];
    } else if (!empty($_COOKIE['rth_uid'])) {
        $uid = $_COOKIE['rth_uid'];
    } else if (!empty($_COOKIE['roadtohalal_session'])) {
        $uid = $_COOKIE['roadtohalal_session'];
    } else if (!empty($_COOKIE['nikahku_session'])) {
        $uid = $_COOKIE['nikahku_session'];
    }

    if ($uid) {
        $cleanUid = preg_replace('/[^a-zA-Z0-9_-]/', '', $uid);
        $userFile = $DATA_DIR . '/users/' . $cleanUid . '/user.json';
        if (file_exists($userFile)) {
            $user = readJson($userFile);
            if (!empty($user['id'])) {
                $_SESSION['user_id'] = $user['id'];
                return $user;
            }
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
    $wsId = $user['workspaceId'] ?? null;
    $ws = null;
    $access = 'owner';
    if ($wsId) {
        $ws = readJson($DATA_DIR . '/workspaces/' . $wsId . '/workspace.json');
        if (!empty($ws['members'])) {
            foreach ($ws['members'] as $m) {
                if ($m['userId'] === $user['id']) {
                    $access = $m['access'] ?? 'owner';
                    break;
                }
            }
        }
    }
    jsonResponse([
        'authenticated' => true,
        'user' => $user,
        'workspace' => $ws,
        'access' => $access
    ]);
}

// Route: /api/auth/login
if ($route === 'auth/login' && $method === 'POST') {
    $identifier = trim(strtolower($input['identifier'] ?? $input['email'] ?? $input['username'] ?? ''));
    $password = $input['password'] ?? '';

    if (empty($identifier) || empty($password)) {
        jsonResponse(['error' => 'Email atau username dan kata sandi wajib diisi.'], 400);
    }

    $usersDir = $DATA_DIR . '/users';
    ensureDir($usersDir);

    $matchedUser = null;
    $matchedAuth = null;
    $userFolders = glob($usersDir . '/*', GLOB_ONLYDIR) ?: [];

    foreach ($userFolders as $uf) {
        $uData = readJson($uf . '/user.json');
        $uEmail = strtolower($uData['email'] ?? '');
        $uUsername = strtolower($uData['username'] ?? '');
        $uIden = strtolower($uData['identifier'] ?? '');
        if ($uEmail === $identifier || $uUsername === $identifier || $uIden === $identifier) {
            $matchedUser = $uData;
            $matchedAuth = readJson($uf . '/auth.json');
            break;
        }
    }

    // Default owner auto-initialization if system has 0 registered users
    if (!$matchedUser && count($userFolders) === 0) {
        $userId = 'usr_' . bin2hex(random_bytes(6));
        $wsId = 'ws_' . bin2hex(random_bytes(6));
        $isEmail = strpos($identifier, '@') !== false;
        $matchedUser = [
            'id' => $userId,
            'name' => 'Calon Pengantin',
            'identifier' => $identifier,
            'email' => $isEmail ? $identifier : ($identifier . '@roadtohalal.id'),
            'username' => !$isEmail ? $identifier : explode('@', $identifier)[0],
            'role' => 'pria',
            'isAdmin' => true,
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
        $wsDir = $DATA_DIR . '/workspaces/' . $wsId;
        ensureDir($wsDir);
        $workspace = [
            'id' => $wsId,
            'name' => 'Persiapan Pernikahan Calon Pengantin',
            'ownerId' => $userId,
            'members' => [
                [
                    'userId' => $userId,
                    'name' => 'Calon Pengantin',
                    'identifier' => $identifier,
                    'role' => 'pria',
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
        writeJsonAtomic($usersDir . '/' . $userId . '/user.json', $matchedUser);
        writeJsonAtomic($usersDir . '/' . $userId . '/auth.json', $matchedAuth);
        writeJsonAtomic($wsDir . '/workspace.json', $workspace);
        writeJsonAtomic($wsDir . '/route.json', $routeInit);
        writeJsonAtomic($wsDir . '/profile.json', getDefaultModuleData('profile', $matchedUser));
        writeJsonAtomic($wsDir . '/taaruf.json', getDefaultModuleData('taaruf', $matchedUser));
    }

    if ($matchedUser && $matchedAuth) {
        if (password_verify($password, $matchedAuth['passwordHash'] ?? '')) {
            setUserSessionCookies($matchedUser['id']);
            jsonResponse(['success' => true, 'user' => $matchedUser]);
        }
    }

    jsonResponse(['error' => 'Email/username atau password salah.'], 401);
}

// Route: /api/auth/register
if ($route === 'auth/register' && $method === 'POST') {
    $identifier = trim(strtolower($input['identifier'] ?? $input['email'] ?? $input['username'] ?? ''));
    $password = $input['password'] ?? '';
    $name = trim($input['name'] ?? 'Calon Pengantin');
    $role = $input['role'] ?? 'pria';
    $targetDate = $input['targetDate'] ?? null;

    if (empty($identifier) || strlen($password) < 6) {
        jsonResponse(['error' => 'Email atau username wajib diisi dan kata sandi minimal 6 karakter.'], 400);
    }

    $usersDir = $DATA_DIR . '/users';
    ensureDir($usersDir);

    // Check duplicate
    $userFolders = glob($usersDir . '/*', GLOB_ONLYDIR) ?: [];
    foreach ($userFolders as $uf) {
        $uData = readJson($uf . '/user.json');
        $uEmail = strtolower($uData['email'] ?? '');
        $uUsername = strtolower($uData['username'] ?? '');
        $uIden = strtolower($uData['identifier'] ?? '');
        if ($uEmail === $identifier || $uUsername === $identifier || $uIden === $identifier) {
            jsonResponse(['error' => 'Email atau username ini sudah terdaftar. Silakan masuk.'], 400);
        }
    }

    $userId = 'usr_' . bin2hex(random_bytes(6));
    $wsId = 'ws_' . bin2hex(random_bytes(6));
    $isEmail = strpos($identifier, '@') !== false;

    $user = [
        'id' => $userId,
        'name' => $name,
        'identifier' => $identifier,
        'email' => $isEmail ? $identifier : ($identifier . '@roadtohalal.id'),
        'username' => !$isEmail ? $identifier : explode('@', $identifier)[0],
        'role' => $role,
        'isAdmin' => true,
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

    $wsDir = $DATA_DIR . '/workspaces/' . $wsId;
    ensureDir($wsDir);

    $workspace = [
        'id' => $wsId,
        'name' => 'Persiapan Pernikahan ' . $name,
        'ownerId' => $userId,
        'members' => [
            [
                'userId' => $userId,
                'name' => $name,
                'identifier' => $identifier,
                'role' => $role,
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

    $profileInit = getDefaultModuleData('profile', $user);
    $taarufInit = getDefaultModuleData('taaruf', $user);
    $settingsInit = getDefaultModuleData('settings', $user);
    if ($targetDate) {
        $settingsInit['targetDate'] = $targetDate;
    }

    writeJsonAtomic($usersDir . '/' . $userId . '/user.json', $user);
    writeJsonAtomic($usersDir . '/' . $userId . '/auth.json', $auth);
    writeJsonAtomic($wsDir . '/workspace.json', $workspace);
    writeJsonAtomic($wsDir . '/route.json', $routeInit);
    writeJsonAtomic($wsDir . '/profile.json', $profileInit);
    writeJsonAtomic($wsDir . '/taaruf.json', $taarufInit);
    writeJsonAtomic($wsDir . '/settings.json', $settingsInit);

    setUserSessionCookies($userId);

    jsonResponse([
        'success' => true,
        'user' => $user,
        'workspace' => [
            'id' => $wsId,
            'ownerId' => $userId
        ]
    ]);
}

// Route: /api/auth/logout
if ($route === 'auth/logout') {
    clearUserSessionCookies();
    jsonResponse(['success' => true]);
}

// Route: /api/auth/change-password
if ($route === 'auth/change-password' && $method === 'POST') {
    $user = getCurrentUser($DATA_DIR);
    if (!$user) {
        jsonResponse(['error' => 'Sesi berakhir, silakan login kembali.'], 401);
    }
    $currentPassword = $input['currentPassword'] ?? '';
    $newPassword = $input['newPassword'] ?? '';

    if (empty($currentPassword) || strlen($newPassword) < 6) {
        jsonResponse(['error' => 'Password baru minimal 6 karakter.'], 400);
    }

    $authFile = $DATA_DIR . '/users/' . $user['id'] . '/auth.json';
    $auth = readJson($authFile);
    if (!password_verify($currentPassword, $auth['passwordHash'] ?? '')) {
        jsonResponse(['error' => 'Password lama tidak cocok.'], 400);
    }

    $auth['passwordHash'] = password_hash($newPassword, PASSWORD_BCRYPT);
    $auth['updatedAt'] = date('c');
    writeJsonAtomic($authFile, $auth);

    jsonResponse(['success' => true, 'message' => 'Password berhasil diperbarui.']);
}

// Route: /api/account
if ($route === 'account') {
    $user = getCurrentUser($DATA_DIR);
    if (!$user) {
        jsonResponse(['error' => 'Sesi telah berakhir.'], 401);
    }

    if ($method === 'PATCH') {
        $name = trim($input['name'] ?? '');
        if (strlen($name) < 2) {
            jsonResponse(['error' => 'Nama tidak valid'], 400);
        }
        $user['name'] = $name;
        $user['updatedAt'] = date('c');
        writeJsonAtomic($DATA_DIR . '/users/' . $user['id'] . '/user.json', $user);
        jsonResponse(['success' => true, 'user' => $user]);
    }

    if ($method === 'DELETE') {
        $uDir = $DATA_DIR . '/users/' . $user['id'];
        if (is_dir($uDir)) {
            array_map('unlink', glob("$uDir/*.*"));
            @rmdir($uDir);
        }
        clearUserSessionCookies();
        jsonResponse(['success' => true, 'message' => 'Akun berhasil dihapus.']);
    }
}

// Route: /api/members/join (Invite Acceptance)
if ($route === 'members/join') {
    if ($method === 'GET') {
        $code = strtoupper(trim($_GET['code'] ?? ''));
        if (empty($code)) {
            jsonResponse(['error' => 'Kode undangan wajib disertakan'], 400);
        }
        $wsFolders = glob($DATA_DIR . '/workspaces/*', GLOB_ONLYDIR) ?: [];
        $foundInvite = null;
        $foundWs = null;
        foreach ($wsFolders as $wf) {
            $wsData = readJson($wf . '/workspace.json');
            $invites = $wsData['invites'] ?? [];
            foreach ($invites as $inv) {
                if (strtoupper($inv['code'] ?? '') === $code) {
                    $foundInvite = $inv;
                    $foundWs = $wsData;
                    break 2;
                }
            }
        }
        if (!$foundInvite || !$foundWs) {
            jsonResponse(['error' => 'Kode undangan tidak valid atau sudah kedaluwarsa'], 404);
        }
        $owner = readJson($DATA_DIR . '/users/' . ($foundWs['ownerId'] ?? '') . '/user.json');
        jsonResponse([
            'valid' => true,
            'code' => $foundInvite['code'],
            'access' => $foundInvite['access'] ?? 'read',
            'relation' => $foundInvite['relation'] ?? 'Pasangan',
            'expiresAt' => $foundInvite['expiresAt'] ?? null,
            'workspaceOwnerName' => $owner['name'] ?? 'Calon Pengantin'
        ]);
    }

    if ($method === 'POST') {
        $code = strtoupper(trim($input['code'] ?? ''));
        $name = trim($input['name'] ?? '');
        $password = $input['password'] ?? '';
        $identifier = trim(strtolower($input['identifier'] ?? ''));
        $role = $input['role'] ?? 'wanita';

        $wsFolders = glob($DATA_DIR . '/workspaces/*', GLOB_ONLYDIR) ?: [];
        $foundInvite = null;
        $foundWsDir = null;
        $foundWs = null;
        foreach ($wsFolders as $wf) {
            $wsData = readJson($wf . '/workspace.json');
            $invites = $wsData['invites'] ?? [];
            foreach ($invites as $inv) {
                if (strtoupper($inv['code'] ?? '') === $code) {
                    $foundInvite = $inv;
                    $foundWsDir = $wf;
                    $foundWs = $wsData;
                    break 2;
                }
            }
        }
        if (!$foundInvite || !$foundWs) {
            jsonResponse(['error' => 'Kode undangan tidak valid atau sudah kedaluwarsa'], 404);
        }

        $user = getCurrentUser($DATA_DIR);
        if (!$user) {
            if (empty($name) || strlen($password) < 6 || empty($identifier)) {
                jsonResponse(['error' => 'Nama, email/username, dan password (min 6 karakter) wajib diisi.'], 400);
            }
            $userId = 'usr_' . bin2hex(random_bytes(6));
            $isEmail = strpos($identifier, '@') !== false;
            $user = [
                'id' => $userId,
                'name' => $name,
                'identifier' => $identifier,
                'email' => $isEmail ? $identifier : ($identifier . '@roadtohalal.id'),
                'username' => !$isEmail ? $identifier : explode('@', $identifier)[0],
                'role' => $role,
                'isAdmin' => false,
                'workspaceId' => $foundWs['id'],
                'status' => 'active',
                'createdAt' => date('c'),
                'updatedAt' => date('c')
            ];
            $auth = [
                'userId' => $userId,
                'passwordHash' => password_hash($password, PASSWORD_BCRYPT),
                'createdAt' => date('c')
            ];
            writeJsonAtomic($DATA_DIR . '/users/' . $userId . '/user.json', $user);
            writeJsonAtomic($DATA_DIR . '/users/' . $userId . '/auth.json', $auth);
        }

        $members = $foundWs['members'] ?? [];
        $members[] = [
            'userId' => $user['id'],
            'name' => $user['name'],
            'identifier' => $user['identifier'] ?? '',
            'role' => $user['role'] ?? 'wanita',
            'access' => $foundInvite['access'] ?? 'read',
            'relation' => $foundInvite['relation'] ?? 'Pasangan',
            'joinedAt' => date('c')
        ];
        $foundWs['members'] = $members;
        $foundWs['invites'] = array_values(array_filter($foundWs['invites'] ?? [], fn($i) => strtoupper($i['code'] ?? '') !== $code));
        writeJsonAtomic($foundWsDir . '/workspace.json', $foundWs);

        $user['workspaceId'] = $foundWs['id'];
        writeJsonAtomic($DATA_DIR . '/users/' . $user['id'] . '/user.json', $user);

        setUserSessionCookies($user['id']);

        jsonResponse([
            'success' => true,
            'message' => 'Berhasil bergabung ke ruang persiapan!',
            'workspace' => [
                'id' => $foundWs['id'],
                'access' => $foundInvite['access'] ?? 'read'
            ]
        ]);
    }
}

// Protect all following routes with Auth
$user = getCurrentUser($DATA_DIR);
if (!$user) {
    jsonResponse(['error' => 'Sesi berakhir, silakan login kembali.'], 401);
}

$workspaceId = $user['workspaceId'] ?? 'ws_default';
$wsDir = $DATA_DIR . '/workspaces/' . $workspaceId;
ensureDir($wsDir);

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
    'persetujuan-taaruf' => ['stepNumber' => 1, 'title' => "Persetujuan Ta'aruf", 'shortTitle' => 'Persetujuan', 'subtitle' => 'Biodata, Riwayat, Kesepakatan Wali & Nadzor'],
    'proses-taaruf' => ['stepNumber' => 2, 'title' => "Proses Ta'aruf", 'shortTitle' => "Sesi Ta'aruf", 'subtitle' => 'Sesi Tanya Jawab Terbimbing, Visi Pernikahan & Komitmen'],
    'kesepakatan-khitbah' => ['stepNumber' => 3, 'title' => 'Kesepakatan Menuju Khitbah', 'shortTitle' => 'Kesepakatan Khitbah', 'subtitle' => 'Persetujuan Kedua Keluarga, Mahar & Waktu Lamaran'],
    'proses-khitbah' => ['stepNumber' => 4, 'title' => 'Proses Khitbah & Lamaran', 'shortTitle' => 'Hari Khitbah', 'subtitle' => 'Checklist Seserahan, Rundown & Pelaksanaan Lamaran'],
    'kesepakatan-akad' => ['stepNumber' => 5, 'title' => 'Kesepakatan Akad & Anggaran', 'shortTitle' => 'Akad & Budget', 'subtitle' => 'Tanggal & Lokasi Akad, Rincian Mahar & Target Tabungan'],
    'administrasi-kua' => ['stepNumber' => 6, 'title' => 'Administrasi & Berkas KUA', 'shortTitle' => 'Berkas KUA', 'subtitle' => 'Checklist N1-N4, Surat Rekomendasi, Cek Lab & Bimwin'],
    'persiapan-walimah' => ['stepNumber' => 7, 'title' => 'Persiapan Walimah', 'shortTitle' => 'Persiapan Walimah', 'subtitle' => 'Vendor Tracker, Undangan & Kuota Katering, Panitia Keluarga'],
    'hari-h' => ['stepNumber' => 8, 'title' => 'Hari-H (Akad & Walimah)', 'shortTitle' => 'Hari-H', 'subtitle' => 'Checklist H-1, Rundown Hari-H & Penutupan'],
    'halal' => ['stepNumber' => 9, 'title' => 'Halal', 'shortTitle' => 'Halal', 'subtitle' => 'Alhamdulillah, Resmi Suami Istri']
];

// Helper: Calculate Stage Requirements (Exact 1:1 match with lib/route/requirements.ts)
function evaluateStage($wsDir, $stageKey) {
    if ($stageKey === 'persetujuan-taaruf') {
        $taaruf = readJson($wsDir . '/taaruf.json', []);
        $profile = readJson($wsDir . '/profile.json', []);

        $self = $profile['self'] ?? $profile['user'] ?? [];
        $partner = $profile['partner'] ?? [];

        // 1. Biodata Saya
        $selfComplete = (!empty($self['fullName']) || !empty($self['name'])) &&
                        (!empty($self['birthDate']) || !empty($self['dob'])) &&
                        !empty($self['domicile']) &&
                        !empty($self['occupation']) &&
                        (!empty($self['phone']) || !empty($self['whatsapp']));

        // 2. Biodata Calon
        $partnerComplete = (!empty($partner['fullName']) || !empty($partner['name'])) &&
                           (!empty($partner['birthDate']) || !empty($partner['dob'])) &&
                           !empty($partner['domicile']) &&
                           !empty($partner['occupation']) &&
                           (!empty($partner['phone']) || !empty($partner['whatsapp']));

        // 3. Perantara terisi
        $mediatorComplete = !empty($taaruf['mediator']['name']) && !empty($taaruf['mediator']['phone']);

        // 4. Checklist Nadzor & Istikharah
        $nadzorOk = !empty($taaruf['nadzor']['checked']);
        $istikharahOk = !empty($taaruf['istikharah']['checked']);

        // 5. Riwayat kesehatan & keluarga sudah saling ditukar
        $healthExchanged = !empty($taaruf['healthExchanged']);
        $familyExchanged = !empty($taaruf['familyExchanged']);

        // 6. Keputusan Saya dan Calon sama-sama "setuju"
        $selfDecision = $taaruf['decisions']['selfDecision'] ?? '';
        $partnerDecision = $taaruf['decisions']['partnerDecision'] ?? '';
        $decisionOk = ($selfDecision === 'setuju' && $partnerDecision === 'setuju');

        $items = [
            ['id' => 'req_self_biodata', 'label' => 'Field wajib biodata Saya terisi (nama, tgl lahir, domisili, pekerjaan, kontak)', 'isMet' => (bool)$selfComplete],
            ['id' => 'req_partner_biodata', 'label' => 'Field wajib biodata Calon terisi (nama, tgl lahir, domisili, pekerjaan, kontak)', 'isMet' => (bool)$partnerComplete],
            ['id' => 'req_mediator', 'label' => 'Data perantara (nama & kontak) terisi', 'isMet' => (bool)$mediatorComplete],
            ['id' => 'req_nadzor_istikharah', 'label' => 'Checklist Nadzor dan Istikharah tercentang', 'isMet' => (bool)($nadzorOk && $istikharahOk)],
            ['id' => 'req_exchanged', 'label' => 'Penanda riwayat kesehatan & keluarga sudah saling ditukar tercentang', 'isMet' => (bool)($healthExchanged && $familyExchanged)],
            ['id' => 'req_decisions', 'label' => "Keputusan Saya dan Calon sama-sama \"Setuju lanjut ta'aruf\"", 'isMet' => (bool)$decisionOk],
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
        $taaruf = readJson($wsDir . '/taaruf.json', []);
        $cards = $taaruf['qaCards'] ?? [];
        $activeCards = array_filter($cards, fn($c) => empty($c['deletedAt']));
        $hasUlang = count(array_filter($activeCards, fn($c) => ($c['status'] ?? '') === 'ulang')) > 0;
        $principleCards = array_filter($activeCards, fn($c) => !empty($c['principle']));
        $allPrincipleSepakat = count($principleCards) > 0 ? (count(array_filter($principleCards, fn($c) => ($c['status'] ?? '') === 'sepakat')) === count($principleCards)) : true;

        $items = [
            ['id' => 'req_no_ulang', 'label' => 'Tidak ada kartu berstatus "Perlu dibahas lagi"', 'isMet' => count($activeCards) > 0 && !$hasUlang],
            ['id' => 'req_principles_agreed', 'label' => 'Semua kartu bertanda Prinsip berstatus "Sepakat"', 'isMet' => (bool)$allPrincipleSepakat],
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
        $khitbah = readJson($wsDir . '/khitbah.json', []);
        $familyAgreed = !empty($khitbah['familyConsent']['selfFamilyAgreed']) && !empty($khitbah['familyConsent']['partnerFamilyAgreed']);
        $eventInfoFilled = !empty($khitbah['eventDate']) && !empty($khitbah['eventStartTime']);
        $decisionsOk = (($khitbah['decisions']['selfDecision'] ?? '') === 'lanjut' && ($khitbah['decisions']['partnerDecision'] ?? '') === 'lanjut');

        $items = [
            ['id' => 'req_summary_reviewed', 'label' => 'Ringkasan kesepakatan sudah ditinjau', 'isMet' => !empty($khitbah['summaryReviewed'])],
            ['id' => 'req_family_consent', 'label' => 'Restu keluarga kedua belah pihak tercentang', 'isMet' => (bool)$familyAgreed],
            ['id' => 'req_event_info', 'label' => 'Tanggal, jam, dan lokasi khitbah terisi', 'isMet' => (bool)$eventInfoFilled],
            ['id' => 'req_khitbah_decision', 'label' => 'Keputusan Saya dan Calon sama-sama "Lanjut khitbah"', 'isMet' => (bool)$decisionsOk],
        ];
        $metCount = count(array_filter($items, fn($i) => $i['isMet']));
        return [
            'canComplete' => $metCount === count($items),
            'totalRequirements' => count($items),
            'metRequirements' => $metCount,
            'items' => $items
        ];
    }

    // Default for remaining stages
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
    $routeData = readJson($wsDir . '/route.json', [
        'workspaceId' => $workspaceId,
        'currentStage' => 'persetujuan-taaruf',
        'status' => 'in_progress',
        'completed' => (object)[],
    ]);

    $stageKey = $input['stageKey'] ?? $routeData['currentStage'] ?? '';
    if (empty($stageKey)) {
        $stageKey = 'persetujuan-taaruf';
    }

    $completed = $routeData['completed'] ?? [];
    if (is_object($completed)) {
        $completed = (array)$completed;
    }

    $completed[$stageKey] = [
        'completedAt' => date('c'),
        'completedBy' => $user['id']
    ];

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
    $stageTitle = $STAGE_DEFINITIONS[$stageKey]['title'] ?? $stageKey;
    jsonResponse([
        'success' => true,
        'previousStage' => $stageKey,
        'nextStage' => $nextStage,
        'route' => $routeData,
        'message' => "Tahap \"{$stageTitle}\" berhasil diselesaikan! Bismillah."
    ]);
}

// Route: /api/route/reopen (POST)
if ($route === 'route/reopen' && $method === 'POST') {
    $routeData = readJson($wsDir . '/route.json');
    $stageKey = $input['stageKey'] ?? $routeData['currentStage'] ?? '';
    if (!empty($stageKey) && !empty($routeData['completed'][$stageKey])) {
        unset($routeData['completed'][$stageKey]);
    }
    $routeData['currentStage'] = $stageKey;
    $routeData['status'] = 'in_progress';
    $routeData['updatedAt'] = date('c');

    writeJsonAtomic($wsDir . '/route.json', $routeData);
    jsonResponse(['success' => true, 'route' => $routeData]);
}

// Route: /api/members (List, Invite, Access, Remove)
if ($route === 'members') {
    $wsFile = $wsDir . '/workspace.json';
    $workspace = readJson($wsFile);

    if ($method === 'GET') {
        jsonResponse([
            'workspaceId' => $workspace['id'] ?? $workspaceId,
            'ownerId' => $workspace['ownerId'] ?? $user['id'],
            'userAccess' => 'owner',
            'members' => $workspace['members'] ?? [],
            'invites' => $workspace['invites'] ?? []
        ]);
    }

    if ($method === 'POST') {
        $access = $input['access'] ?? 'read';
        $relation = $input['relation'] ?? 'Pasangan';
        $inviteCode = strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        $invite = [
            'code' => $inviteCode,
            'access' => $access,
            'relation' => $relation,
            'workspaceId' => $workspaceId,
            'createdAt' => date('c'),
            'expiresAt' => date('c', time() + (86400 * 14))
        ];
        $invites = $workspace['invites'] ?? [];
        $invites[] = $invite;
        $workspace['invites'] = $invites;
        writeJsonAtomic($wsFile, $workspace);

        jsonResponse([
            'success' => true,
            'invite' => $invite,
            'message' => 'Undangan berhasil dibuat.'
        ]);
    }

    if ($method === 'PATCH') {
        $targetUid = $input['userId'] ?? '';
        $access = $input['access'] ?? 'read';
        if (!empty($workspace['members'])) {
            foreach ($workspace['members'] as &$m) {
                if ($m['userId'] === $targetUid) {
                    $m['access'] = $access;
                    break;
                }
            }
        }
        writeJsonAtomic($wsFile, $workspace);
        jsonResponse(['success' => true, 'members' => $workspace['members']]);
    }

    if ($method === 'DELETE') {
        $targetUid = $_GET['userId'] ?? '';
        $code = strtoupper($_GET['code'] ?? '');
        if ($targetUid) {
            $workspace['members'] = array_values(array_filter($workspace['members'] ?? [], fn($m) => $m['userId'] !== $targetUid));
            writeJsonAtomic($wsFile, $workspace);
            jsonResponse(['success' => true, 'members' => $workspace['members']]);
        }
        if ($code) {
            $workspace['invites'] = array_values(array_filter($workspace['invites'] ?? [], fn($i) => strtoupper($i['code'] ?? '') !== $code));
            writeJsonAtomic($wsFile, $workspace);
            jsonResponse(['success' => true]);
        }
    }
}

// Route: /api/m/{module}
if (preg_match('#^m/([a-zA-Z0-9_-]+)$#', $route, $matches)) {
    $module = $matches[1];
    $moduleFile = $wsDir . '/' . $module . '.json';

    if ($method === 'GET') {
        $default = getDefaultModuleData($module, $user);
        $data = readJson($moduleFile, $default);
        // Ensure default structure is completely populated
        $data = array_replace_recursive($default, $data);
        jsonResponse([
            'success' => true,
            'access' => 'owner',
            'data' => $data
        ]);
    }

    if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
        $default = getDefaultModuleData($module, $user);
        $existing = readJson($moduleFile, $default);
        $merged = array_replace_recursive($existing, $input);
        // Replace top level fields directly if provided
        foreach ($input as $k => $v) {
            $merged[$k] = $v;
        }
        $merged['updatedAt'] = date('c');
        writeJsonAtomic($moduleFile, $merged);

        // Sync name to user.json if profile self fullName changed
        if ($module === 'profile' && !empty($input['self']['fullName'])) {
            $user['name'] = $input['self']['fullName'];
            writeJsonAtomic($DATA_DIR . '/users/' . $user['id'] . '/user.json', $user);
        }

        jsonResponse([
            'success' => true,
            'data' => $merged
        ]);
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
    ensureDir($uploadDir);

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

// Route: /api/admin/stats
if ($route === 'admin/stats') {
    $userFolders = glob($DATA_DIR . '/users/*', GLOB_ONLYDIR) ?: [];
    $wsFolders = glob($DATA_DIR . '/workspaces/*', GLOB_ONLYDIR) ?: [];
    jsonResponse([
        'totalUsers' => count($userFolders),
        'totalWorkspaces' => count($wsFolders),
        'activeToday' => count($userFolders),
        'storageUsedMb' => 1.2
    ]);
}

// Route: /api/admin/users
if ($route === 'admin/users') {
    $userFolders = glob($DATA_DIR . '/users/*', GLOB_ONLYDIR) ?: [];
    $users = [];
    foreach ($userFolders as $uf) {
        $u = readJson($uf . '/user.json');
        if (!empty($u['id'])) {
            $users[] = [
                'id' => $u['id'],
                'name' => $u['name'],
                'identifier' => $u['identifier'] ?? $u['email'] ?? '',
                'role' => $u['role'] ?? 'user',
                'isAdmin' => !empty($u['isAdmin']),
                'isDisabled' => !empty($u['isDisabled']),
                'createdAt' => $u['createdAt'] ?? date('c'),
                'lastLoginAt' => $u['lastLoginAt'] ?? null
            ];
        }
    }
    jsonResponse(['users' => $users]);
}

// Default 404
jsonResponse(['error' => 'Endpoint tidak ditemukan: ' . $route], 404);
