import { io } from "socket.io-client";
import blessed from "blessed";

var socket;
try {
  socket = io("http://localhost:3000");
} catch (e) {
  console.log("Problema ao conectar com o servidor");
  process.exit(1);
}

function startChatUI(name, room_code) {
  const screen = blessed.screen({
    smartCSR: true,
    title: `Chat - Sala: ${room_code}`,
  });

  const chatLog = blessed.log({
    parent: screen,
    width: "100%",
    height: "90%",
    border: "line",
    label: ` Sala: ${room_code} `,
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
    label: " Mensagem ",
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

  // Adiciona uma mensagem inicial
  chatLog.log(`Bem-vindo, ${name}! Conectado à sala "${room_code}".`);
  screen.render();

  // Handlers do Socket.IO para atualizar a UI
  socket.on("roomMessage", (data) => {
    chatLog.log(`[${data.user || data.from}]: ${data.msg}`);
    screen.render();
  });

  socket.on("joined", (room) => {
    chatLog.log(`Você entrou na sala: ${room}`);
    screen.render();
  });

  // Foca no input para o usuário poder digitar
  input.focus();

  // Handler para enviar mensagem
  input.on("submit", (text) => {
    if (!text || text.trim() === "") {
      input.clearValue();
      screen.render();
      return;
    }
    
    if (text.trim() === "/sair") {
      socket.emit("leave", room_code);
      return process.exit(0);
    }

    socket.emit("roomMessage", { room: room_code, user: name, msg: text.trim() });
    input.clearValue();
    screen.render();
  });

  // Handler para fechar a aplicação
  screen.key(["escape", "q", "C-c"], () => {
    socket.emit("leave", room_code);
    return process.exit(0);
  });

  screen.render();
}

// Função para mostrar o formulário de entrada inicial
function showSetupScreen() {
  const screen = blessed.screen({
    smartCSR: true,
    title: "Chat - Configuração Inicial",
  });

  const form = blessed.form({
    parent: screen,
    keys: true,
    left: "center",
    top: "center",
    width: 50,
    height: 12,
    border: "line",
    label: " Bem-vindo ao Chat ",
  });

  const nicknameLabel = blessed.text({
    parent: form,
    top: 1,
    left: 2,
    content: "Digite seu nickname:",
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

  // Handler para Enter no nickname - foca nos botões
  nicknameInput.key("enter", () => {
    createButton.focus();
  });

  const menuLabel = blessed.text({
    parent: form,
    top: 5,
    left: 2,
    content: "Escolha uma opção:",
  });

  const createButton = blessed.button({
    parent: form,
    top: 6,
    left: 2,
    width: 20,
    height: 3,
    content: "1. Criar Sala",
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
    content: "2. Entrar na Sala",
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

  // Atalhos de teclado para pressionar 1 ou 2
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

// Função para pedir o código da sala
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
    content: "Código da sala:",
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

// Inicia o fluxo
showSetupScreen();