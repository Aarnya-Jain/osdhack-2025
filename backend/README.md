# The Coder's Dungeon - Backend

This is the backend server for The Coder's Dungeon, a text-based adventure game that transforms GitHub repositories into explorable dungeons.

## Features

- GitHub API integration for fetching repository contents
- AI-powered code descriptions using Google's Gemini API
- Caching system for improved performance
- RESTful API endpoints for frontend communication

## Prerequisites

- Node.js 16+
- npm or yarn
- GitHub Personal Access Token
- Google AI API Key (Gemini)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your API keys

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=3001
NODE_ENV=development
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_api_key
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests

## API Endpoints

### GET /api/repo/:owner/:repo

Get the contents of a GitHub repository.

**Parameters:**
- `owner`: GitHub username or organization name
- `repo`: Repository name

**Example:**
```
GET /api/repo/facebook/react
```

### GET /api/file/:owner/:repo/:path(*)

Get the contents of a specific file or directory in a repository.

**Parameters:**
- `owner`: GitHub username or organization name
- `repo`: Repository name
- `path`: Path to the file or directory in the repository

**Example:**
```
GET /api/file/facebook/react/src/index.js
```

## Error Handling

The API returns JSON responses with error messages in the following format:

```json
{
  "error": "Error message describing the issue"
}
```

## Rate Limiting

To avoid hitting GitHub API rate limits, the server implements client-side caching with a 30-minute TTL.

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
