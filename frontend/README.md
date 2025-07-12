# The Coder's Dungeon - Frontend

This is the frontend for The Coder's Dungeon, a text-based adventure game that transforms GitHub repositories into explorable dungeons.

## Features

- Interactive terminal-style interface
- Real-time command processing
- Responsive design that works on desktop and mobile
- Syntax highlighting for code snippets
- Keyboard navigation support

## Prerequisites

- Node.js 16+
- npm or yarn
- Backend server (see backend README for setup)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Create a `.env` file based on `.env.example` and configure the API URL

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=http://localhost:3001
```

## Project Structure

```
frontend/
  public/
    index.html
    favicon.ico
  src/
    components/     # Reusable UI components
    hooks/          # Custom React hooks
    services/       # API service calls
    styles/         # Global styles and themes
    types/          # TypeScript type definitions
    utils/          # Utility functions
    App.tsx         # Main application component
    index.tsx       # Application entry point
    index.css       # Global styles
```

## Available Commands

Once the application is running, you can use the following commands:

- `go [directory]` - Navigate to a directory
- `examine [file]` - View details about a file
- `read [function]` - View the contents of a function
- `inventory` - View your collected items
- `help` - Show available commands
- `clear` - Clear the console
- `exit` - Leave the current repository

## Styling

The application uses CSS Modules for component-scoped styling. Global styles are defined in `index.css`.

## Testing

To run tests, use:

```bash
npm test
```

## Deployment

To create a production build:

```bash
npm run build
```

This will create an optimized production build in the `build` folder.

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
