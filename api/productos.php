<?php
require_once 'conexion.php';

// Configuración de cabeceras para permitir el envío de archivos (FormData)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ==========================================
// 1. GET: DEVOLVER EL CATÁLOGO ACTUAL
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $productos = peticionSupabase('GET', 'productos?select=*');
    echo json_encode($productos);
    exit();
}

// ==========================================
// 2. POST: SUBIR IMAGEN Y CREAR PRODUCTO
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    global $supabase_url, $supabase_key;
    
    $imagenUrl = null;

    // Extraer token de forma segura (Truco para evitar el bloqueo de Apache XAMPP)
    $authHeader = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (empty($authHeader)) {
        $authHeader = 'Bearer ' . $supabase_key;
    }
    
    // A. Procesar y subir la imagen al Storage de Supabase
    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
        $archivoTmp = $_FILES['imagen']['tmp_name'];
        $extension = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
        $nuevoNombre = uniqid('postre_') . '.' . $extension;
        
        // Ruta exacta de tu bucket
        $bucketUrl = $supabase_url . '/storage/v1/object/menu-imagenes/' . $nuevoNombre;
        
        $ch = curl_init($bucketUrl);
        $headersStorage = [
            "Authorization: " . $authHeader,
            "apikey: " . $supabase_key,
            "Content-Type: " . mime_content_type($archivoTmp)
        ];
        
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents($archivoTmp));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headersStorage);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Fundamental para envíos desde localhost
        
        $resStorage = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 201) {
            // Generar la URL pública directa
            $imagenUrl = $supabase_url . '/storage/v1/object/public/menu-imagenes/' . $nuevoNombre;
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Error al subir la imagen al Storage.', 'detalles' => json_decode($resStorage)]);
            exit();
        }
    }

    // B. Recolectar textos del formulario ($_POST)
    $datosProducto = [
        'nombre' => $_POST['nombre'] ?? '',
        'precio' => floatval($_POST['precio'] ?? 0),
        'descripcion' => $_POST['descripcion'] ?? '',
        'es_temporada' => false,
        'disponible' => true,
        'categoria_id' => intval($_POST['categoria'] ?? 1)
    ];

    if ($imagenUrl) {
        $datosProducto['imagen_url'] = $imagenUrl;
    }

    // C. Guardar el registro en la base de datos PostgreSQL
    $respuesta = peticionSupabase('POST', 'productos', $datosProducto);

    if (isset($respuesta['error']) || (isset($respuesta['code']) && $respuesta['code'] !== 200 && $respuesta['code'] !== 201)) {
        http_response_code(400);
        echo json_encode(['error' => 'Error guardando en la base de datos', 'detalles' => $respuesta]);
    } else {
        http_response_code(201);
        echo json_encode(['mensaje' => 'Producto agregado con éxito', 'data' => $respuesta]);
    }
    exit();
}
// ==========================================
// 3. PATCH: ACTUALIZAR DISPONIBILIDAD O DATOS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Se requiere el ID del producto.']);
        exit();
    }

    // 1. Recibir el JSON con el nuevo estado { "disponible": false/true }
    $datosCrudos = file_get_contents('php://input');
    $datosActualizar = json_decode($datosCrudos, true);

    // 2. Enviar la instrucción a Supabase indicando exactamente qué ID modificar
    $endpoint = 'productos?id=eq.' . $id;
    $respuesta = peticionSupabase('PATCH', $endpoint, $datosActualizar);

    // 3. Responder al frontend
    if (isset($respuesta['error']) || (isset($respuesta['code']) && $respuesta['code'] !== 200 && $respuesta['code'] !== 204)) {
        http_response_code(400);
        echo json_encode(['error' => 'No se pudo actualizar', 'detalles' => $respuesta]);
    } else {
        http_response_code(200);
        echo json_encode(['mensaje' => 'Disponibilidad actualizada exitosamente.']);
    }
    exit();
}
// ==========================================
// 4. DELETE: ELIMINAR PRODUCTO
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Se requiere el ID del producto.']);
        exit();
    }

    // Enviar la instrucción de borrado a Supabase
    $endpoint = 'productos?id=eq.' . $id;
    $respuesta = peticionSupabase('DELETE', $endpoint);

    // Responder al frontend
    http_response_code(200);
    echo json_encode(['mensaje' => 'Producto eliminado correctamente.']);
    exit();
}
?>