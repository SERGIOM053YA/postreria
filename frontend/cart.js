document.addEventListener('DOMContentLoaded', () => {
    // 1. Instanciar Supabase
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8'; 
    window.cliente = window.cliente || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const cliente = window.cliente;

    // 2. Inyectamos Modales y Carrito
    const cartHTML = `
    <div class="custom-modal-overlay" id="custom-modal-overlay">
        <div class="custom-modal" id="custom-modal">
            <div class="custom-modal-header">
                <div class="custom-modal-title-area">
                    <span class="custom-modal-icon">🍓</span>
                    <h2 class="custom-modal-title" id="custom-modal-title">Nombre del Producto</h2>
                </div>
                <button class="custom-modal-close" id="custom-modal-close" type="button"><i class="fas fa-times"></i></button>
            </div>
            <p class="custom-modal-subtitle">Personaliza tu pedido antes de agregarlo</p>
            <form id="custom-modal-form" onsubmit="return false;">
                <label class="custom-modal-label">💬 Instrucciones especiales (opcional):</label>
                <textarea id="custom-modal-instructions" class="custom-modal-textarea" placeholder="Ej: Con poco picante..."></textarea>
                <button type="button" class="btn-custom-add-cart" id="btn-custom-add-cart">
                    <i class="fas fa-shopping-cart"></i> Agregar al carrito
                </button>
            </form>
        </div>
    </div>

    <!-- Modal de Checkout -->
    <div class="custom-modal-overlay" id="checkout-modal-overlay">
        <div class="custom-modal" id="checkout-modal" style="max-height: 90vh; overflow-y: auto;">
            <div class="custom-modal-header">
                <div class="custom-modal-title-area">
                    <span class="custom-modal-icon">🔒</span>
                    <h2 class="custom-modal-title">Finalizar Orden</h2>
                </div>
                <button class="custom-modal-close" id="checkout-modal-close" type="button"><i class="fas fa-times"></i></button>
            </div>
            <p class="custom-modal-subtitle">Completa tus datos para enviar la orden a cocina.</p>
            <form id="checkout-form">
                <div style="margin-bottom: 15px;">
                    <label class="custom-modal-label">👤 Nombre de quien recibe:</label>
                    <input type="text" id="chk-nombre" class="custom-modal-textarea" style="min-height: 40px; padding: 10px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label class="custom-modal-label">📱 Teléfono / WhatsApp:</label>
                    <input type="tel" id="chk-telefono" class="custom-modal-textarea" style="min-height: 40px; padding: 10px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label class="custom-modal-label">🚚 Tipo de Entrega:</label>
                    <select id="chk-entrega" class="custom-modal-textarea" style="min-height: 40px; padding: 10px;">
                        <option value="Recoger en Local">Recoger en Local</option>
                        <option value="A Domicilio">A Domicilio (Radio 1.0 km)</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;" id="box-direccion" style="display:none;">
                    <label class="custom-modal-label">📍 Dirección de entrega:</label>
                    <textarea id="chk-direccion" class="custom-modal-textarea" style="min-height: 70px;" placeholder="Calle, número, referencias..."></textarea>
                </div>
                <div style="margin-bottom: 15px;">
                    <label class="custom-modal-label">💳 Método de Pago:</label>
                    <select id="chk-pago" class="custom-modal-textarea" style="min-height: 40px; padding: 10px;">
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia SPEI">Transferencia SPEI</option>
                    </select>
                </div>
                <button type="submit" class="btn-custom-add-cart" id="btn-procesar-pago" style="background-color: #2ec4b6;">
                    <i class="fas fa-check-circle"></i> Confirmar Pedido
                </button>
            </form>
        </div>
    </div>

    <!-- Carrito Lateral -->
    <div class="cart-overlay" id="cart-overlay" style="display: none; opacity: 0; transition: opacity 0.3s ease;">
        <aside class="cart-sidebar" id="cart-sidebar" style="transform: translateX(100%); transition: transform 0.3s ease;">
            <div class="cart-header">
                <div class="cart-title-area">
                    <i class="fas fa-shopping-cart cart-icon"></i>
                    <h2>Tu carrito</h2>
                    <span class="cart-badge">0</span>
                </div>
                <button class="cart-close" id="cart-close" type="button"><i class="fas fa-times"></i></button>
            </div>
            <div class="cart-items" id="cart-items-container"></div>
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span id="cart-subtotal">$0.00</span>
                </div>
                <div class="summary-total">
                    <span>Total</span>
                    <span class="total-price" id="cart-total">$0.00</span>
                </div>
                <div class="cart-buttons">
                    <button class="btn-checkout" id="btn-abrir-checkout" type="button">
                        <i class="fas fa-lock"></i> Finalizar compra
                    </button>
                    <button class="btn-continue" id="btn-continue-shopping" type="button">
                        <i class="fas fa-arrow-left"></i> Seguir comprando
                    </button>
                </div>
            </div>
        </aside>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', cartHTML);

    const cartIcon = document.getElementById('cart-icon');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.getElementById('cart-close');
    const btnContinue = document.getElementById('btn-continue-shopping');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const btnAbrirCheckout = document.getElementById('btn-abrir-checkout');
    
    const customModalOverlay = document.getElementById('custom-modal-overlay');
    const customModal = document.getElementById('custom-modal');
    const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
    const checkoutForm = document.getElementById('checkout-form');
    
    let pendingProduct = null;
    let carritoDeCompras = []; 

    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    const openCart = () => {
        cartOverlay.style.display = 'flex';
        setTimeout(() => {
            cartOverlay.style.opacity = '1';
            cartSidebar.style.transform = 'translateX(0)';
        }, 10);
    };

    const closeCart = () => {
        cartOverlay.style.opacity = '0';
        cartSidebar.style.transform = 'translateX(100%)';
        setTimeout(() => cartOverlay.style.display = 'none', 300);
    };

    const openCustomModal = (product) => {
        pendingProduct = product;
        document.getElementById('custom-modal-title').textContent = product.name;
        document.getElementById('custom-modal-instructions').value = '';
        customModalOverlay.style.display = 'flex';
        setTimeout(() => {
            customModalOverlay.classList.add('show');
            customModal.classList.add('show');
        }, 10);
    };

    const closeCustomModal = () => {
        customModalOverlay.classList.remove('show');
        customModal.classList.remove('show');
        setTimeout(() => customModalOverlay.style.display = 'none', 300);
    };

    const recalculateCart = () => {
        let subtotal = 0;
        let totalItems = 0;
        const items = cartItemsContainer.querySelectorAll('.cart-item');

        items.forEach((item, index) => {
            const priceText = item.querySelector('.cart-item-price').textContent;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const qty = parseInt(item.querySelector('.cart-item-quantity input').value) || 1;
            
            subtotal += price * qty;
            totalItems += qty;
            
            if(carritoDeCompras[index]) {
                carritoDeCompras[index].cantidad = qty;
            }
        });

        document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `$${subtotal.toFixed(2)}`;
        document.querySelectorAll('.cart-badge').forEach(badge => badge.textContent = totalItems);
    };

    const addProductToCart = (product, instructions) => {
        carritoDeCompras.push({
            producto_id: product.id,
            precio_unitario: product.priceNum,
            cantidad: 1
        });

        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${product.img}" class="cart-item-img">
            <div class="cart-item-info">
                <h3 class="cart-item-title">${escapeHTML(product.name)}</h3>
                ${instructions ? `<div class="cart-item-note"><i class="fas fa-comment-dots"></i> "${escapeHTML(instructions)}"</div>` : ''}
                <span class="cart-item-price">${product.price}</span>
                <div class="cart-item-quantity">
                    <button type="button" class="btn-qty-minus"><i class="fas fa-minus"></i></button>
                    <input type="number" value="1" min="1">
                    <button type="button" class="btn-qty-plus"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <button class="cart-item-delete" type="button"><i class="far fa-trash-alt"></i></button>
        `;
        cartItemsContainer.appendChild(itemEl);
        recalculateCart();
    };

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-cart');
        if (!btn || btn.closest('a[href]')) return;
        
        const card = btn.closest('.product-card');
        if (!card) return;

        const productIdRaw = card.id.replace('product-', '');
        const productoIdNum = parseInt(productIdRaw);

        if (isNaN(productoIdNum)) {
            alert('Aviso: Producto no sincronizado con base de datos.');
            return;
        }

        const name = card.querySelector('h3').textContent.trim();
        const priceText = card.querySelector('.product-price').textContent.trim();
        const priceNum = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const img = card.querySelector('.product-img').src;

        openCustomModal({ id: productoIdNum, name, price: priceText, priceNum, img });
    });

    document.getElementById('btn-custom-add-cart').addEventListener('click', () => {
        if (pendingProduct) {
            addProductToCart(pendingProduct, document.getElementById('custom-modal-instructions').value);
            closeCustomModal();
            openCart();
        }
    });

    cartItemsContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.cart-item');
        const index = Array.from(cartItemsContainer.children).indexOf(item);

        if (e.target.closest('.btn-qty-plus')) {
            const input = item.querySelector('input');
            input.value = parseInt(input.value) + 1;
            recalculateCart();
        } else if (e.target.closest('.btn-qty-minus')) {
            const input = item.querySelector('input');
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
                recalculateCart();
            }
        } else if (e.target.closest('.cart-item-delete')) {
            carritoDeCompras.splice(index, 1); 
            item.remove();
            recalculateCart();
        }
    });

    document.getElementById('chk-entrega').addEventListener('change', (e) => {
        const box = document.getElementById('box-direccion');
        box.style.display = e.target.value === 'A Domicilio' ? 'block' : 'none';
    });

    btnAbrirCheckout.addEventListener('click', async () => {
        if (carritoDeCompras.length === 0) {
            alert('⚠️ El carrito está vacío.');
            return;
        }
        
        try {
            const { data: { user } } = await cliente.auth.getUser();
            if (user && user.email) {
                document.getElementById('chk-nombre').value = user.user_metadata?.nombre || user.email.split('@')[0];
            }
        } catch (err) {
            console.warn("Usuario no autenticado o error de red.");
        }

        closeCart();
        checkoutModalOverlay.style.display = 'flex';
        setTimeout(() => checkoutModalOverlay.classList.add('show'), 10);
    });

    document.getElementById('checkout-modal-close').addEventListener('click', () => {
        checkoutModalOverlay.classList.remove('show');
        setTimeout(() => checkoutModalOverlay.style.display = 'none', 300);
    });

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('chk-nombre').value.trim();
        const telefono = document.getElementById('chk-telefono').value.trim();
        const tipoEntrega = document.getElementById('chk-entrega').value;
        const metodoPago = document.getElementById('chk-pago').value;
        const direccion = document.getElementById('chk-direccion').value.trim();

        // Validaciones manuales con Alerta
        if (!nombre || !telefono) {
            alert("⚠️ Por favor, ingresa tu nombre y teléfono para procesar la orden.");
            return;
        }
        if (tipoEntrega === 'A Domicilio' && !direccion) {
            alert("⚠️ Por favor, ingresa la dirección para la entrega a domicilio.");
            return;
        }

        const btnProcesar = document.getElementById('btn-procesar-pago');
        btnProcesar.disabled = true;
        btnProcesar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando Orden...';

        let latitud = null;
        let longitud = null;

        if (tipoEntrega === 'A Domicilio') {
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
                });
                latitud = pos.coords.latitude;
                longitud = pos.coords.longitude;
            } catch (err) {
                alert('📍 No pudimos obtener tu ubicación GPS. Por favor, acepta los permisos de ubicación en tu navegador para entregas a domicilio.');
                btnProcesar.disabled = false;
                btnProcesar.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Pedido';
                return;
            }
        }

        try {
            const totalNum = parseFloat(document.getElementById('cart-total').textContent.replace(/[^0-9.]/g, ''));
            const estadoLogico = metodoPago === 'Efectivo' ? 'Por Preparar' : 'Pendiente de Validación';

            const { data: pedidoNuevo, error: errorPedido } = await cliente
                .from('pedidos')
                .insert({
                    cliente_nombre: nombre,
                    cliente_telefono: telefono,
                    tipo_entrega: tipoEntrega,
                    metodo_pago: metodoPago,
                    estado: estadoLogico,
                    total: totalNum,
                    direccion_entrega: direccion,
                    latitud: latitud,
                    longitud: longitud
                })
                .select('id')
                .single();

            if (errorPedido) {
                alert('⛔ Bloqueo de Seguridad: ' + errorPedido.message + '\n\nAsegúrate de haber iniciado sesión antes de comprar.');
                btnProcesar.disabled = false;
                btnProcesar.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Pedido';
                return;
            }

            const itemsParaInsertar = carritoDeCompras.map(item => ({
                pedido_id: pedidoNuevo.id,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario 
            }));

            await cliente.from('pedido_items').insert(itemsParaInsertar);

            carritoDeCompras = [];
            cartItemsContainer.innerHTML = '';
            recalculateCart();
            
            checkoutModalOverlay.classList.remove('show');
            setTimeout(() => checkoutModalOverlay.style.display = 'none', 300);
            
            alert(`✅ ¡Orden #${pedidoNuevo.id} recibida con éxito!\nEstado: ${estadoLogico}`);
            
        } catch (err) {
            alert("❌ Ocurrió un error de conexión: " + err.message);
        } finally {
            btnProcesar.disabled = false;
            btnProcesar.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Pedido';
        }
    });

    if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (btnContinue) btnContinue.addEventListener('click', closeCart);
});