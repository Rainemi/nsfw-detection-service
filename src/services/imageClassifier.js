// src/services/imageClassifier.js
const { NSFW_CONFIDENCE_THRESHOLD } = require('../utils/constants');

class ImageClassifier {
  constructor() {
    this.useMockData = process.env.NODE_ENV === 'development' && !process.env.AWS_ACCESS_KEY_ID;
    
    if (!this.useMockData) {
      const AWS = require('aws-sdk');
      
      // Explicitly configure AWS with credentials
      const config = {
        region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        signatureVersion: 'v4'
      };
      
      // Add session token if using temporary credentials (ASIA prefix)
      if (process.env.AWS_SESSION_TOKEN) {
        config.sessionToken = process.env.AWS_SESSION_TOKEN;
      }
      
      this.rekognition = new AWS.Rekognition(config);
      
      // Log configuration (without sensitive data)
      console.log('AWS Rekognition configured with:', {
        region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 10) + '...' : 'NOT SET',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'
      });
    }
    
    console.log('Image classifier initialized with', this.useMockData ? 'MOCK' : 'AWS Rekognition');
  }

  async detectNSFWContent(imageBuffer) {
    try {
      if (this.useMockData) {
        return this.mockDetection(imageBuffer);
      }

      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Invalid image buffer');
      }

      const params = {
        Image: {
          Bytes: imageBuffer
        },
        MinConfidence: NSFW_CONFIDENCE_THRESHOLD
      };

      console.log('Calling AWS Rekognition with image size:', imageBuffer.length);
      const result = await this.rekognition.detectModerationLabels(params).promise();
      
      console.log('AWS Rekognition response:', {
        moderationLabels: result.ModerationLabels.length,
        labels: result.ModerationLabels.map(l => l.Name)
      });
      
      return {
        isNSFW: result.ModerationLabels.length > 0,
        labels: result.ModerationLabels.map(label => ({
          name: label.Name,
          confidence: label.Confidence,
          categories: label.Categories
        })),
        confidence: result.ModerationLabels.length > 0 ? 
          Math.max(...result.ModerationLabels.map(l => l.Confidence)) : 0
      };
    } catch (error) {
      console.error('Image classification failed:', error);
      
      // Provide more specific error messages
      if (error.code === 'UnrecognizedClientException') {
        throw new Error('AWS authentication failed: Invalid credentials');
      } else if (error.code === 'InvalidImageFormatException') {
        throw new Error('Invalid image format: Only JPEG and PNG are supported');
      } else if (error.code === 'AccessDeniedException') {
        throw new Error('AWS access denied: Check IAM permissions for Rekognition');
      } else {
        throw new Error(`Image classification failed: ${error.message}`);
      }
    }
  }

  // Mock detection for testing without AWS
  mockDetection(imageBuffer) {
    console.log('Using mock NSFW detection for image size:', imageBuffer.length);
    
    // Simple mock logic: randomly flag 20% of images as NSFW for testing
    const isNSFW = Math.random() < 0.2;
    const confidence = isNSFW ? 85 + Math.random() * 15 : 20 + Math.random() * 30;
    
    return {
      isNSFW: isNSFW,
      labels: isNSFW ? [
        {
          name: 'Suggestive',
          confidence: confidence,
          categories: ['Suggestive']
        }
      ] : [],
      confidence: confidence,
      mock: true
    };
  }

  async classifyAllImages(images) {
    console.log('Classifying', images.length, 'images...');
    const results = [];
    
    for (const image of images) {
      console.log('Classifying image:', image.id, 'size:', image.buffer.length);
      const classification = await this.detectNSFWContent(image.buffer);
      results.push({
        imageId: image.id,
        contentType: image.contentType,
        size: image.size,
        classification: classification
      });
    }

    const flaggedCount = results.filter(r => r.classification.isNSFW).length;
    console.log('Classification complete:', flaggedCount, 'of', images.length, 'images flagged');
    
    return results;
  }
}

module.exports = new ImageClassifier();