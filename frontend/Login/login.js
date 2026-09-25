const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

// Elementos de los requisitos
const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqLowercase = document.getElementById('req-lowercase');
const reqNumber = document.getElementById('req-number');
const reqSpecial = document.getElementById('req-special');

// Ver/Ocultar contraseña
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});

// Validación en tiempo real
passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;

    // Requisito 1: Entre 8 y 20 caracteres
    validateRequirement(reqLength, val.length >= 8 && val.length <= 20);

    // Requisito 2: Al menos una mayúscula
    validateRequirement(reqUppercase, /[A-Z]/.test(val));

    // Requisito 3: Al menos una minúscula
    validateRequirement(reqLowercase, /[a-z]/.test(val));

    // Requisito 4: Al menos un número
    validateRequirement(reqNumber, /[0-9]/.test(val));

    // Requisito 5: Carácter especial
    validateRequirement(reqSpecial, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val));
});

function validateRequirement(element, isValid) {
    const icon = element.querySelector('i');
    if (isValid) {
        element.classList.add('valid');
        icon.className = 'fas fa-check-circle';
    } else {
        element.classList.remove('valid');
        icon.className = 'fas fa-circle';
    }
}

// Envío del Formulario vía EventListener limpio
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = passwordInput.value;

    const isLengthValid = val.length >= 8 && val.length <= 20;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);

    const emailInput = document.getElementById('email');
    const isEmailValid = emailInput.value.trim() !== '' && emailInput.validity.valid;

    if (isEmailValid && isLengthValid && hasUpper && hasLower && hasNumber && hasSpecial) {
        window.location.href = '../inicio.html';
    } else {
        alert('Por favor asegúrate de que la contraseña cumpla con todos los requisitos.');
    }
});
