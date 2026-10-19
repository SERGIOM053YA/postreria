// ==========================================
// 1. LÓGICA DE LOS MINI HOTCAKES
// ==========================================
let currentHotcakeConfig = { type: '', title: '', price: 0 };
const frutasBase = ["Durazno", "Fresa", "Plátano", "Uva"];
const toppingsBase = ["Nuez", "Luneta", "Huevo Kinder", "Chispas Chocolate", "Kranky"];

function openHotcakesModal(type, title, price) {
    currentHotcakeConfig = { type, title, price };
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-subtitle').textContent = `$${price}.00 MXN - Selecciona tus opciones`;

    const frutasContainer = document.getElementById('frutas-container');
    const toppingsContainer = document.getElementById('toppings-container');
    const frutaTitle = document.getElementById('fruta-title-step');
    const toppingTitle = document.getElementById('topping-title-step');

    document.getElementById('hotcakes-form').reset();
    document.getElementById('step-selection').style.display = 'block';
    document.getElementById('step-instructions').style.display = 'none';

    frutasContainer.innerHTML = '';
    toppingsContainer.innerHTML = '';

    if (type === 'especial') {
        frutaTitle.textContent = "🍑 Selecciona tu Fruta (Elige 2):";
        toppingTitle.textContent = "🧁 Selecciona tu Topping (Elige 2):";

        frutasBase.forEach(fruta => {
            frutasContainer.innerHTML += `
                <label class="crepa-pill-label">
                    <input type="checkbox" name="fruta_especial" value="${fruta}" class="check-limit-fruta">
                    <span class="crepa-pill-text">${fruta}</span>
                </label>`;
        });

        toppingsBase.forEach(topping => {
            toppingsContainer.innerHTML += `
                <label class="crepa-pill-label">
                    <input type="checkbox" name="topping_especial" value="${topping}" class="check-limit-topping">
                    <span class="crepa-pill-text">${topping}</span>
                </label>`;
        });

        applySelectionLimit('check-limit-fruta', 2);
        applySelectionLimit('check-limit-topping', 2);
    } else {
        frutaTitle.textContent = "🍑 Selecciona tu Fruta:";
        toppingTitle.textContent = "🧁 Selecciona tu Topping:";

        frutasBase.forEach(fruta => {
            frutasContainer.innerHTML += `
                <label class="crepa-pill-label">
                    <input type="radio" name="fruta" value="${fruta}">
                    <span class="crepa-pill-text">${fruta}</span>
                </label>`;
        });

        toppingsBase.forEach(topping => {
            toppingsContainer.innerHTML += `
                <label class="crepa-pill-label">
                    <input type="radio" name="topping" value="${topping}">
                    <span class="crepa-pill-text">${topping}</span>
                </label>`;
        });
    }

    document.getElementById('hotcakes-modal').style.display = 'flex';
}

function applySelectionLimit(className, maxLimit) {
    setTimeout(() => {
        const inputs = document.querySelectorAll(`.${className}`);
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const selected = document.querySelectorAll(`.${className}:checked`);
                if (selected.length > maxLimit) {
                    input.checked = false;
                    alert(`Solo puedes elegir un máximo de ${maxLimit} opciones.`);
                }
            });
        });
    }, 50);
}

function goToInstructionsStep() {
    if (currentHotcakeConfig.type === 'especial') {
        const frutasSel = document.querySelectorAll('input[name="fruta_especial"]:checked');
        const toppingsSel = document.querySelectorAll('input[name="topping_especial"]:checked');
        if (frutasSel.length === 0) return alert('Por favor, selecciona al menos una fruta.');
        if (toppingsSel.length === 0) return alert('Por favor, selecciona al menos un topping.');
    } else {
        const frutaSel = document.querySelector('input[name="fruta"]:checked');
        const toppingSel = document.querySelector('input[name="topping"]:checked');
        if (!frutaSel) return alert('Por favor, selecciona una fruta.');
        if (!toppingSel) return alert('Por favor, selecciona un topping.');
    }
    document.getElementById('step-selection').style.display = 'none';
    document.getElementById('step-instructions').style.display = 'block';
}

function closeHotcakesModal() {
    document.getElementById('hotcakes-modal').style.display = 'none';
}

