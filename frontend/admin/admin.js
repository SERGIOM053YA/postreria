(() => {
    // 1. INICIALIZAR SUPABASE
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8';
    const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Arreglo global para almacenar los pedidos de la base de datos
    let dbOrders = [];

    // Claves de LocalStorage
    const PRODUCTS_KEY = 'hilda_custom_products';
    const SALES_KEY = 'hilda_sales';
    const CATALOG_KEY = 'hilda_catalog_status';
    
    // Catálogo Base Simulado
    const catalog = [
        ['product-mini-hotcakes','Mini Hotcakes 12 Pz','postres',40,'mini_hotcakes.jpg'],
        ['product-frappe-oreo','Frappé de Oreo','bebidas',65,'frappe_oreo.jpg']
    ].map(([id,name,category,price,image]) => ({ id, name, category, categoryLabel:category[0].toUpperCase()+category.slice(1), price, image:`../images/${image}`, builtin:true }));
    
    const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
    const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
    const money = value => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(value || 0);
    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
    const rows = document.getElementById('product-rows');
    const form = document.getElementById('product-form');
    const message = document.getElementById('form-message');

    // 2. LÓGICA DE NAVEGACIÓN DEL MENÚ
    const pageHeadings = {
        'products-panel': { title:'Productos', desc:'Gestiona el catálogo y disponibilidad de tu tienda', icon:'fa-box' },
        'sales-panel': { title:'Ganancias', desc:'Resumen de ventas e ingresos del negocio', icon:'fa-chart-line' },
        'orders-panel': { title:'Pedidos', desc:'Gestiona los pedidos de tu tienda', icon:'fa-clipboard-list' }
    };
    
    document.querySelectorAll('.admin-nav button').forEach(button => button.addEventListener('click', () => {
        document.querySelectorAll('.admin-nav button').forEach(item => item.classList.toggle('active', item === button));
        document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.toggle('active', panel.id === button.dataset.panel));
        const headerData = pageHeadings[button.dataset.panel];
        document.getElementById('main-heading-title').textContent = headerData.title;
        document.getElementById('main-heading-desc').textContent = headerData.desc;
        document.getElementById('main-heading-icon').className = 'fas ' + headerData.icon;
        if (button.dataset.panel === 'sales-panel') renderSales();
        if (button.dataset.panel === 'orders-panel') cargarPedidosReales();
    }));

    // 3. CONEXIÓN A SUPABASE PARA PEDIDOS (KDS)
    async function cargarPedidosReales() {
        const { data, error } = await cliente
            .from('pedidos')
            .select(`
                id, cliente_nombre, cliente_telefono, tipo_entrega,
                direccion_entrega, metodo_pago, total, estado, creado_en,
                pedido_items ( cantidad, precio_unitario, productos ( nombre, imagen_url ) )
            `)
            .order('creado_en', { ascending: false });

        if (error) return console.error('Error al obtener pedidos de Supabase:', error);
        dbOrders = data;
        renderOrders();
    }

    // 4. SUSCRIPCIÓN EN TIEMPO REAL
    cliente.channel('kds-orders-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play().catch(e => console.log('Bloqueado auto-play de sonido.'));

            const toast = document.createElement('div');
            toast.className = 'kds-notification';
            toast.innerHTML = `
                <i class="fas fa-bell fa-shake" style="font-size: 2rem;"></i>
                <div>
                    <h4>¡Nuevo Pedido Recibido!</h4>
                    <p>Total: ${money(payload.new.total)} - Actualizando tabla...</p>
                </div>
            `;
            document.body.appendChild(toast);
            cargarPedidosReales();

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 400);
            }, 5000);
        }).subscribe();

    // 5. RENDERIZADO DE PEDIDOS (UI)
    function renderOrders() {
        const search = document.getElementById('order-search').value.toLowerCase();
        const activeFilter = document.querySelector('#orders-filters .filter-btn.active').dataset.filter;
        const tbody = document.getElementById('orders-rows');
        tbody.replaceChildren();
        let count = 0;
        
        dbOrders.forEach(sale => {
            const status = sale.estado || 'Pendiente de Validación';
            
            // FILTROS BLINDADOS
            if (activeFilter !== 'all') {
                if (activeFilter === 'Pendiente' && !(status === 'Pendiente de Validación' || status === 'Por Preparar')) return;
                if (activeFilter === 'En preparación' && status !== 'En Preparación') return;
                if (activeFilter === 'Enviado' && !(status === 'Enviado' || status === 'Listo para entregar')) return;
                if (activeFilter === 'Entregado' && status !== 'Entregado' && status !== 'Completado') return;
            }

            const orderId = String(sale.id);
            if (search && !orderId.includes(search)) return;
            count++;
            
            const dateObj = new Date(sale.creado_en);
            const dateStr = dateObj.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'});
            const timeStr = dateObj.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

            let productsHtml = '';
            if (sale.pedido_items && sale.pedido_items.length > 0) {
                 const firstItem = sale.pedido_items[0];
                 const moreCount = sale.pedido_items.length - 1;
                // Puente inteligente: Si no hay URL en la BD, busca localmente por el nombre
                const productName = firstItem.productos?.nombre || 'Producto Borrado';
                    let productImg = firstItem.productos?.imagen_url;

            if (!productImg) {
                const n = productName.toLowerCase();
                if (n.includes('crepa')) productImg = '../images/crepa.jpg';
                else if (n.includes('hot cake') || n.includes('hotcake')) productImg = '../images/mini_hotcakes.jpg';
                else if (n.includes('frappé')) productImg = '../images/frappe_oreo.jpg'; 
                else if (n.includes('fresa')) productImg = '../images/fresas_crema.jpg';
                else productImg = '../logo.png';
            }
                 
                 productsHtml = `<div style="display:flex; align-items:center; gap:0.6rem;">
                     <img src="${productImg}" class="admin-thumb" style="width:44px; height:44px; object-fit:cover;">
                     <div>
                         <div style="font-weight:600; font-size:.9rem; color:#4a3b32;">${escapeHTML(productName)}</div>
                         <div style="font-size:.8rem; color:#81747a;">${firstItem.cantidad} × ${money(firstItem.precio_unitario)} ${moreCount > 0 ? `<span style="background:#ffe7ed; color:#e95072; padding:.1rem .4rem; border-radius:9px; font-weight:600; font-size:.7rem; margin-left:.3rem;">+${moreCount} más</span>` : ''}</div>
                     </div>
                 </div>`;
            }
            
            // DICCIONARIO DE COLORES ACTUALIZADO
            const statusColors = {
                'Pendiente de Validación': {bg:'#fff5e6', text:'#d97706', icon:'fa-clock'},
                'Por Preparar': {bg:'#fff5e6', text:'#d97706', icon:'fa-clock'},
                'En Preparación': {bg:'#e0f2fe', text:'#0284c7', icon:'fa-fire-burner'},
                'Listo para entregar': {bg:'#ccfbf1', text:'#0f766e', icon:'fa-store'},
                'Enviado': {bg:'#dcfce7', text:'#16a34a', icon:'fa-truck'},
                'Entregado': {bg:'#f3e8ff', text:'#9333ea', icon:'fa-check-double'},
                'Completado': {bg:'#f3e8ff', text:'#9333ea', icon:'fa-check-double'}
            };
            const color = statusColors[status] || statusColors['Pendiente de Validación'];
            const statusBadge = `<span style="background:${color.bg}; color:${color.text}; padding:.35rem .75rem; border-radius:999px; font-size:.78rem; font-weight:700; display:inline-flex; align-items:center; gap:.4rem;"><i class="fas ${color.icon}"></i> ${status}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:700; color:#555;">#${orderId}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:.2rem;">
                        <span style="font-weight:600; font-size:.9rem;"><i class="far fa-user" style="color:#ffb3c1; width:16px;"></i> ${escapeHTML(sale.cliente_nombre || 'Cliente')}</span>
                        <span style="font-size:.85rem; color:#81747a;"><i class="fab fa-whatsapp" style="color:#ffb3c1; width:16px;"></i> ${escapeHTML(sale.cliente_telefono || 'N/A')}</span>
                    </div>
                </td>
                <td>${productsHtml}</td>
                <td style="font-weight:800; color:#443336;">${money(sale.total)}</td>
                <td>${statusBadge}</td>
                <td style="font-size:.85rem; color:#81747a;">${dateStr}<br>${timeStr}</td>
                <td>
                    <button class="row-actions-btn" data-id="${sale.id}"><i class="far fa-eye"></i> Ver detalle <i class="fas fa-chevron-right" style="font-size:.7rem; margin-left:.3rem;"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('orders-empty').hidden = count > 0;
        document.getElementById('orders-showing').textContent = `Mostrando ${count} pedidos`;
    }

    // 6. EVENTOS DE BÚSQUEDA Y FILTROS
    document.querySelectorAll('#orders-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#orders-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOrders();
        });
    });
    document.getElementById('order-search').addEventListener('input', renderOrders);

    // ==========================================
    // 7. MODAL DINÁMICO PARA DETALLES DE PEDIDO
    // ==========================================
    
    document.getElementById('orders-rows').addEventListener('click', (e) => {
        const btn = e.target.closest('.row-actions-btn');
        if (!btn) return;
        mostrarModalDetalle(btn.dataset.id);
    });

    function mostrarModalDetalle(id) {
        const pedido = dbOrders.find(p => String(p.id) === id);
        if (!pedido) return;

        const itemsHtml = pedido.pedido_items.map(item => {
            const nombreProd = item.productos?.nombre || 'Producto Fuera de Catálogo';
            const precioTotal = (item.precio_unitario || 0) * item.cantidad;
            return `
            <div style="display:flex; justify-content:space-between; border-bottom: 1px solid #f4e9ec; padding: 0.5rem 0;">
                <span style="color:#4a3b32;"><b>${item.cantidad}x</b> ${escapeHTML(nombreProd)}</span>
                <strong style="color:#8d3d54;">${money(precioTotal)}</strong>
            </div>`;
        }).join('');

        let direccionTexto = pedido.direccion_entrega || '';
        let notasCocinaHtml = '';
        
        if (direccionTexto.includes(' | NOTAS_COCINA:')) {
            const partes = direccionTexto.split(' | NOTAS_COCINA:');
            direccionTexto = partes[0]; 
            const notas = partes[1].split(' | '); 
            
            notasCocinaHtml = `
            <div style="background:#fff3cd; border-left: 4px solid #ffc107; padding:1rem; margin-bottom:1.5rem; border-radius: 8px;">
                <strong style="color:#856404; display:block; margin-bottom:0.5rem;"><i class="fas fa-exclamation-triangle"></i> Instrucciones Especiales:</strong>
                <ul style="margin:0; padding-left:1.2rem; color:#856404; font-size:0.9rem;">
                    ${notas.map(n => `<li>${escapeHTML(n)}</li>`).join('')}
                </ul>
            </div>`;
        }

        // === LÓGICA DE ESTADOS BLINDADA ===
        let botonesAccion = '';
        let siguienteEstado = '';
        let textoBoton = '';

        if (pedido.estado === 'Pendiente de Validación') {
            siguienteEstado = 'Por Preparar';
            textoBoton = 'Validar Pago y Preparar';
        } else if (pedido.estado === 'Por Preparar') {
            siguienteEstado = 'En Preparación';
            textoBoton = 'Comenzar a Preparar';
        } else if (pedido.estado === 'En Preparación') {
            siguienteEstado = pedido.tipo_entrega === 'A Domicilio' ? 'Enviado' : 'Listo para entregar';
            textoBoton = pedido.tipo_entrega === 'A Domicilio' ? 'Marcar como Enviado' : 'Marcar como Listo';
        } else if (pedido.estado === 'Enviado' || pedido.estado === 'Listo para entregar') {
            siguienteEstado = 'Entregado';
            textoBoton = 'Marcar como Entregado';
        }

        if (pedido.estado !== 'Entregado' && pedido.estado !== 'Completado' && pedido.estado !== 'Cancelado') {
            botonesAccion = `
                <div style="display:flex; gap: 1rem; margin-top:1.5rem;">
                    <button onclick="cerrarModalDetalle()" style="flex:1; padding: 1rem; font-size: 1rem; background:#fff5f8; color:#e95072; border:1px solid #ffccd8; border-radius:12px; cursor:pointer;">Cerrar</button>
                    <button onclick="avanzarEstadoPedido('${pedido.id}', '${siguienteEstado}')" style="flex:2; padding: 1rem; font-size: 1rem; background:#e95072; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">
                        ${textoBoton} <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            `;
        } else {
            botonesAccion = `
                <div style="margin-top:1.5rem;">
                    <button onclick="cerrarModalDetalle()" style="width:100%; padding: 1rem; font-size: 1.1rem; background:#2ecc71; color:white; border:none; border-radius:12px; cursor:pointer;"><i class="fas fa-check-double"></i> Pedido Finalizado</button>
                </div>
            `;
        }

        const modalHtml = `
        <div id="modal-detalle-pedido" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; justify-content:center; align-items:center; backdrop-filter: blur(3px); opacity: 0; transition: opacity 0.3s ease;">
            <div style="background:white; padding:2rem; border-radius:22px; max-width:550px; width:90%; max-height:85vh; overflow-y:auto; box-shadow: 0 15px 40px rgba(233,80,114,0.2); transform: translateY(20px); transition: transform 0.3s ease;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom: 2px solid #ffccd8; padding-bottom: 1rem;">
                    <div>
                        <h2 style="margin:0; color:#e95072; font-size: 1.5rem;"><i class="fas fa-receipt"></i> Pedido #${String(pedido.id)}</h2>
                        <span class="status-pill" style="margin-top: 0.5rem;">${pedido.estado}</span>
                    </div>
                    <button onclick="cerrarModalDetalle()" style="background:#fff5f8; border:none; width:35px; height:35px; border-radius:50%; color:#e95072; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center;"><i class="fas fa-times"></i></button>
                </div>

                <div style="background:#fffafb; padding:1rem; border-radius:12px; border:1px solid #f0dfe4; margin-bottom:1.5rem; color:#45333a; font-size:0.95rem; line-height: 1.6;">
                    <p style="margin:0;"><strong><i class="far fa-user"></i> Cliente:</strong> ${escapeHTML(pedido.cliente_nombre)}</p>
                    <p style="margin:0;"><strong><i class="fas fa-phone-alt"></i> Teléfono:</strong> ${escapeHTML(pedido.cliente_telefono)}</p>
                    <p style="margin:0;"><strong><i class="fas fa-motorcycle"></i> Modalidad:</strong> ${escapeHTML(pedido.tipo_entrega || 'No especificada')}</p>
                    ${(pedido.tipo_entrega !== 'Recoger en local' && direccionTexto) ? `<p style="margin:0;"><strong><i class="fas fa-map-marker-alt"></i> Dirección:</strong> ${escapeHTML(direccionTexto)}</p>` : ''}
                    <p style="margin:0;"><strong><i class="fas fa-wallet"></i> Pago:</strong> ${escapeHTML(pedido.metodo_pago || 'No especificado')}</p>
                </div>

                ${notasCocinaHtml}

                <h3 style="color:#4a3b32; font-size:1.1rem; margin-bottom:0.8rem;">Desglose del carrito</h3>
                <div style="margin-bottom:1.5rem;">
                    ${itemsHtml}
                </div>

                <div style="text-align:right; font-size:1.4rem; padding-top: 1rem; border-top: 2px solid #ffccd8; color:#e95072;">
                    <strong>Total a cobrar: ${money(pedido.total)}</strong>
                </div>

                ${botonesAccion}
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById('modal-detalle-pedido');
        setTimeout(() => {
            modalEl.style.opacity = '1';
            modalEl.children[0].style.transform = 'translateY(0)';
        }, 10);
    }

    window.cerrarModalDetalle = () => {
        const modalEl = document.getElementById('modal-detalle-pedido');
        if (modalEl) {
            modalEl.style.opacity = '0';
            modalEl.children[0].style.transform = 'translateY(20px)';
            setTimeout(() => modalEl.remove(), 300);
        }
    };

    window.avanzarEstadoPedido = async (id, nuevoEstado) => {
        try {
            const { error } = await cliente
                .from('pedidos')
                .update({ estado: nuevoEstado })
                .eq('id', id);

            if (error) throw error;
            
            const pedido = dbOrders.find(p => String(p.id) === String(id));
            if (pedido) pedido.estado = nuevoEstado;
            
            cerrarModalDetalle();
            renderOrders(); 
            
        } catch (err) {
            console.error("Error al actualizar el estado:", err);
            alert("No se pudo actualizar el estado: " + err.message);
        }
    };

    // ==========================================
    // MOCKS DE PRODUCTOS Y VENTAS
    // ==========================================
    // ==========================================
    // GESTOR DE CATÁLOGO (CONEXIÓN A NUBE Y STORAGE)
    // ==========================================
    const mapaCategorias = { 'postres': 1, 'snacks': 2, 'crepas': 3, 'bebidas': 5 };

    async function cargarProductosReales() {
        const { data: productos, error } = await cliente
            .from('productos')
            .select('*')
            .order('id', { ascending: false });

        if (error) return console.error('Error al cargar catálogo:', error);

        const tbody = document.getElementById('product-rows');
        tbody.replaceChildren();

        if (productos.length === 0) {
            document.getElementById('products-empty').hidden = false;
        } else {
            document.getElementById('products-empty').hidden = true;
            
            productos.forEach(prod => {
                const tr = document.createElement('tr');
                
                // PUENTE INTELIGENTE DE IMÁGENES
                let imgUrl = prod.imagen_url;
                if (!imgUrl) {
                    const nombreNorm = (prod.nombre || '').trim().toLowerCase();
                    const mapaAdmin = {
                        "fresas con crema": "../images/fresas_crema.jpg",
                        "mini hot cakes": "../images/mini_hotcakes.jpg",
                        "flan napolitano rebanada": "../images/flan_napolitano.jpg",
                        "flan napolitano": "../images/flan_napolitano.jpg",
                        "pastel imposible": "../images/pastel_imposible.jpg",
                        "ensalada de manzana": "../images/ensalada_manzana.jpg",
                        "gelatina con crema": "../images/gelatina_crema.jpg",
                        "uvas con crema": "../images/uvas_crema.jpg",
                        "arroz con leche": "../images/arroz_leche.jpg",
                        "crepas dulces": "../images/crepa.jpg"
                    };
                    
                    imgUrl = mapaAdmin[nombreNorm];
                    
                    // Si no está en el mapa exacto, buscamos por palabra clave
                    if (!imgUrl) {
                        if (nombreNorm.includes('frappé')) imgUrl = '../images/frappe_oreo.jpg';
                        else if (nombreNorm.includes('eskimo')) imgUrl = '../images/fresas_crema.jpg';
                        else imgUrl = '../logo.png';
                    }
                }
                
                // Mapeo inverso de ID a Texto
                let catNombre = 'Otro';
                if(prod.categoria_id === 1) catNombre = 'Postres';
                if(prod.categoria_id === 2) catNombre = 'Snacks';
                if(prod.categoria_id === 3) catNombre = 'Crepas';
                if(prod.categoria_id === 5) catNombre = 'Bebidas';

                tr.innerHTML = `
                    <td><img class="admin-thumb" src="${imgUrl}" alt="foto" style="width:44px; height:44px; object-fit:cover; border-radius:6px;"></td>
                    <td style="font-weight:600; color:#4a3b32;">${escapeHTML(prod.nombre)}</td>
                    <td>${catNombre}</td>
                    <td>${money(prod.precio)}</td>
                    <td><span class="status-pill">Disponible</span></td>
                    <td>
                        <button onclick="eliminarProducto(${prod.id})" style="background:none; border:none; color:#e95072; cursor:pointer;" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    // Función global para eliminar desde la tabla
    window.eliminarProducto = async (id) => {
        if(!confirm('¿Seguro que deseas eliminar este producto permanentemente?')) return;
        const { error } = await cliente.from('productos').delete().eq('id', id);
        if (error) alert("Error al eliminar: " + error.message);
        else cargarProductosReales();
    };

    // Lógica del Formulario: Subida de Foto e Inserción
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = form.querySelector('button[type="submit"]');
            const catInput = document.getElementById('product-category').value;
            const nameInput = document.getElementById('product-name').value.trim();
            const descInput = document.getElementById('product-description').value.trim();
            const priceInput = parseFloat(document.getElementById('product-price').value);
            const fileInput = document.getElementById('product-image');

            if (!fileInput.files || fileInput.files.length === 0) {
                return alert("Por favor selecciona una fotografía.");
            }

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo imagen...';

            try {
                // 1. Subir Imagen al Storage
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `catalogo/${Date.now()}_${nameInput.replace(/\s+/g, '_').toLowerCase()}.${fileExt}`;
                
                const { error: uploadError } = await cliente.storage
                    .from('menu-imagenes')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando datos...';

                // 2. Obtener la URL pública de la foto
                const { data: urlData } = cliente.storage
                    .from('menu-imagenes')
                    .getPublicUrl(fileName);

                // 3. Insertar el producto en la tabla
                const { error: dbError } = await cliente
                    .from('productos')
                    .insert([{
                        nombre: nameInput,
                        descripcion: descInput,
                        precio: priceInput,
                        categoria_id: mapaCategorias[catInput] || 1,
                        imagen_url: urlData.publicUrl,
                        es_temporada: false
                    }]);

                if (dbError) throw dbError;

                alert("¡Producto agregado a tu tienda exitosamente!");
                form.reset();
                cargarProductosReales(); // Recargar la tabla con el nuevo producto

            } catch (err) {
                console.error(err);
                alert("Ocurrió un error: " + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-plus"></i> Agregar producto';
            }
        });
    }
    function renderSales() {
        const fromDate = document.getElementById('sales-from').value;
        const toDate = document.getElementById('sales-to').value;
        
        // 1. Filtramos pedidos válidos (ignoramos Cancelados y Pendientes de pago)
        let ventasValidas = dbOrders.filter(o => o.estado !== 'Cancelado' && o.estado !== 'Pendiente de Validación');

        // 2. Aplicamos filtros de calendario si el usuario los seleccionó
        if (fromDate) {
            const fDate = new Date(fromDate);
            fDate.setHours(0,0,0,0);
            ventasValidas = ventasValidas.filter(o => new Date(o.creado_en) >= fDate);
        }
        if (toDate) {
            const tDate = new Date(toDate);
            tDate.setHours(23,59,59,999);
            ventasValidas = ventasValidas.filter(o => new Date(o.creado_en) <= tDate);
        }

        // 3. Variables matemáticas
        let totalIngresos = 0;
        let totalUnidades = 0;
        const productosVendidos = {};

        // 4. Extraemos el dinero y las cantidades
        ventasValidas.forEach(pedido => {
            totalIngresos += pedido.total || 0;
            
            if (pedido.pedido_items) {
                pedido.pedido_items.forEach(item => {
                    const cant = item.cantidad || 1;
                    totalUnidades += cant;
                    
                    const nombre = item.productos?.nombre || 'Borrado del catálogo';
                    if (!productosVendidos[nombre]) productosVendidos[nombre] = { unidades: 0, ingresos: 0 };
                    
                    productosVendidos[nombre].unidades += cant;
                    productosVendidos[nombre].ingresos += (cant * (item.precio_unitario || 0));
                });
            }
        });

        // 5. Inyectamos totales al HTML
        document.getElementById('sales-total').textContent = money(totalIngresos);
        document.getElementById('sales-count').textContent = ventasValidas.length;
        document.getElementById('sales-units').textContent = totalUnidades;

        // 6. Construimos la tabla de productos más vendidos
        const tbody = document.getElementById('sales-product-rows');
        tbody.replaceChildren();

        const prodArray = Object.keys(productosVendidos).map(k => ({ nombre: k, ...productosVendidos[k] }));
        prodArray.sort((a, b) => b.unidades - a.unidades); // Los más vendidos arriba

        if (prodArray.length > 0) {
            document.getElementById('sales-products-empty').hidden = true;
            prodArray.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${escapeHTML(p.nombre)}</td><td>${p.unidades}</td><td><strong style="color:#8d3d54;">${money(p.ingresos)}</strong></td>`;
                tbody.appendChild(tr);
            });
        } else {
            document.getElementById('sales-products-empty').hidden = false;
        }
    }

    // Escuchamos el botón "Ver periodo" para ejecutar el cálculo
    const btnFilter = document.getElementById('apply-sales-filter');
    if (btnFilter) btnFilter.addEventListener('click', renderSales);
    
    // Autocompletar el calendario con el mes actual por defecto para vista rápida
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const inputFrom = document.getElementById('sales-from');
    const inputTo = document.getElementById('sales-to');
    
    if (inputFrom && inputTo) {
        // Asigna el día 1 del mes actual y el día de hoy a los inputs
        inputFrom.value = primerDia.toISOString().split('T')[0];
        inputTo.value = hoy.toISOString().split('T')[0];
    }

    // Carga inicial
    cargarProductosReales();
    cargarPedidosReales();
})();