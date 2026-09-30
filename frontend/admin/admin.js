(() => {
    // 1. INICIALIZAR SUPABASE
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8';
    const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Arreglo global para almacenar los pedidos de la base de datos
    let dbOrders = [];

    // Claves de LocalStorage (Temporales para Productos y Ganancias)
    const PRODUCTS_KEY = 'hilda_custom_products';
    const SALES_KEY = 'hilda_sales';
    const CATALOG_KEY = 'hilda_catalog_status';
    
    // Catálogo Base Simulado (Mantendremos esto intacto hasta conectar la fase de Productos)
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
        // Al entrar al panel de pedidos, cargamos datos frescos de la BD
        if (button.dataset.panel === 'orders-panel') cargarPedidosReales();
    }));

    // 3. CONEXIÓN A SUPABASE PARA PEDIDOS (KDS)
    async function cargarPedidosReales() {
        const { data, error } = await cliente
            .from('pedidos')
            .select(`
                id,
                cliente_nombre,
                cliente_telefono,
                tipo_entrega,
                direccion_entrega,
                metodo_pago,
                total,
                estado,
                creado_en,
                pedido_items (
                    cantidad,
                    precio_unitario,
                    productos (
                        nombre,
                        imagen_url
                    )
                )
            `)
            .order('creado_en', { ascending: false });

        if (error) {
            console.error('Error al obtener pedidos de Supabase:', error);
            return;
        }

        dbOrders = data;
        renderOrders();
    }

    // 4. SUSCRIPCIÓN EN TIEMPO REAL (WebSockets con Alerta UI)
    cliente.channel('kds-orders-channel')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'pedidos' },
            (payload) => {
                console.log('¡Nuevo pedido entrante!', payload);
                
                // 1. Reproducir sonido de alerta
                const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                audio.play().catch(e => console.log('El navegador bloqueó el autoplay del sonido.', e));

                // 2. Crear notificación visual flotante
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

                // 3. Descargar los datos nuevos para actualizar la tabla
                cargarPedidosReales();

                // 4. Desaparecer la alerta después de 5 segundos
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(100%)';
                    toast.style.transition = 'all 0.4s ease';
                    setTimeout(() => toast.remove(), 400);
                }, 5000);
            }
        )
        .subscribe();

    // 5. RENDERIZADO DE PEDIDOS (UI)
    function renderOrders() {
        const search = document.getElementById('order-search').value.toLowerCase();
        const activeFilter = document.querySelector('#orders-filters .filter-btn.active').dataset.filter;
        const tbody = document.getElementById('orders-rows');
        tbody.replaceChildren();
        let count = 0;
        
        dbOrders.forEach(sale => {
            const status = sale.estado || 'Pendiente de Validación';
            
            // Adaptar los filtros del HTML a los estados reales de la base de datos
            if (activeFilter !== 'all') {
                if (activeFilter === 'Pendiente' && !(status === 'Pendiente de Validación' || status === 'Por Preparar')) return;
                if (activeFilter === 'En preparación' && status !== 'En Preparación') return;
                if (activeFilter === 'Enviado' && status !== 'Enviado') return;
                if (activeFilter === 'Completado' && status !== 'Completado') return;
            }

            const orderId = String(sale.id);
            if (search && !orderId.includes(search)) return;
            count++;
            
            const tr = document.createElement('tr');
            
            const dateObj = new Date(sale.creado_en);
            const dateStr = dateObj.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'});
            const timeStr = dateObj.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

            // Construir visualmente los productos extraídos del JOIN
            let productsHtml = '';
            if (sale.pedido_items && sale.pedido_items.length > 0) {
                 const firstItem = sale.pedido_items[0];
                 const moreCount = sale.pedido_items.length - 1;
                 const productName = firstItem.productos?.nombre || 'Producto Borrado';
                 const productImg = firstItem.productos?.imagen_url || '../logo.png';
                 
                 productsHtml = `<div style="display:flex; align-items:center; gap:0.6rem;">
                     <img src="${productImg}" class="admin-thumb" style="width:44px; height:44px; object-fit:cover;">
                     <div>
                         <div style="font-weight:600; font-size:.9rem; color:#4a3b32;">${escapeHTML(productName)}</div>
                         <div style="font-size:.8rem; color:#81747a;">${firstItem.cantidad} × ${money(firstItem.precio_unitario)} ${moreCount > 0 ? `<span style="background:#ffe7ed; color:#e95072; padding:.1rem .4rem; border-radius:9px; font-weight:600; font-size:.7rem; margin-left:.3rem;">+${moreCount} más</span>` : ''}</div>
                     </div>
                 </div>`;
            }
            
            // Colores por estados operativos reales
            const statusColors = {
                'Pendiente de Validación': {bg:'#fff5e6', text:'#d97706', icon:'fa-clock'},
                'Por Preparar': {bg:'#fff5e6', text:'#d97706', icon:'fa-clock'},
                'En Preparación': {bg:'#e0f2fe', text:'#0284c7', icon:'fa-fire-burner'},
                'Enviado': {bg:'#dcfce7', text:'#16a34a', icon:'fa-truck'},
                'Completado': {bg:'#f3e8ff', text:'#9333ea', icon:'fa-check-circle'}
            };
            const color = statusColors[status] || statusColors['Pendiente de Validación'];
            const statusBadge = `<span style="background:${color.bg}; color:${color.text}; padding:.35rem .75rem; border-radius:999px; font-size:.78rem; font-weight:700; display:inline-flex; align-items:center; gap:.4rem;"><i class="fas ${color.icon}"></i> ${status}</span>`;

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
        
        const pedidoId = btn.dataset.id;
        mostrarModalDetalle(pedidoId);
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

        // === EXTRAER NOTAS Y DIRECCIÓN ===
        let direccionTexto = pedido.direccion_entrega || '';
        let notasCocinaHtml = '';
        
        if (direccionTexto.includes(' | NOTAS_COCINA:')) {
            const partes = direccionTexto.split(' | NOTAS_COCINA:');
            direccionTexto = partes[0]; // La dirección real y notas de pago se quedan aquí
            const notas = partes[1].split(' | '); // Separar cada ingrediente extra
            
            // Inyectamos un recuadro de advertencia para el cocinero
            notasCocinaHtml = `
            <div style="background:#fff3cd; border-left: 4px solid #ffc107; padding:1rem; margin-bottom:1.5rem; border-radius: 8px;">
                <strong style="color:#856404; display:block; margin-bottom:0.5rem;"><i class="fas fa-exclamation-triangle"></i> Instrucciones Especiales:</strong>
                <ul style="margin:0; padding-left:1.2rem; color:#856404; font-size:0.9rem;">
                    ${notas.map(n => `<li>${escapeHTML(n)}</li>`).join('')}
                </ul>
            </div>`;
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

                <div style="margin-top:1.5rem;">
                    <button onclick="cerrarModalDetalle()" class="admin-button primary" style="width:100%; padding: 1rem; font-size: 1.1rem;"><i class="fas fa-check"></i> Entendido</button>
                </div>
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


    // Función global para cerrar el modal
    window.cerrarModalDetalle = () => {
        const modalEl = document.getElementById('modal-detalle-pedido');
        if (modalEl) {
            modalEl.style.opacity = '0';
            modalEl.children[0].style.transform = 'translateY(20px)';
            setTimeout(() => modalEl.remove(), 300);
        }
    };
    // ==========================================
    // MOCKS DE PRODUCTOS Y VENTAS (Pendiente Fase 2)
    // ==========================================
    function renderProducts() {
        const overrides = read(CATALOG_KEY, {});
        const products = [
            ...catalog.filter(product => !overrides[product.id]?.deleted).map(product => ({ ...product, available: overrides[product.id]?.available !== false })),
            ...read(PRODUCTS_KEY)
        ];
        rows.replaceChildren();
        document.getElementById('products-empty').hidden = products.length > 0;
        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><img class="admin-thumb" src="${escapeHTML(product.image)}" alt=""></td><td>${escapeHTML(product.name)}</td><td>${escapeHTML(product.categoryLabel)}</td><td>${money(Number(product.price))}</td><td><span class="status-pill ${product.available ? '' : 'off'}">${product.available ? 'Disponible' : 'Agotado'}</span></td><td><div class="row-actions"><button type="button" data-action="toggle" data-id="${escapeHTML(product.id)}" data-builtin="${Boolean(product.builtin)}">${product.available ? 'Marcar agotado' : 'Habilitar'}</button><button type="button" class="delete" data-action="delete" data-id="${escapeHTML(product.id)}" data-builtin="${Boolean(product.builtin)}" aria-label="Eliminar ${escapeHTML(product.name)}"><i class="fas fa-trash"></i></button></div></td>`;
            rows.appendChild(tr);
        });
    }

    form.addEventListener('submit', event => { /* Lógica simulada de productos */ event.preventDefault(); });
    rows.addEventListener('click', event => { /* Lógica simulada de productos */ });

    function renderSales() { /* Lógica simulada de ventas */ }
    document.getElementById('sales-group').addEventListener('change', renderSales);
    
    // Carga inicial
    renderProducts();
    cargarPedidosReales();
})();