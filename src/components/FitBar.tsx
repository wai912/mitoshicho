import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { yen } from '../lib/money';

/**
 * いくつかの金額（segments）が、枠（base: 収入や予算）に収まっているかを1本のバーで見せる（計画とふりかえりで同じ形）。
 * 枠をこえた分は、バーの外にはみ出した形（しま模様）で見せる。責める色（赤）は使わない。
 * 収まっているときは何も書かない（余りを細かく見せて合わせさせない）
 */
export function FitBar({ base, segments, overText, overTip }: {
  base: number;
  segments: { value: number; color: string }[];
  /** こえたときの文（例: 収入を ¥5,000 こえている） */
  overText: (over: number) => string;
  overTip?: ReactNode;
}) {
  const used = segments.reduce((a, s) => a + s.value, 0);
  const max = Math.max(base, used, 1);
  const over = used - base;
  const pct = (v: number) => `${(v / max) * 100}%`;
  let left = 0;
  return (
    <Box sx={{ mt: 1.25 }}>
      <Box role="img" aria-label={over > 0 ? overText(over) : '枠の中に収まっている'}
        sx={{ position: 'relative', height: 10, borderRadius: 5, bgcolor: 'soft', overflow: 'hidden' }}>
        {segments.map((s, i) => {
          const x = left; left += s.value;
          return <Box key={i} sx={{ position: 'absolute', left: pct(x), top: 0, bottom: 0, width: pct(s.value), bgcolor: s.color }} />;
        })}
        {over > 0 && <>
          <Box sx={{
            position: 'absolute', left: pct(base), top: 0, bottom: 0, right: 0,
            backgroundImage: (t) => `repeating-linear-gradient(135deg, transparent 0 4px, ${t.palette.background.paper} 4px 7px)`,
          }} />
          <Box sx={{ position: 'absolute', left: pct(base), top: -2, bottom: -2, width: 2, bgcolor: 'text.primary' }} />
        </>}
      </Box>
      {over > 0 && (
        <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="warning.main" fontWeight={700}>{overText(over)}</Typography>
          {overTip}
        </Stack>
      )}
    </Box>
  );
}

/** バーの上に並べる数字。dot はバーの色と対応させる印 */
export function Figure({ label, value, dot, sub }: { label: string; value: number | string; dot?: string; sub?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {dot && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />}
        <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
      </Stack>
      <Typography fontWeight={700} sx={{ whiteSpace: 'nowrap', fontSize: 17 }}>{typeof value === 'number' ? yen(value) : value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary" component="p" noWrap>{sub}</Typography>}
    </Box>
  );
}
