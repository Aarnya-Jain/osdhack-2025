import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

type FileItem = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  aiDescription?: string;
  content?: string;
};

type GameState = {
  currentPath: string;
  currentDir: FileItem[];
  history: string[];
  inventory: string[];
  messages: string[];
  repoUrl: string;
  repoName: string;
  isLoading: boolean;
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    currentPath: '',
    currentDir: [],
    history: [],
    inventory: [],
    messages: [
      'Welcome to The Coder\'s Dungeon!',
      'Enter a GitHub repository URL to begin your adventure (e.g., facebook/react):',
    ],
    repoUrl: '',
    repoName: '',
    isLoading: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  const addMessage = (message: string) => {
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const processCommand = async (command: string) => {
    if (!command.trim()) return;

    const parts = command.trim().toLowerCase().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');

    // Clear the input
    setInput('');
    addMessage(`> ${command}`);

    // If no repo is loaded, try to load one
    if (!gameState.repoName && !['help', 'exit', 'clear'].includes(cmd)) {
      await loadRepository(command);
      return;
    }

    // Process commands
    switch (cmd) {
      case 'go':
        await handleGo(args);
        break;
      case 'examine':
        await handleExamine(args);
        break;
      case 'read':
        await handleRead(args);
        break;
      case 'inventory':
        handleInventory();
        break;
      case 'structure':
      case 'map':
        await handleStructure();
        break;
      case 'help':
        showHelp();
        break;
      case 'clear':
        setGameState(prev => ({
          ...prev,
          messages: ['Console cleared. Type "help" for available commands.'],
        }));
        break;
      case 'exit':
        setGameState({
          currentPath: '',
          currentDir: [],
          history: [],
          inventory: [],
          messages: ['You have left the dungeon. Enter a new repository URL to begin again.'],
          repoUrl: '',
          repoName: '',
          isLoading: false,
        });
        break;
      default:
        addMessage('Unknown command. Type "help" for a list of commands.');
    }
  };

  const loadRepository = async (repoPath: string) => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      // Extract owner and repo from the path
      const [owner, repo] = repoPath.split('/').filter(Boolean);
      if (!owner || !repo) {
        throw new Error('Please provide a valid GitHub repository path (e.g., facebook/react)');
      }

      // Fetch repository contents
      const response = await axios.get(`${API_BASE_URL}/api/repo/${owner}/${repo}`);
      
      setGameState(prev => ({
        ...prev,
        currentPath: '',
        currentDir: response.data,
        repoUrl: `https://github.com/${owner}/${repo}`,
        repoName: repo,
        messages: [
          ...prev.messages,
          `You have entered the repository: ${repo}`,
          'Type "go [directory]" to explore, "examine [file]" to inspect files, or "help" for more commands.'
        ],
      }));
    } catch (error: any) {
      addMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleGo = async (dirName: string) => {
    if (!dirName) {
      addMessage('Please specify a direction or directory name.');
      return;
    }

    // Check for navigation commands
    if (['north', 'south', 'east', 'west', 'up', 'down'].includes(dirName)) {
      addMessage(`You move ${dirName}.`);
      // Add more sophisticated navigation logic here
      return;
    }

    // Handle directory navigation
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      const [owner, repo] = gameState.repoUrl.replace('https://github.com/', '').split('/');
      const newPath = gameState.currentPath ? `${gameState.currentPath}/${dirName}` : dirName;
      
      const response = await axios.get(`${API_BASE_URL}/api/file/${owner}/${repo}/${newPath}`);
      
      if (Array.isArray(response.data)) {
        // It's a directory
        setGameState(prev => ({
          ...prev,
          currentPath: newPath,
          currentDir: response.data,
          history: [...prev.history, newPath],
          messages: [
            ...prev.messages,
            `You enter the ${dirName} directory.`,
          ],
        }));
      } else {
        // It's a file
        addMessage(`You examine the ${dirName} file.`);
        addMessage(response.data.aiDescription || 'This file appears to be empty.');
      }
    } catch (error: any) {
      addMessage(`You can't go that way. ${error.response?.data?.error || error.message}`);
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleExamine = async (itemName: string) => {
    if (!itemName) {
      addMessage('Please specify an item to examine.');
      return;
    }

    const item = gameState.currentDir.find(
      item => item.name.toLowerCase() === itemName.toLowerCase()
    );

    if (!item) {
      addMessage(`You don't see a ${itemName} here.`);
      return;
    }

    if (item.type === 'dir') {
      addMessage(`${item.name} is a directory. Type "go ${item.name}" to enter it.`);
      return;
    }

    // For files, we might already have the description from the directory listing
    if (item.aiDescription) {
      addMessage(`Examining ${item.name}: ${item.aiDescription}`);
    } else {
      // If not, fetch the file details
      try {
        setGameState(prev => ({ ...prev, isLoading: true }));
        const [owner, repo] = gameState.repoUrl.replace('https://github.com/', '').split('/');
        const response = await axios.get(
          `${API_BASE_URL}/api/file/${owner}/${repo}/${gameState.currentPath ? `${gameState.currentPath}/` : ''}${item.name}`
        );
        
        addMessage(`Examining ${item.name}: ${response.data.aiDescription || 'No description available.'}`);
      } catch (error: any) {
        addMessage(`Could not examine ${item.name}: ${error.response?.data?.error || error.message}`);
      } finally {
        setGameState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  const handleRead = async (functionName: string) => {
    // This would be implemented to show function contents
    addMessage(`You attempt to read the ${functionName} function...`);
    addMessage('(Function reading feature coming soon!)');
  };

  const handleInventory = () => {
    if (gameState.inventory.length === 0) {
      addMessage('Your inventory is empty.');
    } else {
      addMessage('You are carrying:');
      gameState.inventory.forEach((item, index) => {
        addMessage(`  ${index + 1}. ${item}`);
      });
    }
  };

  // Add this function to handle the structure/map command
  const handleStructure = async () => {
    if (!gameState.repoUrl) {
      addMessage('No repository loaded. Enter a repository to begin your adventure.');
      return;
    }
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      const [owner, repo] = gameState.repoUrl.replace('https://github.com/', '').split('/');
      const response = await axios.get(`${API_BASE_URL}/api/repo/${owner}/${repo}/structure`);
      addMessage('Dungeon Map:\n' + response.data.tree);
    } catch (error: any) {
      addMessage('Could not fetch the dungeon map. ' + (error.response?.data?.error || error.message));
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const showHelp = () => {
    const helpText = [
      'Available commands:',
      '  go [direction/directory] - Move in a direction or enter a directory',
      '  examine [file] - Get information about a file',
      '  read [function] - Read the contents of a function',
      '  inventory - View your collected items',
      '  structure/map - Show the full dungeon map (repo structure)',
      '  help - Show this help message',
      '  clear - Clear the console',
      '  exit - Leave the current repository',
    ];
    
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, ...helpText],
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      processCommand(input);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧙‍♂️ The Coder's Dungeon</h1>
        <p>Explore codebases as if they were dungeons</p>
      </header>
      
      <div className="game-container">
        <div className="game-console">
          <div className="console-output">
            {gameState.messages.map((msg, index) => (
              <div key={index} className="console-line">
                {msg}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="console-input">
            {gameState.isLoading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <span className="prompt">$&gt;</span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter command..."
                  autoFocus
                />
              </>
            )}
          </div>
        </div>
        
        <div className="game-sidebar">
          <div className="location">
            <h3>Current Location</h3>
            <p>{gameState.repoName || 'No repository loaded'}</p>
            {gameState.currentPath && (
              <p className="path">/{gameState.currentPath}</p>
            )}
          </div>
          
          <div className="inventory">
            <h3>Inventory</h3>
            {gameState.inventory.length === 0 ? (
              <p>Empty</p>
            ) : (
              <ul>
                {gameState.inventory.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <footer className="app-footer">
        <p>Created with ❤️ for OSD Hackathon | Type "help" for commands</p>
      </footer>
    </div>
  );
}

export default App;
