# Lunar Chat 🌙

Real-time chat system with a modern web interface and terminal client, inspired by the Lunar Vim theme.

## Project Structure

```
chat/
├── server.js          # Socket.IO Server
├── client.js          # Terminal Client (blessed)
├── web/               # Web Frontend
│   ├── index.html
│   ├── style.css
│   └── app.js
└── package.json
```

## Technologies

- **Backend**: Node.js, Socket.IO, Express
- **Terminal Client**: Blessed
- **Web Frontend**: HTML5, CSS3, JavaScript (Vanilla)

## Installation

```bash
npm install
```

## How to Use

### 1. Start the Server

```bash
node server.js
```

The server will be running on `http://localhost:3000`

### 2. Option A: Web Client

Open your browser and go to:
```
http://localhost:3000
```

### 2. Option B: Terminal Client

In another terminal, run:
```bash
node client.js
```

## Features

- ✅ Chat rooms with unique codes
- ✅ Real-time messages
- ✅ Modern web interface (Lunar Vim theme)
- ✅ Interactive terminal client
- ✅ System notifications (join/leave)
- ✅ Multi-user support

## Design

The web frontend follows the **Lunar Vim** theme:
- 🌙 Dark color palette (blue/purple)
- ✨ Modern gradients
- 🎨 Smooth animations
- 📱 Responsive design

## Special Commands

- `/leave` - Leave the current room

## Development

The project uses ES Modules. Make sure you have `"type": "module"` in `package.json`.
