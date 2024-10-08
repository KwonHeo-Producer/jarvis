// chat.js
const initChat = () => {
    const sendButton = document.getElementById('send-button'); 
    const userInput = document.getElementById('user-input'); 
    const messagesDiv = document.getElementById('messages'); 
    const chatContainer = document.getElementById('chat-container'); 
    const logoContainer = document.querySelector('.logo-container'); 
    let isFirstMessageSent = false; 
    const isMobile = /Mobi|Android/i.test(navigator.userAgent); 

    const escapeHTML = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

     const createMenuButton = (messageDiv) => {
        const menuButton = document.createElement('button'); 
        menuButton.textContent = '☰'; 
        menuButton.className = 'menu-button'; 
    
        const menu = document.createElement('div'); 
        menu.className = 'menu'; 
        menu.style.display = 'none'; // 초기 상태에서 메뉴를 숨김
    
        const copyOption = document.createElement('div');
        copyOption.textContent = 'Copy';
        const deleteOption = document.createElement('div');
        deleteOption.textContent = 'Delete';
    
        copyOption.onclick = () => {
        const content = Array.from(messageDiv.childNodes)
            .filter(node => 
                node.nodeType === Node.TEXT_NODE || 
                (node.nodeType === Node.ELEMENT_NODE && 
                 !node.classList.contains('menu') && 
                 !node.classList.contains('menu-button'))
            )
            .map(node => node.innerText.trim())
            .join('\n');
        copyToClipboard(content, menuButton);
        menu.style.display = 'none';
        };
    
        deleteOption.onclick = () => {
            messageDiv.remove(); 
            menu.style.display = 'none'; 
        };
    
        menu.appendChild(copyOption);
        menu.appendChild(deleteOption);
    
        menuButton.onclick = (event) => {
            // 버튼 클릭 시 메뉴 토글
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; 
            event.stopPropagation(); // 이벤트 전파 중단
        };
    
        // 문서 클릭 이벤트 추가
        document.addEventListener('click', (event) => {
            // 메뉴가 열려있고 클릭한 요소가 버튼이나 메뉴가 아닐 경우
            if (menu.style.display === 'block' && !menuButton.contains(event.target) && !menu.contains(event.target)) {
                menu.style.display = 'none'; 
            }
        });
    
        messageDiv.appendChild(menuButton); 
        messageDiv.appendChild(menu); 
    };

    const addUserMessage = (formattedPrompt) => {
        const messageDiv = document.createElement('div'); 
        messageDiv.className = 'message-user-message'; 
        messageDiv.innerHTML = formattedPrompt; 
        createMenuButton(messageDiv); 
        messagesDiv.appendChild(messageDiv); 
    };

    const createLoadingIndicator = () => {
        const loadingParentDiv = document.createElement('div'); 
        loadingParentDiv.className = 'loading-parent'; 
        loadingParentDiv.style.height = '40px'; 
        messagesDiv.appendChild(loadingParentDiv); 

        const loadingSpinnerDiv = document.createElement('div'); 
        loadingSpinnerDiv.className = 'loading-spinner'; 
        loadingSpinnerDiv.style.height = '40px'; 
        loadingSpinnerDiv.style.width = '40px'; 
        loadingSpinnerDiv.style.display = 'flex'; 
        loadingParentDiv.appendChild(loadingSpinnerDiv); 
        return loadingParentDiv; 
    };

    const fetchResponse = async (prompt) => {
        const response = await fetch('/process_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt }) 
        });
        return response.text(); 
    };

    const createAssistantMessage = (text) => {
        const tempDiv = document.createElement('div'); 
        tempDiv.innerHTML = text; 
        let currentMessageDiv = document.createElement('div'); 
        currentMessageDiv.className = 'message-assistant-message'; 

        tempDiv.childNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.querySelector('pre code')) {
                    addCodeBlock(node, currentMessageDiv); 
                } else {
                    currentMessageDiv.innerHTML += node.outerHTML; 
                }
            }
        });

        createMenuButton(currentMessageDiv); 
        return currentMessageDiv; 
    };

    const addCodeBlock = (node, currentMessageDiv) => {
        const codeBlocks = node.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
            const codeBlockDiv = document.createElement('div'); 
            codeBlockDiv.className = 'code-block'; 
            const codeHeaderDiv = document.createElement('div'); 
            codeHeaderDiv.className = 'code-header'; 
            const language = block.className; 
            const codeLabelDiv = document.createElement('div'); 
            codeLabelDiv.className = 'code-label'; 
            codeLabelDiv.textContent = language ? `${language}` : 'Code'; 
            codeHeaderDiv.appendChild(codeLabelDiv); 
            codeBlockDiv.appendChild(codeHeaderDiv); 
            const codePre = document.createElement('pre'); 
            codePre.appendChild(block.cloneNode(true)); 
            codeBlockDiv.appendChild(codePre); 
            currentMessageDiv.appendChild(codeBlockDiv); 
        });
    };

    const addCopyButton = () => {
        document.querySelectorAll('.code-block').forEach((element) => {
            const existingButton = element.querySelector('.copy-button'); 
            if (existingButton) {
                existingButton.remove(); 
            }
    
            const copyButton = document.createElement('button'); 
            copyButton.textContent = 'Copy'; 
            copyButton.className = 'copy-button'; 
    
            copyButton.onclick = () => {
                const codeText = element.querySelector('code').innerText; 
                copyToClipboard(codeText, copyButton); 
            };
    
            const header = element.querySelector('.code-header');
            if (header) {
                header.appendChild(copyButton); 
            } 
        });
    };

    const createDeleteButton = (messageDiv) => {
        const deleteButton = document.createElement('button'); 
        deleteButton.textContent = '✘'; 
        deleteButton.className = 'delete-button'; 
    
        deleteButton.onclick = () => {
            messageDiv.remove(); 
        };
    
        messageDiv.appendChild(deleteButton); 
    };
    const highlightCodeBlocks = () => {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block); 
        });
        addCopyButton(); 
    };
    const handleFirstMessageSent = () => {
        logoContainer.style.display = 'none'; 
        chatContainer.style.display = 'flex'; 
        messagesDiv.classList.add('expanded'); 
        isFirstMessageSent = true; 
    };
    const sendMessage = async () => {
        const prompt = userInput.value.trim(); 
        if (prompt) {
            const formattedPrompt = escapeHTML(prompt).replace(/\n/g, '<br>'); 
            addUserMessage(formattedPrompt); 
            userInput.value = ''; 
            userInput.style.height = 'auto'; 
            const loadingParentDiv = createLoadingIndicator(); 
            messagesDiv.scrollTop = messagesDiv.scrollHeight; 
            try {
                const text = await fetchResponse(prompt); 
                const currentMessageDiv = createAssistantMessage(text); 
                messagesDiv.appendChild(currentMessageDiv); 
                loadingParentDiv.remove(); 
                highlightCodeBlocks(); 
            } catch (error) {
                console.error('Error:', error); 
                messagesDiv.innerHTML += `<div class="message-assistant-message">An error occurred. Please try again.</div>`; 
                loadingParentDiv.remove(); 
            }
            messagesDiv.scrollTop = messagesDiv.scrollHeight; 
            if (!isFirstMessageSent) handleFirstMessageSent(); 
            adjustTextareaHeight(); 
        }
    };
    const copyToClipboard = (text, button) => {
        const originalText = button.textContent; // 원래 텍스트 저장
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log('Text successfully copied');
                button.textContent = '✓'; // 복사 성공 메시지
                setTimeout(() => {
                    button.textContent = originalText; // 원래 텍스트로 복원
                }, 1000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err); 
            });
    };

    const adjustTextareaHeight = () => {
        userInput.style.height = 'auto'; 
        const newHeight = Math.min(Math.max(userInput.scrollHeight, 40), 200); 
        userInput.style.height = `${newHeight}px`; 
        adjustMessagesDivHeight(); 
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };

    const adjustMessagesDivHeight = () => {
        const totalHeight = window.innerHeight; 
        const inputHeight = Math.min(userInput.offsetHeight, 200);
        const logoContainerHeight = logoContainer ? logoContainer.offsetHeight : 0;
        messagesDiv.style.height = `${totalHeight - inputHeight - logoContainerHeight - 60}px`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };

    window.addEventListener('resize', adjustMessagesDivHeight);

    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { 
            event.preventDefault(); 
            if (isMobile) { 
                userInput.value += '\n'; 
                adjustTextareaHeight(); 
            } else {
                if (event.shiftKey) { 
                    const { selectionStart, selectionEnd, value } = userInput;
                    userInput.value = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd);
                    userInput.selectionStart = userInput.selectionEnd = selectionStart + 1; 
                    adjustTextareaHeight(); 
                } else {
                    sendMessage(); 
                }
            }
        }
    });

    sendButton.addEventListener('click', sendMessage); 
    userInput.addEventListener('input', adjustTextareaHeight); 

    adjustTextareaHeight(); 
    adjustMessagesDivHeight(); 
};

// initChat 함수 내보내기
export default initChat;
