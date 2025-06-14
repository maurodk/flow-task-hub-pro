
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Image, Play } from 'lucide-react';
import MediaPreview from './MediaPreview';

interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachments }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  if (!attachments || attachments.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (type.startsWith('video/')) {
      return <Play className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const isPreviewable = (type: string) => {
    return type.startsWith('image/') || type.startsWith('video/') || type === 'application/pdf';
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const downloadFile = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mediaAttachments = attachments.filter(att => isPreviewable(att.type));

  return (
    <>
      <div className="mt-3 space-y-2">
        {attachments.map((attachment, index) => {
          const isImage = attachment.type.startsWith('image/');
          const isVideo = attachment.type.startsWith('video/');
          
          return (
            <div key={index} className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
              {/* Pré-visualização inline para imagens */}
              {isImage && (
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => openPreview(mediaAttachments.findIndex(m => m.url === attachment.url))}
                >
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full max-h-64 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )}

              {/* Pré-visualização inline para vídeos */}
              {isVideo && (
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => openPreview(mediaAttachments.findIndex(m => m.url === attachment.url))}
                >
                  <video
                    src={attachment.url}
                    className="w-full max-h-64 object-cover"
                    muted
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </div>
              )}

              {/* Informações do arquivo */}
              <div className="p-3 bg-gray-50 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isPreviewable(attachment.type) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPreview(mediaAttachments.findIndex(m => m.url === attachment.url))}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(attachment.url, attachment.name)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MediaPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        media={mediaAttachments}
        initialIndex={previewIndex}
      />
    </>
  );
};

export default AttachmentViewer;
