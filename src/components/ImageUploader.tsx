import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Image as ImageIcon, Link, Trash2, Check, RefreshCw } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  compact?: boolean;
}

export function ImageUploader({ value, onChange, label = 'Image', required = false, compact = false }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>(value && value.startsWith('http') ? 'url' : 'upload');
  const [stats, setStats] = useState<{ originalSize: string; compressedSize: string; reduction: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressImage = (file: File) => {
    setCompressing(true);
    setError(null);
    setStats(null);

    const originalSizeStr = formatSize(file.size);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Maximum size constraint (1200px longest edge is optimal for quality/lightweight balance)
          const MAX_DIM = 1200;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Could not get 2D canvas context');
          }

          // Handle transparency (draw white background for PNGs)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw image clearly (using high-quality scaling parameters)
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with high quality (0.85 maintains pristine sharpness while achieving excellent compression)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Estimate compressed size from the base64 string
          const stringLength = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
          const compressedBytes = Math.round(stringLength * 0.75);
          const compressedSizeStr = formatSize(compressedBytes);

          const reduction = file.size > 0 
            ? Math.round(((file.size - compressedBytes) / file.size) * 100)
            : 0;

          onChange(compressedDataUrl);
          setStats({
            originalSize: originalSizeStr,
            compressedSize: compressedSizeStr,
            reduction: reduction > 0 ? reduction : 0
          });
        } catch (err: any) {
          console.error(err);
          setError('Failed to compress image. Please try again.');
        } finally {
          setCompressing(false);
        }
      };

      img.onerror = () => {
        setError('Invalid image file.');
        setCompressing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setError('Failed to read file.');
      setCompressing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        compressImage(file);
      } else {
        setError('Please drop a valid image file (JPEG, PNG, WEBP).');
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      compressImage(files[0]);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    onChange('');
    setStats(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (compact) {
    return (
      <div className="relative group/compact w-full aspect-square">
        {value ? (
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
            <img referrerPolicy="no-referrer" src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/compact:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-md"
                title="Remove image"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {/* Fallback delete button for touch devices */}
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 rounded-full transition-colors shadow-sm md:hidden"
              title="Remove image"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerSelect}
            className={`border-2 border-dashed rounded-xl w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5 scale-[0.98]' 
                : 'border-outline-variant hover:border-primary hover:bg-primary/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {compressing ? (
              <RefreshCw size={20} className="text-primary animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload size={18} className="text-outline group-hover/compact:text-primary transition-colors" />
                <span className="text-xs font-semibold text-on-surface block">{label}</span>
                <span className="text-[10px] text-on-surface-variant">Add Image</span>
              </div>
            )}
          </div>
        )}
        {error && (
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <span className="text-[10px] text-red-500 font-semibold truncate block px-1">{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === 'upload' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === 'url' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-3">
          {value ? (
            <div className="relative border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 bg-white flex-shrink-0">
                <img referrerPolicy="no-referrer" src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={16} /> Image Ready
                </p>
                {stats ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Compressed from <span className="line-through">{stats.originalSize}</span> to <span className="font-semibold text-gray-700">{stats.compressedSize}</span> ({stats.reduction}% lighter!)
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Image is loaded successfully</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove image"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerSelect}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[0.99]' 
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {compressing ? (
                <div className="space-y-2 flex flex-col items-center">
                  <RefreshCw size={28} className="text-primary animate-spin" />
                  <p className="text-sm font-medium text-gray-600">Compressing & optimizing image...</p>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="p-3 bg-primary/5 text-primary rounded-xl">
                    <Upload size={22} />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-xs text-gray-400">Pristine clear quality • Automatically optimized for instant loading</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Link size={16} />
            </span>
            <input
              required={required}
              type="url"
              placeholder="https://example.com/image.jpg"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setError(null);
              }}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
            />
          </div>
          {value && (
            <div className="relative border border-gray-100 rounded-xl p-2 bg-gray-50 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                <img referrerPolicy="no-referrer" src={value} alt="URL Preview" className="w-full h-full object-cover" onError={() => setError('Cannot display image from this URL')} onLoad={() => setError(null)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{value}</p>
                <p className="text-[10px] text-gray-400">Loaded via external URL</p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
}
