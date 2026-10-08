document.addEventListener('DOMContentLoaded', async () => {
    const CART_STORAGE_KEY = 'hilda_shopping_cart';
    const loadStored = (key, fallback = []) => {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch { return fallback; }
    };

    let cart = [];
    let pendingProduct = null;
    let catalogoDB = [];

   // ==========================================
    // 1. SESIÓN Y SEGURIDAD
    // ==========================================
    function validarSesionEnNavegacion() {
        const tokenLocal = localStorage.getItem('sb_access_token');
        const userEmail = localStorage.getItem('sb_user_email');

        if (tokenLocal && userEmail) {
            const nombreUsuario = userEmail.split('@')[0];
            
            // Usamos un intervalo para esperar a que header.js inyecte el HTML
            const intervalo = setInterval(() => {
                const botonesLogin = document.querySelectorAll('.login-header-btn, .btn-login-header, #login-btn, a[href*="login.html"]');

                if (botonesLogin.length > 0) {
                    clearInterval(intervalo); // Botones encontrados, detenemos la búsqueda
                    
                    botonesLogin.forEach(btn => {
                        // EXCLUSIÓN CRÍTICA: Solo modificamos si NO es el botón del admin
                        // y verificamos que no lo hayamos modificado ya
                        if (btn.id !== 'admin-btn' && !btn.dataset.sesionActiva) {
                            btn.dataset.sesionActiva = 'true';
                            btn.innerHTML = `<i class="fas fa-sign-out-alt"></i><span>Salir (${nombreUsuario})</span>`;
                            btn.href = '#';
                            btn.style.backgroundColor = '#f8e7ec'; 
                            btn.style.color = '#8d3d54';
                            btn.style.borderColor = '#ffccd8';
                            
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                if (confirm('¿Deseas cerrar sesión?')) {
                                    localStorage.removeItem('sb_access_token');
                                    localStorage.removeItem('sb_user_email');
                                    localStorage.removeItem('sb_user_id');
                                    window.location.reload(); 
                                }
                            });
                        }
                    });

                    // Si eres tú, simplemente encendemos el Panel KDS original
                    if (userEmail.toLowerCase() === 'admin@reposteria.com') {
                        const adminBtns = document.querySelectorAll('#admin-btn');
                        adminBtns.forEach(btn => btn.style.display = 'inline-flex');
                    }
                    // Encendemos el botón de historial para CUALQUIER usuario logueado
                    const historialBtns = document.querySelectorAll('#historial-btn');
                    historialBtns.forEach(btn => btn.style.display = 'inline-flex');
                }
            }, 100); // Revisa la pantalla cada 100 milisegundos
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
    // 3. SINCRONIZAR CATÁLOGO DESDE PHP
    // ==========================================
    try {
        const response = await fetch('../api/productos.php');
        if (response.ok) {
            const catalogoDB = await response.json();
            
            // 1. Sincronización para las TARJETAS NORMALES (Postres, Bebidas, Snacks, Crepas)
            document.querySelectorAll('.product-card').forEach(card => {
                if (!card.id || !card.id.includes('product-')) return;
                const dbId = card.id.replace('product-', '');
                const dbProd = catalogoDB.find(p => String(p.id) === String(dbId));
                
                if (dbProd) {
                    const estaAgotado = dbProd.disponible === false || dbProd.disponible === 0 || dbProd.disponible === '0' || dbProd.disponible === 'false' || dbProd.disponible === 'f';
                    const name = card.querySelector('h3, .flavor-card-name')?.textContent || '';
                    const priceEl = card.querySelector('.product-price');
                    
                    if (estaAgotado) {
                        card.style.pointerEvents = 'none';
                        
                        // Inyectar etiqueta de Agotado
                        if (!card.querySelector('.badge-agotado')) {
                            card.insertAdjacentHTML('afterbegin', '<div class="bestseller-badge badge-agotado" style="background-color: #81747a;">Agotado</div>');
                        }
                        
                        // Filtros grises
                        const img = card.querySelector('.product-img');
                        if (img) { img.style.filter = 'grayscale(100%)'; img.style.opacity = '0.6'; }
                        const info = card.querySelector('.product-info');
                        if (info) info.style.opacity = '0.6';
                        
                        // Botón bloqueado
                        const btn = card.querySelector('.btn-add-cart');
                        if (btn) {
                            btn.disabled = true;
                            btn.style.backgroundColor = '#ccc';
                            btn.style.border = 'none';
                            btn.style.cursor = 'not-allowed';
                            btn.innerHTML = '<i class="fas fa-ban"></i>';
                        }
                        
                        if (priceEl && !name.toLowerCase().includes('crepa') && !name.toLowerCase().includes('hotcake')) {
                            priceEl.textContent = `$${Number(dbProd.precio).toFixed(2)}`;
                        }
                        return; 
                    }

                    // RESTAURAR SI ESTÁ DISPONIBLE
                    card.dataset.producto_id = dbProd.id; 
                    card.style.pointerEvents = 'auto';
                    
                    const oldBadge = card.querySelector('.badge-agotado');
                    if (oldBadge) oldBadge.remove();
                    
                    const img = card.querySelector('.product-img');
                    if (img) { img.style.filter = 'none'; img.style.opacity = '1'; }
                    const info = card.querySelector('.product-info');
                    if (info) info.style.opacity = '1';
                    
                    const btn = card.querySelector('.btn-add-cart');
                    if (btn) {
                        btn.disabled = false;
                        btn.style.backgroundColor = '';
                        btn.style.border = '';
                        btn.style.cursor = 'pointer';
                        btn.innerHTML = '<i class="fas fa-plus"></i>';
                    }

                    if (priceEl && !name.toLowerCase().includes('crepa') && !name.toLowerCase().includes('hotcake')) {
                        priceEl.textContent = `$${Number(dbProd.precio).toFixed(2)}`;
                    }
                }
            });

            // 2. Sincronización exclusiva para los botones de MINI HOTCAKES
            document.querySelectorAll('.hotcakes-size-btn').forEach(btn => {
                const onclickAttr = btn.getAttribute('onclick') || '';
                const match = onclickAttr.match(/openHotcakesModal\(\s*(\d+)/);
                
                if (match) {
                    const dbId = match[1];
                    const dbProd = catalogoDB.find(p => String(p.id) === String(dbId));
                    
                    if (dbProd) {
                        const estaAgotado = dbProd.disponible === false || dbProd.disponible === 0 || dbProd.disponible === '0' || dbProd.disponible === 'false' || dbProd.disponible === 'f';
                        
                        if (estaAgotado) {
                            btn.style.opacity = '0.5';
                            btn.style.pointerEvents = 'none';
                            btn.style.filter = 'grayscale(80%)';
                            
                            const priceEl = btn.querySelector('.size-price');
                            if (priceEl) {
                                priceEl.textContent = 'Agotado';
                                priceEl.style.color = '#e95072';
                            }
                        } else {
                            btn.style.opacity = '1';
                            btn.style.pointerEvents = 'auto';
                            btn.style.filter = 'none';
                            
                            const priceEl = btn.querySelector('.size-price');
                            if (priceEl) {
                                priceEl.textContent = `$${Number(dbProd.precio).toFixed(2)}`;
                                priceEl.style.color = '#333';
                            }
                        }
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
                <img src="${item.img || '../logo.png'}" class="cart-item-img">
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
        // Validación segura del precio
        let priceNum = 0;
        if (typeof product.price === 'string') {
            priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ''));
        } else if (typeof product.priceNum !== 'undefined') {
            priceNum = product.priceNum;
        } else {
            priceNum = parseFloat(product.price);
        }

        cart.push({
            producto_id: product.producto_id || product.id || 1,
            name: product.name,
            price: priceNum,
            img: product.img,
            desc: product.desc || '', // <--- ¡AQUÍ ATRAPAMOS LOS CHECKBOXES DE LA CREPA!
            instructions: instructions, // Aquí atrapamos el texto escrito
            quantity: 1
        });
        recalculateCart();
        openCart();
    };
    window.addProductToCart = addProductToCart;
    window.addHotcakeToCart = addProductToCart;

    // ==========================================
    // LÓGICA EXCLUSIVA DE MINI HOTCAKES
    // ==========================================
    let currentHotcakeConfig = { producto_id: 0, type: '', title: '', price: 0 };

    window.openHotcakesModal = function(id, type, title, price) {
        currentHotcakeConfig = { producto_id: id, type: type, title: title, price: price };
        
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-subtitle').textContent = `$${price}.00 MXN - Personaliza tu pedido`;
        
        // Resetear checkboxes y campos al abrir
        const form = document.getElementById('hotcakes-form');
        if (form) form.reset();
        
        // Asegurar que inicie en el paso 1
        document.getElementById('step-selection').style.display = 'block';
        document.getElementById('step-instructions').style.display = 'none';
        
        document.getElementById('hotcakes-modal').style.display = 'flex';
    };

    window.closeHotcakesModal = function() {
        document.getElementById('hotcakes-modal').style.display = 'none';
    };

    window.goToInstructionsStep = function() {
        document.getElementById('step-selection').style.display = 'none';
        document.getElementById('step-instructions').style.display = 'block';
    };

    window.handleFormSubmit = function(e) {
        e.preventDefault();
        
        const special = currentHotcakeConfig.type === 'especial';
        
        // Captura dinámica según si es normal o especial
        const frutas = Array.from(document.querySelectorAll(special ? 'input[name="fruta_especial"]:checked' : 'input[name="fruta"]:checked'), input => input.value);
        const toppings = Array.from(document.querySelectorAll(special ? 'input[name="topping_especial"]:checked' : 'input[name="topping"]:checked'), input => input.value);
        const extrasTopping = Array.from(document.querySelectorAll('input[name="extra_topping"]:checked'), input => input.value);
        const extrasFruta = Array.from(document.querySelectorAll('input[name="extra_fruta"]:checked'), input => input.value);
        const comentario = document.getElementById('personal-instructions').value.trim();
        
        // Calcula precio base + $5 extra por cada topping o fruta adicional
        const precioFinal = currentHotcakeConfig.price + ((extrasTopping.length + extrasFruta.length) * 5);
        const piezas = currentHotcakeConfig.type.includes('12') ? '12 piezas' : '25 piezas';

        // Construye el resumen de ingredientes (propiedad desc) para la cocina
        let desc = `${piezas} · Fruta: ${frutas.join(', ') || 'Ninguna'} · Topping: ${toppings.join(', ') || 'Ninguno'}`;
        if (extrasFruta.length > 0) desc += ` · Extra Fruta: ${extrasFruta.join(', ')}`;
        if (extrasTopping.length > 0) desc += ` · Extra Topping: ${extrasTopping.join(', ')}`;

        window.closeHotcakesModal();

        // Enviar producto final al motor del carrito
        window.addProductToCart({
            id: currentHotcakeConfig.producto_id, // Atrapa el ID real para Supabase
            name: currentHotcakeConfig.title,
            price: precioFinal,                   // Precio con los cobros extra
            desc: desc,                           // Checkboxes seleccionados
            img: './images/mini_hotcakes.jpg'     // Miniatura para el carrito lateral
        }, comentario);
    };
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
    // 5. REDIRECCIÓN A PÁGINA DE ENVÍO
    // ==========================================
    document.getElementById('btn-abrir-checkout')?.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('⚠️ Tu carrito está vacío. Agrega productos para continuar.');
            return;
        }

        const tokenLocal = localStorage.getItem('sb_access_token');
        if (!tokenLocal) {
            alert('Por favor, inicia sesión para procesar tu pedido.');
            window.location.href = './Login/login.html'; 
            return;
        }

        persistCart();
        closeCart();
        window.location.href = './Envio/Envio.html'; 
    });

    const savedCart = loadStored(CART_STORAGE_KEY);
    if (savedCart.length) { cart = savedCart; recalculateCart(); }

    // Interceptar el clic en el carrito globalmente (solución del error del ícono)
    document.addEventListener('click', (e) => {
        if (e.target.closest('#cart-icon') || e.target.closest('.cart-icon')) {
            e.preventDefault();
            openCart();
        }
    });

    // Validar sesión si el navbar se inyecta tarde
    setTimeout(validarSesionEnNavegacion, 500);

    document.getElementById('cart-close')?.addEventListener('click', closeCart);
    document.getElementById('btn-continue-shopping')?.addEventListener('click', closeCart);
});