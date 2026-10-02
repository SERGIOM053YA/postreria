// ==========================================
// 1. CLIENTE SUPABASE & SESIÓN
// ==========================================
const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8';
// Inicialización limpia sin inyectar el token local
const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = [];
let pendingProduct = null;
let currentUser = null;
let esAdmin = false;

// Variables Modales
let hkMaxFruta = 1;
let hkMaxTopping = 1;
let selectedHkFrutas = [];
let selectedHkToppings = [];
let extraPapasCount = 1;
let hasPapasOption = false;

document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    renderOrders();

    document.querySelectorAll('.pill-btn:not(.hk-f-btn):not(.hk-t-btn)').forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.getAttribute('data-type');
            if (type) {
                document.querySelectorAll(`.pill-btn[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
});

async function verificarSesion() {
    try {
        const { data: { session }, error } = await cliente.auth.getSession();
        if (error || !session) return; 

        currentUser = session.user;

        // Consultar la tabla perfiles para extraer el rol oficial
        const { data: perfil } = await cliente
            .from('perfiles')
            .select('rol')
            .eq('id', currentUser.id)
            .single();

        // Validar si el rol en la base de datos es Administrador o es el correo principal
        if ((perfil && perfil.rol === 'Administrador') || currentUser.email.toLowerCase() === 'admin@reposteria.com') {
            esAdmin = true;
        }

        // Si es el administrador, encendemos el panel oculto del catálogo
        if (esAdmin) {
            const adminPanel = document.getElementById('admin-panel-global');
            if (adminPanel) adminPanel.style.display = 'block';
        }

        // Actualizamos el botón del Header con el nombre y su rol
        const userBtn = document.querySelector('.login-header-btn');
        if (userBtn) {
            const rolDisplay = (perfil && perfil.rol) ? perfil.rol : 'Cliente';
            userBtn.innerHTML = `<i class="fas fa-user-circle"></i> <span>${currentUser.email.split('@')[0]} (${rolDisplay})</span>`;
            userBtn.href = "#";
            userBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm('¿Deseas cerrar sesión?')) {
                    await cliente.auth.signOut();
                    localStorage.clear();
                    window.location.href = '../Login/login.html';
                }
            };
        }
    } catch (err) {
        console.error("Error verificando la sesión:", err);
    }
}

// ==========================================
// 2. MODALES Y AGREGADO AL CARRITO
// ==========================================
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

// 1. Atrapamos el ID en el modal
function openNoteModal(id, productName, price, details = '') {
    // Guardamos el ID junto con los demás datos
    pendingProduct = { id: id, name: productName, price: price, details: details };
    document.getElementById('note-modal-title').textContent = `📝 ${productName}`;
    document.getElementById('product-note-input').value = '';
    document.getElementById('note-modal').style.display = 'flex';
}

// 2. Lo pasamos al carrito al confirmar
function confirmAddWithNote() {
    if (!pendingProduct) return;
    const note = document.getElementById('product-note-input').value.trim();
    // Añadimos pendingProduct.id al envío
    addToCart(pendingProduct.id, pendingProduct.name, pendingProduct.price, pendingProduct.details, note);
    closeModal('note-modal');
    pendingProduct = null;
}

function openCrepaModal() { document.getElementById('crepa-modal').style.display = 'flex'; }

function addCustomCrepa() {
    const base = document.querySelector('.pill-btn.active[data-type="base"]')?.textContent || 'Lechera';
    const fruta = document.querySelector('.pill-btn.active[data-type="fruta"]')?.textContent || 'Fresa';
    const topping = document.querySelector('.pill-btn.active[data-type="topping"]')?.textContent || 'Nuez';
    
    let extraCost = 0;
    let extrasList = [];
    document.querySelectorAll('.extra-item:checked').forEach(item => {
        extraCost += parseFloat(item.value);
        extrasList.push(item.getAttribute('data-name'));
    });

    const totalPrice = 60 + extraCost;
    let details = `Base: ${base}, Fruta: ${fruta}, Topping: ${topping}`;
    if (extrasList.length > 0) details += ` | Extras: ${extrasList.join(', ')}`;

    closeModal('crepa-modal');
    openNoteModal('Crepa Personalizada', totalPrice, details);
}

function openSalsaModal(productName, price, hasPapas = false) {
    pendingProduct = { name: productName, price: price };
    hasPapasOption = hasPapas;
    extraPapasCount = 1;
    document.getElementById('salsa-modal-title').textContent = `🍗 Salsa para ${productName}`;
    document.getElementById('papas-extra-container').style.display = hasPapas ? 'block' : 'none';
    if (hasPapas) updatePapasDisplay();
    document.getElementById('salsa-modal').style.display = 'flex';
}

function changePapasQty(change) {
    if (extraPapasCount + change >= 1) {
        extraPapasCount += change;
        updatePapasDisplay();
    }
}

function updatePapasDisplay() {
    const grams = extraPapasCount * 100;
    const extraPrice = (extraPapasCount - 1) * 15;
    document.getElementById('papas-qty-display').textContent = `${extraPapasCount} porción(es) (${grams}g) ${extraPrice > 0 ? '(+$' + extraPrice + ' MXN)' : ''}`;
}

function addSalsaProduct() {
    const salsa = document.getElementById('salsa-select').value;
    let price = pendingProduct.price;
    let details = `Salsa: ${salsa}`;
    if (hasPapasOption) {
        const extraPapas = extraPapasCount - 1;
        details += extraPapas > 0 ? ` | Papas: ${extraPapasCount * 100}g (+${extraPapas} extra)` : ` | Papas: 100g incluidos`;
        price += extraPapas * 15;
    }
    closeModal('salsa-modal');
    openNoteModal(pendingProduct.name, price, details);
}

function openHotcakesModal(title, price, maxFruta, maxTopping) {
    pendingProduct = { name: `Mini Hotcakes ${title}`, price: price };
    hkMaxFruta = maxFruta;
    hkMaxTopping = maxTopping;
    selectedHkFrutas = [];
    selectedHkToppings = [];
    document.getElementById('hotcakes-modal-title').textContent = `🥞 ${title} ($${price})`;
    document.querySelectorAll('.hk-f-btn, .hk-t-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('hotcakes-modal').style.display = 'flex';
}

function toggleHkSelection(btn, type) {
    const val = btn.getAttribute('data-val');
    if (type === 'fruta') {
        if (selectedHkFrutas.includes(val)) {
            selectedHkFrutas = selectedHkFrutas.filter(item => item !== val);
            btn.classList.remove('active');
        } else if (selectedHkFrutas.length < hkMaxFruta) {
            selectedHkFrutas.push(val);
            btn.classList.add('active');
        }
    } else if (type === 'topping') {
        if (selectedHkToppings.includes(val)) {
            selectedHkToppings = selectedHkToppings.filter(item => item !== val);
            btn.classList.remove('active');
        } else if (selectedHkToppings.length < hkMaxTopping) {
            selectedHkToppings.push(val);
            btn.classList.add('active');
        }
    }
}

function addHotcakesProduct() {
    if (selectedHkFrutas.length === 0 || selectedHkToppings.length === 0) return alert('Selecciona al menos 1 fruta y 1 topping.');
    const details = `Frutas: ${selectedHkFrutas.join(', ')} | Toppings: ${selectedHkToppings.join(', ')}`;
    closeModal('hotcakes-modal');
    openNoteModal(pendingProduct.name, pendingProduct.price, details);
}

function openDrinkFlavorModal(drinkName, price, flavors) {
    pendingProduct = { name: drinkName, price: price };
    document.getElementById('drink-modal-title').textContent = `🥤 ${drinkName}`;
    const select = document.getElementById('drink-flavor-select');
    select.innerHTML = '';
    flavors.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        select.appendChild(opt);
    });
    document.getElementById('drink-comment').value = '';
    document.getElementById('drink-flavor-modal').style.display = 'flex';
}

function addDrinkProduct() {
    const flavor = document.getElementById('drink-flavor-select').value;
    const comment = document.getElementById('drink-comment').value.trim();
    closeModal('drink-flavor-modal');
    addToCart(`${pendingProduct.name} (${flavor})`, pendingProduct.price, `Sabor: ${flavor}`, comment);
}

// ==========================================
// 3. LÓGICA DEL CARRITO
// ==========================================
// 3. El carrito guarda el ID de base de datos (y genera un uniqueId para borrar/sumar en el front)
function addToCart(productId, name, price, details = '', note = '') {
    const existingIndex = cart.findIndex(item => item.name === name && item.details === details && item.note === note);
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        // Guardamos el productId real de Supabase
        cart.push({ 
            productId: productId, 
            uniqueId: Date.now(), 
            name: name, 
            price: price, 
            details: details, 
            note: note, 
            qty: 1 
        });
    }
    renderCart();
    openCart();
}

function updateQuantity(id, change) {
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) cart.splice(index, 1);
    }
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const badge = document.querySelector('.cart-badge');
    const totalPriceEl = document.getElementById('cart-total-price');

    container.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p class="cart-empty-msg">Tu carrito está vacío 🍧<br>¡Agrega algo delicioso!</p>';
    } else {
        cart.forEach(item => {
            total += item.price * item.qty;
            totalItems += item.qty;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    ${item.details ? `<p>${item.details}</p>` : ''}
                    ${item.note ? `<p class="cart-item-note">Nota: "${item.note}"</p>` : ''}
                    <p><strong>$${item.price.toFixed(2)} c/u</strong></p>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <i class="fas fa-trash-alt delete-btn" onclick="removeFromCart(${item.id})"></i>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    }
    totalPriceEl.textContent = `$${total.toFixed(2)} MXN`;
    if (badge) badge.textContent = totalItems;
}

function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-drawer-overlay').classList.add('active');
}

function closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-drawer-overlay').classList.remove('active');
}

// ==========================================
// 4. CHECKOUT Y ENVÍO A SUPABASE (KDS)
// ==========================================
async function checkout() {
    if (cart.length === 0) return alert('Tu carrito está vacío.');
    
    const { data: { session } } = await cliente.auth.getSession();
    if (!session) {
        alert('Por favor inicia sesión para realizar un pedido.');
        window.location.href = '../Login/login.html';
        return;
    }
    currentUser = session.user;

    const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const pagoEfectivo = confirm('¿Pagas en Efectivo al recibir? (Cancelar = Transferencia SPEI)');
    const metodoPago = pagoEfectivo ? 'Efectivo' : 'Transferencia SPEI';
    const estadoInicial = pagoEfectivo ? 'Por Preparar' : 'Pendiente de Validación';
    const aDomicilio = confirm('¿Es pedido A Domicilio? (Cancelar = Recoger en Local)');
    
    let lat = null, lon = null, direccion = 'Recoger en Mostrador';
    
    if (aDomicilio) {
        direccion = prompt('Ingresa tu dirección de entrega en Mathzi 2:') || 'Calle local';
        lat = 19.6030000; 
        lon = -99.0530000;
    }

    const { data: pedido, error: errorPedido } = await cliente
        .from('pedidos')
        .insert([{
            cliente_nombre: currentUser.email.split('@')[0],
            cliente_telefono: "5512345678",
            tipo_entrega: aDomicilio ? 'A Domicilio' : 'Recoger en Local',
            metodo_pago: metodoPago,
            estado: estadoInicial,
            total: orderTotal,
            latitud: lat,
            longitud: lon,
            direccion_entrega: direccion
        }])
        .select()
        .single();

    if (errorPedido) {
        alert('Error al enviar el pedido: ' + errorPedido.message);
        return;
    }

// 2. Insertar los ítems del carrito en `pedido_items`
    const pedidoItemsData = cart.map(item => ({
        pedido_id: pedido.id, 
        producto_id: item.productId, // ¡Aquí pasamos el ID real de tu catálogo!
        cantidad: item.qty,
        precio_unitario: item.price
    }));

    await cliente.from('pedido_items').insert(pedidoItemsData);

    const storedOrders = JSON.parse(localStorage.getItem('hildas_orders') || '[]');
    storedOrders.unshift({
        id: `PED-${pedido.id}`,
        date: new Date().toLocaleString(),
        items: [...cart],
        total: orderTotal,
        status: estadoInicial
    });
    localStorage.setItem('hildas_orders', JSON.stringify(storedOrders));

    cart = [];
    renderCart();
    closeCart();
    renderOrders();

    alert(`¡Orden #${pedido.id} enviada exitosamente a la cocina!`);
    document.getElementById('pedidos-section').scrollIntoView({ behavior: 'smooth' });
}

function renderOrders() {
    const ordersList = document.getElementById('orders-list');
    const storedOrders = JSON.parse(localStorage.getItem('hildas_orders') || '[]');

    if (storedOrders.length === 0) {
        ordersList.innerHTML = '<p class="no-orders-msg">No hay pedidos registrados aún.</p>';
        return;
    }

    ordersList.innerHTML = '';
    storedOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        let itemsHtml = order.items.map(item => `
            <li>
                <strong>${item.qty}x ${item.name}</strong> - $${(item.price * item.qty).toFixed(2)}
                ${item.details ? `<br><small style="color: #8d7b7a;">${item.details}</small>` : ''}
                ${item.note ? `<br><small style="color: #ff6584;">Nota: ${item.note}</small>` : ''}
            </li>
        `).join('');

        orderCard.innerHTML = `
            <div class="order-header">
                <span><i class="fas fa-receipt"></i> ${order.id}</span>
                <span><i class="fas fa-clock"></i> ${order.status || 'En Proceso'}</span>
            </div>
            <div class="order-body">
                <ul>${itemsHtml}</ul>
            </div>
            <div class="order-footer">
                Total: $${order.total.toFixed(2)} MXN
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}

function addToCart(name, price, details = '', note = '') {
    const existingIndex = cart.findIndex(item => item.name === name && item.details === details && item.note === note);
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ id: Date.now(), name, price, details, note, qty: 1 });
    }
    renderCart(); //
    openCart(); //
} //[cite: 3]

function updateQuantity(id, change) {
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) cart.splice(index, 1);
    }
    renderCart(); //[cite: 3]
} //[cite: 3]

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart(); //[cite: 3]
} //[cite: 3]
// ==========================================
// 5. CREAR NUEVO PRODUCTO (PANEL CENTRALIZADO ADMIN)
// ==========================================
async function createNewProductAdmin() {
    if (!esAdmin) return alert('Acción restringida a administradores.');

    const nameInput = document.getElementById('name-admin');
    const descInput = document.getElementById('desc-admin');
    const priceInput = document.getElementById('price-admin');
    const catInput = document.getElementById('cat-admin');
    const fileInput = document.getElementById('file-admin');
    
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const categoryId = parseInt(catInput.value);

    if (!name || isNaN(price) || price <= 0) return alert('Nombre y precio requeridos.');

    const btnGuardar = document.querySelector('#admin-panel-global .btn-add-cute');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btnGuardar.disabled = true;

    try {
        let imgUrl = null;
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `catalogo/${fileName}`;
            
            const { error: uploadError } = await cliente.storage.from('menu-imagenes').upload(filePath, file);
            if (!uploadError) {
                const { data } = cliente.storage.from('menu-imagenes').getPublicUrl(filePath);
                imgUrl = data.publicUrl;
            } else {
                console.error("Error subiendo imagen:", uploadError);
            }
        }

        const { error: dbError } = await cliente.from('productos').insert([{
            nombre: name,
            descripcion: descInput.value.trim(),
            precio: price,
            imagen_url: imgUrl,
            categoria_id: categoryId,
            es_temporada: false
        }]);

        if (dbError) throw dbError;
        
        alert('¡Producto guardado exitosamente en el catálogo oficial de Supabase!');
        
        nameInput.value = '';
        descInput.value = '';
        priceInput.value = '';
        fileInput.value = '';
        document.getElementById('label-text-admin').textContent = 'Subir Fotografía';
    } catch (err) {
        alert('Error al guardar: ' + err.message);
    } finally {
        btnGuardar.innerHTML = originalText;
        btnGuardar.disabled = false;
    }
    async function checkout() {
    if (cart.length === 0) return alert('Tu carrito está vacío.'); //[cite: 3]
    
    // Verificación de sesión previa requerida
    if (!currentUser) {
        alert('Por favor inicia sesión para realizar un pedido.'); //[cite: 3]
        return;
    } //[cite: 3]

    const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0); //[cite: 3]
    
    // Selección de métodos mediante confirmaciones del navegador
    const pagoEfectivo = confirm('¿Pagas en Efectivo al recibir? (Cancelar = Transferencia SPEI)'); //[cite: 3]
    const metodoPago = pagoEfectivo ? 'Efectivo' : 'Transferencia SPEI'; //[cite: 3]
    const estadoInicial = pagoEfectivo ? 'Por Preparar' : 'Pendiente de Validación'; //[cite: 3]
    
    const aDomicilio = confirm('¿Es pedido A Domicilio? (Cancelar = Recoger en Local)'); //[cite: 3]
    let lat = null, lon = null, direccion = 'Recoger en Mostrador'; //[cite: 3]
    
    if (aDomicilio) {
        direccion = prompt('Ingresa tu dirección de entrega:') || 'Calle local'; //[cite: 3]
        // Coordenadas fijas temporales para pruebas
        lat = 19.6030000; //[cite: 3]
        lon = -99.0530000; //[cite: 3]
    }

    // 1. Insertar orden maestra en la tabla `pedidos`
    const { data: pedido, error: errorPedido } = await cliente
        .from('pedidos')
        .insert([{
            cliente_nombre: currentUser.email.split('@')[0], //[cite: 3]
            cliente_telefono: "5512345678", //[cite: 3]
            tipo_entrega: aDomicilio ? 'A Domicilio' : 'Recoger en Local', //[cite: 3]
            metodo_pago: metodoPago, //[cite: 3]
            estado: estadoInicial, //[cite: 3]
            total: orderTotal, //[cite: 3]
            latitud: lat, //[cite: 3]
            longitud: lon, //[cite: 3]
            direccion_entrega: direccion //[cite: 3]
        }])
        .select()
        .single(); //[cite: 3]

    if (errorPedido) {
        alert('Error al enviar el pedido: ' + errorPedido.message); //[cite: 3]
        return;
    }

    // 2. Insertar los ítems del carrito en `pedido_items`
    const pedidoItemsData = cart.map(item => ({
        pedido_id: pedido.id, //[cite: 3]
        producto_id: 1, // IMPORTANTE: En producción este debe ser el ID real de tu catálogo[cite: 3]
        cantidad: item.qty, //[cite: 3]
        precio_unitario: item.price //[cite: 3]
    })); //[cite: 3]

    await cliente.from('pedido_items').insert(pedidoItemsData); //[cite: 3]

    // Limpiar el carrito y actualizar la vista visualmente
    cart = []; //[cite: 3]
    renderCart(); //[cite: 3]
    closeCart(); //[cite: 3]
    
    alert(`¡Orden #${pedido.id} enviada exitosamente a la cocina!`); //[cite: 3]
} //[cite: 3]
}