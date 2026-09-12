import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface ResumeUploadResult {
  url: string;
  fileName: string;
  error?: string;
}

export async function uploadResumeFile(
  userId: string,
  file: File
): Promise<ResumeUploadResult> {
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/resume_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('resumes')
        .getPublicUrl(data.path);

      return {
        url: publicData.publicUrl,
        fileName: file.name,
      };
    } catch (err: any) {
      console.warn('Supabase storage upload error, using local object URL:', err);
    }
  }

  // Fallback to local browser object URL for seamless testing
  const localUrl = URL.createObjectURL(file);
  return {
    url: localUrl,
    fileName: file.name,
  };
}
