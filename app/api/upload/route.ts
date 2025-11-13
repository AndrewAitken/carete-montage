import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate user ID matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filename = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storagePath = `${user.id}/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Create video record in database
    const { data: video, error: dbError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        filename: filename,
        original_filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
        status: 'processing',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from('videos').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 }
      );
    }

    // Trigger video processing
    try {
      // Get signed URL for video
      const { data: signedUrlData } = await supabase.storage
        .from('videos')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (signedUrlData?.signedUrl) {
        // Trigger processing in background (don't await)
        fetch(`${request.nextUrl.origin}/api/process-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId: video.id,
            videoUrl: signedUrlData.signedUrl,
          }),
        }).catch((error) => {
          console.error('Failed to trigger processing:', error);
        });
      }
    } catch (error) {
      console.error('Error triggering processing:', error);
      // Don't fail the upload, just log the error
    }

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

