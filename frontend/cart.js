document.addEventListener('DOMContentLoaded', async () => {
    const CART_STORAGE_KEY = 'hilda_shopping_cart';
    const loadStored = (key, fallback = []) => {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch { return fallback; }
    };

    let cart = [];
    let currentUser = null;
    let pendingProduct = null;
    let catalogoDB = [];

    // ==========================================
    // 1. SESIÓN Y SEGURIDAD (Conectado a Node.js)
    // ==========================================
    async function validarSesionEnNavegacion() {
        const tokenLocal = localStorage.getItem('sb_access_token');
        const userEmail = localStorage.getItem('sb_user_email');

        if (tokenLocal && userEmail) {
            const nombreUsuario = userEmail.split('@')[0];
            const loginBtn = document.getElementById('login-btn');
            
            if (loginBtn) {
                loginBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i><span>Salir (${nombreUsuario})</span>`;
                loginBtn.href = '#';
                loginBtn.style.backgroundColor = '#f8e7ec'; 
                loginBtn.style.color = '#8d3d54';
                loginBtn.style.borderColor = '#ffccd8';
                
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('¿Deseas cerrar sesión?')) {
                        localStorage.removeItem('sb_access_token');
                        localStorage.removeItem('sb_user_email');
                        window.location.reload(); 
                    }
                });
            }

            if (userEmail.toLowerCase() === 'admin@reposteria.com') {
                const adminBtn = document.getElementById('admin-btn');
                if (adminBtn) adminBtn.style.display = 'inline-flex';
            }
        }
    }
    validarSesionEnNavegacion();

    // ==========================================
    // 2. INYECTAR INTERFAZ (Modales y Carrito)
    // ==========================================
    const cartHTML = `
    <!-- Modal de Personalización -->
    <div class="custom-modal-overlay" id="custom-modal-overlay">
        <div class="custom-modal" id="custom-modal">
            <div class="custom-modal-header">
                <div class="custom-modal-title-area">
                    <span class="custom-modal-icon">🍓</span>
                    <h2 class="custom-modal-title" id="custom-modal-title">Producto</h2>
                </div>
                <button class="custom-modal-close" id="custom-modal-close" type="button"><i class="fas fa-times"></i></button>
            </div>
            <form id="custom-modal-form" onsubmit="return false;">
                <div id="sauce-step" style="display:none;">
                    <label class="custom-modal-label">Elige la salsa:</label>
                    <select id="custom-modal-sauce" class="custom-modal-textarea">
                        <option value="">Selecciona una salsa</option>
                        <option value="Mango habanero">Mango habanero</option>
                        <option value="BBQ">BBQ</option>
                        <option value="Búfalo">Búfalo</option>
                    </select>
                    <button type="button" class="btn-custom-add-cart" id="btn-sauce-continue">Continuar</button>
                </div>
                <div id="instructions-step">
                    <label class="custom-modal-label">💬 Instrucciones especiales (opcional):</label>
                    <textarea id="custom-modal-instructions" class="custom-modal-textarea" placeholder="Ej: Con poco picante..."></textarea>
                    <button type="button" class="btn-custom-add-cart" id="btn-custom-add-cart"><i class="fas fa-shopping-cart"></i> Agregar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal de Checkout EXPANDIDO (Tu diseño original + Pagos) -->
    <div class="custom-modal-overlay" id="checkout-modal-overlay">
        <div class="custom-modal" id="checkout-modal" style="max-height: 90vh; overflow-y: auto; max-width: 500px;">
            <div class="custom-modal-header">
                <div class="custom-modal-title-area">
                    <span class="custom-modal-icon">🔒</span>
                    <h2 class="custom-modal-title">Finalizar Orden</h2>
                </div>
                <button class="custom-modal-close" id="checkout-modal-close" type="button"><i class="fas fa-times"></i></button>
            </div>
            <form id="checkout-form">
                <div style="margin-bottom: 12px;">
                    <label class="custom-modal-label">👤 Recibe:</label>
                    <input type="text" id="chk-nombre" class="custom-modal-textarea" style="min-height: 40px;" required>
                </div>
                <div style="margin-bottom: 12px;">
                    <label class="custom-modal-label">📱 Teléfono:</label>
                    <input type="tel" id="chk-telefono" class="custom-modal-textarea" style="min-height: 40px;" required>
                </div>
                <div style="margin-bottom: 12px;">
                    <label class="custom-modal-label">🚚 Entrega:</label>
                    <select id="chk-entrega" class="custom-modal-textarea" style="min-height: 40px;" required>
                        <option value="Recoger en Local">Recoger en Local</option>
                        <option value="A Domicilio">A Domicilio (Radio 1.0 km)</option>
                    </select>
                </div>
                <div style="margin-bottom: 12px; display:none;" id="box-direccion">
                    <label class="custom-modal-label">📍 Dirección y Referencia:</label>
                    <textarea id="chk-direccion" class="custom-modal-textarea" style="min-height: 60px;" placeholder="Calle, número y color de fachada"></textarea>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label class="custom-modal-label">💳 Método de Pago:</label>
                    <select id="chk-pago" class="custom-modal-textarea" style="min-height: 40px;" required>
                        <option value="">Selecciona un método</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia SPEI">Transferencia SPEI</option>
                    </select>
                </div>

                <!-- Sub-opciones de Efectivo -->
                <div id="box-efectivo" style="display:none; background:#fff5f8; padding:10px; border-radius:10px; margin-bottom:12px; border: 1px solid #ffccd8;">
                    <label class="custom-modal-label" style="font-size:0.9rem;">¿Necesitas cambio?</label>
                    <select id="chk-cambio" class="custom-modal-textarea" style="min-height: 35px; margin-top:5px;">
                        <option value="Pago justo">Llevaré el pago justo</option>
                        <option value="Necesito cambio">Sí, necesito cambio</option>
                    </select>
                    <input type="text" id="chk-billete" class="custom-modal-textarea" style="min-height: 35px; margin-top:8px; display:none;" placeholder="¿De qué billete? (Ej. $500)">
                </div>

                <!-- Sub-opciones de Transferencia -->
                <div id="box-transferencia" style="display:none; background:#f6fbf7; padding:10px; border-radius:10px; margin-bottom:12px; border: 1px solid #d9e9df;">
                    <label class="custom-modal-label" style="font-size:0.9rem; color:#20b85a;">Datos Bancarios:</label>
                    <p style="font-size:0.85rem; margin:5px 0;"><strong>Banco:</strong> BBVA<br><strong>CLABE:</strong> 000000000000000000<br><strong>Titular:</strong> Polar Streaming</p>
                    <p style="font-size:0.8rem; color:#6e7771; margin-top:5px;">Por favor, ten listo tu comprobante para enviarlo por WhatsApp al finalizar.</p>
                </div>

                <button type="submit" class="btn-custom-add-cart" id="btn-procesar-pago" style="background-color: #2ec4b6; margin-top: 10px;">Confirmar Pedido</button>
            </form>
        </div>
    </div>

    <!-- Carrito Lateral -->
    <div class="cart-overlay" id="cart-overlay" style="display: none; opacity: 0; transition: opacity 0.3s ease;">
        <aside class="cart-sidebar" id="cart-sidebar" style="transform: translateX(100%); transition: transform 0.3s ease;">
            <div class="cart-header">
                <div class="cart-title-area"><i class="fas fa-shopping-cart cart-icon"></i><h2>Carrito</h2><span class="cart-badge">0</span></div>
                <button class="cart-close" id="cart-close" type="button"><i class="fas fa-times"></i></button>
            </div>
            <div class="cart-items" id="cart-items-container"></div>
            <div class="cart-summary">
                <div class="summary-row"><span>Subtotal</span><span id="cart-subtotal">$0.00</span></div>
                <div class="summary-total"><span>Total</span><span class="total-price" id="cart-total">$0.00</span></div>
                <div class="cart-buttons">
                    <button class="btn-checkout" id="btn-abrir-checkout" type="button"><i class="fas fa-lock"></i> Finalizar compra</button>
                    <button class="btn-continue" id="btn-continue-shopping" type="button"><i class="fas fa-arrow-left"></i> Seguir comprando</button>
                </div>
            </div>
        </aside>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', cartHTML);

    // ==========================================
    // 3. SINCRONIZAR CATÁLOGO DESDE NODE.JS
    // ==========================================
    try {
        const response = await fetch('http://localhost:3000/api/productos');
        if (response.ok) {
            catalogoDB = await response.json();
            document.querySelectorAll('.product-card').forEach(card => {
                const titleEl = card.querySelector('h3, .flavor-card-name');
                if (!titleEl) return;
                let name = titleEl.textContent.replace('♡', '').replace(/\n/g, ' ').trim();
                const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                const dbProd = catalogoDB.find(p => normalize(p.nombre).includes(normalize(name)) || normalize(name).includes(normalize(p.nombre)));
                if (dbProd) {
                    card.dataset.producto_id = dbProd.id; 
                    const priceEl = card.querySelector('.product-price');
                    if (priceEl && !name.toLowerCase().includes('crepa') && !name.toLowerCase().includes('hotcake')) {
                        priceEl.textContent = `$${Number(dbProd.precio).toFixed(2)}`;
                    }
                }
            });
        }
    } catch (err) {
        console.warn("Sincronización pausada.", err);
    }

    // ==========================================
    // 4. LÓGICA VISUAL DEL CARRITO
    // ==========================================
    const cartItemsContainer = document.getElementById('cart-items-container');
    const escapeHTML = (str) => { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; };

    const persistCart = () => { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); };

    const openCart = () => { 
        document.getElementById('cart-overlay').style.display = 'flex'; 
        setTimeout(() => { document.getElementById('cart-overlay').style.opacity = '1'; document.getElementById('cart-sidebar').style.transform = 'translateX(0)'; }, 10); 
    };
    const closeCart = () => { 
        document.getElementById('cart-overlay').style.opacity = '0'; document.getElementById('cart-sidebar').style.transform = 'translateX(100%)'; 
        setTimeout(() => document.getElementById('cart-overlay').style.display = 'none', 300); 
    };

    const recalculateCart = () => {
        let subtotal = 0; let totalItems = 0;
        cart.forEach(item => { 
            const safePrice = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
            subtotal += safePrice * item.quantity; 
            totalItems += item.quantity; 
        });
        document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `$${subtotal.toFixed(2)}`;
        document.querySelectorAll('.cart-badge').forEach(badge => badge.textContent = totalItems);
        persistCart();
        renderCartItems();
    };

    const renderCartItems = () => {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty-message">Tu carrito está vacío.</p>';
            return;
        }
        cart.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            const safePrice = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
            
            itemEl.innerHTML = `
                <img src="${item.img || './logo.png'}" class="cart-item-img">
                <div class="cart-item-info">
                    <h3 class="cart-item-title">${escapeHTML(item.name)}</h3>
                    ${item.instructions ? `<div class="cart-item-note"><i class="fas fa-comment-dots"></i> "${escapeHTML(item.instructions)}"</div>` : ''}
                    <span class="cart-item-price">$${safePrice.toFixed(2)}</span>
                    <div class="cart-item-quantity">
                        <button type="button" class="btn-qty-minus" data-idx="${index}"><i class="fas fa-minus"></i></button>
                        <input type="number" value="${item.quantity}" readonly>
                        <button type="button" class="btn-qty-plus" data-idx="${index}"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <button class="cart-item-delete" type="button" data-idx="${index}"><i class="far fa-trash-alt"></i></button>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
    };

    cartItemsContainer.addEventListener('click', (e) => {
        const btnPlus = e.target.closest('.btn-qty-plus');
        const btnMinus = e.target.closest('.btn-qty-minus');
        const btnDelete = e.target.closest('.cart-item-delete');
        if (btnPlus) { cart[btnPlus.dataset.idx].quantity++; recalculateCart(); }
        if (btnMinus) { if(cart[btnMinus.dataset.idx].quantity > 1) cart[btnMinus.dataset.idx].quantity--; recalculateCart(); }
        if (btnDelete) { cart.splice(btnDelete.dataset.idx, 1); recalculateCart(); }
    });

    const addProductToCart = (product, instructions) => {
        const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ''));
        cart.push({
            producto_id: product.producto_id || 1,
            name: product.name,
            price: priceNum,
            img: product.img,
            instructions: instructions,
            quantity: 1
        });
        recalculateCart();
        openCart();
    };
    window.addProductToCart = addProductToCart;
    window.addHotcakeToCart = addProductToCart;

    // Interceptar Clic en "Agregar"
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-cart');
        if (!btn || btn.closest('a[href]')) return;
        e.preventDefault(); e.stopPropagation();

        const card = btn.closest('.product-card');
        if (!card) return;

        const name = card.querySelector('h3, .flavor-card-name')?.textContent.trim() || 'Producto';
        const price = card.querySelector('.product-price')?.textContent.trim() || '$0.00';
        const img = card.querySelector('.product-img')?.src || '';
        const producto_id = card.dataset.producto_id;

        pendingProduct = { name, price, img, producto_id };
        
        const requiresSauce = ['product-alitas', 'product-alitas-con-papas', 'product-boneless', 'product-boneless-con-papas'].includes(card.id);
        document.getElementById('custom-modal-title').textContent = name;
        document.getElementById('custom-modal-instructions').value = '';
        document.getElementById('sauce-step').style.display = requiresSauce ? 'block' : 'none';
        document.getElementById('instructions-step').style.display = requiresSauce ? 'none' : 'block';
        
        document.getElementById('custom-modal-overlay').style.display = 'flex';
        setTimeout(() => { document.getElementById('custom-modal-overlay').classList.add('show'); document.getElementById('custom-modal').classList.add('show'); }, 10);
    });

    document.getElementById('btn-sauce-continue')?.addEventListener('click', () => {
        const sauce = document.getElementById('custom-modal-sauce').value;
        if(!sauce) return;
        pendingProduct.name += ` (${sauce})`;
        document.getElementById('sauce-step').style.display = 'none';
        document.getElementById('instructions-step').style.display = 'block';
    });

    document.getElementById('btn-custom-add-cart')?.addEventListener('click', () => {
        addProductToCart(pendingProduct, document.getElementById('custom-modal-instructions').value.trim());
        document.getElementById('custom-modal-overlay').classList.remove('show');
        setTimeout(() => document.getElementById('custom-modal-overlay').style.display = 'none', 300);
    });

    document.getElementById('custom-modal-close')?.addEventListener('click', () => {
        document.getElementById('custom-modal-overlay').classList.remove('show');
        setTimeout(() => document.getElementById('custom-modal-overlay').style.display = 'none', 300);
    });

    // ==========================================
    // 5. CHECKOUT EXPANDIDO AL SERVIDOR NODE.JS
    // ==========================================
    
    // Control visual de los campos
    document.getElementById('chk-entrega').addEventListener('change', (e) => {
        const box = document.getElementById('box-direccion');
        const dirInput = document.getElementById('chk-direccion');
        if (e.target.value === 'A Domicilio') { box.style.display = 'block'; dirInput.required = true; } 
        else { box.style.display = 'none'; dirInput.required = false; }
    });

    document.getElementById('chk-pago').addEventListener('change', (e) => {
        const val = e.target.value;
        document.getElementById('box-efectivo').style.display = val === 'Efectivo' ? 'block' : 'none';
        document.getElementById('box-transferencia').style.display = val === 'Transferencia SPEI' ? 'block' : 'none';
    });

    document.getElementById('chk-cambio').addEventListener('change', (e) => {
        const inputBillete = document.getElementById('chk-billete');
        if(e.target.value === 'Necesito cambio') { inputBillete.style.display = 'block'; inputBillete.required = true; }
        else { inputBillete.style.display = 'none'; inputBillete.required = false; }
    });

    // Abrir Ventana de Envio
    document.getElementById('btn-abrir-checkout')?.addEventListener('click', () => {
    // Validar que el carrito no esté vacío
    const carritoActual = (typeof carritoDeCompras !== 'undefined' && carritoDeCompras.length > 0) ? carritoDeCompras : (typeof cart !== 'undefined' ? cart : []);
    
    if (carritoActual.length === 0) {
        alert('⚠️ Tu carrito está vacío. Agrega productos para continuar.');
        return;
    }

    // Validar sesión local (BFF Node.js)
    const tokenLocal = localStorage.getItem('sb_access_token');
    if (!tokenLocal) {
        alert('Por favor, inicia sesión para procesar tu pedido.');
        window.location.href = './Login/login.html'; 
        return;
    }

    // Redirección estricta al formulario de Envio.html
    closeCart();
    window.location.href = './Envio/Envio.html';
});

    // Enviar formulario a Node.js
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnProcesar = document.getElementById('btn-procesar-pago');
        btnProcesar.disabled = true;
        btnProcesar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        const tipoEntrega = document.getElementById('chk-entrega').value;
        const metodoPago = document.getElementById('chk-pago').value;
        
        let direccion = document.getElementById('chk-direccion').value || 'Recoger en Local';
        
        // Agregar nota de cambio si paga en efectivo
        if (metodoPago === 'Efectivo' && document.getElementById('chk-cambio').value === 'Necesito cambio') {
            direccion += ` | Nota de pago: Cambio de ${document.getElementById('chk-billete').value}`;
        }

        const payload = {
            cliente_nombre: document.getElementById('chk-nombre').value,
            cliente_telefono: document.getElementById('chk-telefono').value,
            tipo_entrega: tipoEntrega,
            metodo_pago: metodoPago,
            direccion_entrega: direccion,
            latitud: null,
            longitud: null,
            items: cart.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.quantity,
                precio_unitario: item.price,
                instrucciones: item.instructions
            }))
        };

        if (tipoEntrega === 'A Domicilio') {
            try {
                const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
                payload.latitud = pos.coords.latitude;
                payload.longitud = pos.coords.longitude;
            } catch (err) {
                alert('⚠️ Se requiere tu ubicación GPS para envíos a domicilio.');
                btnProcesar.disabled = false; btnProcesar.textContent = 'Confirmar Pedido';
                return;
            }
        }

        try {
            const tokenLocal = localStorage.getItem('sb_access_token');
            const response = await fetch('http://localhost:3000/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenLocal}` },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al procesar el pedido');

            cart = [];
            recalculateCart();
            document.getElementById('checkout-modal-overlay').classList.remove('show');
            setTimeout(() => document.getElementById('checkout-modal-overlay').style.display = 'none', 300);
            
            if (metodoPago === 'Transferencia SPEI') {
                alert(`✅ ¡Orden #${data.id_orden || data.id_emergencia} registrada!\n\nPor favor, envía tu comprobante por WhatsApp para validarla.`);
                window.open(`https://wa.me/5512345678?text=Hola, acabo de realizar el pedido #${data.id_orden || data.id_emergencia}. Envío mi comprobante:`, '_blank');
            } else {
                alert(`✅ ¡Orden #${data.id_orden || data.id_emergencia} enviada exitosamente a la cocina!`);
            }
            
        } catch (error) {
            alert(`❌ Error de conexión con el servidor: ${error.message}`);
        } finally {
            btnProcesar.disabled = false; btnProcesar.textContent = 'Confirmar Pedido';
        }
    });

    const savedCart = loadStored(CART_STORAGE_KEY);
    if (savedCart.length) { cart = savedCart; recalculateCart(); }

    document.getElementById('cart-icon')?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    document.getElementById('cart-close')?.addEventListener('click', closeCart);
    document.getElementById('btn-continue-shopping')?.addEventListener('click', closeCart);
});