import { Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

// アーカイブ・削除のあとに、画面の下に短く出すメッセージ。どこからでも showToast で出せる
let listener: ((message: string) => void) | null = null;

export function showToast(message: string) {
  listener?.(message);
}

export function archiveToast(name: string, archived: boolean) {
  showToast(archived ? `「${name}」をアーカイブしました` : `「${name}」を使用中に戻しました`);
}

export function ToastHost() {
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  useEffect(() => {
    listener = (message) => setToast({ message, key: Date.now() });
    return () => { listener = null; };
  }, []);
  return (
    <Snackbar key={toast?.key} open={!!toast} message={toast?.message} autoHideDuration={2500}
      onClose={(_, reason) => { if (reason !== 'clickaway') setToast(null); }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px)) !important' }} />
  );
}
