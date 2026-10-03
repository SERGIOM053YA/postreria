require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// CONFIGURACIÓN DEL CARTERO (Nodemailer)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

// ==========================================
// CONEXIÓN A SUPABASE (Nube Principal)
// ==========================================
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ==========================================
// CONEXIÓN A SQLITE (Respaldo y Caché Local)
// ==========================================
const db = new sqlite3.Database('./respaldo_emergencia.db', (err) => {
    if (err) {
        console.error("❌ Error al crear DB de respaldo:", err.message);
    } else {
        console.log("✅ Base de datos de emergencia (SQLite) inicializada.");
        
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password_hash TEXT,
            nombre TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS codigos_recuperacion (
            email TEXT PRIMARY KEY, 
            codigo TEXT, 
            expira_en INTEGER
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS pedidos_emergencia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email_cliente TEXT,
            datos_pedido TEXT,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            db.run(`INSERT OR IGNORE INTO sqlite_sequence (name, seq) VALUES ('pedidos_emergencia', 10000)`);
            db.run(`UPDATE sqlite_sequence SET seq = 10000 WHERE name = 'pedidos_emergencia' AND seq < 10000`);
        });

        // NUEVA TABLA: Caché de productos
        db.run(`CREATE TABLE IF NOT EXISTS productos_cache (
            id INTEGER PRIMARY KEY,
            nombre TEXT,
            descripcion TEXT,
            precio REAL,
            imagen_url TEXT,
            categoria_id INTEGER,
            es_temporada BOOLEAN
        )`);
    }
});

 // ==========================================
// MATEMÁTICAS: FÓRMULA DE HAVERSINE (GEOCERCA)
// ==========================================
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Coordenadas de tu repostería (Mathzi 2)
const TIENDA_LAT = 19.6015500;
const TIENDA_LON = -99.0521000;
// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================
app.post('/api/registro', async (req, res) => {
    const { email, password, nombre } = req.body;
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        db.run(`INSERT INTO usuarios (email, password_hash, nombre) VALUES (?, ?, ?)`, 
            [email, passwordHash, nombre || email.split('@')[0]], 
            () => {}
        );
        res.json({ mensaje: "Usuario registrado.", user: data.user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log(`✅ Login vía Supabase: ${email}`);
        res.json({ token: data.session.access_token, user: data.user, fuente: 'supabase' });
    } catch (error) {
        console.log(`⚠️ Supabase falló. Rescate activado para: ${email}`);
        db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, row) => {
            if (err || !row) return res.status(401).json({ error: "Credenciales inválidas." });
            const validPassword = await bcrypt.compare(password, row.password_hash);
            if (!validPassword) return res.status(401).json({ error: "Credenciales inválidas." });

            const tokenEmergencia = jwt.sign({ email: row.email, id: row.id, role: 'authenticated' }, process.env.JWT_SECRET, { expiresIn: '8h' });
            res.json({ token: tokenEmergencia, user: { email: row.email, nombre: row.nombre }, fuente: 'sqlite_emergencia' });
        });
    }
});

