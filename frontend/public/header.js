const headerContainer = document.getElementById('header-container');

    // 1. RASTREADOR DE CARPETAS: Detecta si estamos "profundos" en una subcarpeta
    const currentPath = window.location.pathname.toLowerCase();
    const esSubcarpeta = currentPath.includes('/login/') || 
                         currentPath.includes('/historial/') || 
                         currentPath.includes('/recuperarc/') || 
                         currentPath.includes('/envio/') ||
                         currentPath.includes('/admin/');
    
    // Si estamos en una subcarpeta, bajamos un nivel ('../'). Si estamos en la raíz, usamos ('./')
    const base = esSubcarpeta ? '../' : './';
document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("header-container");
    
    if (headerContainer) {
        headerContainer.innerHTML = `
            <div class="logo-container">
                <a href="${base}index.html">
                    <img src="${base}logo.png" alt="Hilda's Postres & Snacks" class="logo" onerror="this.src='${base}logo.png'">
                </a>
            </div>
            <nav class="navbar" id="navbar">
                <a href="${base}index.html">INICIO</a>
                <a href="${base}postres.html">POSTRES</a>
                <a href="${base}bebidas.html">BEBIDAS</a>
                <a href="${base}snacks.html">SNACKS</a>
                <a href="${base}crepas.html">CREPAS</a>
            </nav>
            <div class="header-icons">
                <div class="cart-icon" id="cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="cart-badge">0</span>
                </div>
                
                <!-- Historial: Reutilizamos la clase circular para que se vea estético -->
                <a href="${base}historial/historial.html" class="whatsapp-header-icon" id="historial-btn" style="display: none;" title="Mis Pedidos">
                    <i class="fas fa-receipt"></i>
                </a>
                
                <span class="header-divider"></span>
                
                <!-- Botón Admin: Restauramos el escudo y su color rojo original -->
                <a href="${base}admin/admin.html" class="login-header-btn" id="admin-btn" style="display: none; background: #e95072; color: #fff; border-color: #e95072;">
                    <i class="fas fa-user-shield"></i>
                    <span>Panel KDS</span>
                </a>
                
                <a href="${base}Login/login.html" class="login-header-btn" id="login-btn">
                    <i class="fas fa-user"></i>
                    <span>Iniciar sesión</span>
                </a>
                
                <div class="menu-toggle" id="mobile-menu">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </div>
            </div>
        `;
    }
    // 3. CORRECCIÓN DINÁMICA DE RUTAS PARA SUBCARPETAS
        const loginBtn = document.getElementById('login-btn');
        
        if (loginBtn) {
            // Si el navegador detecta que estamos dentro de la carpeta "historial"
            if (window.location.pathname.includes('/historial/')) {
                loginBtn.setAttribute('href', '../Login/login.html'); // Sube un nivel de carpeta
            } else {
                loginBtn.setAttribute('href', './Login/login.html');  // Ruta normal para el inicio
            }
    }
});