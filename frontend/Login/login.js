const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
    const showPassword = passwordInput.type === 'password';
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePassword.classList.toggle('fa-eye', !showPassword);
    togglePassword.classList.toggle('fa-eye-slash', showPassword);
});

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (loginForm.reportValidity()) {
        window.location.href = '../inicio.html';
    }
});
