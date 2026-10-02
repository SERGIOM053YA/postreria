document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar Supabase LIMPIO (Sin inyectar el token local para evitar Error 403)

    const tokenLocal = localStorage.getItem('sb_access_token');
    const userEmail = localStorage.getItem('sb_user_email');

    // 2. Traer Nombre del Usuario logueado (Desde caché local, no desde Supabase)
    const inputNombre = document.getElementById('recipient');
    if (userEmail && inputNombre && !inputNombre.value) {
        inputNombre.value = userEmail.split('@')[0];
    }

    // 3. Restringir teléfono (refuerzo JS)
    const inputPhone = document.getElementById('phone');
    if (inputPhone) {
        inputPhone.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }

    // 4. Renderizar Resumen y Calcular Total
    const CART_KEY = 'hilda_shopping_cart';
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const form = document.getElementById('shipping-form');
    const formatMoney = value => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(value);
    const orderItems = document.getElementById('order-items');
    
    const total = cart.reduce((sum, item) => sum + (parseFloat(String(item.price).replace(/[^0-9.]/g,'')) || 0) * (Number(item.quantity) || 1), 0);
    const totalEl = document.getElementById('order-total');
    if (totalEl) totalEl.textContent = formatMoney(total);
    
    if (cart.length && orderItems) {
        cart.forEach(item => {
            const row = document.createElement('div'); row.className = 'order-item';
            const description = item.desc || '';
            const instructions = item.instructions ? ` · ${item.instructions}` : '';
            const name = document.createElement('span'); name.textContent = `${item.name} × ${item.quantity || 1}`;
            const price = document.createElement('strong');
            price.textContent = formatMoney((parseFloat(String(item.price).replace(/[^0-9.]/g,'')) || 0) * (Number(item.quantity) || 1));
            const details = document.createElement('small'); details.textContent = description + instructions;
            row.append(name, price); row.appendChild(details); orderItems.appendChild(row);
        });
    } else if (orderItems) {
        orderItems.innerHTML = '<p class="empty-order">Tu carrito está vacío.</p>';
        if (form) {
            const btnSubmit = form.querySelector('button[type="submit"]');
            if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.style.opacity = '.55'; }
        }
    }

   // 5. Interacción de Opciones de Entrega (A Domicilio vs Local)
    const addressFields = document.getElementById('address-fields');
    const inputAddress = document.getElementById('address');
    const inputReference = document.getElementById('reference');
    const phoneField = document.getElementById('phone-field');

    const toggleDeliveryFields = () => {
        const isDomicilio = document.getElementById('radio-domicilio').checked;
        if (isDomicilio) {
            if (addressFields) addressFields.style.display = 'grid';
            if (phoneField) phoneField.style.display = 'flex';
            if (inputAddress) inputAddress.required = true;
            if (inputReference) inputReference.required = true;
            if (inputPhone) inputPhone.required = true;
        } else {
            if (addressFields) addressFields.style.display = 'none';
            if (phoneField) phoneField.style.display = 'none';
            if (inputAddress) inputAddress.required = false;
            if (inputReference) inputReference.required = false;
            if (inputPhone) inputPhone.required = false;
        }
    };

    document.querySelectorAll('input[name="deliveryType"]').forEach(input => {
        input.addEventListener('change', toggleDeliveryFields);
    });

    toggleDeliveryFields();

    // 6. Lógica Estricta de Pago (Billetes y Montos)
    const radioEfectivo = document.getElementById('radio-efectivo');
    const radioTransferencia = document.getElementById('radio-transferencia');
    const warningHighAmount = document.getElementById('high-amount-warning');
    const selectChangeFor = document.getElementById('change-for');
    const cashOptions = document.getElementById('cash-options');
    const transferDetails = document.getElementById('transfer-details');
    const changeField = document.getElementById('change-field');

    if (total > 500) {
        if(radioEfectivo) radioEfectivo.disabled = true;
        if(radioTransferencia) radioTransferencia.checked = true;
        if(warningHighAmount) warningHighAmount.style.display = 'block';
        if(transferDetails) transferDetails.style.display = 'block';
        if(cashOptions) cashOptions.style.display = 'none';
    }

    if (selectChangeFor) {
        selectChangeFor.innerHTML = '<option value="">Selecciona un billete</option>';
        const billetesOficiales = [20, 50, 100, 200, 500];
        
        billetesOficiales.forEach(billete => {
            if (billete > total) {
                if (total <= 100 && billete > 200) return;
                if (total > 100 && total <= 400 && billete > 500) return;
                
                const option = document.createElement('option');
                option.value = `$${billete}`;
                option.textContent = `Billete de $${billete}`;
                selectChangeFor.appendChild(option);
            }
        });
    }

    document.querySelectorAll('input[name="payment"]').forEach(input => input.addEventListener('change', (e) => {
        if (e.target.value === 'Efectivo') {
            cashOptions.style.display = 'block';
            transferDetails.style.display = 'none';
        } else {
            cashOptions.style.display = 'none';
            transferDetails.style.display = 'block';
            changeField.style.display = 'none';
            if (selectChangeFor) { selectChangeFor.required = false; selectChangeFor.value = ""; }
        }
    }));
    
    document.querySelectorAll('input[name="cashMode"]').forEach(input => input.addEventListener('change', (e) => {
        if (e.target.value === 'Necesito cambio') {
            changeField.style.display = 'block';
            if(selectChangeFor) selectChangeFor.required = true;
        } else {
            changeField.style.display = 'none';
            if(selectChangeFor) { selectChangeFor.required = false; selectChangeFor.value = ""; }
        }
    }));

    // 7. Lógica de Envío Centralizada Hacia Backend Node.js
    if (form) {
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (!cart.length || total <= 0) return;
            
            const btnSubmit = form.querySelector('button[type="submit"]');
            let formMessage = document.getElementById('form-message');
            btnSubmit.disabled = true;

            const isDomicilio = document.getElementById('radio-domicilio').checked;

            const procesarOrdenBaseDatos = async (lat, lon, dirCompleta) => {
                const data = new FormData(form);
                const paymentMethod = data.get('payment');
                const deliveryType = isDomicilio ? 'A Domicilio' : 'Recoger en local';
                const notasPago = paymentMethod === 'Efectivo' && data.get('cashMode') === 'Necesito cambio' 
                                  ? `Cambio de: ${data.get('changeFor')}` : '';

                // Validación limpia contra catálogo Supabase
                const catResponse = await fetch('http://localhost:3000/api/productos');
                const dbProductos = await catResponse.json();
                
                let errorDeCatalogo = false;
                let nombresFaltantes = [];
                let itemsListos = [];
                let detallesPreparacion = []; 

                for (let item of cart) {
                    let idFirme = item.producto_id;
                    let precioFirme = parseFloat(String(item.price).replace(/[^0-9.]/g,'')) || 0;
                    
                    if (item.desc || item.instructions) {
                        detallesPreparacion.push(`${item.quantity}x ${item.name}: ${item.desc || ''} ${item.instructions || ''}`.trim());
                    }

                    if (dbProductos) {
                        const nombreCarrito = superClean(item.name);
                        const match = dbProductos.find(p => superClean(p.nombre) === nombreCarrito || superClean(p.nombre).includes(nombreCarrito) || nombreCarrito.includes(superClean(p.nombre)));
                        
                        if (match) {
                            idFirme = match.id;
                            precioFirme = precioFirme > match.precio ? precioFirme : match.precio; 
                        } else {
                            errorDeCatalogo = true;
                            nombresFaltantes.push(item.name);
                        }
                    }

                    itemsListos.push({
                        producto_id: idFirme,
                        cantidad: item.quantity,
                        precio_unitario: precioFirme,
                        instrucciones: item.instructions || item.desc || ''
                    });
                }

                if (errorDeCatalogo) {
                    alert("⚠️ Productos no encontrados en base de datos:\n\n- " + nombresFaltantes.join("\n- "));
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = 'Confirmar pedido';
                    return; 
                }

                const notasCocina = detallesPreparacion.length > 0 ? ` | NOTAS_COCINA: ${detallesPreparacion.join(' | ')}` : '';

                // === ENVÍO AL BACKEND LOCAL DE EMERGENCIA ===
                const payload = {
                    cliente_nombre: data.get('recipient'),
                    cliente_telefono: isDomicilio ? data.get('phone') : 'No aplica',
                    tipo_entrega: deliveryType,
                    metodo_pago: paymentMethod,
                    direccion_entrega: dirCompleta + (notasPago ? ` | Notas de pago: ${notasPago}` : '') + notasCocina,
                    latitud: lat,
                    longitud: lon,
                    items: itemsListos
                };

                try {
                    const response = await fetch('http://localhost:3000/api/pedidos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${tokenLocal}` // Enviamos la credencial al backend
                        },
                        body: JSON.stringify(payload)
                    });

                    const responseData = await response.json();

                    if (!response.ok) {
                        throw new Error(responseData.error || 'Error al enviar pedido');
                    }

                    const nuevoPedidoId = responseData.id_orden || responseData.id_emergencia || Math.floor(Math.random() * 10000);

                    localStorage.removeItem(CART_KEY);
                    
                    if (paymentMethod === 'Transferencia') {
                        const whatsappLink = document.getElementById('success-whatsapp-link');
                        if (whatsappLink) {
                            whatsappLink.href = `https://wa.me/5512345678?text=Hola, acabo de realizar el pedido #${nuevoPedidoId}. Envío mi comprobante:`;
                            whatsappLink.style.display = 'inline-flex';
                        }
                        const successMsg = document.getElementById('success-message');
                        if (successMsg) successMsg.textContent = `Pedido #${nuevoPedidoId} registrado. Envía tu comprobante por WhatsApp.`;
                    } else {
                        const successMsg = document.getElementById('success-message');
                        if (successMsg) successMsg.textContent = `¡Tu pedido #${nuevoPedidoId} está en cocina! Pronto nos pondremos en contacto.`;
                    }

                    const checkoutContent = document.getElementById('checkout-content');
                    const successCard = document.getElementById('success-card');
                    if (checkoutContent) checkoutContent.style.display = 'none';
                    if (successCard) successCard.style.display = 'block';

                } catch (error) {
                    let formMessage = document.getElementById('form-message');
                    formMessage.textContent = error.message;
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = 'Confirmar pedido';
                }
            };

            // Bifurcación de lógica (GPS / Local)
            if (isDomicilio) {
                formMessage.textContent = 'Solicitando permisos de ubicación...';
                btnSubmit.innerHTML = '<i class="fas fa-map-marker-alt fa-bounce"></i> Verificando cobertura...';

                if (!navigator.geolocation) {
                    formMessage.textContent = 'Navegador sin GPS.';
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = 'Confirmar pedido';
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        formMessage.textContent = ''; 
                        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando pedido...';
                        const dirCompleta = document.getElementById('address').value + ' | Ref: ' + document.getElementById('reference').value;
                        await procesarOrdenBaseDatos(position.coords.latitude, position.coords.longitude, dirCompleta);
                    }, 
                    (error) => {
                        formMessage.textContent = 'Debes permitir el acceso a tu ubicación para envíos a domicilio.';
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = 'Confirmar pedido';
                    }, 
                    { enableHighAccuracy: true }
                );
            } else {
                formMessage.textContent = ''; 
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando pedido...';
                await procesarOrdenBaseDatos(19.6015500, -99.0521000, 'Recoger en local');
            }
        });
    }
});