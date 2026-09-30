document.addEventListener('DOMContentLoaded', async () => {
    const CART_STORAGE_KEY = 'hilda_shopping_cart';
    const loadStored = (key, fallback = []) => {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch { return fallback; }
    };

    // 1. INICIALIZAR SUPABASE
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8';
    window.cliente = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    // 2. INYECTAR HTML DEL CARRITO Y MODALES
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
            <p class="custom-modal-subtitle">Personaliza tu pedido antes de agregarlo al carrito</p>
            <form id="custom-modal-form" onsubmit="return false;">
                <div id="sauce-step" style="display:none;">
                    <label class="custom-modal-label" for="custom-modal-sauce">Elige la salsa:</label>
                    <select id="custom-modal-sauce" class="custom-modal-textarea">
                        <option value="">Selecciona una salsa</option>
                        <option value="Mango habanero">Mango habanero</option>
                        <option value="BBQ">BBQ</option>
                        <option value="Tamarindo habanero">Tamarindo habanero</option>
                        <option value="Cajún">Cajún</option>
                        <option value="Búfalo">Búfalo</option>
                    </select>
                    <button type="button" class="btn-custom-add-cart" id="btn-sauce-continue">Continuar a instrucciones</button>
                </div>
                <div id="instructions-step">
                    <label class="custom-modal-label" for="custom-modal-instructions"><span style="font-size: 1.15rem;">💬</span> Instrucciones especiales (opcional):</label>
                    <textarea id="custom-modal-instructions" class="custom-modal-textarea" placeholder="Ej: Con poco picante..."></textarea>
                    <button type="button" class="btn-custom-add-cart" id="btn-custom-add-cart"><i class="fas fa-shopping-cart"></i> Agregar al carrito</button>
                </div>
            </form>
        </div>
    </div>
    <div class="cart-overlay" id="cart-overlay" style="display: none; opacity: 0; transition: opacity 0.3s ease;">
        <aside class="cart-sidebar" id="cart-sidebar" style="transform: translateX(100%); transition: transform 0.3s ease;">
            <div class="cart-header">
                <div class="cart-title-area"><i class="fas fa-shopping-cart cart-icon"></i><h2>Tu carrito</h2><span class="cart-badge">0</span></div>
                <button class="cart-close" id="cart-close" type="button"><i class="fas fa-times"></i></button>
            </div>
            <div class="cart-items" id="cart-items-container"><p class="cart-empty-message">Tu carrito está vacío.</p></div>
            <div class="cart-summary">
                <div class="summary-row"><span>Subtotal</span><span id="cart-subtotal">$0.00</span></div>
                <div class="summary-row"><span>Envío</span><span>$0.00</span></div>
                <div class="summary-total"><span>Total</span><span class="total-price" id="cart-total">$0.00</span></div>
                <div class="cart-buttons">
                    <button class="btn-checkout" type="button"><i class="fas fa-lock"></i> Finalizar compra</button>
                    <button class="btn-continue" id="btn-continue-shopping" type="button"><i class="fas fa-arrow-left"></i> Seguir comprando</button>
                </div>
            </div>
        </aside>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', cartHTML);

    // 3. SINCRONIZAR CATÁLOGO CON LA BASE DE DATOS
    let catalogoDB = [];
    if (window.cliente) {
        const { data, error } = await window.cliente.from('productos').select('*');
        if (!error && data) {
            catalogoDB = data;
            sincronizarDOM();
        }
    }

    function sincronizarDOM() {
        document.querySelectorAll('.product-card').forEach(card => {
            const titleEl = card.querySelector('h3, .flavor-card-name');
            if (!titleEl) return;
            
            let name = titleEl.textContent.replace('♡', '').replace(/\n/g, ' ').trim();
            
            if (titleEl.classList.contains('flavor-card-name')) {
                const prefix = card.querySelector('.cat-prefix')?.textContent.trim() || '';
                const clone = titleEl.cloneNode(true);
                if (clone.querySelector('.cat-prefix')) clone.querySelector('.cat-prefix').remove();
                name = `${prefix} ${clone.textContent.trim()}`.replace(/\s+/g, ' ');
            }

            const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            const dbProd = catalogoDB.find(p => normalize(p.nombre).includes(normalize(name)) || normalize(name).includes(normalize(p.nombre)));
            
            if (dbProd) {
                // INYECTAR ID REAL DE LA BASE DE DATOS
                card.dataset.producto_id = dbProd.id; 
                card.setAttribute('data-producto_id', dbProd.id);
                
                const priceEl = card.querySelector('.product-price');
                if (priceEl && !name.toLowerCase().includes('crepa') && !name.toLowerCase().includes('hotcake')) {
                    priceEl.textContent = `$${Number(dbProd.precio).toFixed(2)}`;
                }
            }
        });
    }

    // Elementos del DOM
    const cartIcon = document.getElementById('cart-icon');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.getElementById('cart-close');
    const btnContinue = document.getElementById('btn-continue-shopping');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const customModalOverlay = document.getElementById('custom-modal-overlay');
    const customModal = document.getElementById('custom-modal');
    
    let pendingProduct = null;

    const escapeHTML = (str) => { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; };

    const openCart = () => { cartOverlay.style.display = 'flex'; setTimeout(() => { cartOverlay.style.opacity = '1'; cartSidebar.style.transform = 'translateX(0)'; }, 10); };
    const closeCart = () => { cartOverlay.style.opacity = '0'; cartSidebar.style.transform = 'translateX(100%)'; setTimeout(() => { cartOverlay.style.display = 'none'; }, 300); };

    const openCustomModal = (product) => {
        pendingProduct = product;
        document.getElementById('custom-modal-title').textContent = product.name;
        document.getElementById('custom-modal-instructions').value = '';
        document.getElementById('custom-modal-sauce').value = '';
        document.getElementById('sauce-step').style.display = product.requiresSauce ? 'block' : 'none';
        document.getElementById('instructions-step').style.display = product.requiresSauce ? 'none' : 'block';
        customModalOverlay.style.display = 'flex';
        setTimeout(() => { customModalOverlay.classList.add('show'); customModal.classList.add('show'); }, 10);
    };

    const closeCustomModal = () => {
        customModalOverlay.classList.remove('show'); customModal.classList.remove('show');
        setTimeout(() => { customModalOverlay.style.display = 'none'; pendingProduct = null; }, 300);
    };

    const persistCart = () => {
        const items = Array.from(cartItemsContainer.querySelectorAll('.cart-item')).map(item => {
            // EXTRACCIÓN 100% SEGURA (Tratando el ID como Texto/UUID, eliminando parseInt)
            let rawId = item.dataset.producto_id || item.getAttribute('data-producto_id');
            let cleanId = (rawId && rawId !== 'undefined' && rawId !== 'null') ? String(rawId) : null;

            return {
                producto_id: cleanId,
                name: item.querySelector('.cart-item-title')?.textContent.trim() || 'Producto',
                desc: item.querySelector('.cart-item-desc')?.textContent.trim() || '',
                price: item.querySelector('.cart-item-price')?.textContent.trim() || '$0.00',
                img: item.querySelector('.cart-item-img')?.getAttribute('src') || '',
                instructions: item.dataset.instructions || '',
                quantity: Math.max(1, parseInt(item.querySelector('.cart-item-quantity input')?.value || '1', 10) || 1)
            };
        });
        
        console.log('📦 Guardando en LocalStorage:', items.map(i => ({nombre: i.name, id: i.producto_id})));
        try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch (e) { }
    };

    const recalculateCart = () => {
        let subtotal = 0; let totalItems = 0;
        cartItemsContainer.querySelectorAll('.cart-item').forEach(item => {
            const price = parseFloat((item.querySelector('.cart-item-price')?.textContent || '$0').replace(/[^0-9.]/g, '')) || 0;
            const qty = parseInt(item.querySelector('.cart-item-quantity input')?.value || 1) || 1;
            subtotal += price * qty; totalItems += qty;
        });
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;

        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = totalItems; badge.style.transform = 'scale(1.4)';
            setTimeout(() => badge.style.transform = 'scale(1)', 220);
        });
        persistCart();
    };

    const addProductToCart = (product, instructions, quantity = 1) => {
        cartItemsContainer.querySelector('.cart-empty-message')?.remove();
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.dataset.instructions = instructions || '';
        
        if (product.producto_id && product.producto_id !== 'null') {
            itemEl.dataset.producto_id = product.producto_id;
            itemEl.setAttribute('data-producto_id', product.producto_id);
        }
        
        const noteHTML = instructions ? `<div class="cart-item-note"><i class="fas fa-comment-dots"></i> <span>"${escapeHTML(instructions)}"</span></div>` : '';

        itemEl.innerHTML = `
            <img src="${product.img || './logo.png'}" alt="${escapeHTML(product.name)}" class="cart-item-img">
            <div class="cart-item-info">
                <h3 class="cart-item-title">${escapeHTML(product.name)}</h3>
                ${noteHTML}
                <p class="cart-item-desc">${escapeHTML(product.desc || '')}</p>
                <span class="cart-item-price">${escapeHTML(product.price || '$50.00')}</span>
                <div class="cart-item-quantity">
                    <button type="button" class="btn-qty-minus"><i class="fas fa-minus"></i></button>
                    <input type="number" value="${Math.max(1, Number(quantity) || 1)}" min="1">
                    <button type="button" class="btn-qty-plus"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <button class="cart-item-delete" type="button"><i class="far fa-trash-alt"></i></button>
        `;
        cartItemsContainer.prepend(itemEl);
        recalculateCart();
    };

    window.addHotcakeToCart = (product) => { 
        const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const dbProd = catalogoDB.find(p => normalize(p.nombre).includes(normalize(product.name || product.title)));
        if(dbProd) product.producto_id = dbProd.id;
        
        addProductToCart(product, product.instructions || ''); 
        openCart(); 
    };

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-cart');
        if (!btn || btn.closest('a[href]')) return;
        e.preventDefault(); e.stopPropagation();

        const card = btn.closest('.product-card');
        if (!card) return;

        const name = card.querySelector('h3, .flavor-card-name')?.textContent.trim().replace(/\s+/g, ' ') || 'Producto Especial';
        const price = card.querySelector('.product-price')?.textContent.trim() || '$50.00';
        const img = card.querySelector('.product-img')?.src || '';
        const desc = card.querySelector('.flavor-card-desc, .product-info p')?.textContent.trim() || '';
        
        // EXTRACCIÓN SEGURA COMO TEXTO AL DAR CLIC
        let rawId = card.dataset.producto_id || card.getAttribute('data-producto_id');
        const producto_id = (rawId && rawId !== 'undefined' && rawId !== 'null') ? String(rawId) : null;
        
        console.log('🛒 Clic en producto:', name, '| ID capturado:', producto_id);

        const requiresSauce = ['product-alitas', 'product-alitas-con-papas', 'product-boneless', 'product-boneless-con-papas'].includes(card.id);
        openCustomModal({ name, price, img, desc, requiresSauce, producto_id });
    });

    const sauceContinue = document.getElementById('btn-sauce-continue');
    if (sauceContinue) sauceContinue.addEventListener('click', () => {
        if (!pendingProduct || !document.getElementById('custom-modal-sauce').value) return document.getElementById('custom-modal-sauce').focus();
        pendingProduct.desc = `Salsa: ${document.getElementById('custom-modal-sauce').value}`;
        document.getElementById('sauce-step').style.display = 'none';
        document.getElementById('instructions-step').style.display = 'block';
    });

    document.getElementById('btn-custom-add-cart')?.addEventListener('click', () => {
        if (!pendingProduct) return;
        addProductToCart(pendingProduct, document.getElementById('custom-modal-instructions').value.trim());
        closeCustomModal();
        setTimeout(openCart, 250);
    });

    document.getElementById('custom-modal-close')?.addEventListener('click', closeCustomModal);
    
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            const btnPlus = e.target.closest('.btn-qty-plus'), btnMinus = e.target.closest('.btn-qty-minus'), btnDelete = e.target.closest('.cart-item-delete');
            if (btnPlus) { const input = btnPlus.parentElement.querySelector('input'); input.value = parseInt(input.value) + 1; recalculateCart(); }
            else if (btnMinus) { const input = btnMinus.parentElement.querySelector('input'); if (parseInt(input.value) > 1) { input.value = parseInt(input.value) - 1; recalculateCart(); } }
            else if (btnDelete) { const item = btnDelete.closest('.cart-item'); item.style.opacity = '0'; setTimeout(() => { item.remove(); recalculateCart(); }, 250); }
        });
        cartItemsContainer.addEventListener('input', (e) => { if (e.target.matches('.cart-item-quantity input')) { e.target.value = Math.max(1, parseInt(e.target.value)||1); recalculateCart(); } });
    }

    if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (btnContinue) btnContinue.addEventListener('click', () => { location.pathname.toLowerCase().endsWith('/carrito.html') ? location.href = 'inicio.html' : closeCart(); });
    
    document.querySelector('.btn-checkout')?.addEventListener('click', () => {
        if (!cartItemsContainer.querySelector('.cart-item')) return alert('Agrega productos al carrito.');
        persistCart(); location.href = 'Envio/Envio.html';
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCustomModal(); closeCart(); } });

    window.openCart = openCart; window.closeCart = closeCart; window.openProductCustomModal = openCustomModal; window.addProductToCart = addProductToCart;

    const savedCart = loadStored(CART_STORAGE_KEY);
    if (savedCart.length) { cartItemsContainer.innerHTML = ''; savedCart.forEach(item => addProductToCart(item, item.instructions || '', item.quantity)); }
    recalculateCart();
});