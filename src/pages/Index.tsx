
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

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [questions, setQuestions] = useState<Array<{question: string, answer: string}>>([]);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    
    try {
      // Simulate document processing and summarization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockContent = `Document: ${file.name}\n\nThis document contains important information about the topic. The content has been successfully processed and is ready for analysis.`;
      const mockSummary = `Summary of ${file.name}:\n\n• Key points extracted from the document\n• Main concepts and ideas identified\n• Important details highlighted\n• Conclusions and recommendations\n\nThis summary provides a comprehensive overview of the document's content, making it easy to understand the essential information quickly.`;
      
      setDocumentContent(mockContent);
      setSummary(mockSummary);
      
      toast({
        title: "Document processed successfully!",
        description: `${file.name} has been analyzed and summarized.`,
      });
    } catch (error) {
      toast({
        title: "Error processing document",
        description: "Please try again with a different file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestion = async (question: string) => {
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockAnswer = documentContent 
      ? `Based on the uploaded document "${uploadedFile?.name}", here's the answer to your question: ${question}\n\nThe document provides relevant information that addresses your query. This response is generated based on the content analysis of your uploaded file.`
      : `I'll answer your question: ${question}\n\nSince no document is currently uploaded, I'm providing a general response. For more specific answers, please upload a document first.`;
    
    const newQA = { question, answer: mockAnswer };
    setQuestions(prev => [...prev, newQA]);
    
    return mockAnswer;
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
            Upload any document and get AI-powered summaries, insights, and answers to your questions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <DocumentUpload 
            onFileUpload={handleFileUpload} 
            isProcessing={isProcessing}
            uploadedFile={uploadedFile}
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
