/**
 * OCR Service for extracting text from images
 * Supports multiple OCR providers: Google Vision API, Tesseract.js
 */

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface ExtractedSerialData {
  serialNumber?: string;
  productName?: string;
  invoiceNumber?: string;
  supplierName?: string;
  costPrice?: number;
  salePrice?: number;
  customerName?: string;
  customerPhone?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonths?: number;
  purchaseDate?: string;
  saleDate?: string;
  confidence: number;
}

class OCRService {
  private apiKey: string;

  constructor() {
    // In production, this should come from environment variables
    this.apiKey = 'YOUR_GOOGLE_VISION_API_KEY';
  }

  /**
   * Extract text from image using Google Vision API
   */
  async extractTextFromImage(imageData: string): Promise<OCRResult> {
    try {
      // Convert data URL to base64
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Data,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.responses && result.responses[0] && result.responses[0].textAnnotations) {
        const textAnnotation = result.responses[0].textAnnotations[0];
        const words = result.responses[0].textAnnotations.slice(1).map((word: any) => ({
          text: word.description,
          confidence: 0.9, // Google Vision doesn't provide confidence for individual words
          boundingBox: {
            x: word.boundingPoly.vertices[0].x || 0,
            y: word.boundingPoly.vertices[0].y || 0,
            width: (word.boundingPoly.vertices[2]?.x || 0) - (word.boundingPoly.vertices[0]?.x || 0),
            height: (word.boundingPoly.vertices[2]?.y || 0) - (word.boundingPoly.vertices[0]?.y || 0),
          },
        }));

        return {
          text: textAnnotation.description,
          confidence: 0.9,
          words,
        };
      }

      throw new Error('No text found in image');
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract text using Tesseract.js (client-side OCR)
   */
  async extractTextWithTesseract(imageData: string): Promise<OCRResult> {
    try {
      // Dynamic import of Tesseract.js
      const Tesseract = await import('tesseract.js');

      const { data } = await Tesseract.recognize(imageData, 'vie+eng', {
        logger: (m) => console.log(m),
      });

      // Check if data and words exist
      if (!data) {
        throw new Error('Tesseract returned no data');
      }

      // Map words with null-check
      const words = (data.words || []).map((word: any) => ({
        text: word.text || '',
        confidence: (word.confidence || 0) / 100,
        boundingBox: {
          x: word.bbox?.x0 || 0,
          y: word.bbox?.y0 || 0,
          width: ((word.bbox?.x1 || 0) - (word.bbox?.x0 || 0)),
          height: ((word.bbox?.y1 || 0) - (word.bbox?.y0 || 0)),
        },
      }));

      return {
        text: data.text || '',
        confidence: (data.confidence || 0) / 100,
        words,
      };
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      throw error;
    }
  }

  /**
   * Extract structured data from OCR text
   */
  extractSerialData(ocrResult: OCRResult): ExtractedSerialData {
    const text = ocrResult.text.toLowerCase();
    const extracted: ExtractedSerialData = {
      confidence: ocrResult.confidence,
    };

    // Extract serial number patterns
    const serialPatterns = [
      /số serial[:\s]*([a-z0-9\-]+)/i,
      /serial[:\s]*([a-z0-9\-]+)/i,
      /mã số[:\s]*([a-z0-9\-]+)/i,
      /sn[:\s]*([a-z0-9\-]+)/i,
      /imei[:\s]*([0-9]+)/i,
      /imei[:\s]*([0-9\s]+)/i,
    ];

    for (const pattern of serialPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.serialNumber = match[1].trim();
        break;
      }
    }

    // Extract product name
    const productPatterns = [
      /tên sản phẩm[:\s]*([^\n\r]+)/i,
      /sản phẩm[:\s]*([^\n\r]+)/i,
      /mặt hàng[:\s]*([^\n\r]+)/i,
      /hàng hóa[:\s]*([^\n\r]+)/i,
    ];

    for (const pattern of productPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.productName = match[1].trim();
        break;
      }
    }

    // Extract invoice number
    const invoicePatterns = [
      /số hóa đơn[:\s]*([a-z0-9\-]+)/i,
      /hóa đơn[:\s]*([a-z0-9\-]+)/i,
      /invoice[:\s]*([a-z0-9\-]+)/i,
      /bill[:\s]*([a-z0-9\-]+)/i,
    ];

    for (const pattern of invoicePatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.invoiceNumber = match[1].trim();
        break;
      }
    }

    // Extract supplier name
    const supplierPatterns = [
      /nhà cung cấp[:\s]*([^\n\r]+)/i,
      /supplier[:\s]*([^\n\r]+)/i,
      /công ty[:\s]*([^\n\r]+)/i,
    ];

    for (const pattern of supplierPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.supplierName = match[1].trim();
        break;
      }
    }

    // Extract prices
    const pricePatterns = [
      /giá[:\s]*([0-9,\.]+)/i,
      /price[:\s]*([0-9,\.]+)/i,
      /tiền[:\s]*([0-9,\.]+)/i,
      /([0-9,\.]+)\s*đ/i,
      /([0-9,\.]+)\s*vnd/i,
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(/[,\.]/g, ''));
        if (!extracted.costPrice) {
          extracted.costPrice = price;
        } else if (!extracted.salePrice) {
          extracted.salePrice = price;
        }
      }
    }

    // Extract customer information
    const customerPatterns = [
      /khách hàng[:\s]*([^\n\r]+)/i,
      /customer[:\s]*([^\n\r]+)/i,
      /tên[:\s]*([^\n\r]+)/i,
    ];

    for (const pattern of customerPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.customerName = match[1].trim();
        break;
      }
    }

    // Extract phone number
    const phonePatterns = [
      /số điện thoại[:\s]*([0-9\s\-]+)/i,
      /phone[:\s]*([0-9\s\-]+)/i,
      /điện thoại[:\s]*([0-9\s\-]+)/i,
      /(0[0-9]{9,10})/,
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.customerPhone = match[1].trim();
        break;
      }
    }

    // Extract dates
    const datePatterns = [
      /ngày[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
      /date[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
      /([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1];
        if (!extracted.purchaseDate) {
          extracted.purchaseDate = dateStr;
        } else if (!extracted.saleDate) {
          extracted.saleDate = dateStr;
        }
      }
    }

    // Extract warranty information
    const warrantyPatterns = [
      /bảo hành[:\s]*([0-9]+)\s*tháng/i,
      /warranty[:\s]*([0-9]+)\s*month/i,
      /([0-9]+)\s*tháng bảo hành/i,
    ];

    for (const pattern of warrantyPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.warrantyMonths = parseInt(match[1]);
        break;
      }
    }

    return extracted;
  }

  /**
   * Main method to process image and extract structured data
   */
  async processImage(imageData: string): Promise<ExtractedSerialData> {
    try {
      // Try Google Vision API first (if API key is available)
      if (this.apiKey && this.apiKey !== 'YOUR_GOOGLE_VISION_API_KEY') {
        const ocrResult = await this.extractTextFromImage(imageData);
        return this.extractSerialData(ocrResult);
      } else {
        // Fallback to Tesseract.js
        const ocrResult = await this.extractTextWithTesseract(imageData);
        return this.extractSerialData(ocrResult);
      }
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Không thể xử lý ảnh. Vui lòng thử lại.');
    }
  }
}

export default new OCRService();
