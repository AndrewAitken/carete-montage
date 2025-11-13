'use client';

import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
  userId: string;
}

export default function UploadModal({
  onClose,
  onUploadComplete,
  userId,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Пожалуйста, загрузите видео файл');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Пожалуйста, загрузите видео файл');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          onUploadComplete();
        } else {
          setError('Ошибка при загрузке файла');
          setUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        setError('Ошибка при загрузке файла');
        setUploading(false);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (err) {
      setError('Произошла ошибка при загрузке');
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-semibold text-white">Новый лист</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!uploading ? (
            <>
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-[#3ea662] bg-[#3ea662]/5'
                    : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#2a2a2a] rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-white mb-2">
                    Перетащите область файла или загрузите из устройства
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Выбрать из устройства
                  </button>
                </div>
              </div>

              {/* Selected File Info */}
              {file && (
                <div className="mt-4 p-4 bg-[#2a2a2a] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="ml-4 p-1 hover:bg-[#3a3a3a] rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 text-red-400 text-sm bg-red-500/10 py-2 px-4 rounded-lg">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="py-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3ea662]/20 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-[#3ea662]" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Загрузка видео...
                </h3>
                <p className="text-sm text-gray-400">
                  Пожалуйста, не закрывайте это окно
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>{file?.name}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                  <div
                    className="bg-[#3ea662] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!uploading && (
          <div className="flex gap-3 p-6 border-t border-[#2a2a2a]">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleUpload}
              disabled={!file}
              className="flex-1 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Продолжить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

