const GOOGLE_API_KEY = 'AIzaSyCZSLgJ6EFzfONFUFuob2XOGksYIbFIUHE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
const PYTHON_API_URL = 'http://localhost:5000';

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
        // Use Python backend for PDF extraction
        return await this.extractTextFromPDFViaPython(file);
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

  private async extractTextFromPDFViaPython(file: File): Promise<string> {
    try {
      console.log('Sending PDF to Python backend for extraction:', file.name);
      console.log('File size:', file.size, 'bytes');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${PYTHON_API_URL}/extract-pdf`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Python API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const extractedText = data.text || '';
      console.log('✅ Python PDF extraction successful');
      console.log('Extracted text length:', extractedText.length);
      console.log('Text preview:', extractedText.substring(0, 200));
      
      if (extractedText.length > 20) {
        return extractedText;
      } else {
        return 'PDF was processed but contained very little extractable text. This might be an image-based PDF or contain special formatting.';
      }
      
    } catch (error) {
      console.error('❌ Error with Python PDF extraction:', error);
      
      // Provide specific error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return 'Could not connect to Python backend. Please ensure your Python server is running on http://localhost:5000 and try again.';
      } else {
        return `Error extracting PDF text: ${error.message}. Please check your Python backend server.`;
      }
    }
  }
}

export const aiService = new AIService();
