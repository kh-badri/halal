<?php
/**
 * Road To Halal - Native Web Push (VAPID) Engine
 * Implements RFC 8291 (aes128gcm Content-Encoding) and RFC 8292 (VAPID) in pure PHP.
 * Works natively on standard cPanel hosting with PHP 7.4+ and OpenSSL.
 */

class WebPushEngine {
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    private static function getOpenSslConfig() {
        $options = [
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ];
        // Look for openssl.cnf on Windows/Laragon if needed
        $candidates = [
            getenv('OPENSSL_CONF'),
            'C:/laragon/bin/php/php-8.3.16-Win32-vs16-x64/extras/ssl/openssl.cnf',
            'C:/laragon/bin/apache/httpd-2.4.62-240904-win64-VS17/conf/openssl.cnf',
            '/etc/ssl/openssl.cnf',
            '/etc/pki/tls/openssl.cnf',
        ];
        foreach ($candidates as $cand) {
            if ($cand && file_exists($cand)) {
                $options['config'] = $cand;
                putenv("OPENSSL_CONF={$cand}");
                break;
            }
        }
        return $options;
    }

    /**
     * Get or create the server persistent VAPID keypair
     */
    public static function getVapidKeys($DATA_DIR) {
        $vapidFile = rtrim($DATA_DIR, '/\\') . '/vapid.json';
        if (file_exists($vapidFile)) {
            $content = @file_get_contents($vapidFile);
            $json = json_decode($content, true);
            if (!empty($json['publicKey']) && !empty($json['privatePem'])) {
                return $json;
            }
        }

        // Generate a new EC prime256v1 keypair
        $options = self::getOpenSslConfig();
        $key = openssl_pkey_new($options);
        if ($key === false) {
            error_log('WebPush: Failed to generate VAPID keypair: ' . openssl_error_string());
            return null;
        }

        openssl_pkey_export($key, $privPem, null, $options);
        $details = openssl_pkey_get_details($key);
        if (!$details || empty($details['ec']['x']) || empty($details['ec']['y'])) {
            return null;
        }

        $rawPublic = "\x04" . $details['ec']['x'] . $details['ec']['y'];
        $pubB64 = self::base64UrlEncode($rawPublic);

        $keys = [
            'publicKey' => $pubB64,
            'privatePem' => $privPem,
            'createdAt' => date('c'),
        ];

        $dir = dirname($vapidFile);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($vapidFile, json_encode($keys, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $keys;
    }

    /**
     * Convert 65-byte uncompressed public key to PEM
     */
    private static function rawP256ToPem($rawKey) {
        $derPrefix = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200');
        $der = $derPrefix . $rawKey;
        $b64 = chunk_split(base64_encode($der), 64, "\n");
        return "-----BEGIN PUBLIC KEY-----\n" . $b64 . "-----END PUBLIC KEY-----\n";
    }

    /**
     * Convert OpenSSL ASN.1 DER ECDSA signature to 64-byte raw R || S
     */
    private static function derToRawSignature($der) {
        $pos = 2; // skip 30 <len>
        $pos++;   // skip 02
        $rLen = ord($der[$pos++]);
        $r = substr($der, $pos, $rLen);
        $pos += $rLen;
        $pos++;   // skip 02
        $sLen = ord($der[$pos++]);
        $s = substr($der, $pos, $sLen);

        $r = ltrim($r, "\x00");
        $r = str_pad($r, 32, "\x00", STR_PAD_LEFT);
        $s = ltrim($s, "\x00");
        $s = str_pad($s, 32, "\x00", STR_PAD_LEFT);

        return $r . $s;
    }

    /**
     * Create VAPID Authorization JWT (RFC 8292)
     */
    private static function createVapidJwt($endpoint, $vapidKeys) {
        $parsed = parse_url($endpoint);
        $aud = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? 'fcm.googleapis.com');
        if (!empty($parsed['port']) && $parsed['port'] != 443 && $parsed['port'] != 80) {
            $aud .= ':' . $parsed['port'];
        }

        $header = ['alg' => 'ES256', 'typ' => 'JWT'];
        $claims = [
            'aud' => $aud,
            'exp' => time() + 86400,
            'sub' => 'mailto:support@roadtohalal.com',
        ];

        $signingInput = self::base64UrlEncode(json_encode($header)) . '.' . self::base64UrlEncode(json_encode($claims));
        $derSig = '';
        $options = self::getOpenSslConfig();
        $privateKey = openssl_pkey_get_private($vapidKeys['privatePem']);
        if (!$privateKey) {
            return null;
        }

        if (!openssl_sign($signingInput, $derSig, $privateKey, OPENSSL_ALGO_SHA256)) {
            return null;
        }

        $rawSig = self::derToRawSignature($derSig);
        return $signingInput . '.' . self::base64UrlEncode($rawSig);
    }

    /**
     * Encrypt payload with RFC 8291 (aes128gcm)
     */
    private static function encryptPayload($clientPubRaw, $clientAuthRaw, $payloadString) {
        $options = self::getOpenSslConfig();
        $serverKey = openssl_pkey_new($options);
        if (!$serverKey) return null;

        $serverDetails = openssl_pkey_get_details($serverKey);
        if (!$serverDetails || empty($serverDetails['ec']['x']) || empty($serverDetails['ec']['y'])) {
            return null;
        }
        $serverPubRaw = "\x04" . $serverDetails['ec']['x'] . $serverDetails['ec']['y'];

        // Convert client pub to PEM and derive ECDH shared secret
        $clientPubPem = self::rawP256ToPem($clientPubRaw);
        $clientPubKeyResource = openssl_pkey_get_public($clientPubPem);
        if (!$clientPubKeyResource) return null;

        $sharedSecret = openssl_pkey_derive($clientPubKeyResource, $serverKey, 32);
        if (!$sharedSecret) return null;

        // HKDF to derive CEK & Nonce
        $keyInfo = "WebPush: info\0" . $clientPubRaw . $serverPubRaw;
        $ikm = hash_hkdf('sha256', $sharedSecret, 32, $keyInfo, $clientAuthRaw);

        $salt = random_bytes(16);
        $cek = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\0", $salt);
        $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\0", $salt);

        // Padding record (last record ends with \x02)
        $padded = $payloadString . "\x02";
        $tag = '';
        $ciphertext = openssl_encrypt($padded, 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);
        if ($ciphertext === false) return null;

        $recordSize = 4096;
        $header = $salt . pack('N', $recordSize) . chr(65) . $serverPubRaw;
        return $header . $ciphertext . $tag;
    }

    /**
     * Send Web Push to a single subscription
     */
    public static function sendPush($subscription, $payloadData, $DATA_DIR) {
        $endpoint = $subscription['endpoint'] ?? '';
        $p256dhB64 = $subscription['keys']['p256dh'] ?? '';
        $authB64 = $subscription['keys']['auth'] ?? '';

        if (empty($endpoint) || empty($p256dhB64) || empty($authB64)) {
            return ['success' => false, 'error' => 'Invalid subscription object'];
        }

        $vapidKeys = self::getVapidKeys($DATA_DIR);
        if (!$vapidKeys) {
            return ['success' => false, 'error' => 'VAPID keys unavailable'];
        }

        $clientPubRaw = self::base64UrlDecode($p256dhB64);
        $clientAuthRaw = self::base64UrlDecode($authB64);

        if (strlen($clientPubRaw) !== 65 || strlen($clientAuthRaw) < 16) {
            return ['success' => false, 'error' => 'Invalid key lengths'];
        }

        $payloadJson = is_string($payloadData) ? $payloadData : json_encode($payloadData, JSON_UNESCAPED_UNICODE);
        $body = self::encryptPayload($clientPubRaw, $clientAuthRaw, $payloadJson);
        if (!$body) {
            return ['success' => false, 'error' => 'Encryption failed'];
        }

        $jwt = self::createVapidJwt($endpoint, $vapidKeys);
        if (!$jwt) {
            return ['success' => false, 'error' => 'VAPID JWT signing failed'];
        }

        $headers = [
            'Content-Type: application/octet-stream',
            'Content-Encoding: aes128gcm',
            'TTL: 86400',
            'Urgency: high',
            'Authorization: vapid t=' . $jwt . ', k=' . $vapidKeys['publicKey'],
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        $isSuccess = ($httpCode >= 200 && $httpCode < 300);
        $isExpired = ($httpCode === 404 || $httpCode === 410);

        return [
            'success' => $isSuccess,
            'statusCode' => $httpCode,
            'isExpired' => $isExpired,
            'response' => $response,
            'curlError' => $curlErr,
        ];
    }

    /**
     * Send push notification to partner in workspace
     */
    public static function notifyPartner($workspaceId, $senderRole, $payloadData, $DATA_DIR) {
        $subsFile = rtrim($DATA_DIR, '/\\') . '/workspaces/' . $workspaceId . '/push_subscriptions.json';
        if (!file_exists($subsFile)) {
            return ['sent' => 0, 'message' => 'No subscriptions registered yet'];
        }

        $subs = json_decode(@file_get_contents($subsFile), true);
        if (!is_array($subs) || empty($subs)) {
            return ['sent' => 0, 'message' => 'Subscription list empty'];
        }

        $sentCount = 0;
        $activeSubs = [];
        $hasChanges = false;

        foreach ($subs as $sub) {
            $subRole = $sub['role'] ?? '';
            // Do not send to the person who triggered the action
            if ($senderRole && $subRole === $senderRole) {
                $activeSubs[] = $sub;
                continue;
            }

            $res = self::sendPush($sub, $payloadData, $DATA_DIR);
            if ($res['isExpired']) {
                $hasChanges = true;
                continue; // drop expired subscription
            }

            if ($res['success']) {
                $sentCount++;
            }
            $activeSubs[] = $sub;
        }

        if ($hasChanges) {
            @file_put_contents($subsFile, json_encode($activeSubs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        return ['sent' => $sentCount, 'total' => count($subs)];
    }
}
