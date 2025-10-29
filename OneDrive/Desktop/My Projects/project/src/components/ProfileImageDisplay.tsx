import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileImageDisplayProps {
  filePath: string | null;
  alt?: string;
  className?: string;
}

export function ProfileImageDisplay({ filePath, alt = 'Profile', className = 'w-32 h-32 rounded-full object-cover border-4 border-slate-200' }: ProfileImageDisplayProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImage() {
      if (!filePath) {
        setLoading(false);
        return;
      }

      try {
        const path = filePath.includes('/documents/')
          ? filePath.split('/documents/')[1]
          : filePath;

        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(path, 3600);

        if (error) throw error;

        setImageUrl(data.signedUrl);
      } catch (error) {
        console.error('Error loading image:', error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    }

    loadImage();
  }, [filePath]);

  if (loading) {
    return (
      <div className={className + ' bg-slate-200 animate-pulse'}></div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={className + ' bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-2xl font-bold'}>
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return <img src={imageUrl} alt={alt} className={className} />;
}
