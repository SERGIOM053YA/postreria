document.addEventListener('DOMContentLoaded', () => {
    const tokenLocal = localStorage.getItem('sb_access_token');
    const userEmail = localStorage.getItem('sb_user_email');

    const inputNombre = document.getElementById('recipient');
    if (userEmail && inputNombre && !inputNombre.value) {
        inputNombre.value = userEmail.split('@')[0];
    }

    const inputPhone = document.getElementById('phone');
    if (inputPhone) {
        inputPhone.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }

    // Novedad: Evento para cambiar el texto del botón al subir la foto
    const fileInput = document.getElementById('comprobante-file');
    const fileNameDisplay = document.getElementById('comprobante-name');
    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                fileNameDisplay.textContent = this.files[0].name;
            } else {
                fileNameDisplay.textContent = 'Seleccionar imagen...';
            }
        });
    }

    // ==========================================
    // CORRECCIÓN: BUSCADOR INTELIGENTE DE CARRITO
    // ==========================================
    let CART_KEY = 'hilda_shopping_cart';
    let cartStr = localStorage.getItem('hilda_shopping_cart');
    
    // Si no lo encuentra, busca en las llaves genéricas que suele usar cart.js
    if (!cartStr || cartStr === '[]') {
        if (localStorage.getItem('cart')) {
            cartStr = localStorage.getItem('cart');
            CART_KEY = 'cart';
        } else if (localStorage.getItem('carrito')) {
            cartStr = localStorage.getItem('carrito');
            CART_KEY = 'carrito';
        }
    }
    
    const cart = JSON.parse(cartStr || '[]');

    const form = document.getElementById('shipping-form');
    const formatMoney = value => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(value);
    const orderItems = document.getElementById('order-items');
    
    const total = cart.reduce((sum, item) => sum + (parseFloat(String(item.price).replace(/[^0-9.]/g,'')) || 0) * (Number(item.quantity || item.qty) || 1), 0);
    const totalEl = document.getElementById('order-total');
    if (totalEl) totalEl.textContent = formatMoney(total);
    
    if (cart.length && orderItems) {
        cart.forEach(item => {
            const row = document.createElement('div'); row.className = 'order-item';
            
            const description = item.desc || item.details || '';
            const rawNote = item.instructions || item.note || '';
            const instructions = rawNote ? ` · Nota: ${rawNote}` : '';
            
            const name = document.createElement('span'); 
            name.textContent = `${item.name} × ${item.quantity || item.qty || 1}`;
            const price = document.createElement('strong');
            price.textContent = formatMoney((parseFloat(String(item.price).replace(/[^0-9.]/g,'')) || 0) * (Number(item.quantity || item.qty) || 1));
            
            const details = document.createElement('small'); 
            details.textContent = description + instructions;
            
            row.append(name, price); 
            row.appendChild(details); 
            orderItems.appendChild(row);
        });
    } else if (orderItems) {
        orderItems.innerHTML = '<p class="empty-order">Tu carrito está vacío. Regresa a la tienda para agregar productos.</p>';
        if (form) {
            const btnSubmit = form.querySelector('button[type="submit"]');
            if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.style.opacity = '.55'; }
        }
    }

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
                
                // ASIGNACIÓN OFICIAL DE NUEVAS COLUMNAS (Efectivo)
                const cashMode = data.get('cashMode');
                const changeForValue = data.get('changeFor');
                
                let billeteDeCambio = null;
                if (paymentMethod === 'Efectivo') {
                    if (cashMode === 'Necesito cambio' && changeForValue) {
                        billeteDeCambio = `Cambio de: ${changeForValue}`;
                    } else {
                        billeteDeCambio = `Pago exacto`;
                    }
                }

                // ASIGNACIÓN OFICIAL DE COMPROBANTE (Transferencia)
                let comprobanteBase64 = null;
                let comprobanteNombre = null;
                let comprobanteTipo = null;

                if (paymentMethod === 'Transferencia') {
                    const fileInputEl = document.getElementById('comprobante-file');
                    
                    if (!fileInputEl || !fileInputEl.files || fileInputEl.files.length === 0) {
                        alert('⚠️ Por favor, sube la imagen de tu comprobante de transferencia para continuar.');
                        btnSubmit.disabled = false;
                        return;
                    }
                    
                    const file = fileInputEl.files[0];
                    
                    // Doble candado de seguridad: Validar que no pese más de 5MB
                    if (file.size > 5242880) {
                        alert('⚠️ La imagen es demasiado pesada. El límite es de 5MB.');
                        btnSubmit.disabled = false;
                        return;
                    }

                    formMessage.textContent = 'Procesando imagen del comprobante...';
                    
                    // Convertimos la imagen a código Base64
                    const toBase64 = f => new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(f);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = e => reject(e);
                    });

                    try {
                        comprobanteBase64 = await toBase64(file);
                        const fileExt = file.name.split('.').pop();
                        comprobanteNombre = `recibo_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
                        comprobanteTipo = file.type;
                    } catch (e) {
                        alert('Error al leer la imagen. Intenta de nuevo con otro formato.');
                        btnSubmit.disabled = false;
                        return;
                    }
                }

                const catResponse = await fetch('../../api/productos.php');
                const dbProductos = await catResponse.json();
                
                const superClean = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(de|con|el|la|los|las)\b/g, '').replace(/[^a-z0-9]/g, '');
                let errorDeCatalogo = false;
                let nombresFaltantes = [];
                let itemsListos = [];
                let detallesPreparacion = []; 

                for (let item of cart) {
                    let idFirme = item.producto_id || item.productId || 1;
                    let precioFirme = parseFloat(String(item.price).replace(/[^0-9.]/g,'')) || 0;
                    let quantity = item.quantity || item.qty || 1;
                    
                    let textoDetalles = item.desc || item.details || '';
                    let textoNota = item.instructions || item.note || '';
                    
                    let extraInfo = '';
                    if (textoDetalles) extraInfo += textoDetalles;
                    if (textoNota) extraInfo += (extraInfo ? ' | Nota: ' : 'Nota: ') + textoNota;

                    if (extraInfo) {
                        detallesPreparacion.push(`${quantity}x ${item.name}: ${extraInfo}`);
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
                        cantidad: quantity,
                        precio_unitario: precioFirme,
                        detalles: extraInfo
                    });
                }

                if (errorDeCatalogo) {
                    alert("⚠️ Productos no encontrados en base de datos:\n\n- " + nombresFaltantes.join("\n- "));
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar pedido';
                    return; 
                }

                const notasCocina = detallesPreparacion.length > 0 ? ` | NOTAS_COCINA: ${detallesPreparacion.join(' | ')}` : '';

                // EMPAQUETADO FINAL 
                const payload = {
                    cliente_nombre: data.get('recipient'), 
                    cliente_telefono: isDomicilio ? data.get('phone') : 'No aplica',
                    tipo_entrega: deliveryType,
                    metodo_pago: paymentMethod,
                    direccion_entrega: dirCompleta + notasCocina,
                    billete_cambio: billeteDeCambio,         
                    comprobante_b64: comprobanteBase64,      
                    comprobante_nombre: comprobanteNombre,   
                    comprobante_tipo: comprobanteTipo,       
                    latitud: lat,
                    longitud: lon,
                    items: itemsListos
                };

                try {
                    const response = await fetch('../../api/pedidos.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${tokenLocal}` 
                        },
                        body: JSON.stringify(payload)
                    });

                    const responseData = await response.json();

                    if (!response.ok) {
                        throw new Error(responseData.error || 'Error al enviar pedido');
                    }

                    const nuevoPedidoId = responseData.id_orden || responseData.id_emergencia || Math.floor(Math.random() * 10000);

                    // Aquí borramos la llave correcta
                    localStorage.removeItem(CART_KEY);
                    
                    if (paymentMethod === 'Transferencia') {
                        const successMsg = document.getElementById('success-message');
                        if (successMsg) successMsg.textContent = `Pedido #${nuevoPedidoId} registrado con tu comprobante. En breve iniciaremos la preparación.`;
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
                    btnSubmit.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar pedido';
                }
            };

            if (isDomicilio) {
                formMessage.textContent = 'Solicitando permisos de ubicación...';
                btnSubmit.innerHTML = '<i class="fas fa-map-marker-alt fa-bounce"></i> Verificando cobertura...';

                if (!navigator.geolocation) {
                    formMessage.textContent = 'Navegador sin GPS.';
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar pedido';
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
                        btnSubmit.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar pedido';
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