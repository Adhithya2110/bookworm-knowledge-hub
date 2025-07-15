
import { pipeline } from '@huggingface/transformers';

class AIService {
  private summarizer: any = null;
  private qaModel: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing AI models...');
    
    try {
      // Use smaller, faster models
      this.summarizer = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-6-6'
      );

      this.qaModel = await pipeline(
        'question-answering',
        'Xenova/distilbert-base-uncased-distilled-squad'
      );

      this.isInitialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Error initializing AI models:', error);
      throw new Error('Unable to initialize AI models');
    }
  }

  async summarizeText(text: string): Promise<string> {
    await this.initialize();
    
    // Remove the minimum length requirement and clean the text
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    if (!cleanText || cleanText.length < 20) {
      return 'The document appears to be empty or contains very little text content.';
    }

    try {
      // For shorter texts, provide a more flexible approach
      if (cleanText.length < 100) {
        return `Brief Summary: ${cleanText.substring(0, 200)}...`;
      }

      // Process text in smaller chunks for better performance
      const maxLength = 300;
      const chunks = this.splitTextIntoChunks(cleanText, maxLength);
      
      if (chunks.length === 1 && chunks[0].length < 200) {
        return `Document Summary: ${chunks[0]}`;
      }

      const summaries = [];
      for (const chunk of chunks.slice(0, 3)) { // Limit to 3 chunks for speed
        const result = await this.summarizer(chunk, {
          max_length: 100,
          min_length: 20,
          do_sample: false
        });
        summaries.push(result[0].summary_text);
      }

      return summaries.join(' ');
    } catch (error) {
      console.error('Error summarizing text:', error);
      // Fallback to simple truncation
      return `Document Preview: ${cleanText.substring(0, 300)}...`;
    }
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    await this.initialize();
    
    if (!context) {
      return "I don't have any document context to answer your question. Please upload a document first.";
    }

    try {
      const result = await this.qaModel({
        question: question,
        context: context.substring(0, 1000) // Reduced context for speed
      });

      if (result.score > 0.05) { // Lower threshold
        return result.answer;
      } else {
        return "I couldn't find a specific answer in the document. Here's what I can tell you based on the content: " + context.substring(0, 200) + "...";
      }
    } catch (error) {
      console.error('Error answering question:', error);
      return 'Error processing your question. Please try again.';
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if ((currentChunk + trimmedSentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = trimmedSentence + '.';
        } else {
          chunks.push(trimmedSentence.substring(0, maxLength));
        }
      } else {
        currentChunk += trimmedSentence + '.';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 5);
  }

  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          // Clean up the extracted text
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
      
      // Handle different file types
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll read as text (simplified approach)
        reader.readAsText(file);
      } else {
        // For other files, try to read as text
        reader.readAsText(file);
      }
    });
  }
}

export const aiService = new AIService();
