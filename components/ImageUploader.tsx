import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  selectedImage: string | null;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, selectedImage, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelected(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        const blob = item.getAsFile();
        if (blob) processFile(blob);
      }
    }
  }, []);

  if (selectedImage) {
    return (
      <div className="relative group inline-block">
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 cursor-pointer hover:bg-red-600 shadow-lg z-10 transition-colors"
             onClick={onClear}>
          <X size={12} />
        </div>
        <div className="h-16 w-16 rounded-lg overflow-hidden border border-indigo-500 shadow-md bg-slate-800">
          <img src={selectedImage} alt="预览" className="h-full w-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border-dashed border transition-all cursor-pointer overflow-hidden
        ${isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
       <input 
        type="file" 
        accept="image/*" 
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
      <ImageIcon size={18} className="text-slate-400" />
      <span className="text-sm text-slate-400 hidden sm:inline">上传或拖放图片</span>
    </div>
  );
};