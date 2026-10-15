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

// Función auxiliar para rescatar el Token JWT aunque XAMPP lo oculte
function obtenerAuthHeader($supabase_key) {
    $authHeader = '';
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    return !empty($authHeader) ? $authHeader : ('Bearer ' . $supabase_key);
}

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
    global $supabase_url, $supabase_key;

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['items'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos de pedido inválidos o carrito vacío']);
        exit();
    }

    $esTransferencia = ($input['metodo_pago'] === 'Transferencia' || $input['metodo_pago'] === 'Transferencia SPEI');
    $estadoInicial = $esTransferencia ? 'Pendiente de Validación' : 'Por Preparar';
    
    $totalCalculado = 0;
    foreach ($input['items'] as $item) {
        $totalCalculado += ($item['precio_unitario'] * $item['cantidad']);
    }

    // Rescatamos el token del cliente autenticado
    $authHeader = obtenerAuthHeader($supabase_key);

    // ==========================================
    // SUBIR COMPROBANTE AL BUCKET
    // ==========================================
    $nombreComprobanteFinal = null;
    
    if ($esTransferencia && !empty($input['comprobante_b64'])) {
        $b64 = explode(',', $input['comprobante_b64']);
        $archivoData = base64_decode($b64[1] ?? $b64[0]);
        
        // Limpiamos espacios o caracteres especiales en el nombre del archivo
        $nombreOriginal = $input['comprobante_nombre'] ?? ('recibo_' . time() . '.jpg');
        $nombreArchivo = preg_replace('/[^a-zA-Z0-9._-]/', '_', $nombreOriginal);
        $mimeType = $input['comprobante_tipo'] ?? 'image/jpeg';
        
        $storageEndpoint = $supabase_url . '/storage/v1/object/comprobantes/' . $nombreArchivo;
        
        $ch = curl_init($storageEndpoint);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $archivoData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: ' . $authHeader,
            'apikey: ' . $supabase_key,
            'Content-Type: ' . $mimeType,
            'x-upsert: true'
        ]);
        
        $resStorage = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            // Guardamos la URL pública completa para conectarla con la tabla pedidos
            $nombreComprobanteFinal = $supabase_url . '/storage/v1/object/public/comprobantes/' . $nombreArchivo;
        } else {
            http_response_code(400);
            echo json_encode([
                'error' => 'No se pudo subir la imagen al bucket comprobantes.',
                'codigo_http' => $httpCode,
                'detalles_storage' => json_decode($resStorage, true) ?? $resStorage
            ]);
            exit();
        }
    }

    // ==========================================
    // CREAR LA ORDEN MAESTRA EN LA TABLA PEDIDOS
    // ==========================================
    $datosPedido = [
        'cliente_nombre' => $input['cliente_nombre'] ?? 'Cliente',
        'cliente_telefono' => $input['cliente_telefono'] ?? '',
        'tipo_entrega' => $input['tipo_entrega'] ?? 'Recoger en Local',
        'direccion_entrega' => $input['direccion_entrega'] ?? '',
        'metodo_pago' => $esTransferencia ? 'Transferencia SPEI' : 'Efectivo',
        'billete_cambio' => $input['billete_cambio'] ?? null,
        'comprobante_url' => $nombreComprobanteFinal,
        'estatus_pago' => $esTransferencia ? 'En Revisión' : 'Pendiente',
        'estado' => $estadoInicial,
        'total' => $totalCalculado,
        'latitud' => $input['latitud'] ?? null,
        'longitud' => $input['longitud'] ?? null
    ];

    // Enviamos el pedido con el token del cliente y Prefer: return=representation
    $urlPedido = $supabase_url . "/rest/v1/pedidos?select=*";
    $chPedido = curl_init($urlPedido);
    curl_setopt($chPedido, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($chPedido, CURLOPT_POSTFIELDS, json_encode($datosPedido));
    curl_setopt($chPedido, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chPedido, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($chPedido, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabase_key,
        'Authorization: ' . $authHeader,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);

    $resPedidoRaw = curl_exec($chPedido);
    $httpCodePedido = curl_getinfo($chPedido, CURLINFO_HTTP_CODE);
    curl_close($chPedido);

    $respuestaPedido = json_decode($resPedidoRaw, true);
    $pedidoId = $respuestaPedido[0]['id'] ?? $respuestaPedido['id'] ?? null;

    if (!$pedidoId || $httpCodePedido >= 400) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Supabase rechazó la orden en la tabla pedidos.',
            'codigo_http' => $httpCodePedido,
            'detalles_reales' => $respuestaPedido ?? $resPedidoRaw
        ]);
        exit();
    }

    // ==========================================
    // EMPAQUETAR E INSERTAR POSTRES (pedido_items)
    // ==========================================
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

    $urlItems = $supabase_url . "/rest/v1/pedido_items";
    $chItems = curl_init($urlItems);
    curl_setopt($chItems, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($chItems, CURLOPT_POSTFIELDS, json_encode($datosItems));
    curl_setopt($chItems, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chItems, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($chItems, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabase_key,
        'Authorization: ' . $authHeader,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);

    $resItemsRaw = curl_exec($chItems);
    $httpCodeItems = curl_getinfo($chItems, CURLINFO_HTTP_CODE);
    curl_close($chItems);

    if ($httpCodeItems >= 400) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Supabase rechazó los postres en pedido_items.',
            'detalles_reales' => json_decode($resItemsRaw, true) ?? $resItemsRaw
        ]);
        exit();
    }

    http_response_code(201);
    echo json_encode([
        'mensaje' => 'Orden procesada con éxito',
        'id_orden' => $pedidoId,
        'comprobante_url' => $nombreComprobanteFinal
    ]);
    exit();
}

// ==========================================
// 3. PATCH: AVANZAR ESTADOS (Desde admin.js)
// ==========================================
if ($metodo === 'PATCH') {
    global $supabase_url, $supabase_key;

    $id = $_GET['id'] ?? null;
    $input = json_decode(file_get_contents('php://input'), true);
    $nuevoEstado = $input['estado'] ?? null;

    if (!$id || !$nuevoEstado) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta el ID del pedido o el nuevo estado']);
        exit();
    }

    // Rescatamos el token igual que en el POST para que XAMPP no lo pierda
    $authHeader = obtenerAuthHeader($supabase_key);

    $urlPatch = $supabase_url . "/rest/v1/pedidos?id=eq." . urlencode($id);
    $chPatch = curl_init($urlPatch);
    curl_setopt($chPatch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($chPatch, CURLOPT_POSTFIELDS, json_encode(['estado' => $nuevoEstado]));
    curl_setopt($chPatch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chPatch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($chPatch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabase_key,
        'Authorization: ' . $authHeader,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);

    $resPatchRaw = curl_exec($chPatch);
    $httpCodePatch = curl_getinfo($chPatch, CURLINFO_HTTP_CODE);
    curl_close($chPatch);

    if ($httpCodePatch >= 400) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Error al actualizar en Supabase',
            'codigo_http' => $httpCodePatch,
            'detalles_reales' => json_decode($resPatchRaw, true) ?? $resPatchRaw
        ]);
        exit();
    }

    http_response_code(200);
    echo json_encode([
        'mensaje' => 'Estado actualizado exitosamente',
        'actualizado' => json_decode($resPatchRaw, true)
    ]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
?>