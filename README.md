# NSFW Detection Service

A Node.js service that automatically detects and flags NSFW (Not Safe For Work) content in documents and images using AWS Rekognition. The service processes uploaded documents, extracts images, analyzes them for inappropriate content, and stores flagged results in DynamoDB.

## 🏗️ Architecture

This service integrates with AWS services:
- **AWS Rekognition**: For NSFW content detection in images
- **AWS S3**: For storing flagged content and processed documents
- **AWS DynamoDB**: For storing detection results and metadata
- **AWS Lambda**: Serverless deployment (optional)

## 📋 Prerequisites

Before running this project, ensure you have:
- **Node.js** (version 14.x or higher)
- **npm** or **yarn**
- **AWS Account** with appropriate permissions
- **AWS CLI** configured (optional, for deployment)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Rainemi/nsfw-detection-service.git
cd nsfw-detection-service
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory with the following configuration:

```env
# Local development
PORT=3000
NODE_ENV=development

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# S3 Configuration
S3_BUCKET_NAME=your-nsfw-flagged-content-bucket
S3_REGION=us-east-1

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=nsfw-flagged-documents
DYNAMODB_REGION=us-east-1

# Rekognition Configuration
REKOGNITION_REGION=us-east-1
NSFW_CONFIDENCE_THRESHOLD=80
```

### 4. AWS Setup
Make sure you have the following AWS resources:

**S3 Bucket:**
```bash
aws s3 mb s3://your-nsfw-flagged-content-bucket
```

**DynamoDB Table:**
```bash
aws dynamodb create-table \
    --table-name nsfw-flagged-documents \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 5. Run the Service
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will be running at `http://localhost:3000`

## 📁 Project Structure

```
nsfw-detection-service/
├── src/
│   ├── app.js                    # Main application entry point
│   ├── handlers/
│   │   └── manuscriptHandler.js  # Document processing handlers
│   ├── services/
│   │   ├── databaseService.js    # DynamoDB operations
│   │   ├── documentProcessor.js  # Document parsing & image extraction
│   │   ├── imageClassifier.js    # NSFW detection using Rekognition
│   │   └── storageService.js     # S3 operations
│   └── utils/
│       ├── constants.js          # Application constants
│       └── helpers.js            # Helper functions
├── test/                         # Test files
├── tests/                        # Additional test files
├── .env                          # Environment variables
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies and scripts
├── template.yaml                 # AWS SAM template (for Lambda deployment)
└── README.md                     # This file
```

## 🔧 Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Deploy to AWS Lambda (if using SAM)
sam build && sam deploy
```

## 📝 Usage Instructions

### 1. Upload and Check Document
Upload a document (Word, PDF, etc.) for NSFW content detection:

```bash
curl -X POST -F "manuscript=@your-document.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" http://localhost:3000/api/manuscripts/check
```

**Example with actual test files:**
```bash
# Test with a Word document
curl -X POST -F "manuscript=@trial.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" http://localhost:3000/api/manuscripts/check


### 2. Supported File Types
- **Word Documents**: `.docx` (use `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)

## 🔐 Environment Variables Explained

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PORT` | Server port number | No | `3000` |
| `NODE_ENV` | Environment mode | No | `development` |
| `AWS_REGION` | AWS region for services | Yes | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes | `your-secret-key` |
| `S3_BUCKET_NAME` | S3 bucket for storing flagged content | Yes | `nsfw-flagged-content-bucket` |
| `S3_REGION` | S3 bucket region | Yes | `us-east-1` |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name | Yes | `nsfw-flagged-documents` |
| `DYNAMODB_REGION` | DynamoDB region | Yes | `us-east-1` |
| `REKOGNITION_REGION` | Rekognition service region | Yes | `us-east-1` |
| `NSFW_CONFIDENCE_THRESHOLD` | Minimum confidence level for flagging (0-100) | No | `80` |

## 🔄 How It Works

1. **Document Upload**: Documents are received via API endpoint
2. **Image Extraction**: Service extracts all images from the document
3. **NSFW Detection**: Each image is analyzed using AWS Rekognition
4. **Result Storage**: Flagged content is stored in S3 and metadata in DynamoDB
5. **Notification**: Results are available via API or webhook

## 🐛 Troubleshooting

### Common Issues

**Problem**: AWS credentials not found
- **Solution**: Ensure AWS credentials are set in `.env` file or AWS CLI is configured
- **Solution**: Check IAM permissions for Rekognition, S3, and DynamoDB access

**Problem**: S3 bucket access denied
- **Solution**: Verify bucket name and region in `.env` file
- **Solution**: Check IAM permissions for S3 operations

**Problem**: DynamoDB table not found
- **Solution**: Create the table using AWS CLI or console
- **Solution**: Verify table name matches `DYNAMODB_TABLE_NAME` in `.env`

**Problem**: Rekognition service limit exceeded
- **Solution**: Check AWS service limits and request increase if needed
- **Solution**: Implement retry logic with exponential backoff

## 📊 API Endpoints

### POST `/api/manuscripts/check`
Upload and check a manuscript for NSFW content.

**Request:**
```bash
curl -X POST -F "manuscript=@your-document.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" http://localhost:3000/api/manuscripts/check
```

**Response Examples:**

**Clean Document (No NSFW Content):**
```json
{
  "success": true,
  "flagged": false,
  "documentId": "654b26de-20d8-47dc-a3d1-d5a54db866af",
  "filename": "trial.docx",
  "message": "Document approved for upload",
  "totalImages": 1,
  "textLength": 38
}
```

**Document with NSFW Content:**
```json
{
  "success": true,
  "flagged": true,
  "documentId": "a5caddf7-9ef1-4f91-ae1c-11f309cf19a6",
  "filename": "flagged-document.docx",
  "message": "Document contains inappropriate content",
  "totalImages": 3,
  "textLength": 1980,
  "flaggedImages": [
    {
      "imageId": "img_001",
      "confidence": 85.5,
      "labels": ["Explicit Nudity"]
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "File processing failed",
  "message": "Unable to extract content from document"
}
```

## 🧪 Testing Examples

### Test with Sample Documents
```bash
# Test document with images
curl -X POST -F "manuscript=@trial.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" http://localhost:3000/api/manuscripts/check

# Test document with text only
curl -X POST -F "manuscript=@test.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" http://localhost:3000/api/manuscripts/check

# Test with PDF
curl -X POST -F "manuscript=@document.pdf;type=application/pdf" http://localhost:3000/api/manuscripts/check
```

### Expected Response Fields
- `success`: Boolean indicating if the request was processed successfully
- `flagged`: Boolean indicating if NSFW content was detected
- `documentId`: Unique identifier for the processed document
- `filename`: Original filename of the uploaded document
- `message`: Human-readable status message
- `totalImages`: Number of images found in the document
- `textLength`: Length of extracted text content
- `flaggedImages`: Array of flagged image details (only if flagged=true)

## 🚀 Deployment

### Local Development
Follow the Quick Start guide above.

### AWS Lambda Deployment
1. Update `template.yaml` with your configuration
2. Build and deploy:
   ```bash
   sam build
   sam deploy --guided
   ```

### Production Considerations
- Use AWS IAM roles instead of access keys
- Enable CloudWatch logging
- Set up proper error handling and monitoring
- Configure auto-scaling based on usage

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review AWS CloudWatch logs
3. Contact the development team

## 🔒 Security Notes

- **Never commit `.env` file to version control**
- **Use IAM roles in production instead of access keys**
- **Regularly rotate AWS credentials**
- **Monitor AWS costs and usage**
- **Implement proper error handling to avoid exposing sensitive information**
