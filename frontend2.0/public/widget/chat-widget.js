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
  `;

  // Добавить стили на страницу
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Класс для управления виджетом
  class ChatWidget {
    constructor(config) {
      this.config = {
        apiUrl: 'http://localhost:3000',
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
      
      this.init();
    }

    init() {
      this.createWidget();
      this.bindEvents();
      this.loadSocketIO();
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
            <div style="font-size: 12px; opacity: 0.8;">В сети</div>
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
      
      // Действия (оценка, жалоба)
      const actions = document.createElement('div');
      actions.className = 'chat-widget-actions';
      actions.style.display = 'none';
      
      if (this.config.allowRating) {
        const ratingBtn = document.createElement('button');
        ratingBtn.className = 'chat-widget-action-btn';
        ratingBtn.innerHTML = '⭐ Оценить';
        ratingBtn.onclick = () => this.showRatingModal();
        actions.appendChild(ratingBtn);
      }
      
      if (this.config.allowComplaint) {
        const complaintBtn = document.createElement('button');
        complaintBtn.className = 'chat-widget-action-btn';
        complaintBtn.innerHTML = '🚩 Жалоба';
        complaintBtn.onclick = () => this.showComplaintModal();
        actions.appendChild(complaintBtn);
      }
      
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
      } else {
        this.button.style.display = 'flex';
        this.window.style.display = 'none';
      }
    }

    async authenticateUser() {
      try {
        const response = await fetch(`${this.config.apiUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: `guest_${Date.now()}@temp.com`,
            password: `temp_${Date.now()}`,
            firstName: 'Посетитель',
            lastName: 'Сайта',
            role: 'VISITOR'
          })
        });
        
        const data = await response.json();
        if (data.token) {
          this.userToken = data.token;
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
        this.actionsContainer.style.display = 'flex';
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
      // Простая реализация модального окна оценки
      const rating = prompt('Оцените работу оператора от 1 до 5:');
      if (rating && rating >= 1 && rating <= 5) {
        const comment = prompt('Оставьте комментарий (необязательно):');
        this.submitRating(parseInt(rating), comment);
      }
    }

    showComplaintModal() {
      // Простая реализация модального окна жалобы
      const reason = prompt('Причина жалобы:');
      if (reason) {
        const details = prompt('Подробности:');
        if (details) {
          this.submitComplaint(reason, details);
        }
      }
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