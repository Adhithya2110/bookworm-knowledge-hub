
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, MessageSquare, Download, BookOpen, Sparkles, Brain, FileImage, FileSpreadsheet, Presentation } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { DocumentUpload } from '@/components/DocumentUpload';
import { QuestionBar } from '@/components/QuestionBar';
import { SummaryDisplay } from '@/components/SummaryDisplay';
import { Header } from '@/components/Header';
import { aiService } from '@/services/aiService';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [questions, setQuestions] = useState<Array<{question: string, answer: string}>>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    
    try {
      // Show initialization message on first use
      if (!isInitializing) {
        setIsInitializing(true);
        toast({
          title: "Processing with Google Gemini AI...",
          description: "Analyzing your document using advanced AI.",
        });
      }

      // Extract text from file
      const extractedText = await aiService.extractTextFromFile(file);
      setDocumentContent(extractedText);
      
      // Generate AI summary
      const aiSummary = await aiService.summarizeText(extractedText);
      const formattedSummary = `AI Summary of ${file.name}:\n\n${aiSummary}\n\nDocument processed successfully using Google Gemini AI.`;
      
      setSummary(formattedSummary);
      
      toast({
        title: "Document processed successfully!",
        description: `${file.name} has been analyzed using Google Gemini AI.`,
      });
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error processing document",
        description: "Please try again with a different file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsInitializing(false);
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setDocumentContent('');
    setSummary('');
    setQuestions([]);
    
    toast({
      title: "Document removed",
      description: "You can now upload a new document.",
    });
  };

  const handleQuestion = async (question: string) => {
    try {
      let answer: string;
      
      if (documentContent) {
        // Answer based on document context
        answer = await aiService.answerQuestion(question, documentContent);
      } else {
        // General response when no document is uploaded
        answer = `I'll answer your question: ${question}\n\nSince no document is currently uploaded, I'm providing a general response. For document-specific answers, please upload a document first.`;
      }
      
      const newQA = { question, answer };
      setQuestions(prev => [...prev, newQA]);
      
      return answer;
    } catch (error) {
      console.error('Error handling question:', error);
      const errorAnswer = "Sorry, I encountered an error while processing your question. Please try again.";
      const newQA = { question, answer: errorAnswer };
      setQuestions(prev => [...prev, newQA]);
      return errorAnswer;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Learn Smart</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload any document and get AI-powered summaries and answers using Google Gemini AI
          </p>
          <div className="mt-4 text-sm text-green-600 font-medium">
            ✅ Powered by Google Gemini • ✅ Fast & Accurate • ✅ Advanced AI Analysis
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <DocumentUpload 
            onFileUpload={handleFileUpload} 
            isProcessing={isProcessing || isInitializing}
            uploadedFile={uploadedFile}
            onFileRemove={handleFileRemove}
          />
          
          <QuestionBar 
            onQuestion={handleQuestion}
            hasDocument={!!uploadedFile}
          />
        </div>

        {summary && (
          <SummaryDisplay 
            summary={summary}
            fileName={uploadedFile?.name || ''}
          />
        )}

        {questions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Q&A History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((qa, index) => (
                  <div key={index} className="border-l-4 border-indigo-500 pl-4">
                    <div className="font-semibold text-gray-900 mb-2">
                      Q: {qa.question}
                    </div>
                    <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      A: {qa.answer}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
