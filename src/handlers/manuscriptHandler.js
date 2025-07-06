
// src/handlers/manuscriptHandler.js
const documentProcessor = require('../services/documentProcessor');
const imageClassifier = require('../services/imageClassifier');

class ManuscriptHandler {
  async processManuscript(documentBuffer, filename) {
    try {
      console.log('Processing manuscript:', filename);
      
      // Step 1: Validate file type
      if (!documentProcessor.isValidDocx(documentBuffer)) {
        throw new Error('Invalid DOCX file format');
      }
      
      // Step 2: Extract images from document
      const extractedData = await documentProcessor.extractImagesFromDocx(documentBuffer);
      console.log('Extracted data:', {
        documentId: extractedData.documentId,
        textLength: extractedData.text.length,
        imageCount: extractedData.images.length
      });
      
      // Step 3: Classify images for NSFW content
      const classificationResults = await imageClassifier.classifyAllImages(extractedData.images);
      
      // Step 4: Check if any images are flagged
      const flaggedImages = classificationResults.filter(result => result.classification.isNSFW);
      
      if (flaggedImages.length > 0) {
        console.log('Document flagged:', flaggedImages.length, 'inappropriate images detected');
        
        // For now, we'll just return the flagged result
        // Later we'll add S3 storage and DynamoDB saving
        return {
          success: false,
          flagged: true,
          documentId: extractedData.documentId,
          filename: filename,
          message: `Document flagged for NSFW content. ${flaggedImages.length} inappropriate images detected.`,
          flaggedImages: flaggedImages.map(img => ({
            imageId: img.imageId,
            contentType: img.contentType,
            confidence: img.classification.confidence,
            labels: img.classification.labels
          })),
          totalImages: extractedData.images.length,
          textLength: extractedData.text.length
        };
      } else {
        console.log('Document approved for upload');
        return {
          success: true,
          flagged: false,
          documentId: extractedData.documentId,
          filename: filename,
          message: 'Document approved for upload',
          totalImages: extractedData.images.length,
          textLength: extractedData.text.length
        };
      }
    } catch (error) {
      console.error('Manuscript processing failed:', error);
      throw new Error(`Manuscript processing failed: ${error.message}`);
    }
  }
}

module.exports = new ManuscriptHandler();