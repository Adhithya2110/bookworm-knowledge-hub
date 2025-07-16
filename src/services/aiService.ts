
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

  async answerQuestion(question: string, context?: string): Promise<string> {
    await this.initialize();
    
    try {
      let prompt: string;
      
      if (context && context.trim().length > 10) {
        // Try to answer based on document context first
        prompt = `Based on the following document content, please answer this question: "${question}"

Document content:
${context.substring(0, 3000)}

Instructions:
1. First, try to answer the question based on the document content above.
2. If the document doesn't contain information relevant to the question, clearly state that and then provide a helpful general answer.
3. Be clear about whether your answer comes from the document or general knowledge.`;
      } else {
        // No document context, provide general answer
        prompt = `Please answer this question: "${question}"

Provide a helpful and informative response based on your general knowledge.`;
      }

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
    console.log('Extracting text from file:', file.name, 'Type:', file.type);
    
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
              console.log('Extracted text length:', cleanText.length);
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
      console.log('Starting PDF text extraction for:', file.name);
      console.log('File size:', file.size, 'bytes');
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      // Configure PDF.js with more permissive settings
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useSystemFonts: true,
        disableFontFace: false,
        verbosity: 0 // Reduce PDF.js console output
      });
      
      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully. Pages:', pdf.numPages);
      
      let fullText = '';
      let totalItems = 0;
      
      // Extract text from each page with better error handling
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`Processing page ${pageNum}/${pdf.numPages}...`);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          console.log(`Page ${pageNum} has ${textContent.items.length} text items`);
          totalItems += textContent.items.length;
          
          // Extract text with better formatting preservation
          const pageText = textContent.items
            .map((item: any) => {
              if ('str' in item && item.str) {
                return item.str.trim();
              }
              return '';
            })
            .filter(text => text.length > 0)
            .join(' ');
          
          if (pageText.trim()) {
            fullText += pageText + '\n';
            console.log(`Page ${pageNum} extracted ${pageText.length} characters`);
          } else {
            console.log(`Page ${pageNum} contained no readable text`);
          }
          
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      console.log(`Total text items processed: ${totalItems}`);
      console.log(`Raw text length: ${fullText.length}`);
      
      // Clean up the text
      const cleanedText = fullText
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();
      
      console.log(`Final cleaned text length: ${cleanedText.length}`);
      console.log('Text preview:', cleanedText.substring(0, 200));
      
      // Check if we extracted meaningful content
      if (cleanedText.length > 20) {
        console.log('✅ PDF text extraction successful');
        return cleanedText;
      } else if (totalItems > 0) {
        console.log('⚠️ PDF has text items but extraction yielded little content');
        return `PDF contains ${totalItems} text elements but extraction yielded limited readable content. This might be a formatted resume or contain special characters. The document appears to have text but may require manual review.`;
      } else {
        console.log('❌ No text items found in PDF');
        return 'This PDF appears to contain no extractable text. It might be an image-based document or have text embedded as graphics. Consider converting it to a text-based format.';
      }
      
    } catch (error) {
      console.error('❌ Error extracting PDF text:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('Invalid PDF')) {
        return 'The uploaded file appears to be corrupted or is not a valid PDF. Please try uploading a different PDF file.';
      } else if (error.message?.includes('password')) {
        return 'This PDF is password-protected. Please upload an unprotected version of the document.';
      } else {
        return `Error reading PDF file: ${error.message || 'Unknown error'}. Please try a different file or ensure the PDF contains readable text.`;
      }
    }
  }
}

export const aiService = new AIService();
