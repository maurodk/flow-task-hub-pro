
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Image, Play } from 'lucide-react';
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
  acceptedTypes = "image/*,application/pdf,.doc,.docx,.txt,video/*"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({});

  // Criar URLs de preview para arquivos
  useEffect(() => {
    const newPreviewUrls: {[key: string]: string} = {};
    
    files.forEach((file, index) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const key = `${file.name}-${index}`;
        newPreviewUrls[key] = URL.createObjectURL(file);
      }
    });

    // Limpar URLs antigas
    Object.values(previewUrls).forEach(url => {
      if (!Object.values(newPreviewUrls).includes(url)) {
        URL.revokeObjectURL(url);
      }
    });

    setPreviewUrls(newPreviewUrls);

    // Cleanup ao desmontar
    return () => {
      Object.values(newPreviewUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

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
    const fileToRemove = files[index];
    const key = `${fileToRemove.name}-${index}`;
    if (previewUrls[key]) {
      URL.revokeObjectURL(previewUrls[key]);
    }
    
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
    if (file.type.startsWith('video/')) {
      return <Play className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
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
        <div className="space-y-3">
          {files.map((file, index) => {
            const key = `${file.name}-${index}`;
            const previewUrl = previewUrls[key];
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            return (
              <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {/* Pré-visualização */}
                {previewUrl && (
                  <div className="relative">
                    {isImage && (
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    {isVideo && (
                      <div className="relative">
                        <video
                          src={previewUrl}
                          className="w-full h-32 object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Informações do arquivo */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    {!previewUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
