(function() {
    // Default configuration that will be overridden by API config
    window.echoConfig = window.echoConfig || {
        webhookUrl: 'https://n8n.saltoai.com/webhook/chat',
        primaryColor: '#B9D8F9',
        textColor: '#003459',
        botName: 'Echo Bot',
        welcomeMessage: 'Hi, I hope you are well, How can I help?',
        inputPlaceholder: "Ask your question...",
        inputTextColor: "#003459",
        inputHighlightBoxColor: "#003459",
        showBranding: true,
        position: 'bottom-right'
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
    link.href = 'https://chat.echo.saltoai.com/styles.css';
    document.head.appendChild(link);

    // Wait for Tailwind to load before initializing
    tailwindScript.onload = () => {
        initializeWidget();
    };

    // Function to get config from Cloudflare KV
    async function fetchUserConfig(userRecordId) {
        try {
            const response = await fetch(
                `https://echo-chatbot-config.bruno-e2f.workers.dev/api/config/${userRecordId}`
            );
            
            if (!response.ok) {
                // If 404, the user doesn't have a config yet
                if (response.status === 404) {
                    const notFoundData = await response.json();
                    // Use the default config provided by the worker
                    if (notFoundData.default) {
                        return notFoundData.default;
                    }
                }
                console.warn('Failed to fetch brand config:', response.status, response.statusText);
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching config:', error);
            return null;
        }
    }

    // Fetch brand configuration from API
    async function initializeWidget() {
        try {
            if (userRecordId) {
                const brandConfig = await fetchUserConfig(userRecordId);
                if (brandConfig) {
                    // Merge API config with defaults
                    window.echoConfig = {
                        ...window.echoConfig,
                        ...brandConfig
                    };
                }
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
        // Fix for inputPlaceholder being a JSON string instead of an array
        if (
            typeof window.echoConfig.inputPlaceholder === 'string' &&
            window.echoConfig.inputPlaceholder.trim().startsWith('[') &&
            window.echoConfig.inputPlaceholder.trim().endsWith(']')
        ) {
            try {
                window.echoConfig.inputPlaceholder = JSON.parse(window.echoConfig.inputPlaceholder);
            } catch (e) {
                // If parsing fails, fallback to the string as-is
            }
        }

        // Debug log
        console.log('inputPlaceholder:', window.echoConfig.inputPlaceholder, 'Type:', typeof window.echoConfig.inputPlaceholder, 'IsArray:', Array.isArray(window.echoConfig.inputPlaceholder));

        // Determine position class
        const positionClass = (() => {
            const pos = (window.echoConfig.position || 'bottom-right').toLowerCase();
            switch (pos) {
                case 'bottom-left': return 'fixed bottom-4 left-4';
                case 'top-right': return 'fixed top-4 right-4';
                case 'top-left': return 'fixed top-4 left-4';
                case 'bottom-right':
                default: return 'fixed bottom-4 right-4';
            }
        })();

        // Create widget HTML
        const widgetHTML = `
            <div id="echo-chat-widget" class="${positionClass} z-50">
                <!-- Chat Button -->
                <button id="chat-toggle" class="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors bg-[${window.echoConfig.primaryColor}]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="${window.echoConfig.textColor}">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </button>

                <!-- Chat Window -->
                <div id="chat-window" class="hidden w-96 h-[600px] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden" style="font-size: 14px; line-height: 1.4;">
                    <!-- Chat Header -->
                    <div class="p-4 flex items-center justify-between" style="background-color: ${window.echoConfig.primaryColor}">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="${window.echoConfig.textColor}">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <div>
                                <h3 class="text-lg font-semibold" style="color: ${window.echoConfig.textColor}">${window.echoConfig.botName}</h3>
                                <div class="text-xs flex items-center" style="color: ${window.echoConfig.textColor}">
                                    <span class="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                                    Online Now
                                </div>
                            </div>
                        </div>
                        <button id="close-chat" style="color: ${window.echoConfig.textColor}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Messages Container -->
                    <div id="messages" class="flex-1 pt-1 pr-3 pb-4 pl-3 overflow-y-auto flex flex-col gap-0.3">
                        <div class="flex flex-col items-start max-w-[75%] mr-auto">
                            <div class="text-xs text-gray-400 mb-0.5">${window.echoConfig.botName}</div>
                            <div class="p-3 rounded-lg bg-gray-100 text-gray-800 w-full">
                                ${window.echoConfig.welcomeMessage}
                            </div>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="p-4 border-t">
                        <div class="flex gap-2">
                            <input type="text" id="message-input" 
                                   class="flex-1 p-2 border rounded-lg"
                                   style="color: ${window.echoConfig.inputTextColor}; outline: none; transition: box-shadow 0.2s;"
                                   onfocus="this.style.boxShadow='0 0 0 2px ${window.echoConfig.inputHighlightBoxColor}'"
                                   onblur="this.style.boxShadow='none'"
                                   placeholder="${Array.isArray(window.echoConfig.inputPlaceholder) ? '' : window.echoConfig.inputPlaceholder}">
                            <button id="send-message" 
                                    class="px-4 py-2 rounded-lg transition-colors font-semibold"
                                    style="background-color: ${window.echoConfig.primaryColor}; color: ${window.echoConfig.textColor}">
                                Send
                            </button>
                        </div>
                    </div>

                    <!-- Footer -->
                    ${window.echoConfig.showBranding ? `
                    <div class="p-2 text-center text-xs text-gray-500">
                        Powered by 
                        <img src="https://chat.echo.saltoai.com/salto_ai_logo.png" alt="Salto AI" class="h-4 w-auto mx-1 inline-block">
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

        // Helper to scroll to the bottom
        function scrollToBottom() {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Placeholder animation logic
        function animatePlaceholders(placeholders, inputElement) {
            let current = 0;
            let typing = true;
            let charIndex = 0;
            let timeoutId;

            function type() {
                if (!Array.isArray(placeholders) || placeholders.length === 0) return;
                const text = placeholders[current];
                if (typing) {
                    if (charIndex < text.length) {
                        inputElement.setAttribute('placeholder', text.slice(0, charIndex + 1));
                        charIndex++;
                        timeoutId = setTimeout(type, 60);
                    } else {
                        typing = false;
                        timeoutId = setTimeout(type, 1200); // Pause before erasing
                    }
                } else {
                    if (charIndex > 0) {
                        inputElement.setAttribute('placeholder', text.slice(0, charIndex - 1));
                        charIndex--;
                        timeoutId = setTimeout(type, 30);
                    } else {
                        typing = true;
                        current = (current + 1) % placeholders.length;
                        timeoutId = setTimeout(type, 400); // Pause before next prompt
                    }
                }
            }
            type();
            // Return a function to stop the animation if needed
            return () => clearTimeout(timeoutId);
        }

        // Set up input placeholder (static or animated)
        let stopPlaceholderAnimation;
        if (Array.isArray(window.echoConfig.inputPlaceholder)) {
            stopPlaceholderAnimation = animatePlaceholders(window.echoConfig.inputPlaceholder, messageInput);
        } else {
            messageInput.setAttribute('placeholder', window.echoConfig.inputPlaceholder || 'Ask your question...');
        }

        // Toggle chat window
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.remove('hidden');
            chatToggle.classList.add('hidden');
            scrollToBottom();
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
            userDiv.style.backgroundColor = window.echoConfig.primaryColor;
            userDiv.style.color = window.echoConfig.textColor;
            userDiv.textContent = message;
            messagesContainer.appendChild(userDiv);
            scrollToBottom();

            // Clear input
            messageInput.value = '';
            messageInput.disabled = true;
            sendButton.disabled = true;

            // Add thinking message with animation
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'p-3 rounded-lg max-w-[75%] bg-gray-100 text-gray-800 mr-auto';
            thinkingDiv.textContent = '.';
            messagesContainer.appendChild(thinkingDiv);
            scrollToBottom();
            
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
                
                // Create a wrapper for bot label and message
                const botWrapper = document.createElement('div');
                botWrapper.className = 'flex flex-col items-start max-w-[75%] mr-auto';

                const botLabel = document.createElement('div');
                botLabel.className = 'text-xs text-gray-400 mb-0.5';
                botLabel.textContent = window.echoConfig.botName;
                botWrapper.appendChild(botLabel);

                const botDiv = document.createElement('div');
                botDiv.className = 'p-3 rounded-lg bg-gray-100 text-gray-800 w-full';
                botDiv.textContent = botResponse;
                botWrapper.appendChild(botDiv);

                messagesContainer.appendChild(botWrapper);
                scrollToBottom();
            } catch (error) {
                console.error('Error:', error);
                clearInterval(thinkingInterval);
                messagesContainer.removeChild(thinkingDiv);
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'p-3 rounded-lg max-w-[75%] bg-red-100 text-red-800 mr-auto';
                errorDiv.textContent = 'Sorry, I encountered an error. Please try again.';
                messagesContainer.appendChild(errorDiv);
                scrollToBottom();
            } finally {
                messageInput.disabled = false;
                sendButton.disabled = false;
                messageInput.focus();
                scrollToBottom();
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