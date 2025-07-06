
const AWS = require('aws-sdk');

class DatabaseService {
  constructor() {
    this.dynamodb = new AWS.DynamoDB.DocumentClient({
      region: process.env.DYNAMODB_REGION || 'us-east-1'
    });
    this.tableName = process.env.DYNAMODB_TABLE_NAME;
  }

  async saveFlaggedDocument(documentData) {
    try {
      const item = {
        documentId: documentData.documentId,
        flaggedAt: new Date().toISOString(),
        status: 'FLAGGED',
        s3Location: documentData.s3Location,
        flaggedImages: documentData.flaggedImages,
        totalImages: documentData.totalImages,
        nsfwImageCount: documentData.nsfwImageCount,
        highestConfidence: documentData.highestConfidence,
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
      };

      const params = {
        TableName: this.tableName,
        Item: item
      };

      await this.dynamodb.put(params).promise();
      return item;
    } catch (error) {
      throw new Error(`Failed to save flagged document: ${error.message}`);
    }
  }

  async getFlaggedDocument(documentId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: { documentId: documentId }
      };

      const result = await this.dynamodb.get(params).promise();
      return result.Item;
    } catch (error) {
      throw new Error(`Failed to retrieve flagged document: ${error.message}`);
    }
  }
}

module.exports = new DatabaseService();