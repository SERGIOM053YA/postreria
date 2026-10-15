<?php
// api/login.php

// 1. Cabeceras CORS de seguridad
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Respuesta rápida para las peticiones pre-flight del navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Importar el puente de conexión
require_once __DIR__ . '/conexion.php';

// 3. Capturar el correo y contraseña que envía login.js
$datosCrudos = file_get_contents('php://input');
$credenciales = json_decode($datosCrudos, true);

if (!$credenciales || empty($credenciales['email']) || empty($credenciales['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Correo y contraseña son obligatorios."]);
    exit;
}

// 4. Configurar la petición a la API REST de Supabase Auth
$endpoint = "auth/v1/token?grant_type=password";

global $supabase_url, $supabase_key;
$url = $supabase_url . "/" . $endpoint; 

$ch = curl_init($url);
$headers = [
    "apikey: " . $supabase_key,
    "Content-Type: application/json"
];

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "email" => $credenciales['email'],
    "password" => $credenciales['password']
]));

$respuesta_curl = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$respuesta_decodificada = json_decode($respuesta_curl, true);

// 5. Validar respuesta y enviar token al frontend
if ($httpcode >= 200 && $httpcode < 300) {
    // Extraemos el nombre de los metadatos de Supabase
    $nombre = $respuesta_decodificada['user']['user_metadata']['nombre'] ?? '';

    echo json_encode([
        "token" => $respuesta_decodificada['access_token'],
        "user" => [
            "id" => $respuesta_decodificada['user']['id'],
            "email" => $respuesta_decodificada['user']['email'],
            "nombre" => $nombre  // <--- ¡NUEVA LÍNEA PARA PASAR EL NOMBRE!
        ],
        "fuente" => "Supabase (vía PHP)"
    ]);
} else {
// ... resto del código
    http_response_code($httpcode);
    echo json_encode([
        "error" => $respuesta_decodificada['error_description'] ?? "Credenciales inválidas."
    ]);
}
?>