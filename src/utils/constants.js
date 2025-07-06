// src/utils/constants.js
module.exports = {
  NSFW_CONFIDENCE_THRESHOLD: parseInt(process.env.NSFW_CONFIDENCE_THRESHOLD) || 50,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_DOCUMENT_TYPES: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'nsfw-flagged-content-dev',
  DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'nsfw-flagged-documents-dev',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1'
};