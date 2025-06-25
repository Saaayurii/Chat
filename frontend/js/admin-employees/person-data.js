const profileContainer = document.getElementById('person-data');
const editButton = document.getElementById('editButton');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');
const phoneProfileEmployees = document.getElementById('phoneInput');
const btnBlock = document.querySelector('.btn-block');

//Блок подключения маски для телефона
const maskOptionsPhonePerson = {
    mask: '+{7}(000)000-00-00',
    lazy: false
};
const maskPhoneProfile = IMask(phoneProfileEmployees, maskOptionsPhonePerson);

// Функция включения режима редактирования
function enableEditMode() {
    profileContainer.classList.add('edit-mode');
}

// Функция выключения режима редактирования
function disableEditMode() {
    profileContainer.classList.remove('edit-mode');
}

// Функция сохранения данных
function saveData() {
    // Получаем все текстовые элементы и поля ввода
    const textElements = document.querySelectorAll('.text-view');
    const inputElements = document.querySelectorAll('.edit-input');

    // Обновляем текстовые значения из полей ввода
    textElements.forEach((el, index) => {
        el.textContent = inputElements[index].value;
    });

    disableEditMode();
}

// Функция отмены изменений
function cancelEdit() {
    const textElements = document.querySelectorAll('.text-view');
    const inputElements = document.querySelectorAll('.edit-input');

    // Восстанавливаем значения полей ввода из текстовых элементов
    inputElements.forEach((el, index) => {
        el.value = textElements[index].textContent;
    });

    disableEditMode();
}

// Назначаем обработчики событий
editButton.addEventListener('click', enableEditMode);
saveButton.addEventListener('click', saveData);
cancelButton.addEventListener('click', cancelEdit);

// Обработка нажатия Esc
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && profileContainer.classList.contains('edit-mode')) {
        cancelEdit();
    }
});

//Функция блокировки пользователя
btnBlock.addEventListener('click', block_employees)

function block_employees() {
    if(btnBlock.innerText === 'Заблокировать') {
        btnBlock.innerText = 'Разблокировать';
        btnBlock.classList.add('act');
    } else {
        btnBlock.innerText = 'Заблокировать';
        btnBlock.classList.remove('act');
    }
} 