document.addEventListener('DOMContentLoaded', async () => {
    const ordersList = document.getElementById('orders-list');
    const userEmail = localStorage.getItem('sb_user_email');
    const tokenLocal = localStorage.getItem('sb_access_token');

    const formatMoney = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    const escapeHTML = str => { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; };

    // 1. Validar si hay sesión iniciada
    if (!userEmail || !tokenLocal) {
        ordersList.innerHTML = `
            <div class="no-orders">
                <i class="far fa-user-circle"></i>
                <h3>Inicia sesión</h3>
                <p>Necesitamos saber quién eres para mostrarte tus pedidos.</p>
                <a href="../Login/login.html" style="display:inline-block; margin-top:1rem; padding:10px 20px; background:#ff6b81; color:white; text-decoration:none; border-radius:20px; font-weight:bold;">Ir a Iniciar Sesión</a>
            </div>`;
        return;
    }

    // Tu nombre de usuario es la parte antes del @ (ej: sergio.mendoza.plascencia)
    const nombreCliente = userEmail.split('@')[0].toLowerCase();

    try {
        // 2. Traer todos los pedidos desde tu API PHP
        const response = await fetch('../../api/pedidos.php', {
            headers: { 'Authorization': `Bearer ${tokenLocal}` }
        });
        
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        const pedidosDB = await response.json();

        // 3. Filtrar solo los pedidos de ESTE cliente
        const misPedidos = pedidosDB.filter(p => p.cliente_nombre && p.cliente_nombre.toLowerCase() === nombreCliente);

        if (misPedidos.length === 0) {
            ordersList.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-box-open"></i>
                    <h3>Aún no tienes pedidos</h3>
                    <p>¡Anímate a probar nuestros deliciosos postres hoy mismo!</p>
                    <a href="../inicio.html" style="display:inline-block; margin-top:1rem; padding:10px 20px; background:#ff6b81; color:white; text-decoration:none; border-radius:20px; font-weight:bold;">Ir a la tienda</a>
                </div>`;
            return;
        }

        // 4. Dibujar las tarjetas usando el HTML del diseño
        let htmlFinal = '';

        misPedidos.forEach(pedido => {
            // Formatear Fecha
            const dateObj = new Date(pedido.creado_en);
            const fechaStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} - ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            // Formatear Métodos de Pago y Estatus
            const isCash = pedido.metodo_pago === 'Efectivo';
            const badgeClass = isCash ? 'payment-cash' : 'payment-transfer';
            const badgeIcon = isCash ? 'fa-money-bill-wave' : 'fa-university';

            // Mapear los productos dentro del pedido
            let itemsHtml = '';
            const safeItems = pedido.pedido_items || [];
            
            safeItems.forEach(item => {
                const nombreProd = item.productos?.nombre || item.nombre || 'Producto Múltiple';
                const precioSubtotal = (item.precio_unitario || 0) * item.cantidad;
                const notaHTML = item.detalles ? `<div class="item-comment"><i class="far fa-comment-dots"></i> ${escapeHTML(item.detalles)}</div>` : '';

                itemsHtml += `
                <li class="order-item">
                    <div class="item-details">
                        <div class="item-name">${item.cantidad}x ${escapeHTML(nombreProd)}</div>
                        ${notaHTML}
                    </div>
                    <div class="item-price">${formatMoney(precioSubtotal)}</div>
                </li>`;
            });

            // Ensamblar la Tarjeta Completa
            htmlFinal += `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id-group">
                        <span class="order-id">#PED-${pedido.id}</span>
                        <span class="order-date"><i class="far fa-calendar-alt"></i> ${fechaStr}</span>
                        <span class="order-status">${escapeHTML(pedido.estado)}</span>
                    </div>
                    <span class="payment-badge ${badgeClass}">
                        <i class="fas ${badgeIcon}"></i> ${escapeHTML(pedido.metodo_pago)}
                    </span>
                </div>
                
                <div class="order-body">
                    <ul class="order-items-list">
                        ${itemsHtml}
                    </ul>
                </div>

                <div class="order-footer">
                    <span class="total-label">Total pagado</span>
                    <span class="total-amount">${formatMoney(pedido.total)}</span>
                </div>
            </div>`;
        });

        ordersList.innerHTML = htmlFinal;

    } catch (error) {
        ordersList.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-exclamation-triangle" style="color: #ffcc00;"></i>
                <h3>Error de conexión</h3>
                <p>No pudimos cargar tus pedidos en este momento.</p>
            </div>`;
        console.error(error);
    }
});