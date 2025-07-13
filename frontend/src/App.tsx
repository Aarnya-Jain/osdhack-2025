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
  breadcrumbs: string[]; // Add breadcrumbs for navigation
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
    breadcrumbs: [], // Initialize breadcrumbs
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
      case 'back':
        await handleBack();
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
          messages: ['✨ The mystical console has been cleared. Type "help" to consult your spellbook.'],
        }));
        break;
      case 'exit':
        setGameState({
          currentPath: '',
          currentDir: [],
          history: [],
          breadcrumbs: [], // Reset breadcrumbs
          inventory: [],
          messages: ['🚪 You step through the portal and leave the dungeon. Enter a new repository to begin another adventure.'],
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
          `🏰 You have entered the mystical repository: ${repo}`,
          'The air hums with arcane energy. Ancient code artifacts await your discovery.',
          'Type "go [directory]" to explore chambers, "examine [file]" to inspect artifacts, or "help" for your spellbook.'
        ],
      }));
    } catch (error: any) {
      addMessage(`❌ The portal to this repository is sealed. ${error.response?.data?.error || error.message}`);
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Add function to handle going back
  const handleBack = async () => {
    if (gameState.breadcrumbs.length === 0) {
      addMessage('🏛️ You are already at the entrance of the dungeon. There is nowhere to go back to.');
      return;
    }

    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      const [owner, repo] = gameState.repoUrl.replace('https://github.com/', '').split('/');
      const previousPath = gameState.breadcrumbs[gameState.breadcrumbs.length - 1];
      const newBreadcrumbs = gameState.breadcrumbs.slice(0, -1);
      
      const response = await axios.get(`${API_BASE_URL}/api/file/${owner}/${repo}/${previousPath}`);
      
      if (Array.isArray(response.data)) {
        const backDescriptions = [
          '🔄 You retrace your steps through the mystical corridors.',
          '🏛️ You return to the previous chamber, the familiar arcane energies welcome you back.',
          '🧭 You navigate back through the dungeon\'s winding passages.',
          '⚡ You step back through the portal to the previous realm.',
          '🔮 You find yourself back in the familiar chamber you visited before.'
        ];
        const randomDescription = backDescriptions[Math.floor(Math.random() * backDescriptions.length)];
        
        setGameState(prev => ({
          ...prev,
          currentPath: previousPath,
          currentDir: response.data,
          breadcrumbs: newBreadcrumbs,
          messages: [
            ...prev.messages,
            randomDescription,
            `You are now in the ${previousPath || 'root'} chamber.`
          ],
        }));
      }
    } catch (error: any) {
      addMessage(`❌ The path back is blocked by ancient wards. ${error.response?.data?.error || error.message}`);
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleGo = async (dirName: string) => {
    if (!dirName) {
      addMessage('🗺️ Please specify a direction or chamber name to explore.');
      return;
    }

    // Check for navigation commands
    if (['north', 'south', 'east', 'west', 'up', 'down'].includes(dirName)) {
      addMessage(`🧭 You move ${dirName}, but find yourself in the same chamber. The dungeon's magic keeps you within the current realm.`);
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
        const roomDescriptions = [
          `🏛️ You step into the ${dirName} chamber. The walls are lined with ancient scrolls and magical artifacts.`,
          `🌌 You enter the ${dirName} realm. Mystical energies pulse through the air.`,
          `🏰 You cross the threshold into ${dirName}. This chamber holds secrets yet to be discovered.`,
          `⚡ You venture into the ${dirName} sanctum. Arcane symbols glow faintly on the walls.`,
          `🔮 You find yourself in the ${dirName} library. Knowledge awaits those who seek it.`
        ];
        const randomDescription = roomDescriptions[Math.floor(Math.random() * roomDescriptions.length)];
        
        setGameState(prev => ({
          ...prev,
          currentPath: newPath,
          currentDir: response.data,
          history: [...prev.history, newPath],
          breadcrumbs: [...prev.breadcrumbs, prev.currentPath], // Add current path to breadcrumbs
          messages: [
            ...prev.messages,
            randomDescription,
            `You see ${response.data.length} artifacts and chambers to explore.`
          ],
        }));
      } else {
        // It's a file
        addMessage(`📜 You examine the ${dirName} artifact.`);
        addMessage(response.data.aiDescription || 'This artifact\'s purpose is shrouded in mystery...');
      }
    } catch (error: any) {
      addMessage(`🚫 The path to ${dirName} is blocked by ancient wards. ${error.response?.data?.error || error.message}`);
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleExamine = async (itemName: string) => {
    if (!itemName) {
      addMessage('🔍 Please specify an artifact to examine with your arcane sight.');
      return;
    }

    const item = gameState.currentDir.find(
      item => item.name.toLowerCase() === itemName.toLowerCase()
    );

    if (!item) {
      addMessage(`👁️ You search the chamber but find no artifact named "${itemName}".`);
      return;
    }

    if (item.type === 'dir') {
      addMessage(`🏛️ ${item.name} is a chamber leading to deeper realms. Type "go ${item.name}" to enter its depths.`);
      return;
    }

    // For files, we might already have the description from the directory listing
    if (item.aiDescription) {
      addMessage(`🔮 Examining ${item.name}: ${item.aiDescription}`);
    } else {
      // If not, fetch the file details
      try {
        setGameState(prev => ({ ...prev, isLoading: true }));
        const [owner, repo] = gameState.repoUrl.replace('https://github.com/', '').split('/');
        const response = await axios.get(
          `${API_BASE_URL}/api/file/${owner}/${repo}/${gameState.currentPath ? `${gameState.currentPath}/` : ''}${item.name}`
        );
        
        addMessage(`🔮 Examining ${item.name}: ${response.data.aiDescription || 'This artifact\'s purpose is shrouded in mystery...'}`);
      } catch (error: any) {
        addMessage(`❌ The ${item.name} artifact is protected by powerful magic. ${error.response?.data?.error || error.message}`);
      } finally {
        setGameState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  const handleRead = async (functionName: string) => {
    if (!functionName) {
      addMessage('📖 Please specify a spell or scroll to read.');
      return;
    }
    
    addMessage(`📜 You attempt to read the ${functionName} spell...`);
    addMessage('🔮 The runes are complex and ancient. This spell\'s secrets require deeper study.');
    addMessage('💡 Tip: Try examining files first to discover their magical properties.');
  };

  const handleInventory = () => {
    if (gameState.inventory.length === 0) {
      addMessage('🎒 Your magical satchel is empty.');
      addMessage('💡 Explore chambers and examine artifacts to collect knowledge.');
    } else {
      addMessage('🎒 Your magical satchel contains:');
      gameState.inventory.forEach((item, index) => {
        addMessage(`  ${index + 1}. ${item}`);
      });
    }
  };

  // Add this function to handle the structure/map command
  const handleStructure = async () => {
    if (!gameState.repoUrl) {
      addMessage('🗺️ No dungeon is currently loaded. Enter a repository to begin your cartographic exploration.');
      return;
    }
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      const [owner, repo] = gameState.repoUrl.replace('https://github.com/', '').split('/');
      const response = await axios.get(`${API_BASE_URL}/api/repo/${owner}/${repo}/structure`);
      addMessage('🗺️ You unfurl the ancient Dungeon Map. The parchment reveals the repository\'s structure:');
      addMessage(response.data.tree);
    } catch (error: any) {
      addMessage('❌ The dungeon map is obscured by magical interference. ' + (error.response?.data?.error || error.message));
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const showHelp = () => {
    const helpText = [
      '📚 Your Arcane Spellbook - Available Commands:',
      '',
      '🧭 go [chamber] - Venture into a new chamber (directory)',
      '🔄 back - Return to the previous chamber you visited',
      '🔍 examine [artifact] - Study a magical artifact (file)',
      '📖 read [spell] - Attempt to decipher ancient runes (function)',
      '🎒 inventory - Check your magical satchel',
      '🗺️ structure/map - Unfurl the dungeon map (repo structure)',
      '❓ help - Consult your spellbook',
      '✨ clear - Clear the mystical console',
      '🚪 exit - Leave the current dungeon',
      '',
      '💡 Tip: Use "back" to retrace your steps through the dungeon!'
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
