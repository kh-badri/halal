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
            'qaCards' => [],
            'allowPartnerAnswers' => false,
            'activityLogs' => [],
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

// Helper: Check if user is the invited Partner in the workspace
function isWorkspacePartner($user, $workspace) {
    if (!$user || !$workspace) return false;
    $ownerId = $workspace['ownerId'] ?? '';
    if ($user['id'] === $ownerId) {
        return false;
    }
    if (!empty($workspace['members'])) {
        foreach ($workspace['members'] as $m) {
            if ($m['userId'] === $user['id']) {
                $relation = strtolower($m['relation'] ?? '');
                if ($relation === 'pasangan') {
                    return true;
                }
            }
        }
    }
    return false;
}

// Helper: Transform Profile perspective for Partner
function transformProfileForUser($profile, $isPartner) {
    if (!$isPartner || !is_array($profile)) return $profile;
    $transformed = $profile;
    $self = $profile['self'] ?? [];
    $partner = $profile['partner'] ?? [];
    $transformed['self'] = $partner;
    $transformed['partner'] = $self;
    return $transformed;
}

// Helper: Reverse Transform Profile perspective when Partner saves
function reverseTransformProfileFromUser($input, $existing, $isPartner) {
    if (!$isPartner) {
        $merged = array_replace_recursive($existing, $input);
        foreach ($input as $k => $v) { $merged[$k] = $v; }
        return $merged;
    }
    $merged = $existing;
    if (isset($input['self'])) {
        $merged['partner'] = array_replace_recursive($existing['partner'] ?? [], $input['self']);
    }
    if (isset($input['partner'])) {
        $merged['self'] = array_replace_recursive($existing['self'] ?? [], $input['partner']);
    }
    foreach ($input as $k => $v) {
        if ($k !== 'self' && $k !== 'partner') {
            $merged[$k] = $v;
        }
    }
    return $merged;
}

// Helper: Transform Taaruf perspective for Partner
function transformTaarufForUser($taaruf, $isPartner) {
    if (!$isPartner || !is_array($taaruf)) return $taaruf;
    $transformed = $taaruf;
    $transformed['healthSelf'] = $taaruf['healthPartner'] ?? [];
    $transformed['healthPartner'] = $taaruf['healthSelf'] ?? [];
    $transformed['familySelf'] = $taaruf['familyPartner'] ?? [];
    $transformed['familyPartner'] = $taaruf['familySelf'] ?? [];

    $decisions = $taaruf['decisions'] ?? [];
    $transformed['decisions'] = [
        'selfDecision' => $decisions['partnerDecision'] ?? 'belum',
        'partnerDecision' => $decisions['selfDecision'] ?? 'belum',
        'selfNotes' => $decisions['partnerNotes'] ?? '',
        'partnerNotes' => $decisions['selfNotes'] ?? '',
        'notes' => $decisions['notes'] ?? ''
    ];
    return $transformed;
}

// Helper: Reverse Transform Taaruf perspective when Partner saves
function reverseTransformTaarufFromUser($input, $existing, $isPartner) {
    if (!$isPartner) {
        $merged = array_replace_recursive($existing, $input);
        foreach ($input as $k => $v) { $merged[$k] = $v; }
        return $merged;
    }
    $merged = $existing;
    if (isset($input['healthSelf'])) {
        $merged['healthPartner'] = array_replace_recursive($existing['healthPartner'] ?? [], $input['healthSelf']);
    }
    if (isset($input['healthPartner'])) {
        $merged['healthSelf'] = array_replace_recursive($existing['healthSelf'] ?? [], $input['healthPartner']);
    }
    if (isset($input['familySelf'])) {
        $merged['familyPartner'] = array_replace_recursive($existing['familyPartner'] ?? [], $input['familySelf']);
    }
    if (isset($input['familyPartner'])) {
        $merged['familySelf'] = array_replace_recursive($existing['familySelf'] ?? [], $input['familyPartner']);
    }
    if (isset($input['decisions'])) {
        $dec = $existing['decisions'] ?? [];
        if (isset($input['decisions']['selfDecision'])) {
            $dec['partnerDecision'] = $input['decisions']['selfDecision'];
        }
        if (isset($input['decisions']['partnerDecision'])) {
            $dec['selfDecision'] = $input['decisions']['partnerDecision'];
        }
        if (isset($input['decisions']['selfNotes'])) {
            $dec['partnerNotes'] = $input['decisions']['selfNotes'];
        }
        if (isset($input['decisions']['partnerNotes'])) {
            $dec['selfNotes'] = $input['decisions']['partnerNotes'];
        }
        $merged['decisions'] = $dec;
    }
    foreach ($input as $k => $v) {
        if (!in_array($k, ['healthSelf', 'healthPartner', 'familySelf', 'familyPartner', 'decisions'])) {
            $merged[$k] = $v;
        }
    }
    return $merged;
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
                if (!empty($user['isDisabled'])) {
                    return null;
                }
                $_SESSION['user_id'] = $user['id'];
                return $user;
            }
        }
    }
    return null;
}

