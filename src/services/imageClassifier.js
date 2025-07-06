// src/services/imageClassifier.js
const { NSFW_CONFIDENCE_THRESHOLD } = require('../utils/constants');

class ImageClassifier {
  constructor() {
    this.useMockData = process.env.NODE_ENV === 'development' && !process.env.AWS_ACCESS_KEY_ID;
    
    if (!this.useMockData) {
      const AWS = require('aws-sdk');
      this.rekognition = new AWS.Rekognition({
        region: process.env.AWS_REGION || 'us-east-1'
      });
    }
    
    console.log('Image classifier initialized with', this.useMockData ? 'MOCK' : 'AWS Rekognition');
  }

  async detectNSFWContent(imageBuffer) {
    try {
      if (this.useMockData) {
        return this.mockDetection(imageBuffer);
      }

      const params = {
        Image: {
          Bytes: imageBuffer
        },
        MinConfidence: NSFW_CONFIDENCE_THRESHOLD
      };

      const result = await this.rekognition.detectModerationLabels(params).promise();
      
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
      throw new Error(`Image classification failed: ${error.message}`);
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
      console.log('Classifying image:', image.id);
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