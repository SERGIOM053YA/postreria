(() => {
    // 1. INICIALIZAR SUPABASE
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';


    let dbOrders = [];
    window.catalogoGlobal = []; 
    
    const money = value => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(value || 0);
    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
    const form = document.getElementById('product-form');

    // 2. NAVEGACIÓN
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


    // 3. LECTURA DUAL DE PEDIDOS
    async function cargarPedidosReales() {
        try {
            const res = await fetch('http://localhost:3000/api/pedidos');
            if (res.ok) {
                dbOrders = await res.json();
                renderOrders();
            } else {
                console.error("Error al cargar pedidos:", res.statusText);
            }
        } catch(e) {
            console.error("Servidor local inalcanzable", e);
        }
    }

    // Refresco automático
    setInterval(cargarPedidosReales, 10000);

    // 4. SUSCRIPCIÓN EN TIEMPO REAL
    cliente.channel('kds-orders-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
            cargarPedidosReales();
        }).subscribe();

    // 5. RENDERIZADO DE PEDIDOS Y PUENTE DE IMÁGENES
    function renderOrders() {
        const search = document.getElementById('order-search').value.toLowerCase();
        const activeFilter = document.querySelector('#orders-filters .filter-btn.active').dataset.filter;
        const tbody = document.getElementById('orders-rows');
        tbody.replaceChildren();
        let count = 0;
        
        dbOrders.forEach(sale => {
            const status = sale.estado || 'Pendiente de Validación';
            
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
                 const productName = firstItem.productos?.nombre || 'Producto Múltiple';
                 let productImg = firstItem.productos?.imagen_url;

                // Diccionario de imágenes blindado
                if (!productImg) {
                    const n = productName.toLowerCase();
                    if (n.includes('crepa')) productImg = '../images/crepa.jpg';
                    else if (n.includes('hot cake') || n.includes('hotcake')) productImg = '../images/mini_hotcakes.jpg';
                    else if (n.includes('frappé') || n.includes('frappe')) productImg = '../images/frappe_oreo.jpg'; 
                    else if (n.includes('fresa') || n.includes('eskimo')) productImg = '../images/fresas_crema.jpg';
                    else if (n.includes('alita')) productImg = '../images/alitas.jpg';
                    else if (n.includes('boneless')) productImg = '../images/boneless.jpg';
                    else if (n.includes('flan')) productImg = '../images/flan_napolitano.jpg';
                    else if (n.includes('imposible')) productImg = '../images/pastel_imposible.jpg';
                    else if (n.includes('manzana')) productImg = '../images/ensalada_manzana.jpg';
                    else if (n.includes('gelatina')) productImg = '../images/gelatina_crema.jpg';
                    else if (n.includes('uva')) productImg = '../images/uvas_crema.jpg';
                    else if (n.includes('arroz')) productImg = '../images/arroz_leche.jpg';
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
            
            // Etiqueta visual para diferenciar si es orden de nube o de emergencia
            const dbBadge = sale.es_emergencia ? `<i class="fas fa-server" style="color:#d97706;" title="Respaldo Local"></i>` : `<i class="fas fa-cloud" style="color:#0284c7;" title="Nube Oficial"></i>`;
            const statusBadge = `<span style="background:${color.bg}; color:${color.text}; padding:.35rem .75rem; border-radius:999px; font-size:.78rem; font-weight:700; display:inline-flex; align-items:center; gap:.4rem;"><i class="fas ${color.icon}"></i> ${status}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:700; color:#555;">${dbBadge} #${orderId}</td>
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
                    <button class="row-actions-btn" data-id="${sale.id}"><i class="far fa-eye"></i> Ver detalle</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('orders-empty').hidden = count > 0;
        document.getElementById('orders-showing').textContent = `Mostrando ${count} pedidos`;
    }

    document.querySelectorAll('#orders-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#orders-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOrders();
        });
    });
    document.getElementById('order-search').addEventListener('input', renderOrders);

    // 6. MODAL DINÁMICO
    document.getElementById('orders-rows').addEventListener('click', (e) => {
        const btn = e.target.closest('.row-actions-btn');
        if (!btn) return;
        mostrarModalDetalle(btn.dataset.id);
    });

    function mostrarModalDetalle(id) {
        const pedido = dbOrders.find(p => String(p.id) === id);
        if (!pedido) return;

        const itemsHtml = pedido.pedido_items.map(item => {
            const nombreProd = item.productos?.nombre || 'Producto Múltiple';
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
                <strong style="color:#856404; display:block; margin-bottom:0.5rem;"><i class="fas fa-exclamation-triangle"></i> Instrucciones:</strong>
                <ul style="margin:0; padding-left:1.2rem; color:#856404; font-size:0.9rem;">
                    ${notas.map(n => `<li>${escapeHTML(n)}</li>`).join('')}
                </ul>
            </div>`;
        }

        let botonesAccion = '';
        let siguienteEstado = '';
        let textoBoton = '';

        if (pedido.estado === 'Pendiente de Validación') { siguienteEstado = 'Por Preparar'; textoBoton = 'Validar Pago'; } 
        else if (pedido.estado === 'Por Preparar') { siguienteEstado = 'En Preparación'; textoBoton = 'Comenzar a Preparar'; } 
        else if (pedido.estado === 'En Preparación') {
            siguienteEstado = pedido.tipo_entrega === 'A Domicilio' ? 'Enviado' : 'Listo para entregar';
            textoBoton = pedido.tipo_entrega === 'A Domicilio' ? 'Marcar como Enviado' : 'Marcar como Listo';
        } else if (pedido.estado === 'Enviado' || pedido.estado === 'Listo para entregar') {
            siguienteEstado = 'Entregado'; textoBoton = 'Marcar como Entregado';
        }

        if (pedido.estado !== 'Entregado' && pedido.estado !== 'Completado' && pedido.estado !== 'Cancelado') {
            botonesAccion = `
                <div style="display:flex; gap: 1rem; margin-top:1.5rem;">
                    <button onclick="cerrarModalDetalle()" style="flex:1; padding: 1rem; background:#fff5f8; color:#e95072; border:1px solid #ffccd8; border-radius:12px; cursor:pointer;">Cerrar</button>
                    <button onclick="avanzarEstadoPedido('${pedido.id}', '${siguienteEstado}')" style="flex:2; padding: 1rem; background:#e95072; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">
                        ${textoBoton} <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            `;
        } else {
            botonesAccion = `<div style="margin-top:1.5rem;"><button onclick="cerrarModalDetalle()" style="width:100%; padding: 1rem; background:#2ecc71; color:white; border:none; border-radius:12px; cursor:pointer;"><i class="fas fa-check-double"></i> Pedido Finalizado</button></div>`;
        }

        const modalHtml = `
        <div id="modal-detalle-pedido" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; padding:2rem; border-radius:22px; max-width:550px; width:90%; max-height:85vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom: 2px solid #ffccd8; padding-bottom: 1rem;">
                    <h2 style="margin:0; color:#e95072;"><i class="fas fa-receipt"></i> Pedido #${String(pedido.id)}</h2>
                    <button onclick="cerrarModalDetalle()" style="background:none; border:none; color:#e95072; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div style="background:#fffafb; padding:1rem; border-radius:12px; border:1px solid #f0dfe4; margin-bottom:1.5rem;">
                    <p><strong><i class="far fa-user"></i> Cliente:</strong> ${escapeHTML(pedido.cliente_nombre)}</p>
                    <p><strong><i class="fas fa-phone-alt"></i> Teléfono:</strong> ${escapeHTML(pedido.cliente_telefono)}</p>
                    <p><strong><i class="fas fa-motorcycle"></i> Modalidad:</strong> ${escapeHTML(pedido.tipo_entrega)}</p>
                    <p><strong><i class="fas fa-wallet"></i> Pago:</strong> ${escapeHTML(pedido.metodo_pago)}</p>
                </div>
                ${notasCocinaHtml}
                <h3 style="color:#4a3b32; font-size:1.1rem; margin-bottom:0.8rem;">Desglose</h3>
                <div style="margin-bottom:1.5rem;">${itemsHtml}</div>
                <div style="text-align:right; font-size:1.4rem; border-top: 2px solid #ffccd8; padding-top:1rem; color:#e95072;">
                    <strong>Total: ${money(pedido.total)}</strong>
                </div>
                ${botonesAccion}
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    window.cerrarModalDetalle = () => {
        const modalEl = document.getElementById('modal-detalle-pedido');
        if (modalEl) modalEl.remove();
    };

    // 7. AVANCE DUAL DE ESTADOS
    window.avanzarEstadoPedido = async (id, nuevoEstado) => {
        try {
            const pedido = dbOrders.find(p => String(p.id) === String(id));
            if (!pedido) return;

            const res = await fetch(`http://localhost:3000/api/pedidos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!res.ok) throw new Error("Fallo al actualizar en el servidor");
            
            pedido.estado = nuevoEstado;
            cerrarModalDetalle();
            renderOrders(); 
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    // 8. CARGA DE CATÁLOGO Y VENTAS
    async function cargarProductosReales() {
        const { data: productos, error } = await cliente.from('productos').select('*').order('id', { ascending: false });
        if (error) return;

        window.catalogoGlobal = productos; // Respaldo global para mapear los pedidos de emergencia

        const tbody = document.getElementById('product-rows');
        tbody.replaceChildren();

        if (productos.length === 0) {
            document.getElementById('products-empty').hidden = false;
        } else {
            document.getElementById('products-empty').hidden = true;
            productos.forEach(prod => {
                const tr = document.createElement('tr');
                let imgUrl = prod.imagen_url;
                if (!imgUrl) {
                    const n = (prod.nombre || '').trim().toLowerCase();
                    if (n.includes('crepa')) imgUrl = '../images/crepa.jpg';
                    else if (n.includes('hot cake') || n.includes('hotcake')) imgUrl = '../images/mini_hotcakes.jpg';
                    else if (n.includes('frappé') || n.includes('frappe')) imgUrl = '../images/frappe_oreo.jpg'; 
                    else if (n.includes('fresa') || n.includes('eskimo')) imgUrl = '../images/fresas_crema.jpg';
                    else if (n.includes('alita')) imgUrl = '../images/alitas.jpg';
                    else if (n.includes('boneless')) imgUrl = '../images/boneless.jpg';
                    else if (n.includes('flan')) imgUrl = '../images/flan_napolitano.jpg';
                    else if (n.includes('imposible')) imgUrl = '../images/pastel_imposible.jpg';
                    else if (n.includes('manzana')) imgUrl = '../images/ensalada_manzana.jpg';
                    else if (n.includes('gelatina')) imgUrl = '../images/gelatina_crema.jpg';
                    else if (n.includes('uva')) imgUrl = '../images/uvas_crema.jpg';
                    else if (n.includes('arroz')) imgUrl = '../images/arroz_leche.jpg';
                    else imgUrl = '../logo.png';
                }
                
                let catNombre = {1:'Postres', 2:'Snacks', 3:'Crepas', 5:'Bebidas'}[prod.categoria_id] || 'Otro';

                tr.innerHTML = `
                    <td><img src="${imgUrl}" style="width:44px; height:44px; object-fit:cover; border-radius:6px;"></td>
                    <td style="font-weight:600; color:#4a3b32;">${escapeHTML(prod.nombre)}</td>
                    <td>${catNombre}</td>
                    <td>${money(prod.precio)}</td>
                    <td><span class="status-pill">Disponible</span></td>
                    <td><button onclick="eliminarProducto(${prod.id})" style="background:none; border:none; color:#e95072; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    window.eliminarProducto = async (id) => {
        if(!confirm('¿Seguro que deseas eliminar este producto?')) return;
        const { error } = await cliente.from('productos').delete().eq('id', id);
        if (error) alert("Error: " + error.message);
        else cargarProductosReales();
    };

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = form.querySelector('button[type="submit"]');
            const fileInput = document.getElementById('product-image');
            if (!fileInput.files || fileInput.files.length === 0) return alert("Selecciona una fotografía.");
            
            btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';

            try {
                const file = fileInput.files[0];
                const fileName = `catalogo/${Date.now()}_${file.name}`;
                const { error: uploadError } = await cliente.storage.from('menu-imagenes').upload(fileName, file);
                if (uploadError) throw uploadError;

                const { data: urlData } = cliente.storage.from('menu-imagenes').getPublicUrl(fileName);
                const { error: dbError } = await cliente.from('productos').insert([{
                    nombre: document.getElementById('product-name').value.trim(),
                    descripcion: document.getElementById('product-description').value.trim(),
                    precio: parseFloat(document.getElementById('product-price').value),
                    categoria_id: { 'postres': 1, 'snacks': 2, 'crepas': 3, 'bebidas': 5 }[document.getElementById('product-category').value] || 1,
                    imagen_url: urlData.publicUrl,
                    es_temporada: false
                }]);

                if (dbError) throw dbError;
                alert("¡Producto agregado!");
                form.reset();
                cargarProductosReales(); 
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-plus"></i> Agregar producto';
            }
        });
    }

    function renderSales() {
        const fromDate = document.getElementById('sales-from').value;
        const toDate = document.getElementById('sales-to').value;
        
        let ventasValidas = dbOrders.filter(o => o.estado !== 'Cancelado' && o.estado !== 'Pendiente de Validación');
        if (fromDate) { const fDate = new Date(fromDate); fDate.setHours(0,0,0,0); ventasValidas = ventasValidas.filter(o => new Date(o.creado_en) >= fDate); }
        if (toDate) { const tDate = new Date(toDate); tDate.setHours(23,59,59,999); ventasValidas = ventasValidas.filter(o => new Date(o.creado_en) <= tDate); }

        let totalIngresos = 0, totalUnidades = 0; const productosVendidos = {};
        ventasValidas.forEach(pedido => {
            totalIngresos += pedido.total || 0;
            if (pedido.pedido_items) {
                pedido.pedido_items.forEach(item => {
                    const cant = item.cantidad || 1; totalUnidades += cant;
                    const nombre = item.productos?.nombre || 'Borrado';
                    if (!productosVendidos[nombre]) productosVendidos[nombre] = { unidades: 0, ingresos: 0 };
                    productosVendidos[nombre].unidades += cant;
                    productosVendidos[nombre].ingresos += (cant * (item.precio_unitario || 0));
                });
            }
        });

        document.getElementById('sales-total').textContent = money(totalIngresos);
        document.getElementById('sales-count').textContent = ventasValidas.length;
        document.getElementById('sales-units').textContent = totalUnidades;

        const tbody = document.getElementById('sales-product-rows');
        tbody.replaceChildren();
        const prodArray = Object.keys(productosVendidos).map(k => ({ nombre: k, ...productosVendidos[k] })).sort((a, b) => b.unidades - a.unidades);

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

    const btnFilter = document.getElementById('apply-sales-filter');
    if(btnFilter) btnFilter.addEventListener('click', renderSales);
    
    const hoy = new Date();
    const inputFrom = document.getElementById('sales-from'), inputTo = document.getElementById('sales-to');
    if (inputFrom && inputTo) {
        inputFrom.value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        inputTo.value = hoy.toISOString().split('T')[0];
    }
    
    // Carga inicial secuencial para asegurar que el catálogo esté listo antes de pintar los pedidos de emergencia
    async function init() {
        await cargarProductosReales();
        await cargarPedidosReales();
    }
    init();
})();