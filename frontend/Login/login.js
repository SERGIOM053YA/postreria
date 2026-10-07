document.addEventListener('DOMContentLoaded', () => {
    // Ya no usamos window.supabase aquí. Apuntamos a tu nuevo servidor.
const API_URL = '../../api/login.php';   

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const togglePass = document.getElementById('togglePassword');
    const btnLogin = document.getElementById('btnLogin');

    // Lógica visual del ojito para la contraseña
    if (togglePass) {
        togglePass.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            togglePass.classList.toggle('fa-eye', !isPass);
            togglePass.classList.toggle('fa-eye-slash', isPass);
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnLogin.disabled = true;
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AUTENTICANDO...';

            try {
                // Pasamos la variable relativa en lugar de la ruta absoluta
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: emailInput.value.trim(),
                        password: passInput.value
                    })
                });

                const data = await response.json();

                // Si el servidor (Node.js) devuelve un error (ej. credenciales inválidas)
                if (!response.ok) {
                    throw new Error(data.error || 'Error al iniciar sesión');
                }

                // Si fue exitoso, guardamos el token que nos dio tu servidor
                localStorage.setItem('sb_access_token', data.token);
                // Agrega esta línea para estampar tu identidad localmente
                localStorage.setItem('sb_user_email', data.user.email || email);
                
                // Extraemos el ID y email del objeto 'user' que devuelve el servidor
                if(data.user) {
                    localStorage.setItem('sb_user_id', data.user.id || 'local-id');
                    localStorage.setItem('sb_user_email', data.user.email);
                }

                console.log(`Login exitoso. Fuente: ${data.fuente}`);
                window.location.href = '../index.html';

            } catch (error) {
                alert('Error de acceso: ' + error.message);
                btnLogin.disabled = false;
                btnLogin.innerHTML = 'INICIAR SESIÓN <i class="fas fa-arrow-right"></i>';
            }
        });
    }
});