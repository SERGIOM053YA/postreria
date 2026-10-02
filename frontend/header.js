document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("header-container");
    
    if (headerContainer) {
        // 1. INYECTAR LA ESTRUCTURA DEL HEADER
        headerContainer.innerHTML = `
            <div class="logo-container">
                <a href="./index.html">
                    <img src="./logo.png" alt="Hilda's Postres & Snacks" class="logo" onerror="this.src='../logo.png'">
                </a>
            </div>
            <nav class="navbar" id="navbar">
                <a href="./index.html">INICIO</a>
                <a href="./postres.html">POSTRES</a>
                <a href="./bebidas.html">BEBIDAS</a>
                <a href="./snacks.html">SNACKS</a>
                <a href="./crepas.html">CREPAS</a>
            </nav>
            <div class="header-icons">
                <div class="cart-icon" id="cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="cart-badge">0</span>
                </div>
                <a href="#" class="whatsapp-header-icon" id="whatsapp-btn"><i class="fab fa-whatsapp"></i></a>
                <span class="header-divider"></span>
                
                <!-- Botón Admin oculto por defecto -->
                <a href="./admin/admin.html" class="login-header-btn" id="admin-btn" style="display: none; background: #e95072; color: #fff; border-color: #e95072;">
                    <i class="fas fa-user-shield"></i>
                    <span>Panel KDS</span>
                </a>
                
                <a href="./Login/login.html" class="login-header-btn" id="login-btn">
                    <i class="far fa-user"></i>
                    <span>Iniciar sesión</span>
                </a>
            </div>
            <!-- Wavy bottom -->
            <div class="header-wave">
                <svg viewBox="0 0 1440 50" preserveAspectRatio="none">
                    <path fill="#ffffff" d="M0,0 L0,30 Q60,50 120,30 Q180,10 240,30 Q300,50 360,30 Q420,10 480,30 Q540,50 600,30 Q660,10 720,30 Q780,50 840,30 Q900,10 960,30 Q1020,50 1080,30 Q1140,10 1200,30 Q1260,50 1320,30 Q1380,10 1440,30 L1440,0 Z" />
                </svg>
            </div>
        `;

        // 2. LÓGICA INTELIGENTE PARA DETECTAR LA PÁGINA ACTUAL (SUBRAYADO ROSA)
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll(".navbar a");
        let activeFound = false;

        navLinks.forEach(link => {
            // Limpiamos el href (quitamos el "./" o "../") para compararlo con la URL real
            const href = link.getAttribute("href").replace("./", "").replace("../", "");
            
            // Si la URL del navegador contiene el nombre del archivo (ej. "postres.html")
            if (href && currentPath.includes(href)) {
                link.classList.add("active");
                activeFound = true;
            } else {
                link.classList.remove("active");
            }
        });

        // Caso especial: Si el usuario entra a la raíz "/" o a "index.html", forzamos que se subraye "INICIO"
        if (!activeFound && (currentPath.endsWith("/") || currentPath.includes("index.html"))) {
            document.querySelector('.navbar a[href="./index.html"]')?.classList.add("active");
        }
    }
});