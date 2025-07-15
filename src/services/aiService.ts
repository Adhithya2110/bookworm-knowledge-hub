
import { pipeline } from '@huggingface/transformers';

class AIService {
  private summarizer: any = null;
  private qaModel: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing AI models...');
    
    try {
      // Initialize summarization model
      this.summarizer = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-6-6',
        { device: 'webgpu' }
      );

      // Initialize question-answering model
      this.qaModel = await pipeline(
        'question-answering',
        'Xenova/distilbert-base-cased-distilled-squad',
        { device: 'webgpu' }
      );

      this.isInitialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Error initializing AI models:', error);
      // Fallback to CPU if WebGPU fails
      try {
        this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        this.qaModel = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad');
        this.isInitialized = true;
        console.log('AI models initialized successfully (CPU fallback)');
      } catch (fallbackError) {
        console.error('Failed to initialize AI models:', fallbackError);
        throw new Error('Unable to initialize AI models');
      }
    }
  }

  async summarizeText(text: string): Promise<string> {
    await this.initialize();
    
    if (!text || text.length < 100) {
      return 'Document is too short to generate a meaningful summary.';
    }

    try {
      // Split long text into chunks for better processing
      const maxLength = 512;
      const chunks = this.splitTextIntoChunks(text, maxLength);
      const summaries = [];

      for (const chunk of chunks) {
        const result = await this.summarizer(chunk, {
          max_length: 150,
          min_length: 30,
          do_sample: false
        });
        summaries.push(result[0].summary_text);
      }

      // Combine and create final summary
      const combinedSummary = summaries.join(' ');
      
      if (combinedSummary.length > 500) {
        // Summarize the combined summary if it's too long
        const finalResult = await this.summarizer(combinedSummary, {
          max_length: 200,
          min_length: 50,
          do_sample: false
        });
        return finalResult[0].summary_text;
      }

      return combinedSummary;
    } catch (error) {
      console.error('Error summarizing text:', error);
      return 'Error generating summary. Please try again.';
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
        context: context.substring(0, 2000) // Limit context length
      });

      if (result.score > 0.1) {
        return result.answer;
      } else {
        return "I couldn't find a relevant answer in the uploaded document. Could you try rephrasing your question or ask something more specific about the document content?";
      }
    } catch (error) {
      console.error('Error answering question:', error);
      return 'Error processing your question. Please try again.';
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    const sentences = text.split(/[.!?]+/);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          // If single sentence is too long, split it
          chunks.push(sentence.substring(0, maxLength));
        }
      } else {
        currentChunk += sentence + '.';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 10);
  }

  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text || '');
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else {
        // For non-text files, we'll need additional processing
        // This is a simplified version - in production you'd use libraries like pdf-parse
        resolve(`Content extracted from ${file.name}. This is a simplified text extraction.`);
      }
    });
  }
}

export const aiService = new AIService();
