import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ file, onFileChange, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
    onFileChange(selectedFile);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mb-8">
      <label className="block text-cn-red-light font-serif font-bold text-lg mb-4 text-center">
        上传您的照片 / Upload Photo
      </label>
      
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
          ${isDragging ? 'border-cn-gold bg-cn-gold/10' : 'border-gray-300 hover:border-cn-gold'}
          ${disabled ? 'cursor-not-allowed opacity-70' : ''}
          ${preview ? 'border-solid border-cn-gold' : 'bg-gray-50'}
        `}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept="image/*"
          onChange={onChange}
          disabled={disabled}
        />

        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {!disabled && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={clearFile}
                  className="bg-white/90 p-3 rounded-full text-cn-red hover:scale-110 transition-transform shadow-lg"
                >
                  <X size={24} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <div className="p-4 rounded-full bg-gray-100 mb-3 group-hover:scale-110 transition-transform duration-300">
              <Upload size={32} className="text-gray-400 group-hover:text-cn-gold" />
            </div>
            <p className="font-serif text-sm">点击或拖拽上传照片</p>
            <p className="text-xs text-gray-300 mt-1">支持 JPG, PNG</p>
          </div>
        )}
      </div>
    </div>
  );
};
