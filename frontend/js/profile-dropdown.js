//Данные для профиля в админ панеле
const profileToggle = document.getElementById('profileToggle');
const profileDropdown = document.getElementById('profileDropdown');

// Переключение меню
profileToggle.addEventListener('click', function(e) {
    console.log('hello');
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
});

// Закрытие при клике вне меню
document.addEventListener('click', function(e) {
    if (!profileDropdown.contains(e.target) && !profileToggle.contains(e.target)) {
        profileDropdown.classList.remove('active');
    }
});

// Закрытие при нажатии Esc
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        profileDropdown.classList.remove('active');
    }
});