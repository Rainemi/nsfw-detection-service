// src/app.js
console.log('Starting NSFW Detection Service...');

try {
  const express = require('express');
  const multer = require('multer');
  const cors = require('cors');
  
  console.log('All required modules loaded successfully');
  
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });
  
  app.use(cors());
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    console.log('Health check accessed');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      message: 'Server is running successfully'
    });
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({ 
      message: 'NSFW Detection Service API',
      version: '1.0.0'
    });
  });
  
  // Import the manuscript handler
  const manuscriptHandler = require('./handlers/manuscripthandler');
  
  // NSFW detection endpoint
  app.post('/api/manuscripts/check', upload.single('manuscript'), async (req, res) => {
    try {
      console.log('Manuscript upload request received');
      
      if (!req.file) {
        return res.status(400).json({ error: 'No manuscript file provided' });
      }

      // Validate file type
      if (req.file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return res.status(400).json({ error: 'Only DOCX files are supported' });
      }

      console.log('Processing file:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const result = await manuscriptHandler.processManuscript(req.file.buffer, req.file.originalname);
      
      const statusCode = result.success ? 200 : 422;
      res.status(statusCode).json(result);
      
    } catch (error) {
      console.error('Error processing manuscript:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message 
      });
    }
  });
  
  const PORT = process.env.PORT || 3000;
  
  const server = app.listen(PORT, () => {
    console.log('Server successfully started on port ' + PORT);
    console.log('Health check: http://localhost:' + PORT + '/health');
    console.log('Root endpoint: http://localhost:' + PORT + '/');
    console.log('Server is ready to accept requests');
  });
  
  // Keep the process alive
  process.on('SIGTERM', () => {
    console.log('Shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('Error starting server:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}