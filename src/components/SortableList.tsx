import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box } from '@mui/material';
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

interface Drag { id: string; from: number; to: number; startY: number; dy: number; centers: number[]; height: number }

/**
 * つまみ（⋮⋮）をつかんで、上下にドラッグして並べ替える一覧。指でもマウスでも動く。
 * 行を押したときの動き（編集を開くなど）は、行の中身（children）に任せる。離したときに onMove(id, 新しい場所) を呼ぶ
 */
export function SortableList<T extends { id: string }>({ items, onMove, label, children }: {
  items: T[];
  onMove: (id: string, to: number) => void;
  /** つまみの読み上げ（例: 食費 を動かす） */
  label: (item: T) => string;
  children: (item: T) => ReactNode;
}) {
  const rows = useRef(new Map<string, HTMLElement>());
  const [drag, setDrag] = useState<Drag | null>(null);

  const start = (e: PointerEvent, id: string, from: number) => {
    const rects = items.map((x) => rows.current.get(x.id)!.getBoundingClientRect());
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, from, to: from, startY: e.clientY, dy: 0, centers: rects.map((r) => r.top + r.height / 2), height: rects[from].height });
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const center = drag.centers[drag.from] + dy;
    // 動かしている行のまん中より上にある、ほかの行の数が新しい場所
    const to = drag.centers.filter((c, i) => i !== drag.from && c < center).length;
    setDrag({ ...drag, dy, to });
  };
  const end = () => {
    if (drag && drag.to !== drag.from) onMove(drag.id, drag.to);
    setDrag(null);
  };

  // ほかの行は、動かしている行が通りすぎた分だけ1行ずらす
  const shift = (i: number) => {
    if (!drag || i === drag.from) return 0;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -drag.height;
    if (drag.to < drag.from && i >= drag.to && i < drag.from) return drag.height;
    return 0;
  };

  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((x, i) => {
        const active = drag?.id === x.id;
        return (
          <Box component="li" key={x.id} ref={(el: HTMLElement | null) => { if (el) rows.current.set(x.id, el); else rows.current.delete(x.id); }}
            sx={{
              display: 'flex', alignItems: 'center', position: 'relative', bgcolor: 'background.paper',
              transform: `translateY(${active ? drag.dy : shift(i)}px)`,
              transition: active || !drag ? 'none' : 'transform 150ms ease',
              zIndex: active ? 2 : 1, boxShadow: active ? 4 : 0, borderRadius: active ? '10px' : 0,
            }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>{children(x)}</Box>
            <Box role="button" aria-label={label(x)} tabIndex={-1}
              onPointerDown={(e) => start(e, x.id, i)} onPointerMove={move} onPointerUp={end} onPointerCancel={() => setDrag(null)}
              sx={{ px: 1.5, alignSelf: 'stretch', display: 'flex', alignItems: 'center', color: 'text.secondary', cursor: active ? 'grabbing' : 'grab', touchAction: 'none' }}>
              <DragIndicatorIcon />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
