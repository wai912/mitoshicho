import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ClickAwayListener, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

/** 補足を「ⓘ」にしまう。タップ（クリック）で開き、ほかを触ると閉じる。画面に説明の文を並べないため */
export function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <span>
        <Tooltip title={text} open={open} onClose={() => setOpen(false)} arrow
          disableFocusListener disableHoverListener disableTouchListener
          slotProps={{ tooltip: { sx: { fontSize: 13, lineHeight: 1.6, p: 1.25, whiteSpace: 'pre-line' } } }}>
          <IconButton size="small" aria-label={label} onClick={() => setOpen((v) => !v)}
            sx={{ color: 'text.secondary', p: 0.5, verticalAlign: 'middle' }}>
            <InfoOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </span>
    </ClickAwayListener>
  );
}
