
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, FileImage, FileSpreadsheet, Presentation, File, Loader2, X } from 'lucide-react';

interface DocumentUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  uploadedFile: File | null;
  onFileRemove?: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onFileUpload, 
  isProcessing, 
  uploadedFile,
  onFileRemove 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleRemoveFile = () => {
    if (onFileRemove) {
      onFileRemove();
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="h-6 w-6 text-orange-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-6 w-6 text-purple-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-700">Processing document...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center relative">
              <Button
                variant="outline"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white border-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              {getFileIcon(uploadedFile.name)}
              <p className="text-lg font-medium text-gray-700 mt-2">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">Document uploaded successfully</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Different File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your document here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Support for PDF, PPT, DOC, Excel, Images, and Text files
              </p>
              <Button>
                Choose File
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-500">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            PDF, DOC
          </div>
          <div className="flex items-center">
            <Presentation className="h-4 w-4 mr-1" />
            PPT, Excel
          </div>
          <div className="flex items-center">
            <FileImage className="h-4 w-4 mr-1" />
            Images
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
