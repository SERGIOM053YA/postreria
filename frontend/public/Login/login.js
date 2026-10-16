document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '../../api/login.php';

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const togglePass = document.getElementById('togglePassword');
    const btnLogin = document.getElementById('btnLogin') || document.querySelector('.btn-login');

    // 1. Mostrar/Ocultar contraseña
    if (togglePass) {
        togglePass.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            togglePass.classList.toggle('fa-eye', !isPass);
            togglePass.classList.toggle('fa-eye-slash', isPass);
        });
    }

    // 2. Evento de inicio de sesión
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (btnLogin) {
                btnLogin.disabled = true;
                btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AUTENTICANDO...';
            }

            try {
                // Petición al backend PHP
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailInput.value.trim(),
                        password: passInput.value
                    })
                });

                const data = await response.json(); // Aquí nace la variable "data"

                if (!response.ok) {
                    throw new Error(data.error || 'Error al iniciar sesión');
                }

                // 3. Guardar credenciales y nombre en memoria
                localStorage.setItem('sb_access_token', data.token);
                if (data.user) {
                    localStorage.setItem('sb_user_id', data.user.id);
                    localStorage.setItem('sb_user_email', data.user.email);
                    
                    // Ahora sí leemos el nombre real que nos mandó PHP
                    const nombreReal = data.user.nombre || data.user.email.split('@')[0];
                    localStorage.setItem('sb_user_nombre', nombreReal);
                }

                // 4. Redirección
                window.location.href = '../index.html'; 

            } catch (error) {
                alert('Error de acceso: ' + error.message);
                if (btnLogin) {
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = 'INICIAR SESIÓN <i class="fas fa-arrow-right"></i>';
                }
            }
        });
    }
});