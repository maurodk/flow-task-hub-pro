
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from 'lucide-react';

interface MediaItem {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface MediaPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  initialIndex: number;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  isOpen,
  onClose,
  media,
  initialIndex,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentMedia = media[currentIndex];
  
  if (!currentMedia) return null;

  const isImage = currentMedia.type.startsWith('image/');
  const isVideo = currentMedia.type.startsWith('video/');
  const isPdf = currentMedia.type === 'application/pdf';

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
    setZoom(1);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    setZoom(1);
  };

  const downloadFile = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-black/95">
        <div className="relative w-full h-full flex flex-col">
          {/* Header com controles */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                {currentIndex + 1} de {media.length}
              </span>
              <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                {currentMedia.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isImage && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadFile(currentMedia.url, currentMedia.name)}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Área principal de visualização */}
          <div className="flex-1 flex items-center justify-center p-16">
            {isImage && (
              <img
                src={currentMedia.url}
                alt={currentMedia.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            )}
            {isVideo && (
              <video
                src={currentMedia.url}
                controls
                className="max-w-full max-h-full"
                autoPlay
              />
            )}
            {isPdf && (
              <iframe
                src={currentMedia.url}
                className="w-full h-full"
                title={currentMedia.name}
              />
            )}
            {!isImage && !isVideo && !isPdf && (
              <div className="text-white text-center">
                <p className="mb-4">Visualização não disponível para este tipo de arquivo</p>
                <Button
                  onClick={() => downloadFile(currentMedia.url, currentMedia.name)}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar arquivo
                </Button>
              </div>
            )}
          </div>

          {/* Navegação (apenas se houver múltiplas mídias) */}
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={prevMedia}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMedia}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreview;
