
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Brain, Loader2 } from 'lucide-react';

interface QuestionBarProps {
  onQuestion: (question: string) => Promise<string>;
  hasDocument: boolean;
}

export const QuestionBar: React.FC<QuestionBarProps> = ({ onQuestion, hasDocument }) => {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    try {
      await onQuestion(question);
      setQuestion('');
    } finally {
      setIsAsking(false);
    }
  };

  const suggestionQuestions = hasDocument 
    ? [
        "Summarize this document briefly",
        "What are the key points?",
        "What conclusions can be drawn?",
        "Explain the main concepts"
      ]
    : [
        "What can you help me with?",
        "How does document analysis work?",
        "What file formats do you support?",
        "Tell me about AI summarization"
      ];

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Ask Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder={hasDocument 
                ? "Ask anything about your document..." 
                : "Ask me anything..."
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isAsking || !question.trim()}>
              {isAsking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Brain className="h-4 w-4 mr-1" />
            Suggested Questions:
          </h4>
          <div className="space-y-2">
            {suggestionQuestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start text-sm"
                onClick={() => setQuestion(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> {hasDocument 
              ? "I can answer questions about your uploaded document or provide general knowledge."
              : "Upload a document first to get specific answers about its content!"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
