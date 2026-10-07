<?php
// api/registro.php

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

// 3. Capturar los datos que envía registro.js
$datosCrudos = file_get_contents('php://input');
$datos = json_decode($datosCrudos, true);

if (!$datos || empty($datos['email']) || empty($datos['password']) || empty($datos['nombre'])) {
    http_response_code(400);
    echo json_encode(["error" => "El nombre, correo y contraseña son obligatorios."]);
    exit;
}

// 4. Configurar la petición a la API REST de Supabase (Signup)
$endpoint = "auth/v1/signup";

global $supabase_url, $supabase_key;
$url = $supabase_url . "/" . $endpoint; 

$ch = curl_init($url);
$headers = [
    "apikey: " . $supabase_key,
    "Content-Type: application/json"
];

// En Supabase, el nombre se guarda dentro del objeto "data" (user_metadata)
$payload = [
    "email" => $datos['email'],
    "password" => $datos['password'],
    "data" => [
        "nombre" => $datos['nombre']
    ]
];

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$respuesta_curl = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$respuesta_decodificada = json_decode($respuesta_curl, true);

// 5. Validar respuesta y confirmar al frontend
if ($httpcode >= 200 && $httpcode < 300) {
    // Extraemos el ID y Email de forma segura (soporta respuestas con o sin confirmación de correo)
    $userId = $respuesta_decodificada['user']['id'] ?? $respuesta_decodificada['id'] ?? 'ID_Pendiente';
    $userEmail = $respuesta_decodificada['user']['email'] ?? $respuesta_decodificada['email'] ?? $datos['email'];

    echo json_encode([
        "mensaje" => "Registro exitoso",
        "user" => [
            "id" => $userId,
            "email" => $userEmail
        ]
    ]);
} else {
    http_response_code($httpcode);
    // Supabase devuelve el error en 'msg' o 'error_description'
    $mensajeError = $respuesta_decodificada['msg'] ?? $respuesta_decodificada['error_description'] ?? "Error al registrar la cuenta.";
    echo json_encode([
        "error" => $mensajeError
    ]);
}
?>