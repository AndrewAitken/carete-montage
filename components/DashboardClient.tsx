'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Video, Profile } from '@/types';
import type { User } from '@supabase/supabase-js';
import VideoCard from './VideoCard';
import UploadModal from './UploadModal';
import UserMenu from './UserMenu';

interface DashboardClientProps {
  videos: Video[];
  user: User;
  profile: Profile | null;
}

export default function DashboardClient({
  videos: initialVideos,
  user,
  profile,
}: DashboardClientProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ready' | 'processing'>('ready');
  const router = useRouter();

  // Separate videos by status
  const readyVideos = videos.filter((v) => v.status === 'completed');
  const processingVideos = videos.filter((v) =>
    ['uploading', 'processing'].includes(v.status)
  );
  const errorVideos = videos.filter((v) => v.status === 'error');

  const displayVideos = activeTab === 'ready' ? readyVideos : processingVideos;

  // Poll for video status updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (processingVideos.length > 0) {
        router.refresh();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [processingVideos.length, router]);

  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-light">
              <span className="font-normal">carête</span>{' '}
              <span className="text-gray-400">montage</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-400">
              <span className="text-white">{processingVideos.length}</span> монтажных листах
            </div>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Примеры
            </button>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Поддержка
            </button>
            <UserMenu user={user} profile={profile} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Монтажные листы</h2>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Новый лист
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-8">
          <button
            onClick={() => setActiveTab('ready')}
            className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
              activeTab === 'ready'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span>Готово</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'ready'
                  ? 'bg-white text-black'
                  : 'bg-[#2a2a2a] text-gray-400'
              }`}
            >
              {readyVideos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('processing')}
            className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
              activeTab === 'processing'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span>В работе</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'processing'
                  ? 'bg-white text-black'
                  : 'bg-[#2a2a2a] text-gray-400'
              }`}
            >
              {processingVideos.length}
            </span>
          </button>
        </div>

        {/* Video Grid */}
        {displayVideos.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1a1a] rounded-full mb-4">
              <svg
                className="w-8 h-8 text-gray-500"
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
            <h3 className="text-lg font-medium text-white mb-2">
              {activeTab === 'ready'
                ? 'Нет готовых монтажных листов'
                : 'Нет видео в обработке'}
            </h3>
            <p className="text-gray-400 mb-6">
              {activeTab === 'ready'
                ? 'Загрузите видео, чтобы начать создание монтажного листа'
                : 'Загруженные видео появятся здесь во время обработки'}
            </p>
            {activeTab === 'ready' && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Загрузить видео
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {/* Error Videos */}
        {errorVideos.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-medium text-red-400 mb-4">
              Ошибки обработки ({errorVideos.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {errorVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
          userId={user.id}
        />
      )}
    </div>
  );
}

