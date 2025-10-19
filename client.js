import { io } from "socket.io-client";
import blessed from "blessed";

var socket;
try {
  socket = io("http://localhost:3000");
} catch (e) {
  console.log("Problem connecting to the server");
  process.exit(1);
}

function startChatUI(name, room_code) {
  const screen = blessed.screen({
    smartCSR: true,
    title: `Chat - Room: ${room_code}`,
  });

  const chatLog = blessed.log({
    parent: screen,
    width: "100%",
    height: "90%",
    border: "line",
    label: ` Room: ${room_code} `,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: " ",
      inverse: true,
    },
    keys: true,
    vi: true,
    mouse: true,
  });

  const input = blessed.textbox({
    parent: screen,
    bottom: 0,
    width: "100%",
    height: 1,
    border: "line",
    label: " Message ",
    input: true,
    keys: true,
    mouse: true,
    style: {
      fg: "white",
      bg: "black",
      focus: {
        fg: "black",
        bg: "white",
      },
    },
  });

  // Add an initial message
  chatLog.log(`Welcome, ${name}! Connected to room "${room_code}".`);
  screen.render();

  // Socket.IO handlers to update the UI
  socket.on("roomMessage", (data) => {
    chatLog.log(`[${data.user || data.from}]: ${data.msg}`);
    screen.render();
  });

  socket.on("joined", (room) => {
    chatLog.log(`You have joined the room: ${room}`);
    screen.render();
  });

  // Focus on the input so the user can type
  input.focus();

  // Handler to send a message
  input.on("submit", (text) => {
    if (!text || text.trim() === "") {
      input.clearValue();
      screen.render();
      return;
    }
    
    if (text.trim() === "/leave") {
      socket.emit("leave", room_code);
      return process.exit(0);
    }

    socket.emit("roomMessage", { room: room_code, user: name, msg: text.trim() });
    input.clearValue();
    screen.render();
  });

  // Handler to close the application
  screen.key(["escape", "q", "C-c"], () => {
    socket.emit("leave", room_code);
    return process.exit(0);
  });

  screen.render();
}

// Function to show the initial setup form
function showSetupScreen() {
  const screen = blessed.screen({
    smartCSR: true,
    title: "Chat - Initial Setup",
  });

  const form = blessed.form({
    parent: screen,
    keys: true,
    left: "center",
    top: "center",
    width: 50,
    height: 12,
    border: "line",
    label: " Welcome to Chat ",
  });

  const nicknameLabel = blessed.text({
    parent: form,
    top: 1,
    left: 2,
    content: "Enter your nickname:",
  });

  const nicknameInput = blessed.textarea({
    parent: form,
    top: 2,
    left: 2,
    width: 44,
    height: 3,
    border: "line",
    inputOnFocus: true,
    name: "nickname",
    style: {
      fg: "white",
      bg: "black",
      focus: {
        fg: "white",
        bg: "blue",
      },
    },
  });

  // Handler for Enter on nickname - focuses on buttons
  nicknameInput.key("enter", () => {
    createButton.focus();
  });

  const menuLabel = blessed.text({
    parent: form,
    top: 5,
    left: 2,
    content: "Choose an option:",
  });

  const createButton = blessed.button({
    parent: form,
    top: 6,
    left: 2,
    width: 20,
    height: 3,
    content: "1. Create Room",
    border: "line",
    align: "center",
    style: {
      bg: "blue",
      focus: {
        bg: "cyan",
      },
    },
  });

  const joinButton = blessed.button({
    parent: form,
    top: 6,
    left: 24,
    width: 20,
    height: 3,
    content: "2. Join Room",
    border: "line",
    align: "center",
    style: {
      bg: "blue",
      focus: {
        bg: "cyan",
      },
    },
  });

  let selectedOption = null;

  createButton.on("press", () => {
    selectedOption = "create";
    const name = nicknameInput.getValue().trim();
    if (!name) {
      nicknameInput.focus();
      return;
    }
    screen.destroy();
    createRoom(name);
  });

  joinButton.on("press", () => {
    selectedOption = "join";
    const name = nicknameInput.getValue().trim();
    if (!name) {
      nicknameInput.focus();
      return;
    }
    screen.destroy();
    showRoomCodeInput(name);
  });

  // Keyboard shortcuts to press 1 or 2
  screen.key(["1"], () => {
    const name = nicknameInput.getValue().trim();
    if (!name) {
      nicknameInput.focus();
      return;
    }
    screen.destroy();
    createRoom(name);
  });

  screen.key(["2"], () => {
    const name = nicknameInput.getValue().trim();
    if (!name) {
      nicknameInput.focus();
      return;
    }
    screen.destroy();
    showRoomCodeInput(name);
  });

  screen.key(["escape", "q", "C-c"], () => {
    return process.exit(0);
  });

  nicknameInput.focus();
  screen.render();
}

// Function to ask for the room code
function showRoomCodeInput(name) {
  const screen = blessed.screen({
    smartCSR: true,
    title: "LunarChat - Join Room",
  });

  const box = blessed.box({
    parent: screen,
    keys: true,
    left: "center",
    top: "center",
    width: 50,
    height: 8,
    border: "line",
    label: " Type Room Code ",
  });

  const label = blessed.text({
    parent: box,
    top: 1,
    left: 2,
    content: "Room code:",
  });

  const codeInput = blessed.textarea({
    parent: box,
    top: 2,
    left: 2,
    width: 44,
    height: 3,
    border: "line",
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: {
        fg: "white",
        bg: "blue",
      },
    },
  });

  codeInput.key("enter", () => {
    const code = codeInput.getValue().trim();
    if (!code) {
      codeInput.focus();
      return;
    }
    screen.destroy();
    joinRoom(name, code);
  });

  screen.key(["escape", "q", "C-c"], () => {
    return process.exit(0);
  });

  codeInput.focus();
  screen.render();
}

function generateCode() {
  return Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000;
}

function joinRoom(name, code) {
  const room_code = code;

  const startUI = () => {
    socket.emit("join", room_code);
    startChatUI(name, room_code);
  };

  socket.on("connect", () => {
    if (!socket.startedUI) {
      socket.startedUI = true;
      startUI();
    }
  });

  if (socket.connected && !socket.startedUI) {
    socket.startedUI = true;
    startUI();
  }
}

function createRoom(name) {
  const code = generateCode();
  joinRoom(name, code.toString());
}

// Starts the flow
showSetupScreen();
