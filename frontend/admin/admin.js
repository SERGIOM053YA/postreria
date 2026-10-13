(() => {
    let dbOrders = [];
    window.catalogoGlobal = []; 
    
    const money = value => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(value || 0);
    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
    const form = document.getElementById('product-form');
// ==========================================
// 1. ESCUDO DE SEGURIDAD ESTRICTO
// ==========================================
const token = localStorage.getItem('sb_access_token');
const email = localStorage.getItem('sb_user_email');

if (!token || !email || email.toLowerCase() !== 'admin@reposteria.com') {
    alert('⛔ Acceso denegado. Esta es un área exclusiva para personal autorizado.');
    window.location.replace('../index.html'); 
    
    // ESTA LÍNEA ES LA CLAVE: Detiene en seco la ejecución de JavaScript
    throw new Error("Ejecución detenida por seguridad: Usuario anónimo."); 
}

// 2. SI EL USUARIO APRUEBA, SE ENCIENDE LA PÁGINA
document.body.style.display = 'block';

// CONTROL MAESTRO DE LA TIENDA (Botón en Navegación)
const masterSwitchBtn = document.getElementById('master-store-switch-btn');
const masterStatusText = document.getElementById('master-status-text');
const masterStoreIcon = document.getElementById('master-store-icon');
let tiendaAbierta = true; // Estado inicial

if (masterSwitchBtn) {
    // 1. Leer estado actual al cargar el admin
    fetch('../../api/configuracion.php') // <-- CAMBIO CLAVE: Agregamos un ../ extra
        .then(res => res.json())
        .then(data => {
            tiendaAbierta = data.abierta;
            actualizarBotonTienda(tiendaAbierta);
        })
        .catch(err => console.error("Error al leer configuración:", err));

    // 2. Enviar cambio al hacer clic en el botón
    masterSwitchBtn.addEventListener('click', async () => {
        tiendaAbierta = !tiendaAbierta; // Invertir estado
        actualizarBotonTienda(tiendaAbierta);
        
        try {
            await fetch('../../api/configuracion.php', { // <-- CAMBIO CLAVE: Agregamos un ../ extra
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ abierta: tiendaAbierta })
            });
        } catch(e) {
            console.error("Error guardando el estado:", e);
        }
    });
}

// 3. Cambiar estilos del botón dinámicamente
function actualizarBotonTienda(abierta) {
    if (abierta) {
        masterStatusText.textContent = 'Abierto';
        masterStoreIcon.className = 'fas fa-store';
        masterSwitchBtn.style.background = '#dcfce7'; // Fondo verde pastel
        masterSwitchBtn.style.color = '#16a34a';      // Texto verde oscuro
        masterSwitchBtn.style.borderColor = '#bbf7d0';
    } else {
        masterStatusText.textContent = 'Cerrado';
        masterStoreIcon.className = 'fas fa-store-slash';
        masterSwitchBtn.style.background = '#fee2e2'; // Fondo rojo pastel
        masterSwitchBtn.style.color = '#dc2626';      // Texto rojo oscuro
        masterSwitchBtn.style.borderColor = '#fecaca';
    }
}

