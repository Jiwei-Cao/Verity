# Verity

Verity is a multiplayer web game based on "Two Truths and a Lie". Players generate truths about themselves, the system generates believable lies, and opponents try to guess the truth!

## Features

- Multiplayer rooms with real-time updates (Pusher)
- AI-generated lies (Anthropic Claude API)
- Game phases: generation, review, play, results
- Chat and scoreboard

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Yarn or npm

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jiwei-cao/verity.git
   cd verity
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local` and fill in your keys for Pusher and Anthropic.

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Project Structure

- `src/app/` — Next.js app directory (pages, layout, API routes)
- `src/components/` — React components
- `src/types/` — TypeScript types
- `src/lib/` — Server-side utilities and game store
- `public/` — Static assets (favicon, images)

## Customization

- **Favicon:** Replace `public/favicon.png` with your own image.
- **Styling:** Uses Tailwind CSS (see `src/app/globals.css`).

## License

MIT

---
