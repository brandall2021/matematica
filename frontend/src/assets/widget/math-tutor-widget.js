(function() {
  'use strict';

  const MATH_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 2c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 10H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1zm-6-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>';
  const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  const SEND_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  class MathTutorWidget {
    constructor(config) {
      this.apiUrl = config.apiUrl || 'http://localhost:8080/api';
      this.theme = config.theme || 'blue';
      this.position = config.position || 'bottom-right';
      this.isOpen = false;
      this.sessionId = null;
      this.messages = [];
      this.isTyping = false;
      this.widgetKey = config.widgetKey || '';
      this.jwtToken = null;
      
      this.init();
    }

    init() {
      this.createStyles();
      this.createWidget();
      this.attachEvents();
    }

    createStyles() {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = this.getBaseUrl() + '/math-tutor-widget.css';
      document.head.appendChild(link);
    }

    getBaseUrl() {
      const script = document.currentScript;
      return script ? script.src.replace(/\/[^\/]+$/, '') : '';
    }

    createWidget() {
      this.container = document.createElement('div');
      this.container.className = 'mt-widget-container ' + this.position + ' theme-' + this.theme;

      // Floating button
      this.button = document.createElement('button');
      this.button.className = 'mt-floating-btn';
      this.button.innerHTML = MATH_ICON;
      this.button.title = 'Ask Math Tutor';

      // Chat panel
      this.chatPanel = document.createElement('div');
      this.chatPanel.className = 'mt-chat-panel';

      // Header
      const header = document.createElement('div');
      header.className = 'mt-chat-header';
      header.innerHTML = `
        <h3>Math Tutor</h3>
        <div class="mt-chat-header-buttons">
          <button class="mt-chat-header-btn" title="Close">${CLOSE_ICON}</button>
        </div>
      `;

      // Messages container
      this.messagesContainer = document.createElement('div');
      this.messagesContainer.className = 'mt-chat-messages';
      this.messagesContainer.innerHTML = `
        <div class="mt-welcome">
          <div class="mt-welcome-icon">🎓</div>
          <h4>Math Tutor</h4>
          <p>Ask me anything about mathematics!</p>
        </div>
      `;

      // Input area
      const inputArea = document.createElement('div');
      inputArea.className = 'mt-chat-input-area';
      inputArea.innerHTML = `
        <textarea class="mt-chat-input" placeholder="Type your math question..." rows="1"></textarea>
        <button class="mt-send-btn">${SEND_ICON}</button>
      `;

      this.chatPanel.appendChild(header);
      this.chatPanel.appendChild(this.messagesContainer);
      this.chatPanel.appendChild(inputArea);

      this.container.appendChild(this.chatPanel);
      this.container.appendChild(this.button);
      document.body.appendChild(this.container);

      // Get references
      this.input = this.chatPanel.querySelector('.mt-chat-input');
      this.sendBtn = this.chatPanel.querySelector('.mt-send-btn');
      this.closeBtn = header.querySelector('.mt-chat-header-btn');
    }

    attachEvents() {
      this.button.addEventListener('click', () => this.toggle());
      this.closeBtn.addEventListener('click', () => this.toggle());
      this.sendBtn.addEventListener('click', () => this.sendMessage());
      
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize textarea
      this.input.addEventListener('input', () => {
        this.input.style.height = 'auto';
        this.input.style.height = Math.min(this.input.scrollHeight, 100) + 'px';
      });

      // Drag functionality
      this.makeDraggable();
    }

    makeDraggable() {
      const header = this.chatPanel.querySelector('.mt-chat-header');
      let isDragging = false;
      let offsetX, offsetY;

      header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - this.chatPanel.offsetLeft;
        offsetY = e.clientY - this.chatPanel.offsetTop;
        this.chatPanel.style.transition = 'none';
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        this.chatPanel.style.position = 'absolute';
        this.chatPanel.style.left = x + 'px';
        this.chatPanel.style.top = y + 'px';
        this.chatPanel.style.right = 'auto';
        this.chatPanel.style.bottom = 'auto';
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
        this.chatPanel.style.transition = '';
      });
    }

    toggle() {
      this.isOpen = !this.isOpen;
      this.chatPanel.classList.toggle('open', this.isOpen);
      
      if (this.isOpen) {
        this.input.focus();
      }
    }

    async sendMessage() {
      const text = this.input.value.trim();
      if (!text || this.isTyping) return;

      this.addMessage(text, 'user');
      this.input.value = '';
      this.input.style.height = 'auto';
      
      this.setTyping(true);
      this.sendBtn.disabled = true;

      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (this.jwtToken) {
          headers['Authorization'] = 'Bearer ' + this.jwtToken;
        }
        
        if (this.widgetKey) {
          headers['X-Widget-Key'] = this.widgetKey;
        }

        const response = await fetch(this.apiUrl + '/chat/message', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sessionId: this.sessionId,
            message: text,
            webSearchEnabled: false
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        this.sessionId = data.sessionId;
        this.addMessage(data.answer, 'assistant');
      } catch (error) {
        console.error('Math Tutor Widget Error:', error);
        this.addMessage('Sorry, there was an error. Please try again.', 'assistant');
      } finally {
        this.setTyping(false);
        this.sendBtn.disabled = false;
      }
    }

    addMessage(text, type) {
      // Remove welcome message
      const welcome = this.messagesContainer.querySelector('.mt-welcome');
      if (welcome) welcome.remove();

      const msgDiv = document.createElement('div');
      msgDiv.className = 'mt-message ' + type;
      msgDiv.textContent = text;
      
      this.messagesContainer.appendChild(msgDiv);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      
      this.messages.push({ text, type, timestamp: Date.now() });
    }

    setTyping(typing) {
      this.isTyping = typing;
      
      const existing = this.messagesContainer.querySelector('.mt-message.typing');
      if (typing) {
        if (!existing) {
          const typingDiv = document.createElement('div');
          typingDiv.className = 'mt-message typing';
          typingDiv.innerHTML = '<div class="mt-typing-indicator"><span></span><span></span><span></span></div>';
          this.messagesContainer.appendChild(typingDiv);
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
      } else {
        if (existing) existing.remove();
      }
    }

    setToken(token) {
      this.jwtToken = token;
    }

    destroy() {
      this.container.remove();
    }
  }

  // Expose globally
  window.MathTutorWidget = MathTutorWidget;

  // Auto-init from script tag
  const script = document.currentScript;
  if (script) {
    const config = {
      apiUrl: script.dataset.apiUrl || 'http://localhost:8080/api',
      theme: script.dataset.theme || 'blue',
      position: script.dataset.position || 'bottom-right',
      widgetKey: script.dataset.widgetKey || ''
    };
    
    window.mathTutorWidget = new MathTutorWidget(config);
  }
})();