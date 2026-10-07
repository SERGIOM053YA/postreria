<?php
// api/verificar.php

// Cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/conexion.php';

// Capturar los datos del frontend (correo, código de 6 dígitos y nueva contraseña)
$datosCrudos = file_get_contents('php://input');
$datos = json_decode($datosCrudos, true);

if (empty($datos['email']) || empty($datos['token']) || empty($datos['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Correo, código y nueva contraseña son obligatorios."]);
    exit;
}

global $supabase_url, $supabase_key;

// ETAPA 1: Verificar el código OTP (token) enviado al correo
$urlVerify = $supabase_url . "/auth/v1/verify?type=recovery";
$chVerify = curl_init($urlVerify);
curl_setopt($chVerify, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($chVerify, CURLOPT_HTTPHEADER, [
    "apikey: " . $supabase_key,
    "Content-Type: application/json"
]);
curl_setopt($chVerify, CURLOPT_RETURNTRANSFER, true);
curl_setopt($chVerify, CURLOPT_POSTFIELDS, json_encode([
    "type" => "recovery",
    "email" => $datos['email'],
    "token" => $datos['token'] // El código de 8 dígitos
]));
$resVerify = curl_exec($chVerify);
$httpVerify = curl_getinfo($chVerify, CURLINFO_HTTP_CODE);
curl_close($chVerify);

$verifyData = json_decode($resVerify, true);

// Si el código es correcto, Supabase nos devuelve un access_token temporal
if ($httpVerify >= 200 && $httpVerify < 300 && isset($verifyData['access_token'])) {
    
    // ETAPA 2: Usar el token temporal para sobrescribir la contraseña
    $accessToken = $verifyData['access_token'];
    $urlUpdate = $supabase_url . "/auth/v1/user";
    
    $chUpdate = curl_init($urlUpdate);
    curl_setopt($chUpdate, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($chUpdate, CURLOPT_HTTPHEADER, [
        "apikey: " . $supabase_key,
        "Authorization: Bearer " . $accessToken, // Nos identificamos con el token temporal
        "Content-Type: application/json"
    ]);
    curl_setopt($chUpdate, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chUpdate, CURLOPT_POSTFIELDS, json_encode([
        "password" => $datos['password'] // Inyectamos la nueva contraseña
    ]));

    $resUpdate = curl_exec($chUpdate);
    $httpUpdate = curl_getinfo($chUpdate, CURLINFO_HTTP_CODE);
    curl_close($chUpdate);

    if ($httpUpdate >= 200 && $httpUpdate < 300) {
        echo json_encode(["mensaje" => "Contraseña actualizada exitosamente."]);
    } else {
        $updateData = json_decode($resUpdate, true);
        http_response_code($httpUpdate);
        echo json_encode(["error" => $updateData['msg'] ?? $updateData['error_description'] ?? "Error al actualizar contraseña."]);
    }

} else {
    // El código era incorrecto o ya expiró
    http_response_code($httpVerify);
    echo json_encode(["error" => $verifyData['msg'] ?? $verifyData['error_description'] ?? "Código de verificación inválido o expirado."]);
}
?>