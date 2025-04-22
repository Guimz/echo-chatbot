(function() {
    // Default configuration that will be overridden by API config
    window.echoConfig = window.echoConfig || {
        webhookUrl: 'http://localhost:5678/webhook/chat',
        appearance: {
            primaryColor: '#003459',
            textColor: '#E6E1C5',
            botName: 'Echo Bot',
            welcomeMessage: 'Hi, I hope you are well, How can I help?',
            inputPlaceholder: "Ask your question...",
            inputTextColor: "#003459",
            inputHighlightBoxColor: "#003459"
        },
        showBranding: true
    };

    // Get user_record_id from script tag
    const scriptTag = document.currentScript;
    window.userRecordId = scriptTag.getAttribute('user_record_id');

    // Create and append the widget container
    const container = document.createElement('div');
    container.id = 'echo-chat-widget-container';
    document.body.appendChild(container);

    // Load Tailwind CSS
    const tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(tailwindScript);

    // Load styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles.css';
    document.head.appendChild(link);

    // Wait for Tailwind to load before initializing
    tailwindScript.onload = () => {
        initializeWidget();
    };

    // Fetch brand configuration from API
    async function initializeWidget() {
        try {
            if (userRecordId) {
                const response = await fetch(`https://echo.saltoai.com/api/brand-config/${userRecordId}`);
                
                if (!response.ok) {
                    console.warn('Failed to fetch brand config:', response.status, response.statusText);
                    createWidget();
                    return;
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.warn('Invalid content type received:', contentType);
                    createWidget();
                    return;
                }

                const brandConfig = await response.json();
                
                // Merge API config with defaults
                window.echoConfig = {
                    ...window.echoConfig,
                    ...brandConfig
                };
            }
            // If no user_record_id or API call fails, use default config
            createWidget();
        } catch (error) {
            console.warn('Error fetching brand config:', error.message);
            // Fallback to default config if API fails
            createWidget();
        }
    }

    function createWidget() {
        // Create widget HTML
        const widgetHTML = `
            <div id="echo-chat-widget" class="fixed bottom-4 right-4 z-50">
                <!-- Chat Button -->
                <button id="chat-toggle" class="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors bg-[${window.echoConfig.appearance.primaryColor}]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="${window.echoConfig.appearance.textColor}">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </button>

                <!-- Chat Window -->
                <div id="chat-window" class="hidden w-96 h-[600px] bg-white rounded-lg shadow-lg flex flex-col">
                    <!-- Chat Header -->
                    <div class="p-4 rounded-t-lg flex items-center justify-between" style="background-color: ${window.echoConfig.appearance.primaryColor}">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="${window.echoConfig.appearance.textColor}">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <div>
                                <h3 class="text-lg font-semibold" style="color: ${window.echoConfig.appearance.textColor}">${window.echoConfig.appearance.botName}</h3>
                                <div class="text-xs flex items-center" style="color: ${window.echoConfig.appearance.textColor}">
                                    <span class="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                                    Online Now
                                </div>
                            </div>
                        </div>
                        <button id="close-chat" style="color: ${window.echoConfig.appearance.textColor}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Messages Container -->
                    <div id="messages" class="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
                        <div class="p-3 rounded-lg max-w-[75%] bg-gray-100 text-gray-800 mr-auto">
                            ${window.echoConfig.appearance.welcomeMessage}
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="p-4 border-t">
                        <div class="flex gap-2">
                            <input type="text" id="message-input" 
                                   class="flex-1 p-2 border rounded-lg"
                                   style="color: ${window.echoConfig.appearance.inputTextColor}; outline: none; transition: box-shadow 0.2s;"
                                   onfocus="this.style.boxShadow='0 0 0 2px ${window.echoConfig.appearance.inputHighlightBoxColor}'"
                                   onblur="this.style.boxShadow='none'"
                                   placeholder="${window.echoConfig.appearance.inputPlaceholder}">
                            <button id="send-message" 
                                    class="px-4 py-2 rounded-lg transition-colors"
                                    style="background-color: ${window.echoConfig.appearance.primaryColor}; color: ${window.echoConfig.appearance.textColor}">
                                Send
                            </button>
                        </div>
                    </div>

                    <!-- Footer -->
                    ${window.echoConfig.showBranding ? `
                    <div class="p-2 text-center text-xs text-gray-500">
                        Powered by 
                        <img src="salto_ai_logo.png" alt="Salto AI" class="h-4 w-auto mx-1 inline-block">
                        Salto AI
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add the widget HTML
        container.innerHTML = widgetHTML;

        // Initialize chat functionality
        const chatToggle = document.getElementById('chat-toggle');
        const chatWindow = document.getElementById('chat-window');
        const closeChat = document.getElementById('close-chat');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-message');
        const messagesContainer = document.getElementById('messages');

        // Toggle chat window
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.remove('hidden');
            chatToggle.classList.add('hidden');
        });

        closeChat.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
            chatToggle.classList.remove('hidden');
        });

        // Send message functionality
        const sendMessage = async () => {
            const message = messageInput.value.trim();
            if (!message) return;

            // Add user message
            const userDiv = document.createElement('div');
            userDiv.className = 'p-3 rounded-lg max-w-[75%] ml-auto';
            userDiv.style.backgroundColor = window.echoConfig.appearance.primaryColor;
            userDiv.style.color = window.echoConfig.appearance.textColor;
            userDiv.textContent = message;
            messagesContainer.appendChild(userDiv);

            // Clear input
            messageInput.value = '';
            messageInput.disabled = true;
            sendButton.disabled = true;

            // Add thinking message with animation
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'p-3 rounded-lg max-w-[75%] bg-gray-100 text-gray-800 mr-auto';
            thinkingDiv.textContent = '.';
            messagesContainer.appendChild(thinkingDiv);
            
            let dots = 1;
            const thinkingInterval = setInterval(() => {
                dots = (dots % 3) + 1;
                thinkingDiv.textContent = '.'.repeat(dots);
            }, 500);

            try {
                // Send to webhook
                const response = await fetch(window.echoConfig.webhookUrl, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors',
                    body: JSON.stringify({ 
                        message,
                        user_record_id: window.userRecordId,
                        conversationHistory: Array.from(messagesContainer.children)
                            .filter(div => div !== thinkingDiv)
                            .map(div => ({
                                role: div.classList.contains('ml-auto') ? 'user' : 'bot',
                                content: div.textContent
                            }))
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const botResponse = data.message || data.response || data.output;

                if (!botResponse) {
                    throw new Error('No response from bot');
                }

                // Remove thinking message and add bot response
                clearInterval(thinkingInterval);
                messagesContainer.removeChild(thinkingDiv);
                
                const botDiv = document.createElement('div');
                botDiv.className = 'p-3 rounded-lg max-w-[75%] bg-gray-100 text-gray-800 mr-auto';
                botDiv.textContent = botResponse;
                messagesContainer.appendChild(botDiv);
            } catch (error) {
                console.error('Error:', error);
                clearInterval(thinkingInterval);
                messagesContainer.removeChild(thinkingDiv);
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'p-3 rounded-lg max-w-[75%] bg-red-100 text-red-800 mr-auto';
                errorDiv.textContent = 'Sorry, I encountered an error. Please try again.';
                messagesContainer.appendChild(errorDiv);
            } finally {
                messageInput.disabled = false;
                sendButton.disabled = false;
                messageInput.focus();
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        };

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Start initialization
    initializeWidget();
})(); 