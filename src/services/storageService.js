
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

class StorageService {
  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.S3_REGION || 'us-east-1'
    });
    this.bucketName = process.env.S3_BUCKET_NAME;
  }

  async storeFlaggedDocument(documentBuffer, documentId, metadata) {
    try {
      const key = `flagged-documents/${documentId}/original-document.docx`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: documentBuffer,
        ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        Metadata: {
          documentId: documentId,
          flaggedAt: new Date().toISOString(),
          ...metadata
        }
      };

      const result = await this.s3.upload(params).promise();
      return {
        location: result.Location,
        key: result.Key,
        bucket: result.Bucket
      };
    } catch (error) {
      throw new Error(`Failed to store flagged document: ${error.message}`);
    }
  }

  async storeFlaggedImages(images, documentId) {
    const storedImages = [];

    for (const image of images) {
      if (image.classification.isNSFW) {
        const key = `flagged-documents/${documentId}/images/${image.imageId}.jpg`;
        
        const params = {
          Bucket: this.bucketName,
          Key: key,
          Body: image.buffer,
          ContentType: image.contentType,
          Metadata: {
            documentId: documentId,
            imageId: image.imageId,
            nsfwConfidence: image.classification.confidence.toString(),
            labels: JSON.stringify(image.classification.labels)
          }
        };

        const result = await this.s3.upload(params).promise();
        storedImages.push({
          imageId: image.imageId,
          location: result.Location,
          key: result.Key,
          classification: image.classification
        });
      }
    }

    return storedImages;
  }
}

module.exports = new StorageService();