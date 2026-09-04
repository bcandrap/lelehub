<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Google Form destination configured for LeleHub CRM.
$formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdzVs52Ge2peu64C2nOZEB1_h7XMYl77seB5y0Fk45Xm-Lv-A/formResponse';

function clean_text(string $value, int $maxLength): string {
    $value = trim($value);
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength);
    }
    return substr($value, 0, $maxLength);
}

function normalize_phone(string $phone): string {
    $phone = preg_replace('/[\s().-]+/', '', trim($phone)) ?? '';
    if (strpos($phone, '+62') === 0) return $phone;
    if (strpos($phone, '62') === 0) return '+' . $phone;
    if (strpos($phone, '0') === 0) return '+62' . substr($phone, 1);
    return $phone;
}

$email   = clean_text((string)($_POST['email'] ?? ''), 254);
$phone   = normalize_phone(clean_text((string)($_POST['phone'] ?? ''), 24));
$rating  = clean_text((string)($_POST['rating'] ?? ''), 1);
$comment = clean_text((string)($_POST['comment'] ?? ''), 3000);
$wish    = clean_text((string)($_POST['wish'] ?? ''), 3000);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Format email tidak valid.']);
    exit;
}

if (!preg_match('/^\+628[1-9][0-9]{7,10}$/', $phone)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Format nomor HP tidak valid.']);
    exit;
}

if (!in_array($rating, ['1', '2', '3', '4', '5'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Rating harus 1 sampai 5.']);
    exit;
}

if ($comment === '' || $wish === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Comment dan Wish wajib diisi.']);
    exit;
}

$payload = http_build_query([
    'entry.2105015209' => $email,
    'entry.211829700'  => $phone,
    'entry.1915206390' => $rating,
    'entry.564337398'  => $comment,
    'entry.1498932458' => $wish,
], '', '&', PHP_QUERY_RFC3986);

$ok = false;
$httpCode = 0;

if (function_exists('curl_init')) {
    $ch = curl_init($formUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'Content-Length: ' . strlen($payload),
        ],
        CURLOPT_USERAGENT => 'LeleHubSurvey/1.0',
    ]);
    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    $ok = ($response !== false && $httpCode >= 200 && $httpCode < 400);
} else {
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n" .
                        "Content-Length: " . strlen($payload) . "\r\n" .
                        "User-Agent: LeleHubSurvey/1.0\r\n",
            'content' => $payload,
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);
    $response = @file_get_contents($formUrl, false, $context);
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $line) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $m)) {
                $httpCode = (int)$m[1];
                break;
            }
        }
    }
    $ok = ($response !== false && $httpCode >= 200 && $httpCode < 400);
}

if (!$ok) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => 'Server belum berhasil meneruskan survey ke Google Form.',
        'google_status' => $httpCode,
    ]);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Terima kasih. Masukan Anda telah dikirim.']);
