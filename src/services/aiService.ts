
const GOOGLE_API_KEY = 'AIzaSyCZSLgJ6EFzfONFUFuob2XOGksYIbFIUHE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Import PDF.js for browser-compatible PDF parsing
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

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
        // Handle PDF files with pdfjs-dist
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
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + ' ';
      }
      
      if (fullText.trim().length > 10) {
        return fullText.trim();
      } else {
        return 'Could not extract readable text from this PDF file. The file may be image-based or protected.';
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return 'Error reading PDF file. Please try a different file or convert to text format.';
    }
  }
}

export const aiService = new AIService();
