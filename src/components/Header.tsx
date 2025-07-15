
import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learn Smart</h1>
              <p className="text-sm text-gray-600">AI-Powered Document Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Supported formats: PDF, PPT, DOC, Images, Text
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
