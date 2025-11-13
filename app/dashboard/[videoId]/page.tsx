import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import MontageTableClient from '@/components/MontageTableClient';
import type { Video, MontageSheet, MontageEntry } from '@/types';

interface PageProps {
  params: Promise<{
    videoId: string;
  }>;
}

export default async function MontagePage({ params }: PageProps) {
  const { videoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch video
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .eq('user_id', user.id)
    .single();

  if (videoError || !video) {
    notFound();
  }

  // Fetch montage sheet
  const { data: sheet, error: sheetError } = await supabase
    .from('montage_sheets')
    .select('*')
    .eq('video_id', videoId)
    .single();

  if (sheetError || !sheet) {
    // Video exists but no montage sheet yet (might be processing)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1a1a] rounded-full mb-4">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Монтажный лист обрабатывается
          </h2>
          <p className="text-gray-400">
            Это может занять несколько минут...
          </p>
        </div>
      </div>
    );
  }

  // Fetch montage entries
  const { data: entries, error: entriesError } = await supabase
    .from('montage_entries')
    .select('*')
    .eq('sheet_id', sheet.id)
    .order('order_index', { ascending: true });

  if (entriesError) {
    console.error('Error fetching entries:', entriesError);
  }

  return (
    <MontageTableClient
      video={video as Video}
      sheet={sheet as MontageSheet}
      entries={(entries as MontageEntry[]) || []}
    />
  );
}

