// Estado da aplicação
let socket;
let currentUser = '';
let currentRoom = '';

// Elementos do DOM
const setupScreen = document.getElementById('setup-screen');
const roomCodeScreen = document.getElementById('room-code-screen');
const chatScreen = document.getElementById('chat-screen');

const nicknameInput = document.getElementById('nickname');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');

const roomCodeInput = document.getElementById('room-code');
const joinBtn = document.getElementById('join-btn');
const backBtn = document.getElementById('back-btn');

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const leaveBtn = document.getElementById('leave-btn');

const roomDisplay = document.getElementById('room-display');
const userDisplay = document.getElementById('user-display');

// Inicializa Socket.IO
function initSocket() {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('Conectado ao servidor');
    });

    socket.on('disconnect', () => {
        console.log('Desconectado do servidor');
    });

    socket.on('roomMessage', (data) => {
        addMessage(data.user, data.msg, data.user === currentUser);
    });

    socket.on('system', (msg) => {
        addSystemMessage(msg);
    });

    socket.on('joined', (room) => {
        console.log('Entrou na sala:', room);
    });
}

// Navegação entre telas
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Gera código de sala
function generateCode() {
    return Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000;
}

// Criar sala
function createRoom() {
    const name = nicknameInput.value.trim();
    if (!name) {
        nicknameInput.focus();
        return;
    }

    currentUser = name;
    const code = generateCode();
    joinRoom(name, code.toString());
}

// Entrar na sala
function joinRoom(name, code) {
    currentRoom = code;
    currentUser = name;

    // Atualiza UI
    roomDisplay.textContent = code;
    userDisplay.textContent = `@${name}`;

    // Conecta e entra na sala
    if (socket.connected) {
        socket.emit('join', code);
        showScreen(chatScreen);
        messageInput.focus();
    } else {
        socket.once('connect', () => {
            socket.emit('join', code);
            showScreen(chatScreen);
            messageInput.focus();
        });
    }
}

// Adiciona mensagem ao chat
function addMessage(user, text, isOwn = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;

    if (!isOwn) {
        const userSpan = document.createElement('div');
        userSpan.className = 'message-user';
        userSpan.textContent = `@${user}`;
        messageDiv.appendChild(userSpan);
    }

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    messageDiv.appendChild(textDiv);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Adiciona mensagem do sistema
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Envia mensagem
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    if (text === '/sair') {
        leaveRoom();
        return;
    }

    socket.emit('roomMessage', {
        room: currentRoom,
        user: currentUser,
        msg: text
    });

    messageInput.value = '';
    messageInput.focus();
}

// Sair da sala
function leaveRoom() {
    socket.emit('leave', currentRoom);
    chatMessages.innerHTML = '<div class="welcome-message"><p>Bem-vindo ao Lunar Chat 🌙</p></div>';
    showScreen(setupScreen);
    nicknameInput.value = '';
    roomCodeInput.value = '';
    nicknameInput.focus();
}

// Event Listeners - Setup Screen
createRoomBtn.addEventListener('click', () => {
    createRoom();
});

joinRoomBtn.addEventListener('click', () => {
    const name = nicknameInput.value.trim();
    if (!name) {
        nicknameInput.focus();
        return;
    }
    showScreen(roomCodeScreen);
    roomCodeInput.focus();
});

nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createRoomBtn.click();
    }
});

// Event Listeners - Room Code Screen
joinBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim();
    const name = nicknameInput.value.trim();
    if (!code || !name) return;
    joinRoom(name, code);
});

backBtn.addEventListener('click', () => {
    showScreen(setupScreen);
    nicknameInput.focus();
});

roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinBtn.click();
    }
});

// Event Listeners - Chat Screen
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

leaveBtn.addEventListener('click', leaveRoom);

// Inicializa
initSocket();
nicknameInput.focus();