function handleFormSubmit(e) {
    e.preventDefault();
    const special = currentHotcakeConfig.type === 'especial';
    const frutas = Array.from(document.querySelectorAll(special ? 'input[name="fruta_especial"]:checked' : 'input[name="fruta"]:checked'), input => input.value);
    const toppings = Array.from(document.querySelectorAll(special ? 'input[name="topping_especial"]:checked' : 'input[name="topping"]:checked'), input => input.value);
    const extrasTopping = Array.from(document.querySelectorAll('input[name="extra_topping"]:checked'), input => input.value);
    const extrasFruta = Array.from(document.querySelectorAll('input[name="extra_fruta"]:checked'), input => input.value);
    const comentario = document.getElementById('personal-instructions').value.trim();
    const precio = currentHotcakeConfig.price + (extrasTopping.length + extrasFruta.length) * 5;
    const piezas = currentHotcakeConfig.type === 'simple12' ? '12 piezas' : '25 piezas';

    const hotcakeItem = {
        productId: 0, // ID genérico para especialidades si no está en BD
        name: "Mini Hotcakes",
        price: precio,
        details: `${piezas} · Fruta: ${frutas.join(', ')} · Topping: ${toppings.join(', ')}${extrasFruta.length ? ` · Extra: ${extrasFruta.join(', ')}` : ''}${extrasTopping.length ? ` · Extra: ${extrasTopping.join(', ')}` : ''}`,
        note: comentario,
        qty: 1
    };

    closeHotcakesModal();
    // Enviamos el producto al motor del carrito
    if (typeof addToCart === 'function') addToCart(hotcakeItem.productId, hotcakeItem.name, hotcakeItem.price, hotcakeItem.details, hotcakeItem.note);
}

// ==========================================
// 2. CARGA DINÁMICA DE POSTRES (PHP)
// ==========================================
document.addEventListener('DOMContentLoaded', cargarPostres);

function obtenerImagenLocal(nombreProducto) {
    const n = nombreProducto.trim().toLowerCase();
    if (n.includes('flan')) return './images/flan_napolitano.jpg';
    if (n.includes('imposible')) return './images/pastel_imposible.jpg';
    if (n.includes('fresa')) return './images/fresas_crema.jpg';
    if (n.includes('manzana')) return './images/ensalada_manzana.jpg';
    if (n.includes('gelatina')) return './images/gelatina_crema.jpg';
    if (n.includes('uva')) return './images/uvas_crema.jpg';
    if (n.includes('arroz')) return './images/arroz_leche.jpg';
    return './logo.png';
}

async function cargarPostres() {
    const grid = document.getElementById('catalogo-postres');
    if (!grid) return;

    grid.innerHTML = '<p class="loading-msg">Cargando postres...</p>';

    try {
        const respuesta = await fetch('../api/productos.php');
        if (!respuesta.ok) throw new Error('Error en la conexión');
        const productosBD = await respuesta.json();
        
        // Filtramos para evitar duplicar los hotcakes
        const postres = productosBD.filter(p => 
            p.categoria_id === 1 && 
            !p.nombre.toLowerCase().includes('hotcake') && 
            !p.nombre.toLowerCase().includes('hot cake')
        );
        
        grid.innerHTML = ''; 

        postres.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.producto_id = prod.id;
            
            const estaDisponible = prod.disponible !== false;
            const imagenSource = prod.imagen_url || obtenerImagenLocal(prod.nombre); // Agrega esta línea
            let badgeHtml = !estaDisponible ? '<div class="bestseller-badge agotado">Agotado</div>' : '';
            const btnHtml = estaDisponible 
                ? `<button class="btn-add-cart" onclick="addToCart(${prod.id}, '${prod.nombre}', ${prod.precio}, '', '')"><i class="fas fa-plus"></i></button>`
                : `<button class="btn-add-cart disabled" disabled><i class="fas fa-ban"></i></button>`;

            const imgClass = estaDisponible ? 'product-img' : 'product-img img-agotado';
            const infoClass = estaDisponible ? 'product-info' : 'product-info info-agotado';

            card.innerHTML = `
                ${badgeHtml}
                <div class="product-img-wrapper">
                    <img src="${imagenSource}" alt="${prod.nombre}" class="${imgClass}">
                </div>
                <div class="${infoClass}">
                    <h3>${prod.nombre}</h3>
                    <p>${prod.descripcion || 'Delicioso postre casero.'}</p>
                    <div class="product-footer">
                        <span class="product-price">$${Number(prod.precio).toFixed(2)}</span>
                        ${btnHtml}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = '<p class="error-msg">Error al cargar el menú.</p>';
    }
}