// ==========================================
// 3. INICIALIZACIÓN DEL MAPA Y PEDIDOS
// ==========================================
// (Todo tu código de Leaflet, carga de postres y KDS va de aquí hacia abajo)

    // 1. NAVEGACIÓN Y TÍTULOS (CORREGIDO)
    const pageHeadings = {
        'products-panel': { title:'Productos', desc:'Gestiona el catálogo y disponibilidad de tu tienda', icon:'fa-box' },
        'sales-panel': { title:'Ganancias', desc:'Resumen de ventas e ingresos del negocio', icon:'fa-chart-line' },
        'orders-panel': { title:'Pedidos', desc:'Gestiona los pedidos de tu tienda', icon:'fa-clipboard-list' },
        'delivery-zone-panel': { title:'Zona de entrega', desc:'Configura las zonas de cobertura para entregas', icon:'fa-map-marked-alt' }
    };
    
    document.querySelectorAll('.admin-nav button').forEach(button => button.addEventListener('click', () => {
        document.querySelectorAll('.admin-nav button').forEach(item => item.classList.toggle('active', item === button));
        document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.toggle('active', panel.id === button.dataset.panel));
        
        const headerData = pageHeadings[button.dataset.panel];
        if(headerData) {
            document.getElementById('main-heading-title').textContent = headerData.title;
            document.getElementById('main-heading-desc').textContent = headerData.desc;
            document.getElementById('main-heading-icon').className = 'fas ' + headerData.icon;
        }

        if (button.dataset.panel === 'sales-panel') renderSales();
        if (button.dataset.panel === 'orders-panel') cargarPedidosReales();
        if (button.dataset.panel === 'delivery-zone-panel' && typeof window.initDeliveryZone === 'function') window.initDeliveryZone();
    }));

    // 2. LECTURA DE PEDIDOS DESDE PHP
    async function cargarPedidosReales() {
        try {
            const tokenLocal = localStorage.getItem('sb_access_token');
            const res = await fetch('../../api/pedidos.php', {
                headers: { 'Authorization': `Bearer ${tokenLocal}` }
            });
            
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

    setInterval(cargarPedidosReales, 10000);

    // 3. RENDERIZADO DE PEDIDOS Y MODAL
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
            
            const dateObj = new Date(sale.creado_en || sale.created_at || new Date());
            const dateStr = dateObj.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'});
            const timeStr = dateObj.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

            let productsHtml = '';
            if (sale.pedido_items && sale.pedido_items.length > 0) {
                 const firstItem = sale.pedido_items[0];
                 const moreCount = sale.pedido_items.length - 1;
                 const productName = firstItem.productos?.nombre || firstItem.nombre || 'Producto Múltiple';
                 let productImg = firstItem.productos?.imagen_url;

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
            
            const dbBadge = `<i class="fas fa-server" style="color:#0284c7;" title="PHP Backend"></i>`;
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

    document.getElementById('orders-rows').addEventListener('click', (e) => {
        const btn = e.target.closest('.row-actions-btn');
        if (!btn) return;
        mostrarModalDetalle(btn.dataset.id);
    });

    window.verComprobante = function(url, btn) {
        if(url) {
            window.open(url, '_blank');
        } else {
            alert("No hay comprobante adjunto.");
        }
    };

    function mostrarModalDetalle(id) {
        const pedido = dbOrders.find(p => String(p.id) === id);
        if (!pedido) return;

        const safeItems = pedido.pedido_items || [];
        let notasArray = []; 
        
        const itemsHtml = safeItems.map(item => {
            const nombreProd = item.productos?.nombre || item.nombre || 'Producto Múltiple';
            const precioTotal = (item.precio_unitario || 0) * item.cantidad;
            
            const extraInfo = item.detalles || item.instrucciones || item.nota || '';
            
            if (extraInfo) {
                let infoLimpia = escapeHTML(extraInfo);
                
                let notaTexto = '';
                if (infoLimpia.match(/\|\s*Nota:|Nota:|\+\s*Nota:/i)) {
                    let partesNota = infoLimpia.split(/\|\s*Nota:|Nota:|\+\s*Nota:/i);
                    infoLimpia = partesNota[0]; 
                    notaTexto = partesNota[1].trim(); 
                }

                let extrasTexto = '';
                if (infoLimpia.match(/\+\s*Extras:|\|\s*Extras:|Extras:/i)) {
                    let partesExtra = infoLimpia.split(/\+\s*Extras:|\|\s*Extras:|Extras:/i);
                    infoLimpia = partesExtra[0]; 
                    extrasTexto = partesExtra[1].trim(); 
                }

                infoLimpia = infoLimpia.replace(/Base:\s*/gi, '')
                                       .replace(/Fruta:\s*/gi, '')
                                       .replace(/Topping:\s*/gi, '')
                                       .replace(/Salsa:\s*/gi, '');

                let listaBase = infoLimpia.split(/,\s*|\|\s*/)
                                          .filter(i => i.trim() !== '')
                                          .map(i => `<li style="margin-bottom: 4px;">${i.trim()}</li>`)
                                          .join('');

                let htmlFinal = `<ul style="margin-top: 8px; margin-bottom: 12px; padding-left: 24px; color: #1e7e34; list-style-type: disc;">${listaBase}</ul>`;

                if (extrasTexto) {
                    let listaExtras = extrasTexto.split(/,\s*|\|\s*/)
                                                 .filter(i => i.trim() !== '')
                                                 .map(i => `<li style="margin-bottom: 4px;">${i.trim()}</li>`)
                                                 .join('');
                    htmlFinal += `
                        <div style="margin-top: 12px; color: #155d27; font-size: 0.95rem;"><strong>Ingredientes Extra:</strong></div>
                        <ul style="margin-top: 8px; margin-bottom: 12px; padding-left: 24px; color: #1e7e34; list-style-type: disc;">
                            ${listaExtras}
                        </ul>
                    `;
                }

                if (notaTexto) {
                    htmlFinal += `
                        <div style="margin-top: 12px; color: #155d27; font-size: 0.95rem; background: rgba(255,255,255,0.6); padding: 8px; border-radius: 6px; border-left: 3px solid #20b85a;">
                            <strong>Nota del cliente:</strong> <span style="font-style: italic;">"${notaTexto}"</span>
                        </div>
                    `;
                }

                notasArray.push(`
                    <div style="margin-bottom: 1.8rem; background: transparent;">
                        <strong style="font-size: 1.1rem; display: block; margin-bottom: 0.6rem; color: #155d27; border-bottom: 2px dashed #85d89d; padding-bottom: 6px;">
                            <i class="fas fa-utensils"></i> ${item.cantidad}x ${escapeHTML(nombreProd)}
                        </strong>
                        <div style="line-height: 1.4; font-weight: 500;">
                            ${htmlFinal}
                        </div>
                    </div>
                `);
            }

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
            const notasViejas = partes[1].split(' | '); 
            
            if (notasArray.length === 0) {
                notasViejas.forEach(n => {
                    notasArray.push(`
                        <div style="margin-bottom: 1.2rem;">
                            <div style="padding-left: 12px; border-left: 3px solid #85d89d; line-height: 1.6; color: #1e7e34; font-weight: 500;">
                                ${escapeHTML(n)}
                            </div>
                        </div>
                    `);
                }); 
            }
        }

        if (notasArray.length > 0) {
            notasCocinaHtml = `
            <div style="background:#e6f6ec; border-left: 5px solid #20b85a; padding:1.5rem; margin-bottom:1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <strong style="color:#155d27; display:block; margin-bottom:1.2rem; font-size: 1.15rem; text-transform: uppercase; letter-spacing: 0.5px;">
                    <i class="fas fa-clipboard-list"></i> Instrucciones de Cocina
                </strong>
                <div style="font-size: 1rem;">
                    ${notasArray.join('')}
                </div>
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
                    <button onclick="cerrarModalDetalle()" style="flex:1; padding: 1rem; background:#fff5f8; color:#e95072; border:1px solid #ffccd8; border-radius:12px; cursor:pointer; font-weight:600;">Cerrar</button>
                    <button onclick="avanzarEstadoPedido('${pedido.id}', '${siguienteEstado}')" style="flex:2; padding: 1rem; background:#e95072; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:bold; font-size:1.05rem;">
                        ${textoBoton} <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            `;
        } else {
            botonesAccion = `<div style="margin-top:1.5rem;"><button onclick="cerrarModalDetalle()" style="width:100%; padding: 1rem; background:#2ecc71; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:bold; font-size:1.05rem;"><i class="fas fa-check-double"></i> Pedido Finalizado</button></div>`;
        }

        let textoCambioHtml = '';
        if (pedido.billete_cambio) {
            if (pedido.billete_cambio === 'Pago exacto') {
                textoCambioHtml = `<br><span style="color:#159447; font-size:0.95rem; margin-left: 1.5rem; font-weight: 600;"><i class="fas fa-check-circle"></i> Cliente trae el pago exacto</span>`;
            } else if (pedido.billete_cambio.includes('Cambio de:')) {
                const billeteMatch = pedido.billete_cambio.match(/\d+/);
                const billeteNum = billeteMatch ? parseFloat(billeteMatch[0]) : 0;
                const totalOrden = parseFloat(pedido.total) || 0;
                if (billeteNum > totalOrden) {
                    const cambioADar = billeteNum - totalOrden;
                    textoCambioHtml = `<br>
                    <span style="color:#d93d5c; font-size:0.95rem; margin-left: 1.5rem; font-weight: 600;">
                        👉 Paga con: $${billeteNum.toFixed(2)} 
                        <span style="color:#ccc; margin: 0 6px;">|</span> 
                        <span style="color:#159447; background:#e6f6ec; padding:3px 8px; border-radius:6px; border:1px solid #85d89d;">
                            <i class="fas fa-hand-holding-usd"></i> Dar cambio: $${cambioADar.toFixed(2)}
                        </span>
                    </span>`;
                } else {
                    textoCambioHtml = `<br><span style="color:#d93d5c; font-size:0.95rem; margin-left: 1.5rem; font-weight: 600;">👉 ${escapeHTML(pedido.billete_cambio)}</span>`;
                }
            } else {
                textoCambioHtml = `<br><span style="color:#d93d5c; font-size:0.95rem; margin-left: 1.5rem; font-weight: 600;">👉 ${escapeHTML(pedido.billete_cambio)}</span>`;
            }
        }

        const modalHtml = `
        <div id="modal-detalle-pedido" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; justify-content:center; align-items:center;">
            <div style="background:white; padding:2rem; border-radius:22px; max-width:600px; width:90%; max-height:85vh; overflow-y:auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom: 2px solid #ffccd8; padding-bottom: 1rem;">
                    <h2 style="margin:0; color:#e95072; font-size:1.5rem;"><i class="fas fa-receipt"></i> Pedido #${String(pedido.id)}</h2>
                    <button onclick="cerrarModalDetalle()" style="background:none; border:none; color:#e95072; font-size:1.4rem; cursor:pointer; transition:transform 0.2s;"><i class="fas fa-times"></i></button>
                </div>
                <div style="background:#fffafb; padding:1.2rem; border-radius:12px; border:1px solid #f0dfe4; margin-bottom:1.5rem; font-size:0.95rem; line-height:1.6;">
                    <p style="margin:0 0 8px 0;"><strong><i class="far fa-user"></i> Cliente:</strong> ${escapeHTML(pedido.cliente_nombre)}</p>
                    <p style="margin:0 0 8px 0;"><strong><i class="fas fa-phone-alt"></i> Teléfono:</strong> ${escapeHTML(pedido.cliente_telefono)}</p>
                    <p style="margin:0 0 8px 0;"><strong><i class="fas fa-motorcycle"></i> Modalidad:</strong> ${escapeHTML(pedido.tipo_entrega)}</p>
                    <p style="margin:0 0 8px 0;">
                        <strong><i class="fas fa-wallet"></i> Pago:</strong> ${escapeHTML(pedido.metodo_pago)}
                        ${textoCambioHtml}
                    </p>
                    ${pedido.comprobante_url ? `
                    <div style="margin: 8px 0 8px 1.5rem;">
                        <button onclick="verComprobante('${pedido.comprobante_url}', this)" style="background: #20b85a; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <i class="fas fa-file-invoice-dollar"></i> Ver comprobante
                        </button>
                    </div>` : ''}
                    <p style="margin:0;"><strong><i class="fas fa-map-pin"></i> Destino:</strong> ${escapeHTML(direccionTexto)}</p>
                </div>
                
                ${notasCocinaHtml}
                
                <h3 style="color:#4a3b32; font-size:1.2rem; margin-bottom:1rem; border-bottom:1px solid #f4e9ec; padding-bottom:0.5rem;">Desglose Final</h3>
                <div style="margin-bottom:1.5rem; font-size:1rem;">${itemsHtml}</div>
                <div style="text-align:right; font-size:1.5rem; border-top: 2px solid #ffccd8; padding-top:1.2rem; color:#e95072;">
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

    window.avanzarEstadoPedido = async (id, nuevoEstado) => {
        try {
            const pedido = dbOrders.find(p => String(p.id) === String(id));
            if (!pedido) return;

            const tokenLocal = localStorage.getItem('sb_access_token');
            const res = await fetch(`../../api/pedidos.php?id=${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenLocal}` 
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            
            if (!res.ok) throw new Error("Fallo al actualizar el estado en el servidor PHP");
            
            pedido.estado = nuevoEstado;
            cerrarModalDetalle();
            renderOrders(); 
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    async function cargarProductosReales() {
        try {
            const res = await fetch('../../api/productos.php');
            if (!res.ok) throw new Error("Error al cargar productos"); 
            const productos = await res.json();
            
            window.catalogoGlobal = productos; 

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
                        else if (n.includes('eskimo')) imgUrl = '../images/fresas_crema.jpg'; // O la imagen que uses para eskimos
                        else if (n.includes('alita')) imgUrl = '../images/alitas.jpg';
                        else if (n.includes('boneless')) imgUrl = '../images/boneless.jpg';
                        else if (n.includes('elote')) imgUrl = '../images/elotes.jpg';
                        else if (n.includes('esquite')) imgUrl = '../images/esquites.jpg';
                        else if (n.includes('papas')) imgUrl = '../images/papas.jpg';
                        else imgUrl = '../logo.png';
                    }
                    
                    let catNombre = {1:'Postres', 2:'Snacks', 3:'Crepas', 5:'Bebidas'}[prod.categoria_id] || 'Otro';

                    const estaDisponible = prod.disponible !== false; 
                    const toggleChecked = estaDisponible ? 'checked' : '';
                    const toggleText = estaDisponible ? 'Disponible' : 'Agotado';
                    const textColor = estaDisponible ? '#20b85a' : '#81747a';

                    tr.innerHTML = `
                        <td><img class="admin-thumb" src="${imgUrl}" alt="foto" style="width:44px; height:44px; object-fit:cover; border-radius:6px;"></td>
                        <td style="font-weight:600; color:#4a3b32;">${escapeHTML(prod.nombre)}</td>
                        <td>${catNombre}</td>
                        <td>${money(prod.precio)}</td>
                        <td>
                            <div class="toggle-container">
                                <label class="toggle-switch">
                                    <input type="checkbox" onchange="toggleDisponibilidad(${prod.id}, ${estaDisponible})" ${toggleChecked}>
                                    <span class="toggle-slider"></span>
                                </label>
                                <span class="toggle-label" style="color: ${textColor};">${toggleText}</span>
                            </div>
                        </td>
                        <td class="row-actions">
                            <button type="button" class="delete" onclick="eliminarProducto(${prod.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (err) {
            console.error(err);
        }
    }

    window.toggleDisponibilidad = async (id, estadoActual) => {
        try {
            const tokenLocal = localStorage.getItem('sb_access_token');
            const nuevoEstado = !estadoActual; 

            const res = await fetch(`../../api/productos.php?id=${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenLocal}`
                },
                body: JSON.stringify({ disponible: nuevoEstado })
            });

            if (!res.ok) throw new Error("No se pudo actualizar la disponibilidad");
            cargarProductosReales(); 
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    window.eliminarProducto = async (id) => {
        if(!confirm('¿Seguro que deseas eliminar este producto?')) return;
        try {
            const tokenLocal = localStorage.getItem('sb_access_token');
            const res = await fetch(`../../api/productos.php?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tokenLocal}` }
            });
            if (!res.ok) throw new Error("No se pudo eliminar");
            cargarProductosReales();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    document.getElementById('product-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        btnSubmit.disabled = true;

        const formData = new FormData(e.target);

        try {
            const tokenLocal = localStorage.getItem('sb_access_token');
            if (!tokenLocal) throw new Error("Sesión expirada. Inicia sesión nuevamente.");

            const response = await fetch('../../api/productos.php', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tokenLocal}` },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al procesar el producto');

            alert('✅ Producto agregado al catálogo exitosamente.');
            e.target.reset(); 
            
            const fileLabel = document.getElementById('file-label');
            if (fileLabel) {
                fileLabel.classList.remove('has-file');
                fileLabel.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Haz clic para elegir una imagen</span>';
            }
            cargarProductosReales();
        } catch (error) {
            console.error("Error al subir producto:", error);
            alert('❌ Falló la subida: ' + error.message);
        } finally {
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
        }
    });

    document.getElementById('product-image')?.addEventListener('change', function() {
        const label = document.getElementById('file-label');
        if (this.files && this.files.length > 0) {
            label.innerHTML = `<i class="fas fa-check-circle"></i><span>${this.files[0].name}</span>`;
            label.classList.add('has-file');
        } else {
            label.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><span>Haz clic para elegir una imagen</span>`;
            label.classList.remove('has-file');
        }
    });

    function renderSales() {
        const fromDate = document.getElementById('sales-from').value;
        const toDate = document.getElementById('sales-to').value;
        
        let ventasValidas = dbOrders.filter(o => o.estado !== 'Cancelado' && o.estado !== 'Pendiente de Validación');
        if (fromDate) { const fDate = new Date(fromDate); fDate.setHours(0,0,0,0); ventasValidas = ventasValidas.filter(o => new Date(o.creado_en || o.created_at) >= fDate); }
        if (toDate) { const tDate = new Date(toDate); tDate.setHours(23,59,59,999); ventasValidas = ventasValidas.filter(o => new Date(o.creado_en || o.created_at) <= tDate); }

        let totalIngresos = 0, totalUnidades = 0; const productosVendidos = {};
        ventasValidas.forEach(pedido => {
            totalIngresos += pedido.total || 0;
            if (pedido.pedido_items) {
                pedido.pedido_items.forEach(item => {
                    const cant = item.cantidad || 1; totalUnidades += cant;
                    const nombre = item.productos?.nombre || item.nombre || 'Borrado';
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
    
    async function init() {
        await cargarProductosReales();
        await cargarPedidosReales();
    }
    init();
    
    // ==========================================
        // MÓDULO AISLADO: ZONA DE ENTREGA, MAPA Y COBERTURA
        // ==========================================
        (() => {
            let map = null;
            let centerMarker = null;
            let radiusCircle = null;
            let zoneInitialized = false;
            
           // 1. Memoria de configuración con nacimiento en Francisco Villa 8 (Coordenadas exactas)
            let config = JSON.parse(localStorage.getItem('hilda_delivery_zones')) || { 
                center: { lat: 19.623194, lng: -99.059361 }, 
                address: 'Calle Francisco Villa 8, entre Chapultepec y cerrada de Benito Juárez, Guadalupe Victoria, 55010 Ecatepec de Morelos, Méx.',
                radius: 1,      
                enabled: true   
            };

            function updateMap() {
                if (!map) return;
                map.setView([config.center.lat, config.center.lng], 15);
                
                if (centerMarker) map.removeLayer(centerMarker);
                if (radiusCircle) map.removeLayer(radiusCircle);
                
                const shopIcon = L.divIcon({
                    html: '<div style="background:#e04868;width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 12px rgba(224,72,104,0.4);"></div>',
                    iconSize: [24, 24], iconAnchor: [12, 12]
                });
                
                centerMarker = L.marker([config.center.lat, config.center.lng], { icon: shopIcon })
                    .addTo(map).bindPopup(`<b>📍 Origen de entregas</b><br>${config.address}`).openPopup();

                radiusCircle = L.circle([config.center.lat, config.center.lng], {
                    color: '#e04868',
                    fillColor: '#f05473',
                    fillOpacity: 0.15,
                    radius: config.radius * 1000 
                }).addTo(map);

                const addrInput = document.getElementById('zone-center-address');
                if (addrInput) addrInput.value = config.address;
            }

            document.querySelector('[data-panel="delivery-zone-panel"]')?.addEventListener('click', () => {
                if (!zoneInitialized) {
                    zoneInitialized = true;
                    setTimeout(() => {
                        const container = document.getElementById('delivery-map');
                        if (!container) return;
                        
                        map = L.map(container).setView([config.center.lat, config.center.lng], 15);
                        
                        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                            attribution: '&copy; Esri',
                            maxZoom: 19
                        }).addTo(map);
                        
                        updateMap();
                        
                        const toggleInput = document.getElementById('zone-enabled');
                        const radiusInput = document.getElementById('zone-radius');
                        const radiusLabel = document.getElementById('zone-radius-label');
                        const statusBadge = document.getElementById('zone-status-badge');
                        
                        if(toggleInput) toggleInput.checked = config.enabled;
                        if(radiusInput) radiusInput.value = config.radius;
                        if(radiusLabel) radiusLabel.textContent = config.radius + ' km';
                        if(statusBadge) {
                            statusBadge.textContent = config.enabled ? 'Activo' : 'Inactivo';
                            statusBadge.className = 'zone-status ' + (config.enabled ? 'active' : 'inactive');
                        }
                    }, 200);
                } else {
                    setTimeout(() => { if (map) map.invalidateSize(); }, 200);
                }
            });

            // Control del interruptor general
            document.getElementById('zone-enabled')?.addEventListener('change', (e) => {
                config.enabled = e.target.checked;
                const badge = document.getElementById('zone-status-badge');
                if (badge) {
                    badge.textContent = config.enabled ? 'Activo' : 'Inactivo';
                    badge.className = 'zone-status ' + (config.enabled ? 'active' : 'inactive');
                }
                localStorage.setItem('hilda_delivery_zones', JSON.stringify(config));
            });

            // Control del margen de cobertura
            document.getElementById('zone-radius')?.addEventListener('input', (e) => {
                config.radius = parseFloat(e.target.value);
                const label = document.getElementById('zone-radius-label');
                if (label) label.textContent = config.radius + ' km';
                if (radiusCircle) radiusCircle.setRadius(config.radius * 1000);
                localStorage.setItem('hilda_delivery_zones', JSON.stringify(config));
            });

            // Ubicación Dinámica (GPS o Buscador Manual)
            document.getElementById('zone-locate-btn')?.addEventListener('click', async () => {
                const addrInput = document.getElementById('zone-center-address');
                const addr = addrInput ? addrInput.value.trim() : '';
                const btn = document.getElementById('zone-locate-btn');
                
                if (!addr) {
                    if (!navigator.geolocation) return alert('Tu navegador no soporta GPS.');
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            config.center = { lat: position.coords.latitude, lng: position.coords.longitude };
                            config.address = "Ubicación detectada por GPS";
                            updateMap();
                            localStorage.setItem('hilda_delivery_zones', JSON.stringify(config));
                            btn.innerHTML = '<i class="fas fa-crosshairs"></i> Ubicar';
                        },
                        (error) => {
                            alert('Error de GPS. Verifica tus permisos.');
                            btn.innerHTML = '<i class="fas fa-crosshairs"></i> Ubicar';
                        },
                        { enableHighAccuracy: true }
                    );
                    return;
                }

                try {
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
                    const data = await res.json();
                    if (data.length) {
                        config.center = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                        config.address = addr;
                        updateMap();
                        localStorage.setItem('hilda_delivery_zones', JSON.stringify(config));
                    } else {
                        alert('Dirección no encontrada.');
                    }
                } catch (err) {
                    alert('Error de red.');
                } finally {
                    btn.innerHTML = '<i class="fas fa-crosshairs"></i> Ubicar';
                }
            });
        })();

})();