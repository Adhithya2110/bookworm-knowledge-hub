
const GOOGLE_API_KEY = 'AIzaSyCZSLgJ6EFzfONFUFuob2XOGksYIbFIUHE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Import PDF parser
import * as pdfjsLib from 'pdfjs-dist';

class AIService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing Google Gemini AI...');
    this.isInitialized = true;
    console.log('Google Gemini AI initialized successfully');
  }

  async summarizeText(text: string): Promise<string> {
    await this.initialize();
    
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    if (!cleanText || cleanText.length < 10) {
      return 'The document appears to be empty or contains very little text content.';
    }

    try {
      const prompt = `Please provide a comprehensive summary of the following document. Focus on key points, main ideas, and important details:

${cleanText}

Please format the summary in a clear, readable way with bullet points or paragraphs as appropriate.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error summarizing text:', error);
      // Fallback to simple truncation
      return `Document Preview: ${cleanText.substring(0, 500)}...

Note: AI summarization temporarily unavailable. This is a preview of your document content.`;
    }
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    await this.initialize();
    
    if (!context) {
      return "I don't have any document context to answer your question. Please upload a document first.";
    }

    try {
      const prompt = context 
        ? `Based on the following document content, please answer this question: "${question}"

Document content:
${context.substring(0, 2000)}

Please provide a detailed and accurate answer based on the document content. If the answer isn't directly available in the document, please say so and provide any relevant context you can find.`
        : `Please answer this question: "${question}"

Since no document is currently uploaded, please provide a general helpful response.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 800,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error answering question:', error);
      return 'Sorry, I encountered an error while processing your question. Please try again.';
    }
  }

  async extractTextFromFile(file: File): Promise<string> {
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Handle PDF files with proper text extraction
        return await this.extractTextFromPDF(file);
      } else {
        // Handle text files and other formats
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              const cleanText = result
                .replace(/[\r\n]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              resolve(cleanText);
            } else {
              resolve('');
            }
          };
          
          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };
          
          reader.readAsText(file);
        });
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from file');
    }
  }

  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Use a simpler approach for PDF text extraction
      // This is a basic implementation that works with most PDFs
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = this.extractTextFromPDFBuffer(uint8Array);
      
      if (text && text.length > 50) {
        return text;
      } else {
        // Fallback: try to extract any readable text from the PDF
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(uint8Array);
        
        // Extract text between common PDF text markers
        const textMatches = rawText.match(/\(([^)]+)\)/g) || [];
        const extractedText = textMatches
          .map(match => match.replace(/[()]/g, ''))
          .filter(text => text.length > 3 && /[a-zA-Z]/.test(text))
          .join(' ');
        
        return extractedText || 'Could not extract readable text from this PDF file. The file may be image-based or protected.';
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return 'Error reading PDF file. Please try a different file or convert to text format.';
    }
  }

  private extractTextFromPDFBuffer(buffer: Uint8Array): string {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(buffer);
    
    // Look for text content between PDF stream objects
    const textPattern = /BT\s*(.*?)\s*ET/gs;
    const matches = text.match(textPattern) || [];
    
    let extractedText = '';
    
    for (const match of matches) {
      // Extract text from PDF text objects
      const contentMatch = match.match(/\((.*?)\)/g);
      if (contentMatch) {
        for (const content of contentMatch) {
          const cleanContent = content.replace(/[()]/g, '').trim();
          if (cleanContent.length > 2 && /[a-zA-Z]/.test(cleanContent)) {
            extractedText += cleanContent + ' ';
          }
        }
      }
    }
    
    // Also try to extract text using Tj operators
    const tjPattern = /\((.*?)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjPattern.exec(text)) !== null) {
      const content = tjMatch[1].trim();
      if (content.length > 2 && /[a-zA-Z]/.test(content)) {
        extractedText += content + ' ';
      }
    }
    
    return extractedText.trim();
  }
}

export const aiService = new AIService();
