'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Video } from '@/types';
import { Download, Trash2 } from 'lucide-react';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    switch (video.status) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded bg-[#3ea662] text-white">
            Загружен
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs rounded bg-[#2a2a2a] text-gray-300">
            В обработке
          </span>
        );
      case 'uploading':
        return (
          <span className="px-2 py-1 text-xs rounded bg-[#2a2a2a] text-gray-300">
            Загрузка...
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">
            Ошибка
          </span>
        );
      default:
        return null;
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Вы уверены, что хотите удалить этот монтажный лист?')) {
      return;
    }

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/export/${video.id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.original_filename}_montage.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const cardContent = (
    <>
      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-[#1a1a1a] rounded-lg mb-3 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-600"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </div>

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate mb-1">
            {video.original_filename}
          </h3>
          <p className="text-sm text-gray-400">{formatDate(video.created_at)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {getStatusBadge()}
        
        <div className="flex gap-2">
          {video.status === 'completed' && (
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
              title="Скачать"
            >
              <Download className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>
    </>
  );

  if (video.status === 'completed') {
    return (
      <Link
        href={`/dashboard/${video.id}`}
        className="block p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-colors"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
      {cardContent}
    </div>
  );
}

