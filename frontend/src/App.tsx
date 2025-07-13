import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import heartIcon from './pixel-heart.png';
import TypewriterMessage from './TypewriterMessage.tsx';
import './App.css';

type FileItem = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  aiDescription?: string;
  content?: string;
  decodedContent?: string;
};

type GameState = {
  currentPath: string;
  currentDir: FileItem[];
  history: string[];
  breadcrumbs: string[];
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
    breadcrumbs: [],
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
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);

  const typeSoundRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
  // Setup background music
  const music = new Audio('/dungeon2.mp3');
  music.loop = true;
  music.volume = 0.4;
  musicRef.current = music;

  // ADD THESE LINES to set up the typewriter sound
  const typeSound = new Audio('/click.mp3');
  typeSound.preload = 'auto';
  typeSound.volume = 0.05;
  typeSound.load();
  typeSoundRef.current = typeSound;

  // Cleanup function
  return () => {
    music.pause();
  };
}, []);



  const addMessage = (message: string) => {
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const processCommand = async (command: string) => {
    if (!command.trim()) return;

    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      // Add a .catch() here to handle any music playback errors gracefully
      musicRef.current?.play().catch(e => console.error("Music autoplay failed:", e));
    }

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
        await showHelp();
        break;
      case 'clear':
        setGameState(prev => ({
          ...prev,
          messages: ['The mystical console has been cleared. Type "help" to consult your spellbook.'],
        }));
        break;
      case 'exit':
        setGameState({
          currentPath: '',
          currentDir: [],
          history: [],
          breadcrumbs: [],
          inventory: [],
          messages: ['You step through the portal and leave the dungeon. Enter a new repository to begin another adventure.'],
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
        throw new Error('❌ Please provide a valid GitHub repository path (e.g., facebook/react)');
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
          `You have entered the mystical repository: ${repo}`,
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
          breadcrumbs: [...prev.breadcrumbs, prev.currentPath],
          messages: [
            ...prev.messages,
            randomDescription,
            `You see ${response.data.length} artifacts and chambers to explore.`
          ],
        }));
      } else {
        // It's a file - fetch with AI description
        addMessage(`📜 You approach the ${dirName} artifact...`);
        if (response.data.aiDescription) {
          addMessage(`🔮 ${response.data.aiDescription}`);
        } else {
          addMessage('This artifact\'s purpose is shrouded in mystery...');
        }
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

    // For files, fetch detailed information with AI description
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      addMessage(`🔍 You focus your arcane sight on the ${item.name} artifact...`);

      const [owner, repo] = gameState.repoUrl.replace('https://github.com/', '').split('/');
      const filePath = gameState.currentPath ? `${gameState.currentPath}/${item.name}` : item.name;

      const response = await axios.get(`${API_BASE_URL}/api/file/${owner}/${repo}/${filePath}`);
      console.log("Backend response:", response.data); // <-- Add this

      if (response.data.aiDescription) {
        addMessage(`🔮 ${response.data.aiDescription}`);

        // Add to inventory if not already there
        const inventoryItem = `${item.name} (${gameState.currentPath || 'root'})`;
        if (!gameState.inventory.includes(inventoryItem)) {
          setGameState(prev => ({
            ...prev,
            inventory: [...prev.inventory, inventoryItem]
          }));
          addMessage(`✨ You have gained knowledge of the ${item.name} artifact. It has been added to your inventory.`);
        }
      } else {
        addMessage('🌫️ The artifact\'s secrets remain hidden in the mists of time...');
      }
    } catch (error: any) {
      addMessage(`❌ The ${item.name} artifact is protected by powerful magic. ${error.response?.data?.error || error.message}`);
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRead = async (itemName: string) => {
    if (!itemName) {
      addMessage('📖 Please specify an artifact to read with your mystical abilities.');
      return;
    }

    const item = gameState.currentDir.find(
      item => item.name.toLowerCase() === itemName.toLowerCase()
    );

    if (!item) {
      addMessage(`📜 You search for the ${itemName} scroll but find nothing.`);
      return;
    }

    if (item.type === 'dir') {
      addMessage(`🏛️ ${item.name} is a chamber, not a readable artifact. Use "go ${item.name}" to explore it.`);
      return;
    }

    // For files, attempt to read the content and get AI interpretation
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      addMessage(`📖 You begin to decipher the ancient runes of ${item.name}...`);

      const [owner, repo] = gameState.repoUrl.replace('https://github.com/', '').split('/');
      const filePath = gameState.currentPath ? `${gameState.currentPath}/${item.name}` : item.name;

      const response = await axios.get(`${API_BASE_URL}/api/file/${owner}/${repo}/${filePath}`);

      if (response.data.decodedContent) {
        // Get AI description specifically for reading/understanding the code
        const aiResponse = await axios.post(`${API_BASE_URL}/api/ai/describe`, {
          code: response.data.decodedContent,
          type: 'function',
          fileName: item.name
        });
        console.log("AI describe response:", aiResponse.data); // <-- Add this

        if (aiResponse.data.description) {
          addMessage(`📜 As you read the ${item.name} scroll, ancient knowledge unfolds:`);
          addMessage(`🔮 ${aiResponse.data.description}`);

          // Show a snippet of the actual code
          const codeSnippet = response.data.decodedContent.substring(0, 300);
          addMessage(`📝 The beginning of the scroll reads: "${codeSnippet}${response.data.decodedContent.length > 300 ? '...' : ''}"`);
        } else {
          addMessage('🌫️ The runes are too ancient to fully comprehend...');
        }
      } else {
        addMessage('📜 The scroll appears to be blank or written in an unknown script...');
      }
    } catch (error: any) {
      addMessage(`❌ The ${item.name} scroll is protected by powerful enchantments. ${error.response?.data?.error || error.message}`);
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
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

   const showHelp = async () => {
    const helpText = [
      '== Your Arcane Spellbook - Available Commands:',
      '',
      '-- go [chamber] - Venture into a new chamber (directory)',
      '-- back - Return to the previous chamber you visited',
      '-- examine [artifact] - Study a magical artifact (file) with AI insights',
      '-- read [artifact] - Read the contents of a code scroll with AI interpretation',
      '-- inventory - Check your magical satchel',
      '-- structure/map - Unfurl the dungeon map (repo structure)',
      '-- help - Consult your spellbook',
      '-- clear - Clear the mystical console',
      '-- exit - Leave the current dungeon',
      '',
      '<> Tips:',
      '• Use "examine" to get AI-powered insights about files',
      '• Use "read" to see code content with AI explanations',
      '• Use "back" to retrace your steps through the dungeon!'
    ];

    // This loop adds each line one by one with a delay
    for (const line of helpText) {
      addMessage(line);
      // This creates a short pause to let the typewriter finish
      await new Promise(resolve => setTimeout(resolve, 500)); 
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      processCommand(input);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>The Coder's Dungeon</h1>
        <p>Explore codebases as if they were dungeons with AI-powered insights</p>
      </header>

      <div className="game-container">
        <div className="game-console">
          <div className="console-output">
            {gameState.messages.filter(msg => msg).map((msg, index) => {
              const isLastMessage = index === gameState.messages.length - 1;

              if (isLastMessage) {
                return <TypewriterMessage key={index} message={msg} audio={typeSoundRef.current} />;
              }
              return (
                <div key={index} className="console-line">
                  {msg}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="console-input">
            {gameState.isLoading ? (
              <div className="loading">The oracle is consulting the ancient spirits...</div>
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
            <h3>Knowledge Inventory</h3>
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
        <p>Created with <img className='heart' src={heartIcon} alt="pixel-heart" /> for OSD Hackathon | Type "help" for commands</p>
      </footer>
    </div>
  );
}

export default App;