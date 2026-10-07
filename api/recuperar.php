<?php
// api/recuperar.php

// 1. Cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Importar conexión
require_once __DIR__ . '/conexion.php';

// 3. Capturar el correo
$datosCrudos = file_get_contents('php://input');
$datos = json_decode($datosCrudos, true);

if (!$datos || empty($datos['email'])) {
    http_response_code(400);
    echo json_encode(["error" => "El correo es obligatorio."]);
    exit;
}

// 4. Petición a Supabase Auth para enviar correo de recuperación
$endpoint = "auth/v1/recover";

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
    "email" => $datos['email']
]));

$respuesta_curl = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 5. Validar respuesta
if ($httpcode >= 200 && $httpcode < 300) {
    echo json_encode([
        "mensaje" => "Si el correo existe, recibirás instrucciones para recuperar tu cuenta."
    ]);
} else {
    $respuesta_decodificada = json_decode($respuesta_curl, true);
    http_response_code($httpcode);
    echo json_encode([
        "error" => $respuesta_decodificada['msg'] ?? $respuesta_decodificada['error_description'] ?? "Error al procesar la solicitud."
    ]);
}
?>