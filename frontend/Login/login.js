document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://abwqlettqauklpufupaa.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8'; 
    window.cliente = window.cliente || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const cliente = window.cliente;

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const togglePass = document.getElementById('togglePassword');
    const btnLogin = document.getElementById('btnLogin');

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

            const { data, error } = await cliente.auth.signInWithPassword({
                email: emailInput.value.trim(),
                password: passInput.value
            });

            if (error) {
                alert('Error de acceso: ' + error.message);
                btnLogin.disabled = false;
                btnLogin.innerHTML = 'INICIAR SESIÓN <i class="fas fa-arrow-right"></i>';
                return;
            }

            localStorage.setItem('sb_access_token', data.session.access_token);
            localStorage.setItem('sb_user_id', data.user.id);
            localStorage.setItem('sb_user_email', data.user.email);

            window.location.href = '../index.html';
        });
    }
});