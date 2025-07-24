# 🕵️ Verity

Verity is a multiplayer web game based on *Two Truths and a Lie*.  
Players write two truths about themselves, the system generates a believable lie using AI, and opponents try to guess the real truths.

## 🛠 Built With

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)  
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)  
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)  
[![Pusher](https://img.shields.io/badge/Pusher-5A2C84?style=for-the-badge&logo=pusher&logoColor=white)](https://pusher.com/)  
[![Anthropic](https://img.shields.io/badge/Claude_AI-Anthropic-000000?style=for-the-badge&logo=anthropic&logoColor=white)](https://www.anthropic.com/index/claude)  
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)  
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

## 🔗 Live Demo

[https://verity-game.vercel.app](https://verity-game.vercel.app)

## 🚀 Getting Started

This section explains how to run Verity locally.

### 🧰 Prerequisites

- Node.js (v18+ recommended)  
- Git  

## 🛠️ Installation

### 1. Clone the repo
```bash
git clone https://github.com/Jiwei-Cao/verity
cd verity
2. Install dependencies
bash
Copy
Edit
npm install
# or
yarn install
3. Configure environment variables
Create a .env.local file in the root directory:

env
Copy
Edit
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=your-cluster
ANTHROPIC_API_KEY=your-anthropic-api-key
4. Start the development server
bash
Copy
Edit
npm run dev
# or
yarn dev
5. Open in your browser
http://localhost:3000

6. (Optional) Change Git Remote if Forked
bash
Copy
Edit
git remote set-url origin https://github.com/jiwei-cao/verity
git remote -v
🧪 Features
Multiplayer rooms with real-time updates via Pusher

AI-generated lies using Anthropic Claude

Game phases: generation → review → play → results

Chat and scoreboard system

Clean responsive UI with Tailwind CSS

Fully deployed on Vercel

🗂️ Project Structure
php
Copy
Edit
verity/
├── public/
│   └── favicon.png, images/
├── src/
│   ├── app/          # Next.js app directory (pages, layout, API routes)
│   ├── components/   # React components
│   ├── lib/          # Game logic and server utilities
│   └── types/        # TypeScript types
├── .env.local        # Environment variables
├── package.json
├── tailwind.config.ts
└── README.md
