# Lunar Chat 🌙

Sistema de chat em tempo real com interface web moderna e cliente terminal, inspirado no tema Lunar Vim.

## Estrutura do Projeto

```
chat/
├── server.js          # Servidor Socket.IO
├── client.js          # Cliente Terminal (blessed)
├── web/               # Frontend Web
│   ├── index.html
│   ├── style.css
│   └── app.js
└── package.json
```

## Tecnologias

- **Backend**: Node.js, Socket.IO, Express
- **Cliente Terminal**: Blessed
- **Frontend Web**: HTML5, CSS3, JavaScript (Vanilla)

## Instalação

```bash
npm install
```

## Como Usar

### 1. Iniciar o Servidor

```bash
node server.js
```

O servidor estará rodando em `http://localhost:3000`

### 2. Opção A: Cliente Web

Abra seu navegador e acesse:
```
http://localhost:3000
```

### 2. Opção B: Cliente Terminal

Em outro terminal, execute:
```bash
node client.js
```

## Funcionalidades

- ✅ Salas de chat com código único
- ✅ Mensagens em tempo real
- ✅ Interface web moderna (tema Lunar Vim)
- ✅ Cliente terminal interativo
- ✅ Notificações de sistema (entrar/sair)
- ✅ Suporte a múltiplos usuários

## Design

O frontend web segue o tema **Lunar Vim**:
- 🌙 Paleta de cores escuras (azul/roxo)
- ✨ Gradientes modernos
- 🎨 Animações suaves
- 📱 Design responsivo

## Comandos Especiais

- `/sair` - Sair da sala atual

## Desenvolvimento

O projeto usa ES Modules. Certifique-se de ter `"type": "module"` no `package.json`.
