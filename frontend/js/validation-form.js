//Данные для формы авторизации, регистрации
/* const formLogin = document.getElementById('loginForm');
const formRegistration = document.getElementById('registrationForm');
const formReset = document.getElementById('resetForm');
const resetPasswordForm = document.getElementById('resetPasswordForm'); */

/* const emailInput = document.getElementById('email');
const passwordInputRepeat = document.getElementById('password-repeat'); */
const passwordInput = document.getElementById('password');
const togglePassword = document.querySelector('.toggle-password');
/* const submitBtn = document.querySelector('.submit-btn');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('emailError'); */

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    /* togglePassword.textContent = type === 'password' ? '👁️' : '👁️'; */
    togglePassword.innerHTML = type === 'password' ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
  <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
</svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
</svg>`;
});

/* const page = document.body.dataset.page;

switch (page) {
    case 'login-page':
        tooglePassword();
        formLogin.addEventListener('submit', (e) => {
            validation;
        });
        break;
    case 'registration-page':
        tooglePassword();
        formRegistration.addEventListener('submit', (e) => {
            validation;
        });
        break;
    case 'resetForm':
        formReset.addEventListener('submit', (e) => {
            e.preventDefault();
            submitBtn.classList.add('loading');

            // Простая валидация
            const emailValid = validateEmail(emailInput.value);

            // Проверка полей
            if (!emailValid) {
                showError(emailError);
            }

        });
        break;
    case 'resetPasswordForm':
        tooglePassword();
        resetPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitBtn.classList.add('loading');

            // Простая валидация
            const passwordValid = passwordInput.value.length >= 6;
            const passwordValidRepeat = passwordInputRepeat.value.length >= 6;

            if (!passwordValid && !passwordValidRepeat) {
                showError(passwordError);
            }
        });
    default:
        break;
} */

// Переключение видимости пароля
/* function tooglePassword() {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.innerHTML = type === 'password' ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
      <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
    </svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
    </svg>`;
    });
} */

/* БЛОК ВАЛИДАЦИИ ФОРМЫ АВТОРИЗАЦИИ И РЕГИСТРАЦИИ */

// Валидация формы входа
/* formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.classList.add('loading');
    
    // Простая валидация
    const emailValid = validateEmail(emailInput.value);
    const passwordValid = passwordInput.value.length >= 6;

    // Проверка полей
    if (!emailValid) {
        showError(emailError);
    }
    if (!passwordValid) {
        showError(passwordError);
    }
}); */

// Валидация формы регистрации
/* formRegistration.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.classList.add('loading');

    // Простая валидация
    const emailValid = validateEmail(emailInput.value);
    const passwordValid = passwordInput.value.length >= 6;

    // Проверка полей
    if (!emailValid) {
        showError(emailError);
    }
    if (!passwordValid) {
        showError(passwordError);
    }
}); */

/* function validation() {
    e.preventDefault();
    submitBtn.classList.add('loading');

    // Простая валидация
    const emailValid = validateEmail(emailInput.value);
    const passwordValid = passwordInput.value.length >= 6;

    // Проверка полей
    if (!emailValid) {
        showError(emailError);
    }
    if (!passwordValid) {
        showError(passwordError);
    }
} */

// Валидация email
/* function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
} */

// Показать ошибку
/* function showError(element) {
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
} */