function isUserAdmin($user, $DATA_DIR) {
    if (!$user) return false;
    if (!empty($user['isAdmin'])) return true;
    if (isset($user['role']) && in_array(strtolower($user['role']), ['admin', 'owner', 'superadmin'])) return true;
    $userFolders = glob($DATA_DIR . '/users/*', GLOB_ONLYDIR) ?: [];
    if (!empty($userFolders)) {
        sort($userFolders);
        if (basename($userFolders[0]) === ($user['id'] ?? '')) {
            return true;
        }
    }
    return false;
}

function getFolderSize($dir) {
    if (!is_dir($dir)) return 0;
    $size = 0;
    try {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($files as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }
    } catch (Exception $e) {}
    return $size;
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
            if (!empty($matchedUser['isDisabled'])) {
                jsonResponse(['error' => 'Akun Anda telah dinonaktifkan oleh Administrator.'], 403);
            }
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
        $ownerRole = $owner['role'] ?? 'pria';
        $relation = $foundInvite['relation'] ?? 'Pasangan';
        $isPartner = (strtolower($relation) === 'pasangan');
        $suggestedRole = $isPartner ? ($ownerRole === 'pria' ? 'wanita' : 'pria') : 'wanita';

        $wsProfile = readJson($wf . '/profile.json', []);
        $partnerName = $wsProfile['partner']['fullName'] ?? '';

        jsonResponse([
            'valid' => true,
            'code' => $foundInvite['code'],
            'access' => $foundInvite['access'] ?? 'read',
            'relation' => $relation,
            'expiresAt' => $foundInvite['expiresAt'] ?? null,
            'workspaceOwnerName' => $owner['name'] ?? 'Calon Pengantin',
            'ownerRole' => $ownerRole,
            'suggestedRole' => $suggestedRole,
            'partnerName' => $partnerName
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

        $owner = readJson($DATA_DIR . '/users/' . ($foundWs['ownerId'] ?? '') . '/user.json');
        $ownerRole = $owner['role'] ?? 'pria';
        $relation = $foundInvite['relation'] ?? 'Pasangan';
        $isPartner = (strtolower($relation) === 'pasangan');

        // Otomatis tentukan role pasangan (berlawanan dari pemilik)
        if ($isPartner) {
            $role = ($ownerRole === 'pria') ? 'wanita' : 'pria';
        }

        // Sinkronisasi nama dengan profile.json pasangan bila sudah pernah diisikan pemilik
        $wsProfileFile = $foundWsDir . '/profile.json';
        $wsProfile = readJson($wsProfileFile, []);
        if ($isPartner) {
            if (empty($name) && !empty($wsProfile['partner']['fullName'])) {
                $name = $wsProfile['partner']['fullName'];
            } else if (!empty($name) && empty($wsProfile['partner']['fullName'])) {
                $wsProfile['partner']['fullName'] = $name;
                $wsProfile['partner']['nickname'] = explode(' ', $name)[0];
                writeJsonAtomic($wsProfileFile, $wsProfile);
            }
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
        } else {
            // Update existing user role if partner
            if ($isPartner) {
                $user['role'] = $role;
                writeJsonAtomic($DATA_DIR . '/users/' . $user['id'] . '/user.json', $user);
            }
        }

        $members = $foundWs['members'] ?? [];
        $members[] = [
            'userId' => $user['id'],
            'name' => $user['name'],
            'identifier' => $user['identifier'] ?? '',
            'role' => $role,
            'access' => $foundInvite['access'] ?? 'read',
            'relation' => $relation,
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

    $workspace = readJson($wsDir . '/workspace.json');
    $userAccess = 'owner';
    if ($user['id'] !== ($workspace['ownerId'] ?? '')) {
        $userAccess = 'read';
        if (!empty($workspace['members'])) {
            foreach ($workspace['members'] as $m) {
                if ($m['userId'] === $user['id']) {
                    $userAccess = $m['access'] ?? 'read';
                    break;
                }
            }
        }
    }
    $isPartner = isWorkspacePartner($user, $workspace);

    jsonResponse([
        'workspaceId' => $workspaceId,
        'currentStage' => $currentStage,
        'status' => $routeData['status'] ?? 'in_progress',
        'completed' => $completed,
        'access' => $userAccess,
        'isPartner' => $isPartner,
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

    $isOwner = ($user['id'] === ($workspace['ownerId'] ?? ''));
    $userAccess = 'read';
    if ($isOwner) {
        $userAccess = 'owner';
    } else if (!empty($workspace['members'])) {
        foreach ($workspace['members'] as $m) {
            if ($m['userId'] === $user['id']) {
                $userAccess = $m['access'] ?? 'read';
                break;
            }
        }
    }

    if ($method === 'GET') {
        jsonResponse([
            'workspaceId' => $workspace['id'] ?? $workspaceId,
            'ownerId' => $workspace['ownerId'] ?? '',
            'userAccess' => $userAccess,
            'members' => $workspace['members'] ?? [],
            'invites' => $isOwner ? ($workspace['invites'] ?? []) : []
        ]);
    }

    // Hanya Pemilik yang boleh membuat undangan baru
    if ($method === 'POST') {
        if (!$isOwner) {
            jsonResponse(['error' => 'Akses ditolak: Hanya pemilik ruang yang dapat membuat undangan baru.'], 403);
        }

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

    // Hanya Pemilik yang boleh mengubah hak akses anggota (Read <-> Full)
    if ($method === 'PATCH') {
        if (!$isOwner) {
            jsonResponse(['error' => 'Akses ditolak: Hanya pemilik ruang yang dapat mengubah hak akses anggota.'], 403);
        }

        $targetUid = $input['userId'] ?? '';
        $access = $input['access'] ?? 'read';

        if (empty($targetUid) || !in_array($access, ['read', 'full'])) {
            jsonResponse(['error' => 'userId dan access (read/full) wajib diisi.'], 400);
        }

        if ($targetUid === ($workspace['ownerId'] ?? '')) {
            jsonResponse(['error' => 'Hak akses pemilik ruang tidak dapat diubah.'], 400);
        }

        if (!empty($workspace['members'])) {
            foreach ($workspace['members'] as &$m) {
                if ($m['userId'] === $targetUid) {
                    $m['access'] = $access;
                    break;
                }
            }
        }
        writeJsonAtomic($wsFile, $workspace);
        jsonResponse([
            'success' => true,
            'message' => 'Hak akses berhasil diubah menjadi ' . strtoupper($access),
            'members' => $workspace['members']
        ]);
    }

    // Hanya Pemilik yang boleh mengeluarkan anggota atau mencabut undangan
    if ($method === 'DELETE') {
        if (!$isOwner) {
            jsonResponse(['error' => 'Akses ditolak: Hanya pemilik ruang yang dapat menghapus anggota atau undangan.'], 403);
        }

        $targetUid = $_GET['userId'] ?? '';
        $code = strtoupper($_GET['code'] ?? '');

        if ($targetUid) {
            if ($targetUid === ($workspace['ownerId'] ?? '')) {
                jsonResponse(['error' => 'Pemilik ruang tidak dapat dihapus.'], 400);
            }
            $workspace['members'] = array_values(array_filter($workspace['members'] ?? [], fn($m) => $m['userId'] !== $targetUid));
            writeJsonAtomic($wsFile, $workspace);
            jsonResponse(['success' => true, 'message' => 'Anggota berhasil dikeluarkan.', 'members' => $workspace['members']]);
        }
        if ($code) {
            $workspace['invites'] = array_values(array_filter($workspace['invites'] ?? [], fn($i) => strtoupper($i['code'] ?? '') !== $code));
            writeJsonAtomic($wsFile, $workspace);
            jsonResponse(['success' => true, 'message' => 'Undangan berhasil dicabut.']);
        }
    }
}

// Route: /api/m/{module}
if (preg_match('#^m/([a-zA-Z0-9_-]+)$#', $route, $matches)) {
    $module = $matches[1];
    $moduleFile = $wsDir . '/' . $module . '.json';

    $workspace = readJson($wsDir . '/workspace.json');
    $userAccess = 'owner';
    if ($user['id'] !== ($workspace['ownerId'] ?? '')) {
        $userAccess = 'read';
        if (!empty($workspace['members'])) {
            foreach ($workspace['members'] as $m) {
                if ($m['userId'] === $user['id']) {
                    $userAccess = $m['access'] ?? 'read';
                    break;
                }
            }
        }
    }
    $isPartner = isWorkspacePartner($user, $workspace);

    if ($method === 'GET') {
        $default = getDefaultModuleData($module, $user);
        $data = readJson($moduleFile, $default);
        $data = array_replace_recursive($default, $data);

        // Jika user adalah pasangan, sajikan sudut pandang data (self vs partner)
        if ($isPartner) {
            if ($module === 'profile') {
                $data = transformProfileForUser($data, true);
            } else if ($module === 'taaruf') {
                $data = transformTaarufForUser($data, true);
            }
        }

        // Pasangan diizinkan mengedit biodata/profile & taaruf miliknya walaupun access utama read
        $effectiveAccess = ($isPartner && ($module === 'profile' || $module === 'taaruf')) ? 'full' : $userAccess;

        jsonResponse([
            'success' => true,
            'access' => $effectiveAccess,
            'data' => $data
        ]);
    }

    if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
        // Cek izin akses: anggota dengan akses read-only HANYA boleh edit profile & taaruf jika dia pasangan
        if ($userAccess === 'read' && !($isPartner && ($module === 'profile' || $module === 'taaruf'))) {
            jsonResponse(['error' => 'Akses hanya baca (read-only). Anda tidak dapat mengubah data modul ini.'], 403);
        }

        $default = getDefaultModuleData($module, $user);
        $existing = readJson($moduleFile, $default);
        $existing = array_replace_recursive($default, $existing);

        if ($isPartner) {
            if ($module === 'profile') {
                $merged = reverseTransformProfileFromUser($input, $existing, true);
            } else if ($module === 'taaruf') {
                // Pasangan tidak boleh mengubah permission allowPartnerAnswers
                unset($input['allowPartnerAnswers']);

                // Jika allowPartnerAnswers belum diaktifkan oleh pemilik, pasangan tidak boleh mengubah jawaban
                if (empty($existing['allowPartnerAnswers']) && isset($input['qaCards']) && is_array($input['qaCards'])) {
                    $existingMap = [];
                    foreach (($existing['qaCards'] ?? []) as $ec) {
                        $existingMap[$ec['id'] ?? ''] = $ec;
                    }
                    foreach ($input['qaCards'] as &$ic) {
                        $id = $ic['id'] ?? '';
                        if (isset($existingMap[$id])) {
                            $ic['answerPria'] = $existingMap[$id]['answerPria'] ?? '';
                            $ic['answerWanita'] = $existingMap[$id]['answerWanita'] ?? '';
                            $ic['answerSelf'] = $existingMap[$id]['answerSelf'] ?? '';
                            $ic['answerPartner'] = $existingMap[$id]['answerPartner'] ?? '';
                        }
                    }
                    unset($ic);
                }
                $merged = reverseTransformTaarufFromUser($input, $existing, true);
            } else {
                $merged = array_replace_recursive($existing, $input);
                foreach ($input as $k => $v) { $merged[$k] = $v; }
            }
        } else {
            $merged = array_replace_recursive($existing, $input);
            foreach ($input as $k => $v) { $merged[$k] = $v; }
        }

        $merged['updatedAt'] = date('c');
        writeJsonAtomic($moduleFile, $merged);

        // Sync name to user.json if fullName changed
        if ($module === 'profile' && !empty($input['self']['fullName'])) {
            $user['name'] = $input['self']['fullName'];
            writeJsonAtomic($DATA_DIR . '/users/' . $user['id'] . '/user.json', $user);
        }

        $responseData = $merged;
        if ($isPartner) {
            if ($module === 'profile') {
                $responseData = transformProfileForUser($merged, true);
            } else if ($module === 'taaruf') {
                $responseData = transformTaarufForUser($merged, true);
            }
        }

        jsonResponse([
            'success' => true,
            'data' => $responseData
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
    if (!isUserAdmin($user, $DATA_DIR)) {
        jsonResponse(['error' => 'Akses ditolak: Hanya untuk Administrator.'], 403);
    }
    $userFolders = glob($DATA_DIR . '/users/*', GLOB_ONLYDIR) ?: [];
    $wsFolders = glob($DATA_DIR . '/workspaces/*', GLOB_ONLYDIR) ?: [];

    $totalUsers = 0;
    $activeUsers = 0;
    $disabledUsers = 0;
    foreach ($userFolders as $uf) {
        $u = readJson($uf . '/user.json');
        if (!empty($u['id'])) {
            $totalUsers++;
            if (!empty($u['isDisabled'])) {
                $disabledUsers++;
            } else {
                $activeUsers++;
            }
        }
    }

    $backupsDir = $DATA_DIR . '/backups';
    $backups = [];
    if (is_dir($backupsDir)) {
        $bFiles = glob($backupsDir . '/*.*') ?: [];
        foreach ($bFiles as $bf) {
            $backups[] = [
                'name' => basename($bf),
                'size' => filesize($bf),
                'date' => date('c', filemtime($bf))
            ];
        }
        usort($backups, function($a, $b) {
            return strcmp($b['date'], $a['date']);
        });
    }

    $totalStorageBytes = getFolderSize($DATA_DIR);
    $uploadsBytes = getFolderSize($DATA_DIR . '/uploads');

    $statsData = [
        'totalUsers' => $totalUsers,
        'activeUsers' => $activeUsers,
        'disabledUsers' => $disabledUsers,
        'activeToday' => $activeUsers,
        'totalWorkspaces' => count($wsFolders),
        'totalStorageMb' => round($totalStorageBytes / (1024 * 1024), 2),
        'uploadsStorageMb' => round($uploadsBytes / (1024 * 1024), 2),
        'backupsCount' => count($backups),
        'backups' => $backups
    ];

    jsonResponse([
        'success' => true,
        'stats' => $statsData,
        'totalUsers' => $totalUsers,
        'totalWorkspaces' => count($wsFolders),
        'activeToday' => $activeUsers,
        'storageUsedMb' => round($totalStorageBytes / (1024 * 1024), 2)
    ]);
}

// Route: /api/admin/users
if ($route === 'admin/users') {
    if (!isUserAdmin($user, $DATA_DIR)) {
        jsonResponse(['error' => 'Akses ditolak: Hanya untuk Administrator.'], 403);
    }
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

// Route: /api/admin/users/{userId}/toggle
if (preg_match('#^admin/users/([^/]+)/toggle$#', $route, $matches) && $method === 'POST') {
    if (!isUserAdmin($user, $DATA_DIR)) {
        jsonResponse(['error' => 'Akses ditolak: Hanya untuk Administrator.'], 403);
    }
    $targetId = preg_replace('/[^a-zA-Z0-9_-]/', '', $matches[1]);
    $targetFile = $DATA_DIR . '/users/' . $targetId . '/user.json';
    if (!file_exists($targetFile)) {
        jsonResponse(['error' => 'Pengguna tidak ditemukan.'], 404);
    }
    if ($targetId === $user['id']) {
        jsonResponse(['error' => 'Tidak dapat menonaktifkan akun sendiri.'], 400);
    }
    $targetUser = readJson($targetFile);
    $targetUser['isDisabled'] = empty($targetUser['isDisabled']) ? true : false;
    $targetUser['status'] = $targetUser['isDisabled'] ? 'disabled' : 'active';
    $targetUser['updatedAt'] = date('c');
    writeJsonAtomic($targetFile, $targetUser);

    jsonResponse([
        'success' => true,
        'message' => $targetUser['isDisabled'] ? 'Pengguna berhasil dinonaktifkan' : 'Pengguna berhasil diaktifkan kembali',
        'user' => $targetUser
    ]);
}

// Route: /api/admin/users/{userId}/reset-password
if (preg_match('#^admin/users/([^/]+)/reset-password$#', $route, $matches) && $method === 'POST') {
    if (!isUserAdmin($user, $DATA_DIR)) {
        jsonResponse(['error' => 'Akses ditolak: Hanya untuk Administrator.'], 403);
    }
    $targetId = preg_replace('/[^a-zA-Z0-9_-]/', '', $matches[1]);
    $targetFile = $DATA_DIR . '/users/' . $targetId . '/user.json';
    $authFile = $DATA_DIR . '/users/' . $targetId . '/auth.json';
    if (!file_exists($targetFile) || !file_exists($authFile)) {
        jsonResponse(['error' => 'Pengguna tidak ditemukan.'], 404);
    }

    $newPassword = $input['newPassword'] ?? '';
    if (empty($newPassword) || strlen($newPassword) < 8) {
        jsonResponse(['error' => 'Password baru minimal 8 karakter.'], 400);
    }

    $targetUser = readJson($targetFile);
    $targetAuth = readJson($authFile);
    $targetAuth['passwordHash'] = password_hash($newPassword, PASSWORD_BCRYPT);
    $targetAuth['updatedAt'] = date('c');
    unset($targetAuth['resetToken'], $targetAuth['resetTokenExpires']);

    writeJsonAtomic($authFile, $targetAuth);

    jsonResponse([
        'success' => true,
        'message' => 'Password pengguna ' . ($targetUser['name'] ?? 'tersebut') . ' berhasil direset.'
    ]);
}

// Route: /api/admin/backup
if ($route === 'admin/backup' && $method === 'POST') {
    if (!isUserAdmin($user, $DATA_DIR)) {
        jsonResponse(['error' => 'Akses ditolak: Hanya untuk Administrator.'], 403);
    }
    $backupsDir = $DATA_DIR . '/backups';
    ensureDir($backupsDir);
    $baseName = 'backup_' . date('Y-m-d_His');

    if (class_exists('ZipArchive')) {
        $zipFile = $backupsDir . '/' . $baseName . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($DATA_DIR, FilesystemIterator::SKIP_DOTS),
                RecursiveIteratorIterator::SELF_FIRST
            );
            $realDataDir = realpath($DATA_DIR);
            foreach ($files as $file) {
                $realPath = $file->getRealPath();
                $relPath = substr($realPath, strlen($realDataDir) + 1);
                if (strpos($relPath, 'backups') === 0) continue;
                if ($file->isDir()) {
                    $zip->addEmptyDir($relPath);
                } else if ($file->isFile()) {
                    $zip->addFile($realPath, $relPath);
                }
            }
            $zip->close();
            jsonResponse([
                'success' => true,
                'message' => 'Snapshot cadangan sistem ZIP berhasil dibuat.',
                'backup' => [
                    'name' => $baseName . '.zip',
                    'date' => date('c'),
                    'size' => filesize($zipFile)
                ]
            ]);
        }
    }

    // Fallback: JSON snapshot
    $jsonFile = $backupsDir . '/' . $baseName . '.json';
    $snapshot = [
        'timestamp' => date('c'),
        'version' => '1.1.0',
        'data' => []
    ];
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($DATA_DIR, FilesystemIterator::SKIP_DOTS)
    );
    $realDataDir = realpath($DATA_DIR);
    foreach ($files as $file) {
        if ($file->isFile() && $file->getExtension() === 'json') {
            $realPath = $file->getRealPath();
            $relPath = substr($realPath, strlen($realDataDir) + 1);
            if (strpos($relPath, 'backups') === 0) continue;
            $snapshot['data'][$relPath] = readJson($realPath);
        }
    }
    writeJsonAtomic($jsonFile, $snapshot);
    jsonResponse([
        'success' => true,
        'message' => 'Snapshot cadangan sistem JSON berhasil dibuat.',
        'backup' => [
            'name' => $baseName . '.json',
            'date' => date('c'),
            'size' => filesize($jsonFile)
        ]
    ]);
}

// Route: /api/admin/backups/{filename}
if (preg_match('#^admin/backups/([^/]+)$#', $route, $matches) && $method === 'GET') {
    if (!isUserAdmin($user, $DATA_DIR)) {
        jsonResponse(['error' => 'Akses ditolak.'], 403);
    }
    $safeFilename = basename($matches[1]);
    $backupPath = $DATA_DIR . '/backups/' . $safeFilename;
    if (!file_exists($backupPath)) {
        http_response_code(404);
        exit('Berkas cadangan tidak ditemukan');
    }
    $ext = strtolower(pathinfo($safeFilename, PATHINFO_EXTENSION));
    $contentType = $ext === 'zip' ? 'application/zip' : 'application/json';
    header('Content-Type: ' . $contentType);
    header('Content-Disposition: attachment; filename="' . $safeFilename . '"');
    header('Content-Length: ' . filesize($backupPath));
    header('Cache-Control: no-store');
    readfile($backupPath);
    exit;
}

// Default 404
jsonResponse(['error' => 'Endpoint tidak ditemukan: ' . $route], 404);
