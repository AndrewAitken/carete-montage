import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Replicate from 'replicate';
import { parseGeminiResponse, parseAlternativeFormat } from '@/lib/parseGeminiResponse';
import { MONTAGE_ANALYSIS_PROMPT } from '@/lib/gemini-prompt';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { videoId, videoUrl } = await request.json();

    if (!videoId || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing videoId or videoUrl' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update video status to processing
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId);

    try {
      // Run Gemini 2.5 Flash on video through Replicate
      console.log('Starting Replicate prediction for video:', videoId);
      
      const output = await replicate.run(
        'google/gemini-2.5-flash:latest',
        {
          input: {
            prompt: MONTAGE_ANALYSIS_PROMPT,
            video: videoUrl,
            max_tokens: 8000,
          },
        }
      ) as string;

      console.log('Replicate output received:', output?.substring(0, 200));

      if (!output) {
        throw new Error('No output from Replicate');
      }

      // Parse the response
      let parsedScenes = parseGeminiResponse(output);
      
      // Try alternative parser if first one fails
      if (parsedScenes.length === 0) {
        parsedScenes = parseAlternativeFormat(output);
      }

      console.log('Parsed scenes count:', parsedScenes.length);

      if (parsedScenes.length === 0) {
        throw new Error('Failed to parse any scenes from output');
      }

      // Get video record to get user_id
      const { data: video } = await supabase
        .from('videos')
        .select('user_id')
        .eq('id', videoId)
        .single();

      if (!video) {
        throw new Error('Video not found');
      }

      // Create montage sheet
      const { data: sheet, error: sheetError } = await supabase
        .from('montage_sheets')
        .insert({
          video_id: videoId,
          user_id: video.user_id,
          title: `Монтажный лист`,
        })
        .select()
        .single();

      if (sheetError) {
        console.error('Error creating sheet:', sheetError);
        throw new Error('Failed to create montage sheet');
      }

      // Insert all entries
      const entries = parsedScenes.map((scene, index) => ({
        sheet_id: sheet.id,
        plan_number: index + 1,
        start_timecode: scene.start_timecode,
        end_timecode: scene.end_timecode,
        plan_type: scene.plan_type,
        description: scene.description,
        dialogues: scene.dialogues,
        order_index: index,
      }));

      const { error: entriesError } = await supabase
        .from('montage_entries')
        .insert(entries);

      if (entriesError) {
        console.error('Error inserting entries:', entriesError);
        throw new Error('Failed to insert montage entries');
      }

      // Update video status to completed
      await supabase
        .from('videos')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', videoId);

      console.log('Video processing completed successfully:', videoId);

      return NextResponse.json({
        success: true,
        sheetId: sheet.id,
        entriesCount: entries.length,
      });
    } catch (processingError: any) {
      console.error('Processing error:', processingError);

      // Update video status to error
      await supabase
        .from('videos')
        .update({
          status: 'error',
          error_message: processingError.message || 'Processing failed',
        })
        .eq('id', videoId);

      return NextResponse.json(
        {
          error: 'Processing failed',
          details: processingError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

