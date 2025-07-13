# The Coder's Dungeon 🏰

Inspired by classic MUD (Multi-User Dungeon) games, The Coder’s Dungeon reimagines the exploration of codebases as a single-player, offline text adventure.

Navigate your local GitHub repositories as if they were mysterious dungeons — directories become rooms, files become ancient artifacts, and every 'go' is a step deeper into the unknown. Perfect for offline play, this game offers a nostalgic, narrative-driven way to interact with your code like never before.

## Features

- 🗺️ Convert GitHub repositories into explorable dungeons
- 📜 Interactive command-line interface
- 🔍 AI-powered code explanations
- 🧭 Intuitive navigation through code structure
- 🎮 Gamified learning experience

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- GitHub Personal Access Token (for private repositories)

### Installation
1. Clone this repository
```
   cd osdhack-2025
```

2. Set up environment variables:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your GitHub token and AI API key
   ```

### Running the Application
```bash
# Start the backend server
cd backend
npm start

# In a new terminal, start the frontend
cd ../frontend
npm start
```

## How to Play

1. Start the game and enter a GitHub repository URL
2. Explore the codebase using simple commands:

   go [chamber]           - Venture into a new chamber (directory)
   back                   - Return to the previous chamber you visited
   examine [artifact]     - Study a magical artifact (file) with AI insights
   read [artifact]        - Read the contents of a code scroll with AI interpretation
   inventory              - Check your magical satchel (collected code artifacts)
   structure / map        - Unfurl the dungeon map (repository structure)
   help                   - Consult your spellbook
   clear                  - Clear the mystical console
   exit                   - Leave the current dungeon


## Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express
- **AI**: Gemini API for code explanations
- **Version Control**: GitHub API

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
