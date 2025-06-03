
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  files, 
  onFilesChange, 
  maxFiles = 5,
  acceptedTypes = "image/*,application/pdf,.doc,.docx,.txt"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const totalFiles = files.length + selectedFiles.length;
    
    if (totalFiles > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitido`);
      return;
    }

    onFilesChange([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2"
      >
        <Paperclip className="h-4 w-4" />
        Anexar arquivo
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2 p-2">
              {getFileIcon(file)}
              <span className="text-xs">
                {file.name} ({formatFileSize(file.size)})
              </span>
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => removeFile(index)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
