<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

$archivo_estado = __DIR__ . '/estado_tienda.json';

// Si no existe, creamos el estado por defecto (Abierto)
if (!file_exists($archivo_estado)) {
    file_put_contents($archivo_estado, json_encode(['abierta' => true]));
}

// LECTURA (Frontend y Admin)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo file_get_contents($archivo_estado);
    exit();
}

// ESCRITURA (Solo Admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['abierta'])) {
        file_put_contents($archivo_estado, json_encode(['abierta' => (bool)$input['abierta']]));
        echo json_encode(['mensaje' => 'Estado actualizado']);
    }
    exit();
}
?>