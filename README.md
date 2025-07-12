# The Coder's Dungeon 🏰

Transform any GitHub repository into an interactive, text-based adventure game! Explore codebases as if they were dungeons, with files as artifacts and directories as rooms.

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
2. Install dependencies:
   ```bash
   cd coder-dungeon
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your GitHub token and AI API key
   ```

### Running the Application
```bash
# Start the backend server
cd backend
npm start

# In a new terminal, start the frontend
cd frontend
npm start
```

## How to Play

1. Start the game and enter a GitHub repository URL
2. Explore the codebase using simple commands:
   - `go [direction]` - Move between directories
   - `examine [file]` - View file details
   - `read [function]` - View function code
   - `inventory` - View your collected code artifacts
   - `help` - Show available commands

## Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express
- **AI**: OpenAI API for code explanations
- **Version Control**: GitHub API

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
