import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { File, Download } from 'lucide-react';

interface DocumentDownloadButtonProps {
  filePath: string | null;
  label: string;
  colorClass?: string;
}

export function DocumentDownloadButton({
  filePath,
  label,
  colorClass = 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
}: DocumentDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!filePath || downloading) return;

    setDownloading(true);
    try {
      const path = filePath.includes('/documents/')
        ? filePath.split('/documents/')[1]
        : filePath;

      const { data, error } = await supabase.storage
        .from('documents')
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  if (!filePath) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`flex items-center gap-2 p-3 border rounded-xl transition-colors ${colorClass} ${
        downloading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <File className="w-5 h-5" />
      <span className="text-sm font-medium flex-1 text-left">{label}</span>
      <Download className="w-4 h-4" />
    </button>
  );
}
