'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Video, MontageSheet, MontageEntry } from '@/types';
import { ArrowLeft, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface MontageTableClientProps {
  video: Video;
  sheet: MontageSheet;
  entries: MontageEntry[];
}

export default function MontageTableClient({
  video,
  sheet,
  entries,
}: MontageTableClientProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleDownload = async () => {
    setDownloading(true);
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
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {video.original_filename}
                </h1>
                <p className="text-sm text-gray-400">
                  {entries.length} планов
                </p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Скачивание...' : 'Скачать excel'}
            </button>
          </div>
        </div>
      </header>

      {/* Table */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                    № плана
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">
                    Начальный<br />тайм-код
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">
                    Конечный<br />тайм-код
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                    План
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Содержание (описание) плана, титры
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Монологи, разговоры, песни, субтитры, музыка
                  </th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {entries.map((entry) => {
                  const isExpanded = expandedRows.has(entry.id);
                  const hasLongContent =
                    (entry.description?.length || 0) > 100 ||
                    (entry.dialogues?.length || 0) > 100;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#252525] transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-white text-center">
                        {entry.plan_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {entry.start_timecode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {entry.end_timecode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {entry.plan_type || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div
                          className={
                            isExpanded ? '' : 'line-clamp-3'
                          }
                        >
                          {entry.description || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div
                          className={
                            isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-3'
                          }
                        >
                          {entry.dialogues || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {hasLongContent && (
                          <button
                            onClick={() => toggleRow(entry.id)}
                            className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
                            title={isExpanded ? 'Свернуть' : 'Развернуть'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {entries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">Нет данных для отображения</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