app.post('/api/recuperar-password', async (req, res) => {
    const { email } = req.body;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = Date.now() + 15 * 60 * 1000;
    db.run(`INSERT OR REPLACE INTO codigos_recuperacion (email, codigo, expira_en) VALUES (?, ?, ?)`, [email, codigo, expiraEn], async (err) => {
        if (err) return res.status(500).json({ error: "Error interno." });
        try {
            await transporter.sendMail({
                from: `"Hilda's Postres" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Código de Recuperación",
                html: `<h1>${codigo}</h1>`
            });
            res.json({ mensaje: "Código enviado." });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});

app.post('/api/verificar-otp', (req, res) => {
    const { email, token, password } = req.body;
    db.get(`SELECT * FROM codigos_recuperacion WHERE email = ?`, [email], async (err, row) => {
        if (err || !row || Date.now() > row.expira_en || row.codigo !== token) {
            return res.status(400).json({ error: "Código inválido o expirado." });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        db.run(`UPDATE usuarios SET password_hash = ? WHERE email = ?`, [passwordHash, email], () => {
            db.run(`DELETE FROM codigos_recuperacion WHERE email = ?`, [email]);
            res.json({ mensaje: "Contraseña actualizada." });
        });
    });
});

// ==========================================
// CATÁLOGO: LA RUTA DEL MENÚ BLINDADA
// ==========================================
app.get('/api/productos', async (req, res) => {
    try {
        const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false });
        if (error) throw error;
        
        // Refrescar la caché local con INSERT OR REPLACE para evitar colisiones
        const stmt = db.prepare('INSERT OR REPLACE INTO productos_cache (id, nombre, descripcion, precio, imagen_url, categoria_id, es_temporada) VALUES (?, ?, ?, ?, ?, ?, ?)');
        
        data.forEach(p => {
            stmt.run(p.id, p.nombre, p.descripcion, p.precio, p.imagen_url, p.categoria_id, p.es_temporada);
        });
        
        stmt.finalize();
        res.json(data);
        
    } catch (err) {
        console.log("⚠️ Supabase inalcanzable. Enviando menú desde la caché local.");
        db.all('SELECT * FROM productos_cache ORDER BY id DESC', [], (errLocal, rows) => {
            if (errLocal) return res.status(500).json({ error: "Error leyendo caché local." });
            res.json(rows);
        });
    }
});

// ==========================================
// PEDIDOS: EL EMBUDO RECEPTOR (Try/Catch)
// ==========================================
app.post('/api/pedidos', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No autorizado." });
    const token = authHeader.split(' ')[1];
    
    let emailCliente = 'Cliente';
    // Decodificar identidad (sin importar si es token de Supabase o local)
    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        emailCliente = decodificado.email;
    } catch (e) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) emailCliente = user.email;
    }

    const payload = req.body;

    // VALIDACIÓN DE GEOCERCA (Solo para envíos a domicilio)
    if (payload.tipo_entrega === 'A Domicilio') {
        if (!payload.latitud || !payload.longitud) {
            return res.status(400).json({ error: "No se detectó tu ubicación GPS. Es obligatoria para envíos a domicilio." });
        }

        const distancia = calcularDistanciaKm(TIENDA_LAT, TIENDA_LON, payload.latitud, payload.longitud);

        if (distancia > 1.0) { // 1.0 km de límite
            return res.status(400).json({ 
                error: `Estás fuera de nuestra área de reparto. Te encuentras a ${distancia.toFixed(2)} km (Máximo permitido: 1.0 km). Por favor, elige "Recoger en Local".` 
            });
        }
    }

    try {
        // Intento de envío a la nube oficial
        const estadoInicial = payload.metodo_pago === 'Efectivo' ? 'Por Preparar' : 'Pendiente de Validación';
        const totalCalculado = payload.items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);

        const { data: pedido, error: errorPedido } = await supabase.from('pedidos').insert([{
            cliente_nombre: payload.cliente_nombre || emailCliente.split('@')[0],
            cliente_telefono: payload.cliente_telefono,
            tipo_entrega: payload.tipo_entrega,
            direccion_entrega: payload.direccion_entrega,
            metodo_pago: payload.metodo_pago,
            estado: estadoInicial,
            latitud: payload.latitud,
            longitud: payload.longitud,
            total: totalCalculado
        }]).select().single();

        if (errorPedido) throw errorPedido;

        const pedidoItemsData = payload.items.map(item => ({
            pedido_id: pedido.id,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            instrucciones: item.instrucciones || ''
        }));

        const { error: errorItems } = await supabase.from('pedido_items').insert(pedidoItemsData);
        if (errorItems) throw errorItems;

        console.log(`✅ Pedido en la Nube #${pedido.id} para:${emailCliente}`);
        res.status(201).json({ mensaje: "Orden enviada a cocina.", id_orden: pedido.id });

    } catch (error) {
        // Rescate: Supabase falló, guardamos en SQLite
        console.log(`⚠️ Nube falló. Creando Orden de Emergencia para: ${emailCliente}`);
        db.run(`INSERT INTO pedidos_emergencia (email_cliente, datos_pedido) VALUES (?, ?)`, 
            [emailCliente, JSON.stringify(payload)], 
            function(err) {
                if (err) return res.status(500).json({ error: "Error guardando orden local." });
                res.status(201).json({ mensaje: "Orden enviada (Modo Local).", id_emergencia: this.lastID });
            }
        );
    }
});

// ==========================================
// KDS: LECTURA FUSIONADA PARA COCINA
// ==========================================
app.get('/api/pedidos', async (req, res) => {
    let pedidosNube = [];
    let pedidosLocales = [];

    // 1. Extraemos el token del administrador que viene del frontend
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : '';

    // 2. Creamos un cliente temporal de Supabase CON LA IDENTIDAD DEL ADMINISTRADOR para saltar el RLS
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Traer los oficiales de Supabase
    try {
        // CORRECCIÓN: Usamos 'created_at' en lugar de 'creado_en'
        const { data, error } = await supabaseAdmin.from('pedidos').select(`
            id, cliente_nombre, cliente_telefono, tipo_entrega,
            direccion_entrega, metodo_pago, total, estado, created_at,
            pedido_items ( cantidad, precio_unitario, instrucciones, productos ( nombre, imagen_url ) )
        `);
        
        if (error) {
            console.log("⚠️ Error leyendo nube:", error.message);
        } else if (data) {
            pedidosNube = data;
        }
    } catch (e) { 
        console.log("⚠️ Excepción al conectar con la nube:", e.message); 
    }

    // Traer los de emergencia y fusionarlos
    db.all(`SELECT * FROM pedidos_emergencia ORDER BY id DESC`, [], (err, rows) => {
        if (!err && rows) {
            db.all('SELECT * FROM productos_cache', [], (errCache, catalogo) => {
                pedidosLocales = rows.map(row => {
                    const datos = JSON.parse(row.datos_pedido);
                    const totalCalculado = (datos.items || []).reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
                    
                    const itemsAdornados = (datos.items || []).map(item => {
                        const p = (catalogo || []).find(c => String(c.id) === String(item.producto_id));
                        return {
                            cantidad: item.cantidad,
                            precio_unitario: item.precio_unitario,
                            instrucciones: item.instrucciones,
                            productos: { nombre: p ? p.nombre : 'Producto Especial', imagen_url: p ? p.imagen_url : null }
                        };
                    });

                    return {
                        id: row.id,
                        cliente_nombre: datos.cliente_nombre,
                        cliente_telefono: datos.cliente_telefono,
                        tipo_entrega: datos.tipo_entrega,
                        direccion_entrega: datos.direccion_entrega,
                        metodo_pago: datos.metodo_pago,
                        estado: datos.estado || (datos.metodo_pago === 'Efectivo' ? 'Por Preparar' : 'Pendiente de Validación'),
                        total: totalCalculado,
                        created_at: row.fecha, // Unificamos el nombre a created_at para el ordenamiento
                        es_emergencia: true,
                        pedido_items: itemsAdornados
                    };
                });
                
                // Fusionamos y ordenamos del más nuevo al más viejo
                const todos = [...pedidosNube, ...pedidosLocales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                res.json(todos);
            });
        } else {
            res.json(pedidosNube);
        }
    });
});

app.patch('/api/pedidos/:id', async (req, res) => {
    const { estado } = req.body;
    const pedidoId = req.params.id;

    if (Number(pedidoId) >= 10000) {
        db.get(`SELECT datos_pedido FROM pedidos_emergencia WHERE id = ?`, [pedidoId], (err, row) => {
            if (err || !row) return res.status(404).json({ error: "No encontrado" });
            let datos = JSON.parse(row.datos_pedido);
            datos.estado = estado; 
            db.run(`UPDATE pedidos_emergencia SET datos_pedido = ? WHERE id = ?`, [JSON.stringify(datos), pedidoId], () => {
                res.json({ mensaje: "Estado local actualizado" });
            });
        });
    } else {
        await supabase.from('pedidos').update({ estado: estado }).eq('id', pedidoId);
        res.json({ mensaje: "Estado actualizado en nube" });
    }
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 SERVIDOR MAESTRO EN http://localhost:${PORT}`);
    console.log(`=========================================`);
});