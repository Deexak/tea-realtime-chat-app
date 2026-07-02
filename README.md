# Real-Time Chat Application

A premium full-stack real-time chat application built using React (Vite), Node.js, Express, Socket.io, and MongoDB.

## Features
- **Real-Time Communication:** Instant messaging via WebSockets (Socket.io).
- **User Authentication:** Secure user registration and login using JWT.
- **Presence Tracking:** Online/offline status indicators.
- **Typing Indicators:** Real-time visual typing feedback.
- **Chat Rooms:** Create and join public chat rooms.
- **Glassmorphic UI:** A beautiful, responsive glassmorphism dark theme built using vanilla CSS.

## Getting Started

### Prerequisites
- **Node.js:** v18 or higher (tested on v25)
- **MongoDB:** A running MongoDB instance locally or on MongoDB Atlas.

### Configuration
Create `.env` file under `/server` (if not automatically created) with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=supersecretkey
```

### Installation
From the project root directory, run:
```bash
npm run install-all
```
This will install all root, server, and client dependencies.

### Running the Application
To run both client and server concurrently, execute:
```bash
npm run dev
```
The application will be accessible at:
- **Client (Frontend):** `http://localhost:5173`
- **Server (API/Sockets):** `http://localhost:5000`
"# tea-realtime-chat-app" 
