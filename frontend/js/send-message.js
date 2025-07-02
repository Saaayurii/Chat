const messagesContainer = document.getElementById('chat');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('fileInput');

// Обработчик загрузки файла
fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение!');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            addMessage('', event.target.result);
        }
        reader.readAsDataURL(file);
    }
});

// Отправка сообщения
function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        addMessage(text);
        messageInput.value = '';
    }
}

// Добавление сообщения в чат
function addMessage(text, imageUrl = null) {
    const date = new Date();
    const messageDiv = document.createElement('div');
    const messageDivClear = document.createElement('div');
    messageDiv.className = 'message-administrator';
    messageDivClear.className = 'clear-block';

    if (text) {
        /* const textNode = document.createTextNode(text); */
        messageDiv.innerHTML = `
            <div class="message-administrator-name">Администратор</div>
            <div class="message-administrator-item">${text}
                <div class="date-chat">${formatDateTime(date)}</div>
            </div>
        `
    }

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        messageDiv.innerHTML = `
            <div class="message-administrator-name">Администратор</div>
            <div><img src="${imageUrl}" class="img-download"></div>
        `
        /* messageDiv.appendChild(img); */
    }

    messagesContainer.appendChild(messageDiv);
    messageDiv.after(messageDivClear);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Сброс выбора файла
    fileInput.value = '';
}

//Функция для формата времени
function formatDateTime(date) {
    return [
      date.getDate().toString().padStart(2, '0'),
      (date.getMonth() + 1).toString().padStart(2, '0'),
      date.getFullYear()
    ].join('.') + ' ' + [
      date.getHours().toString().padStart(2, '0'),
      date.getMinutes().toString().padStart(2, '0'),
      date.getSeconds().toString().padStart(2, '0')
    ].join(':');
  }


// Отправка по Enter
messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});