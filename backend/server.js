// Cargar variables de entorno ocultas
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Inicializar la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES (Reglas de seguridad y formato)
// ==========================================
app.use(cors()); // Permite que tu frontend se conecte sin bloqueos
app.use(express.json()); // Permite que el servidor lea los datos de los formularios

// ==========================================
// RUTAS (Endpoints)
// ==========================================
// Ruta de prueba para verificar que el servidor está vivo
app.get('/', (req, res) => {
    res.json({
        mensaje: "¡Servidor Backend de Hilda's Postres funcionando! 🚀",
        estado: "OK"
    });
});

// Aquí irán las rutas de /api/login y /api/registro más adelante...

// ==========================================
// LEVANTAR EL SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`=========================================`);
});