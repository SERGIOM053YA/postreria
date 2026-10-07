<?php
// conexion.php

// 1. Importar las variables de entorno de la bóveda
$env = require __DIR__ . '/config.php';

$supabase_url = $env['SUPABASE_URL'];
$supabase_key = $env['SUPABASE_ANON_KEY'];

// 2. Función global para hacer peticiones a Supabase usando cURL
function peticionSupabase($metodo, $endpoint, $datos = null) {
    global $supabase_url, $supabase_key;
    $url = $supabase_url . "/rest/v1/" . $endpoint;
    $ch = curl_init($url);

    // 1. Extraer el token de autorización que envió el frontend
    $authHeader = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    // 2. Preparar los headers base
    $curlHeaders = [
        "apikey: " . $supabase_key,
        "Content-Type: application/json",
        "Prefer: return=representation"
    ];

    // 3. Inyectar el token del cliente si existe; si no, usar la llave pública
    if (!empty($authHeader)) {
        $curlHeaders[] = "Authorization: " . $authHeader;
    } else {
        $curlHeaders[] = "Authorization: Bearer " . $supabase_key;
    }

    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $metodo);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    if ($datos !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($datos));
    }
    
    $respuesta = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($respuesta, true);
}
?>