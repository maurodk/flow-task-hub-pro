
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Image } from 'lucide-react';

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
    return <FileText className="h-4 w-4" />;
  };

  const openFile = (url: string) => {
    window.open(url, '_blank');
  };

  const downloadFile = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-3 space-y-2">
      {attachments.map((attachment, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 flex-1">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openFile(attachment.url)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
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
      ))}
    </div>
  );
};

export default AttachmentViewer;
