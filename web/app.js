document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let socket;
    let currentUser = '';
    let currentRoom = '';
    let currentRoomName = '';

    // --- DOM ELEMENTS ---
    const screens = {
        setup: document.getElementById('setup-screen'),
        room: document.getElementById('room-screen'),
        createRoom: document.getElementById('create-room-screen'),
        chat: document.getElementById('chat-screen'),
    };

    const setupForm = document.getElementById('setup-form');
    const usernameInput = document.getElementById('username');
    
    const welcomeMessage = document.getElementById('welcome-message');
    const publicRoomsList = document.getElementById('public-rooms-list');
    const showCreateRoomBtn = document.getElementById('show-create-room-btn');
    const joinForm = document.getElementById('join-form');
    const roomCodeInput = document.getElementById('room-code');

    const createRoomForm = document.getElementById('create-room-form');
    const newRoomNameInput = document.getElementById('new-room-name');
    const isPublicSwitch = document.getElementById('is-public-switch');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');

    const chatRoomName = document.getElementById('chat-room-name');
    const chatRoomCode = document.getElementById('chat-room-code');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');

    // --- FUNCTIONS ---

    /**
     * Initializes Socket.IO connection and sets up event listeners.
     */
    function initSocket() {
        socket = io({ autoConnect: false });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        socket.on('disconnect', () => console.log('Socket disconnected'));

        socket.on('publicRoomsUpdate', (rooms) => {
            updatePublicRoomsList(rooms);
        });

        socket.on('roomMessage', (data) => {
            addMessage(data.user, data.msg, data.user === currentUser);
        });

        socket.on('system', (data) => {
            addSystemMessage(data.message);
        });
        
        socket.on('roomCreated', (data) => {
            currentRoom = data.room;
            currentRoomName = data.name;
            chatRoomName.textContent = currentRoomName;
            chatRoomCode.textContent = currentRoom;
            showScreen('chat');
            addSystemMessage(`You created and joined '${currentRoomName}'.`);
        });

        socket.on('joined', (data) => {
            currentRoom = data.room;
            currentRoomName = data.name;
            chatRoomName.textContent = currentRoomName;
            chatRoomCode.textContent = currentRoom;
            showScreen('chat');
            addSystemMessage(`You joined '${currentRoomName}'.`);
        });

        socket.on('error', (data) => {
            alert(`Error: ${data.message}`);
        });

        socket.connect();
    }

    /**
     * Switches the visible screen.
     * @param {string} screenName - The name of the screen to show.
     */
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
        
        // Focus appropriate input
        if (screenName === 'setup') usernameInput.focus();
        if (screenName === 'room') roomCodeInput.focus();
        if (screenName === 'createRoom') newRoomNameInput.focus();
        if (screenName === 'chat') messageInput.focus();
    }

    /**
     * Generates a 10-digit room code.
     * @returns {string}
     */
    function generateCode() {
        return (Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000).toString();
    }

    /**
     * Updates the list of public rooms on the UI.
     * @param {Array} rooms - Array of public room objects.
     */
    function updatePublicRoomsList(rooms) {
        publicRoomsList.innerHTML = ''; // Clear existing list
        if (rooms.length === 0) {
            publicRoomsList.innerHTML = '<p class="no-rooms-message">No public rooms available. Create one!</p>';
            return;
        }

        rooms.forEach(room => {
            const roomEl = document.createElement('div');
            roomEl.classList.add('public-room-item');
            roomEl.innerHTML = `
                <div class="room-info">
                    <span class="room-name">${room.name}</span>
                    <span class="room-code">#${room.code}</span>
                </div>
                <div class="room-meta">
                    <span class="user-count">${room.userCount} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg></span>
                    <button class="btn-join-public">Join</button>
                </div>
            `;
            roomEl.querySelector('.btn-join-public').addEventListener('click', () => {
                socket.emit('joinRoom', { roomCode: room.code, user: currentUser });
            });
            publicRoomsList.appendChild(roomEl);
        });
    }

    /**
     * Adds a message to the chat interface.
     * @param {string} user - The user who sent the message.
     * @param {string} text - The message content.
     * @param {boolean} isOwn - True if the message is from the current user.
     */
    function addMessage(user, text, isOwn) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', isOwn ? 'user-message' : 'other-message');

        const metaEl = document.createElement('div');
        metaEl.classList.add('meta');
        metaEl.textContent = isOwn ? 'You' : user;

        const textEl = document.createElement('div');
        textEl.classList.add('text');
        textEl.textContent = text;

        messageEl.appendChild(metaEl);
        messageEl.appendChild(textEl);
        chatMessages.appendChild(messageEl);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Adds a system message to the chat interface.
     * @param {string} text - The system message content.
     */
    function addSystemMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', 'system-message');
        messageEl.textContent = text;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- EVENT HANDLERS ---

    setupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        if (username) {
            currentUser = username;
            welcomeMessage.textContent = `Hello, ${username}!`;
            initSocket();
            showScreen('room');
        }
    });

    showCreateRoomBtn.addEventListener('click', () => {
        showScreen('createRoom');
    });

    cancelCreateBtn.addEventListener('click', () => {
        showScreen('room');
    });

    createRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newRoomCode = generateCode();
        const roomName = newRoomNameInput.value.trim();
        const isPublic = isPublicSwitch.checked;
        
        socket.emit('createRoom', { 
            roomCode: newRoomCode, 
            roomName: roomName,
            isPublic: isPublic,
            user: currentUser 
        });
    });

    joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const roomCode = roomCodeInput.value.trim();
        if (roomCode) {
            socket.emit('joinRoom', { roomCode: roomCode, user: currentUser });
        }
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = messageInput.value.trim();
        if (msg) {
            socket.emit('roomMessage', { room: currentRoom, user: currentUser, msg });
            messageInput.value = '';
        }
    });

    leaveRoomBtn.addEventListener('click', () => {
        if (socket) {
            socket.emit('leave', { room: currentRoom, user: currentUser });
            // We don't disconnect, just go back to the room selection screen
        }
        currentRoom = '';
        currentRoomName = '';
        chatMessages.innerHTML = '';
        roomCodeInput.value = '';
        showScreen('room');
    });

    // --- INITIALIZATION ---
    showScreen('setup');
});
