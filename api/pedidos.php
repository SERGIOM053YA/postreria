<?php
// Permitir conexiones desde tu frontend (CORS)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

// ==========================================
// 1. GET: KDS LECTURA DE PEDIDOS (Para admin.js)
// ==========================================
if ($metodo === 'GET') {
    $endpoint = "pedidos?select=id,cliente_nombre,cliente_telefono,tipo_entrega,direccion_entrega,metodo_pago,billete_cambio,comprobante_url,total,estado,creado_en,pedido_items(cantidad,precio_unitario,detalles,productos(nombre,imagen_url))&order=creado_en.desc";
    
    $pedidos = peticionSupabase('GET', $endpoint);
    echo json_encode($pedidos);
    exit();
}

// ==========================================
// 2. POST: RECIBIR NUEVA ORDEN (Desde el Carrito)
// ==========================================
if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['items'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos de pedido inválidos o carrito vacío']);
        exit();
    }

    $estadoInicial = ($input['metodo_pago'] === 'Efectivo') ? 'Por Preparar' : 'Pendiente de Validación';
    $totalCalculado = 0;
    foreach ($input['items'] as $item) {
        $totalCalculado += ($item['precio_unitario'] * $item['cantidad']);
    }

   // ==========================================
    // MAGIA: SUBIR COMPROBANTE AL BUCKET
    // ==========================================
    $nombreComprobanteFinal = null;
    
    if ($input['metodo_pago'] === 'Transferencia' && !empty($input['comprobante_b64'])) {
        global $supabase_url, $supabase_key; // Aseguramos traer las llaves de conexion.php
        
        $b64 = explode(',', $input['comprobante_b64']);
        $archivoData = base64_decode($b64[1] ?? $b64[0]);
        
        $nombreArchivo = $input['comprobante_nombre'] ?? ('recibo_' . time() . '.jpg');
        $mimeType = $input['comprobante_tipo'] ?? 'image/jpeg';
        
        $storageEndpoint = $supabase_url . '/storage/v1/object/comprobantes/' . $nombreArchivo;
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ('Bearer ' . $supabase_key);
        
        $ch = curl_init($storageEndpoint);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $archivoData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // VITAL: Evita que XAMPP bloquee la subida
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: ' . $authHeader,
            'apikey: ' . $supabase_key,      // VITAL: La llave que exigía Supabase
            'Content-Type: ' . $mimeType
        ]);
        
        $resStorage = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 201) {
            // Como el bucket ya es público, guardamos el enlace directo listo para darle clic
            $nombreComprobanteFinal = $supabase_url . '/storage/v1/object/public/comprobantes/' . $nombreArchivo;
        }
    }

    // ==========================================
    // CREAR LA ORDEN MAESTRA CON NUEVAS COLUMNAS
    // ==========================================
    $datosPedido = [
        'cliente_nombre' => $input['cliente_nombre'] ?? 'Cliente',
        'cliente_telefono' => $input['cliente_telefono'] ?? '',
        'tipo_entrega' => $input['tipo_entrega'] ?? 'Recoger en Local',
        'direccion_entrega' => $input['direccion_entrega'] ?? '',
        'metodo_pago' => $input['metodo_pago'] ?? 'Efectivo',
        'billete_cambio' => $input['billete_cambio'] ?? null,
        'comprobante_url' => $nombreComprobanteFinal,
        'estatus_pago' => ($input['metodo_pago'] === 'Transferencia') ? 'En Revisión' : 'Pendiente',
        'estado' => $estadoInicial,
        'total' => $totalCalculado,
        'latitud' => $input['latitud'] ?? null,
        'longitud' => $input['longitud'] ?? null
    ];

    $endpointPedido = "pedidos?select=*";
    $respuestaPedido = peticionSupabase('POST', $endpointPedido, $datosPedido);

    if (isset($respuestaPedido['error']) || !is_array($respuestaPedido) || count($respuestaPedido) === 0) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo registrar la orden en la nube']);
        exit();
    }

    $pedidoId = $respuestaPedido[0]['id'] ?? $respuestaPedido['id'] ?? null;

    if (!$pedidoId) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Supabase rechazó la orden.',
            'detalles_reales' => $respuestaPedido
        ]);
        exit();
    }

    // EMPAQUETAR POSTRES
    $datosItems = [];
    foreach ($input['items'] as $item) {
        $textoDetalles = $item['detalles'] ?? $item['instrucciones'] ?? $item['desc'] ?? null;
        $datosItems[] = [
            'pedido_id' => $pedidoId,
            'producto_id' => $item['producto_id'],
            'cantidad' => $item['cantidad'],
            'precio_unitario' => $item['precio_unitario'],
            'detalles' => $textoDetalles 
        ];
    }

    $respuestaItems = peticionSupabase('POST', 'pedido_items', $datosItems);
    http_response_code(201);
    echo json_encode(['mensaje' => 'Orden procesada con éxito', 'id_orden' => $pedidoId]);
    exit();
}

if ($metodo === 'PATCH') {
    $id = $_GET['id'] ?? null;
    $input = json_decode(file_get_contents('php://input'), true);
    $nuevoEstado = $input['estado'] ?? null;

    if (!$id || !$nuevoEstado) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta el ID del pedido o el nuevo estado']);
        exit();
    }

    $endpoint = "pedidos?id=eq." . $id;
    $respuesta = peticionSupabase('PATCH', $endpoint, ['estado' => $nuevoEstado]);
    echo json_encode(['mensaje' => 'Estado actualizado exitosamente']);
    exit();
}
?>