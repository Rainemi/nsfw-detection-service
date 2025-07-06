// src/services/documentProcessor.js
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');

class DocumentProcessor {
  async extractImagesFromDocx(buffer) {
    try {
      console.log('Starting document processing...');
      
      // First, try to extract raw text to verify it's a valid DOCX
      const textResult = await mammoth.extractRawText(buffer);
      console.log('Document text extracted, length:', textResult.value.length);
      
      // Extract images
      const images = await this.extractImages(buffer);
      console.log('Found', images.length, 'images in document');
      
      return {
        text: textResult.value,
        images: images,
        documentId: uuidv4()
      };
    } catch (error) {
      console.error('Document processing failed:', error);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  async extractImages(buffer) {
    try {
      console.log('Extracting images from document...');
      
      const options = {
        convertImage: mammoth.images.imgElement((image) => {
          return image.read("base64").then((imageBuffer) => {
            console.log('Processing image:', image.contentType);
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`,
              buffer: imageBuffer,
              contentType: image.contentType,
              id: uuidv4()
            };
          });
        })
      };

      const result = await mammoth.convertToHtml(buffer, options);
      const images = this.parseImagesFromHtml(result.value);
      
      console.log('Successfully extracted', images.length, 'images');
      return images;
    } catch (error) {
      console.error('Image extraction failed:', error);
      // Return empty array if no images or extraction fails
      return [];
    }
  }

  parseImagesFromHtml(html) {
    const images = [];
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src.startsWith('data:')) {
        const [header, base64Data] = src.split(',');
        const contentTypeMatch = header.match(/data:([^;]+)/);
        
        if (contentTypeMatch && base64Data) {
          const contentType = contentTypeMatch[1];
          
          try {
            const buffer = Buffer.from(base64Data, 'base64');
            images.push({
              id: uuidv4(),
              buffer: buffer,
              contentType: contentType,
              size: buffer.length
            });
          } catch (error) {
            console.warn('Failed to process image data:', error.message);
          }
        }
      }
    }

    return images;
  }

  // Helper method to validate DOCX file
  isValidDocx(buffer) {
    // Check for DOCX file signature (PK headers)
    const signature = buffer.slice(0, 4);
    return signature.toString('hex') === '504b0304' || signature.toString('hex') === '504b0506';
  }
}

module.exports = new DocumentProcessor();