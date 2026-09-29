document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar Supabase
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8';
    const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 2. Traer Nombre del Usuario logueado
    cliente.auth.getUser().then(({ data: { user } }) => {
        const inputNombre = document.getElementById('recipient');
        if (user && inputNombre && !inputNombre.value) {
            inputNombre.value = user.user_metadata?.nombre || user.user_metadata?.full_name || user.email?.split('@')[0] || '';
        }
    });

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

    // Escuchar el click del usuario
    document.querySelectorAll('input[name="deliveryType"]').forEach(input => {
        input.addEventListener('change', toggleDeliveryFields);
    });

    // Forzar la validación inicial al cargar la pantalla
    toggleDeliveryFields();
    // 6. Lógica Estricta de Pago (Billetes y Montos)
    const radioEfectivo = document.getElementById('radio-efectivo');
    const radioTransferencia = document.getElementById('radio-transferencia');
    const warningHighAmount = document.getElementById('high-amount-warning');
    const selectChangeFor = document.getElementById('change-for');
    const cashOptions = document.getElementById('cash-options');
    const transferDetails = document.getElementById('transfer-details');
    const changeField = document.getElementById('change-field');

    // Regla: Bloqueo de efectivo para compras > $500
    if (total > 500) {
        if(radioEfectivo) radioEfectivo.disabled = true;
        if(radioTransferencia) radioTransferencia.checked = true;
        if(warningHighAmount) warningHighAmount.style.display = 'block';
        if(transferDetails) transferDetails.style.display = 'block';
        if(cashOptions) cashOptions.style.display = 'none';
    }

    // Regla: Generar billetes válidos según el total
    if (selectChangeFor) {
        selectChangeFor.innerHTML = '<option value="">Selecciona un billete</option>';
        const billetesOficiales = [20, 50, 100, 200, 500];
        
        billetesOficiales.forEach(billete => {
            if (billete > total) {
                // Compras menores de $100 -> máximo billete de $200
                if (total <= 100 && billete > 200) return;
                // Compras entre $100 y $400 -> máximo billete de $500
                if (total > 100 && total <= 400 && billete > 500) return;
                
                const option = document.createElement('option');
                option.value = `$${billete}`;
                option.textContent = `Billete de $${billete}`;
                selectChangeFor.appendChild(option);
            }
        });
    }

    // Interacción Efectivo vs Transferencia
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
    
    // Regla: Pago Justo vs Necesito Cambio
    document.querySelectorAll('input[name="cashMode"]').forEach(input => input.addEventListener('change', (e) => {
        if (e.target.value === 'Necesito cambio') {
            changeField.style.display = 'block';
            if(selectChangeFor) selectChangeFor.required = true;
        } else {
            // Pago justo oculta el select de billetes
            changeField.style.display = 'none';
            if(selectChangeFor) { selectChangeFor.required = false; selectChangeFor.value = ""; }
        }
    }));

    // 6. Lógica de Envío Centralizada (Con bypass para Recoger en Local)
    if (form) {
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (!cart.length || total <= 0) return;
            
            const btnSubmit = form.querySelector('button[type="submit"]');
            let formMessage = document.getElementById('form-message');
            btnSubmit.disabled = true;

            const isDomicilio = document.getElementById('radio-domicilio').checked;

            // Función centralizada para enviar a Supabase
            const procesarOrdenBaseDatos = async (lat, lon, dirCompleta) => {
                const data = new FormData(form);
                const paymentMethod = data.get('payment');
                const deliveryType = isDomicilio ? 'A Domicilio' : 'Recoger en local';
                const estadoPedido = paymentMethod === 'Efectivo' ? 'Por Preparar' : 'Pendiente de Validación';
                const notasPago = paymentMethod === 'Efectivo' && data.get('cashMode') === 'Necesito cambio' 
                                  ? `Cambio de: ${data.get('changeFor')}` : '';

                const { data: pedidoData, error: pedidoError } = await cliente.from('pedidos').insert([{
                    cliente_nombre: data.get('recipient'),
                    // Si recoge en local, enviamos un texto genérico, si no, el teléfono
                    cliente_telefono: isDomicilio ? data.get('phone') : 'No aplica',
                    tipo_entrega: deliveryType,
                    metodo_pago: paymentMethod,
                    estado: estadoPedido,
                    total: total,
                    direccion_entrega: dirCompleta + (notasPago ? ` | Notas de pago: ${notasPago}` : ''),
                    latitud: lat,
                    longitud: lon
                }]).select('id').single();

                if (pedidoError) {
                    formMessage.textContent = pedidoError.message;
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = 'Confirmar pedido';
                    return;
                }

                const nuevoPedidoId = pedidoData.id;
                const itemsAInsertar = cart.map(item => ({
                    pedido_id: nuevoPedidoId,
                    producto_id: item.producto_id,
                    cantidad: item.quantity,
                    precio_unitario: parseFloat(String(item.price).replace(/[^0-9.]/g,'')) || 0,
                }));

                await cliente.from('pedido_items').insert(itemsAInsertar);
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
            };

            // Bifurcación de lógica
            if (isDomicilio) {
                formMessage.textContent = 'Solicitando permisos de ubicación... Acepta en la ventana emergente.';
                btnSubmit.innerHTML = '<i class="fas fa-map-marker-alt fa-bounce"></i> Verificando cobertura...';

                if (!navigator.geolocation) {
                    formMessage.textContent = 'Tu navegador no soporta geolocalización. Imposible validar la entrega.';
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
                        if (error.code === error.PERMISSION_DENIED) {
                            formMessage.textContent = 'Debes permitir el acceso a tu ubicación para verificar si estás en nuestra zona de entrega.';
                        } else {
                            formMessage.textContent = 'No pudimos obtener tu ubicación. Verifica tu conexión o GPS.';
                        }
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = 'Confirmar pedido';
                    }, 
                    { enableHighAccuracy: true }
                );
            } else {
                formMessage.textContent = ''; 
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando pedido...';
                // Al recoger en local, enviamos las coordenadas fijas del negocio para pasar el candado del backend
                await procesarOrdenBaseDatos(19.6015500, -99.0521000, 'Recoger en local');
            }
        });
    }
});