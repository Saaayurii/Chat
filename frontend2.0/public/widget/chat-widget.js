(function() {
  'use strict';

  // Проверка на уже загруженный виджет
  if (window.ChatWidgetLoaded) {
    return;
  }
  window.ChatWidgetLoaded = true;

  // Стили для виджета
  const styles = `
    .chat-widget-container {
      position: fixed;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .chat-widget-button {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .chat-widget-button:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }
    
    .chat-widget-window {
      width: 384px;
      height: 600px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      background: white;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .chat-widget-header {
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
      font-weight: 600;
    }
    
    .chat-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
    }
    
    .chat-widget-message {
      margin-bottom: 12px;
      display: flex;
    }
    
    .chat-widget-message.user {
      justify-content: flex-end;
    }
    
    .chat-widget-message.operator {
      justify-content: flex-start;
    }
    
    .chat-widget-message-content {
      max-width: 80%;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .chat-widget-message.user .chat-widget-message-content {
      background: #3b82f6;
      color: white;
    }
    
    .chat-widget-message.operator .chat-widget-message-content {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }
    
    .chat-widget-input-area {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: white;
    }
    
    .chat-widget-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      resize: none;
      outline: none;
    }
    
    .chat-widget-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .chat-widget-send-btn {
      margin-top: 8px;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    
    .chat-widget-send-btn:hover {
      background: #2563eb;
    }
    
    .chat-widget-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .chat-widget-close-btn {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
      padding: 4px;
      border-radius: 4px;
    }
    
    .chat-widget-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .chat-widget-typing {
      padding: 8px 16px;
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }
    
    .chat-widget-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    
    .chat-widget-action-btn {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      color: #374151;
      transition: all 0.2s;
    }
    
    .chat-widget-action-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }
    
    @media (max-width: 480px) {
      .chat-widget-window {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
    }
    
    .chat-widget-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    
    .chat-widget-modal-content {
      background: white;
      padding: 24px;
      border-radius: 12px;
      width: 100%;
      max-width: 400px;
      margin: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .chat-widget-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .chat-widget-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
    }
    
    .chat-widget-modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
    }
    
    .chat-widget-modal-close:hover {
      color: #374151;
    }
    
    .chat-widget-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .chat-widget-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .chat-widget-form-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }
    
    .chat-widget-form-input {
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    
    .chat-widget-form-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .chat-widget-form-btn {
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .chat-widget-form-btn:hover {
      background: #2563eb;
    }
    
    .chat-widget-form-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .chat-widget-form-link {
      color: #3b82f6;
      text-decoration: none;
      font-size: 14px;
      cursor: pointer;
      margin-top: 8px;
      text-align: center;
    }
    
    .chat-widget-form-link:hover {
      text-decoration: underline;
    }
    
    .chat-widget-form-error {
      color: #dc2626;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .chat-widget-tabs {
      display: flex;
      margin-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .chat-widget-tab {
      flex: 1;
      padding: 12px;
      text-align: center;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
    }
    
    .chat-widget-tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }
  `;

  // Добавить стили на страницу
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Класс для управления виджетом
  class ChatWidget {
    constructor(config) {
      this.config = {
        apiUrl: 'http://localhost:3004',
        theme: 'light',
        position: 'bottom-right',
        primaryColor: '#3b82f6',
        allowFileUpload: true,
        allowComplaint: true,
        allowRating: true,
        maxFileSize: 10 * 1024 * 1024,
        placeholder: 'Введите сообщение...',
        welcomeMessage: 'Добро пожаловать! Как могу помочь?',
        operatorName: 'Оператор поддержки',
        operatorAvatar: '',
        ...config
      };
      
      this.isOpen = false;
      this.messages = [];
      this.socket = null;
      this.conversationId = null;
      this.userToken = null;
      this.isTyping = false;
      this.operatorInfo = null;
      this.isAuthenticated = false;
      this.userData = null;
      
      this.init();
    }

    init() {
      this.createWidget();
      this.bindEvents();
      this.loadSocketIO();
      this.checkExistingAuth();
      this.checkOperatorStatus();
    }

    createWidget() {
      // Создать контейнер
      this.container = document.createElement('div');
      this.container.className = 'chat-widget-container';
      this.container.style.cssText = this.getPositionStyles();
      
      // Создать кнопку
      this.button = document.createElement('button');
      this.button.className = 'chat-widget-button';
      this.button.style.backgroundColor = this.config.primaryColor;
      this.button.innerHTML = '💬';
      this.button.title = 'Открыть чат';
      
      // Создать окно чата
      this.window = document.createElement('div');
      this.window.className = 'chat-widget-window';
      this.window.style.display = 'none';
      
      this.createHeader();
      this.createMessageArea();
      this.createInputArea();
      
      this.container.appendChild(this.button);
      this.container.appendChild(this.window);
      document.body.appendChild(this.container);
    }

    createHeader() {
      const header = document.createElement('div');
      header.className = 'chat-widget-header';
      header.style.backgroundColor = this.config.primaryColor;
      
      const title = document.createElement('div');
      title.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
            👤
          </div>
          <div>
            <div style="font-weight: 600; font-size: 14px;">${this.config.operatorName}</div>
            <div id="operator-status" style="font-size: 12px; opacity: 0.8;">Проверка статуса...</div>
          </div>
        </div>
      `;
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'chat-widget-close-btn';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = () => this.toggleWidget();
      
      header.appendChild(title);
      header.appendChild(closeBtn);
      this.window.appendChild(header);
    }

    createMessageArea() {
      this.messagesContainer = document.createElement('div');
      this.messagesContainer.className = 'chat-widget-messages';
      
      this.typingIndicator = document.createElement('div');
      this.typingIndicator.className = 'chat-widget-typing';
      this.typingIndicator.style.display = 'none';
      this.typingIndicator.textContent = 'Оператор печатает...';
      
      this.window.appendChild(this.messagesContainer);
      this.window.appendChild(this.typingIndicator);
    }

    createInputArea() {
      const inputArea = document.createElement('div');
      inputArea.className = 'chat-widget-input-area';
      
      this.input = document.createElement('textarea');
      this.input.className = 'chat-widget-input';
      this.input.placeholder = this.config.placeholder;
      this.input.rows = 1;
      this.input.style.resize = 'none';
      
      this.sendBtn = document.createElement('button');
      this.sendBtn.className = 'chat-widget-send-btn';
      this.sendBtn.textContent = 'Отправить';
      this.sendBtn.onclick = () => this.sendMessage();
      
      // Действия (оценка, жалоба, авторизация)
      const actions = document.createElement('div');
      actions.className = 'chat-widget-actions';
      actions.style.display = 'none';
      
      // Кнопка авторизации (показывается только для неавторизованных)
      const authBtn = document.createElement('button');
      authBtn.className = 'chat-widget-action-btn';
      authBtn.innerHTML = '🔐 Войти';
      authBtn.onclick = () => window.open('/login', '_blank');
      actions.appendChild(authBtn);
      this.authBtn = authBtn;
      
      if (this.config.allowRating) {
        const ratingBtn = document.createElement('button');
        ratingBtn.className = 'chat-widget-action-btn';
        ratingBtn.innerHTML = '⭐ Оценить';
        ratingBtn.onclick = () => this.showRatingModal();
        actions.appendChild(ratingBtn);
        this.ratingBtn = ratingBtn;
      }
      
      if (this.config.allowComplaint) {
        const complaintBtn = document.createElement('button');
        complaintBtn.className = 'chat-widget-action-btn';
        complaintBtn.innerHTML = '🚩 Жалоба';
        complaintBtn.onclick = () => this.showComplaintModal();
        actions.appendChild(complaintBtn);
        this.complaintBtn = complaintBtn;
      }

      // Кнопка профиля (показывается только для авторизованных)
      const profileBtn = document.createElement('button');
      profileBtn.className = 'chat-widget-action-btn';
      profileBtn.innerHTML = '👤 Профиль';
      profileBtn.onclick = () => this.showProfileModal();
      profileBtn.style.display = 'none';
      actions.appendChild(profileBtn);
      this.profileBtn = profileBtn;
      
      inputArea.appendChild(this.input);
      inputArea.appendChild(this.sendBtn);
      inputArea.appendChild(actions);
      this.window.appendChild(inputArea);
      
      this.actionsContainer = actions;
    }

    bindEvents() {
      this.button.onclick = () => this.toggleWidget();
      
      this.input.onkeypress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      };
      
      this.input.oninput = () => {
        this.input.style.height = 'auto';
        this.input.style.height = Math.min(this.input.scrollHeight, 100) + 'px';
      };
    }

    getPositionStyles() {
      const position = this.config.position;
      const styles = {
        'bottom-right': 'bottom: 20px; right: 20px;',
        'bottom-left': 'bottom: 20px; left: 20px;'
      };
      return styles[position] || styles['bottom-right'];
    }

    toggleWidget() {
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        this.button.style.display = 'none';
        this.window.style.display = 'flex';
        this.input.focus();
        
        if (!this.userToken) {
          this.authenticateUser();
        }
        
        // Показываем кнопки действий
        if (this.actionsContainer) {
          this.actionsContainer.style.display = 'flex';
        }
      } else {
        this.button.style.display = 'flex';
        this.window.style.display = 'none';
      }
    }

    async authenticateUser() {
      // Проверяем есть ли уже сохраненный токен гостя
      const guestToken = this.getCookie('chat_widget_guest_token');
      if (guestToken) {
        try {
          const response = await fetch(`${this.config.apiUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${guestToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            this.userToken = guestToken;
            this.userData = data.user;
            await this.createConversation();
            this.connectSocket();
            return;
          }
        } catch (error) {
          console.error('Ошибка проверки гостевого токена:', error);
        }
      }

      // Создаем нового гостя
      try {
        const guestId = this.getCookie('chat_widget_guest_id') || `guest_${Date.now()}`;
        this.setCookie('chat_widget_guest_id', guestId, 365);
        
        const response = await fetch(`${this.config.apiUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: `${guestId}@temp.com`,
            password: `temp_${Date.now()}`,
            firstName: 'Посетитель',
            lastName: 'Сайта',
            role: 'VISITOR'
          })
        });
        
        const data = await response.json();
        if (data.token) {
          this.userToken = data.token;
          this.userData = data.user;
          this.setCookie('chat_widget_guest_token', data.token, 30);
          await this.createConversation();
          this.connectSocket();
        }
      } catch (error) {
        console.error('Ошибка аутентификации:', error);
        this.addMessage('system', 'Ошибка подключения к серверу');
      }
    }

    async createConversation() {
      try {
        const response = await fetch(`${this.config.apiUrl}/chat/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.userToken}`
          },
          body: JSON.stringify({
            type: 'support',
            title: 'Обращение с сайта'
          })
        });
        
        const data = await response.json();
        if (data.id) {
          this.conversationId = data.id;
          this.addMessage('operator', this.config.welcomeMessage);
        }
      } catch (error) {
        console.error('Ошибка создания беседы:', error);
      }
    }

    loadSocketIO() {
      if (window.io) {
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.8.1/socket.io.min.js';
      script.onload = () => {
        if (this.userToken && this.conversationId) {
          this.connectSocket();
        }
      };
      document.head.appendChild(script);
    }

    connectSocket() {
      if (!window.io || !this.userToken) return;
      
      this.socket = window.io(`${this.config.apiUrl}/chat`, {
        auth: {
          token: this.userToken
        }
      });
      
      this.socket.on('connect', () => {
        if (this.conversationId) {
          this.socket.emit('join-room', { conversationId: this.conversationId });
        }
      });
      
      this.socket.on('new-message', (message) => {
        this.addMessage('operator', message.content);
        this.hideTyping();
      });
      
      this.socket.on('user-typing', () => {
        this.showTyping();
      });
      
      this.socket.on('user-stopped-typing', () => {
        this.hideTyping();
      });
      
      this.socket.on('operator-assigned', (operator) => {
        this.operatorInfo = operator;
        this.addMessage('system', `Оператор ${operator.name} присоединился к чату`);
        this.updateAuthUI();
      });
    }

    sendMessage() {
      const content = this.input.value.trim();
      if (!content || !this.conversationId) return;
      
      this.addMessage('user', content);
      this.input.value = '';
      this.input.style.height = 'auto';
      
      if (this.socket) {
        this.socket.emit('send-message', {
          conversationId: this.conversationId,
          content: content,
          type: 'text'
        });
      }
    }

    addMessage(sender, content) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chat-widget-message ${sender}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'chat-widget-message-content';
      contentDiv.textContent = content;
      
      if (sender === 'system') {
        contentDiv.style.cssText = 'background: #f3f4f6; color: #6b7280; text-align: center; font-style: italic;';
      }
      
      messageDiv.appendChild(contentDiv);
      this.messagesContainer.appendChild(messageDiv);
      
      // Скролл к последнему сообщению
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTyping() {
      this.typingIndicator.style.display = 'block';
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    hideTyping() {
      this.typingIndicator.style.display = 'none';
    }

    showRatingModal() {
      // Проверяем авторизацию
      if (!this.isAuthenticated) {
        const shouldLogin = confirm('Для оценки работы оператора необходимо войти в систему. Перейти на страницу входа?');
        if (shouldLogin) {
          window.open('/login', '_blank');
        }
        return;
      }
      
      // Простая реализация модального окна оценки
      const rating = prompt('Оцените работу оператора от 1 до 5:');
      if (rating && rating >= 1 && rating <= 5) {
        const comment = prompt('Оставьте комментарий (необязательно):');
        this.submitRating(parseInt(rating), comment);
      }
    }

    showComplaintModal() {
      // Проверяем авторизацию
      if (!this.isAuthenticated) {
        const shouldLogin = confirm('Для подачи жалобы необходимо войти в систему. Перейти на страницу входа?');
        if (shouldLogin) {
          window.open('/login', '_blank');
        }
        return;
      }
      
      // Простая реализация модального окна жалобы
      const reason = prompt('Причина жалобы:');
      if (reason) {
        const details = prompt('Подробности:');
        if (details) {
          this.submitComplaint(reason, details);
        }
      }
    }


    showProfileModal() {
      if (this.profileModal) {
        this.profileModal.remove();
      }

      this.profileModal = document.createElement('div');
      this.profileModal.className = 'chat-widget-modal';
      
      this.profileModal.innerHTML = `
        <div class="chat-widget-modal-content">
          <div class="chat-widget-modal-header">
            <div class="chat-widget-modal-title">Профиль</div>
            <button class="chat-widget-modal-close">×</button>
          </div>
          
          <div class="chat-widget-form">
            <div class="chat-widget-form-group">
              <label class="chat-widget-form-label">Имя</label>
              <div style="padding: 12px; background: #f9fafb; border-radius: 8px; color: #6b7280;">
                ${this.userData.fullName || this.userData.username}
              </div>
            </div>
            
            <div class="chat-widget-form-group">
              <label class="chat-widget-form-label">Email</label>
              <div style="padding: 12px; background: #f9fafb; border-radius: 8px; color: #6b7280;">
                ${this.userData.email}
              </div>
            </div>
            
            <div class="chat-widget-form-group">
              <label class="chat-widget-form-label">Статус</label>
              <div style="padding: 12px; background: #f9fafb; border-radius: 8px; color: #6b7280;">
                ${this.userData.isActivated ? 'Активирован' : 'Не активирован'}
              </div>
            </div>
            
            <button class="chat-widget-form-btn" style="background: #dc2626;" id="logoutBtn">
              Выйти
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.profileModal);
      
      // Обработчики событий
      this.profileModal.querySelector('.chat-widget-modal-close').onclick = () => {
        this.profileModal.remove();
      };
      
      this.profileModal.onclick = (e) => {
        if (e.target === this.profileModal) {
          this.profileModal.remove();
        }
      };
      
      // Обработчик кнопки выхода
      this.profileModal.querySelector('#logoutBtn').onclick = () => {
        this.handleLogout();
        this.profileModal.remove();
      };
    }

    async handleLogout() {
      if (this.userToken) {
        try {
          await fetch(`${this.config.apiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.userToken}`
            }
          });
        } catch (error) {
          console.error('Ошибка выхода:', error);
        }
      }
      
      this.clearAuth();
      this.addMessage('system', 'Вы вышли из системы');
    }

    async submitRating(rating, comment) {
      try {
        const response = await fetch(`${this.config.apiUrl}/ratings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.userToken}`
          },
          body: JSON.stringify({
            operatorId: this.operatorInfo?.id,
            rating: rating,
            comment: comment || '',
            conversationId: this.conversationId
          })
        });
        
        if (response.ok) {
          this.addMessage('system', `Спасибо за оценку! Ваша оценка: ${rating} звезд`);
        }
      } catch (error) {
        console.error('Ошибка отправки оценки:', error);
      }
    }

    async submitComplaint(reason, details) {
      try {
        const response = await fetch(`${this.config.apiUrl}/complaints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.userToken}`
          },
          body: JSON.stringify({
            operatorId: this.operatorInfo?.id,
            reason: reason,
            details: details,
            conversationId: this.conversationId
          })
        });
        
        if (response.ok) {
          this.addMessage('system', 'Ваша жалоба принята и будет рассмотрена');
        }
      } catch (error) {
        console.error('Ошибка отправки жалобы:', error);
      }
    }

    // Утилиты для работы с cookies
    setCookie(name, value, days = 30) {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    }

    getCookie(name) {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }

    deleteCookie(name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    // Проверка существующей авторизации
    checkExistingAuth() {
      const savedToken = this.getCookie('chat_widget_token');
      const savedUserData = this.getCookie('chat_widget_user');
      
      if (savedToken && savedUserData) {
        try {
          this.userToken = savedToken;
          this.userData = JSON.parse(decodeURIComponent(savedUserData));
          this.isAuthenticated = this.userData.role !== 'VISITOR';
          
          // Проверяем валидность токена
          this.validateToken();
        } catch (error) {
          console.error('Ошибка восстановления авторизации:', error);
          this.clearAuth();
        }
      }
    }

    // Проверка валидности токена
    async validateToken() {
      try {
        const response = await fetch(`${this.config.apiUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${this.userToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.userData = data.user;
          this.isAuthenticated = data.user.role !== 'VISITOR';
          this.updateAuthUI();
        } else {
          this.clearAuth();
        }
      } catch (error) {
        console.error('Ошибка проверки токена:', error);
        this.clearAuth();
      }
    }

    // Очистка авторизации
    clearAuth() {
      this.userToken = null;
      this.userData = null;
      this.isAuthenticated = false;
      this.deleteCookie('chat_widget_token');
      this.deleteCookie('chat_widget_user');
      this.updateAuthUI();
    }

    // Сохранение авторизации
    saveAuth(token, userData) {
      this.userToken = token;
      this.userData = userData;
      this.isAuthenticated = userData.role !== 'VISITOR';
      
      this.setCookie('chat_widget_token', token);
      this.setCookie('chat_widget_user', encodeURIComponent(JSON.stringify(userData)));
      
      this.updateAuthUI();
    }

    // Обновление UI в зависимости от статуса авторизации
    updateAuthUI() {
      // Обновляем заголовок
      const headerTitle = this.window.querySelector('.chat-widget-header div');
      if (headerTitle && this.isAuthenticated) {
        headerTitle.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
              👤
            </div>
            <div>
              <div style="font-weight: 600; font-size: 14px;">${this.userData.fullName || this.userData.username}</div>
              <div style="font-size: 12px; opacity: 0.8;">Авторизован</div>
            </div>
          </div>
        `;
      }
      
      // Показываем/скрываем кнопки действий
      if (this.actionsContainer) {
        this.actionsContainer.style.display = 'flex';
      }
      
      // Управляем видимостью кнопок
      if (this.authBtn) {
        this.authBtn.style.display = this.isAuthenticated ? 'none' : 'inline-block';
      }
      
      if (this.profileBtn) {
        this.profileBtn.style.display = this.isAuthenticated ? 'inline-block' : 'none';
      }
      
      if (this.ratingBtn) {
        this.ratingBtn.style.display = this.operatorInfo ? 'inline-block' : 'none';
      }
      
      if (this.complaintBtn) {
        this.complaintBtn.style.display = this.operatorInfo ? 'inline-block' : 'none';
      }
    }

    async checkOperatorStatus() {
      try {
        const response = await fetch(`${this.config.apiUrl}/users/operators?online=true&limit=1`);
        if (response.ok) {
          const data = await response.json();
          const operatorStatusElement = document.getElementById('operator-status');
          if (operatorStatusElement) {
            if (data.operators && data.operators.length > 0) {
              operatorStatusElement.textContent = 'В сети';
              operatorStatusElement.style.color = '#22c55e';
            } else {
              operatorStatusElement.textContent = 'Не в сети';
              operatorStatusElement.style.color = '#ef4444';
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса оператора:', error);
        const operatorStatusElement = document.getElementById('operator-status');
        if (operatorStatusElement) {
          operatorStatusElement.textContent = 'Статус неизвестен';
          operatorStatusElement.style.color = '#6b7280';
        }
      }
      
      // Повторяем проверку каждые 30 секунд
      setTimeout(() => this.checkOperatorStatus(), 30000);
    }
  }

  // Глобальная функция для инициализации виджета
  window.initChatWidget = function(config) {
    return new ChatWidget(config);
  };

  // Автоматическая инициализация если есть глобальная конфигурация
  if (window.ChatWidgetConfig) {
    window.initChatWidget(window.ChatWidgetConfig);
  }
})();