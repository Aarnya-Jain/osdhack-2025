require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const winston = require('winston');
const path = require('path');
const treeify = require('treeify');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || '',
  userAgent: 'coders-dungeon/v1.0.0'
});

// Initialize Google's Generative AI client
let genAI; // Declare genAI in the module scope
console.log(process.env.GEMINI_API_KEY + "is the key\n")
try {
  // Make sure the API key is provided
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in the environment variables.");
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Assign the instance to the outer variable
  logger.info('Google Generative AI client initialized successfully.');
} catch (error) {
  // Log the error using winston and also to the console for immediate visibility
  logger.error(`Failed to initialize Google Generative AI client: ${error.message}`);
  console.error(`Failed to initialize Google Generative AI client: ${error.message}`);
}


// Cache for storing repository data
const repoCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches repository contents from GitHub
 */
async function fetchRepoContents(owner, repo, path = '') {
  const cacheKey = `${owner}/${repo}${path ? `:${path}` : ''}`;
  const cached = repoCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const result = Array.isArray(data) ? data : [data];
    repoCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    logger.error(`Error fetching repo contents: ${error.message}`);
    throw new Error(`Failed to fetch repository contents: ${error.message}`);
  }
}

/**
 * Gets AI-generated description for code
 */
async function getAIDescription(code, type = 'file') {
  // Add a check to see if the genAI client was initialized
  if (!genAI) {
    logger.error('Attempted to use AI description, but the AI client is not initialized.');
    return "The arcane energies are dormant; the AI oracle is silent.";
  }
  
  try {
    const prompt = type === 'file' 
      ? `Describe what this code file does in a creative, fantasy-themed way, as if it were a magical artifact or location in a dungeon. Keep it under 3 sentences.\n\n${code.substring(0, 1000)}`
      : `Describe what this code function does in a creative, fantasy-themed way, as if it were a spell or scroll. Keep it under 2 sentences.\n\n${code.substring(0, 500)}`;
    
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const result = await model.generateContent(prompt);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error(`AI description error: ${error.message}`);
    console.error(error); 
    return `A magical interference occurred: ${error.message}`;
  }
}

// Recursively build the repo tree
async function buildRepoTree(owner, repo, dir = '') {
  const contents = await fetchRepoContents(owner, repo, dir);
  const tree = {};
  for (const item of contents) {
    if (item.type === 'dir') {
      tree[item.name] = await buildRepoTree(owner, repo, item.path);
    } else {
      tree[item.name] = null;
    }
  }
  return tree;
}

/**
 * Get repository structure as a tree (for the 'structure' command)
 */
app.get('/api/repo/:owner/:repo/structure', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const tree = await buildRepoTree(owner, repo);
    const treeString = treeify.asTree(tree, true);
    res.json({ tree: treeString });
  } catch (error) {
    logger.error(`Error in /api/repo/structure: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API Routes

/**
 * Get repository structure
 */
app.get('/api/repo/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const contents = await fetchRepoContents(owner, repo);
    res.json(contents);
  } catch (error) {
    logger.error(`Error in /api/repo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get file contents with AI description
 */
app.get('/api/file/:owner/:repo/:path(*)', async (req, res) => {
  try {
    const { owner, repo, path } = req.params;
    const contents = await fetchRepoContents(owner, repo, path);
    
    if (Array.isArray(contents)) {
      return res.json(contents);
    }
    
    // For single files, get AI description
    if (contents.type === 'file') {
      const aiDescription = await getAIDescription(atob(contents.content), 'file');
      return res.json({
        ...contents,
        aiDescription
      });
    }
    
    res.json(contents);
  } catch (error) {
    logger.error(`Error in /api/file: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;