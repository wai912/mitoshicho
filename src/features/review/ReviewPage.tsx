import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Button, Card, CardContent, Chip, Divider, IconButton, Stack, Typography,
} from '@mui/material';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { summarize } from '../../domain/cashflow';
import { addPeriods, periodRule } from '../../domain/period';
import { driftHints, driftMinYen, monthDrifts, REVIEW_DONE_KEY, reviewStatus } from '../../domain/review';
import type { AppData } from '../../domain/types';
import { toggleCheck } from '../../db/ops';
import { yen } from '../../lib/money';
import { PeriodNav } from '../../components/PeriodNav';
import { Confetti } from '../../components/Confetti';
import { KITSUNE } from '../../components/Kitsune';
import { InfoTip } from '../../components/InfoTip';
import { FitBar, Figure } from '../../components/FitBar';
import { ActualRow } from '../budget/parts';
import { DriftInline, HintsCard } from './Drift';

/** ふりかえり: 実績を入れて、ずれを考える → 改善のヒント → 完了 */
export function ReviewPage({ data, period, setPeriod, current, menu }: {
  data: AppData; period: string; setPeriod: (p: string) => void; current: string; menu?: ReactNode;
}) {
  const startDay = periodRule(data.settings);
  const s = useMemo(() => summarize(data, period, current), [data, period, current]);
  const status = useMemo(() => reviewStatus(data, period), [data, period]);
  const drifts = useMemo(() => monthDrifts(data, period), [data, period]);
  const hints = useMemo(() => driftHints(data, addPeriods(period, 1)), [data, period]);
  const expense = s.categories.filter((c) => c.kind === 'expense');
  const others = s.categories.filter((c) => c.kind !== 'expense');
  const entered = expense.filter((c) => c.actual !== undefined).length;
  const driftOf = new Map(drifts.map((d) => [d.category.id, d]));
  const allEntered = status.missing === 0 && status.started;
  const future = period > current;
  const minYen = driftMinYen(data);

  // 完了した瞬間だけクラッカーを鳴らす
  const [fire, setFire] = useState(0);
  const wasDone = useRef(status.done);
  useEffect(() => {
    if (status.done && !wasDone.current) setFire((n) => n + 1);
    wasDone.current = status.done;
  }, [status.done]);

  return (
    <Stack spacing={2}>
      <Confetti fire={fire} />
      <PeriodNav value={period} onChange={setPeriod} startDay={startDay} current={current} leading={menu} />

      {status.done ? (
        <Card data-tour="review-steps" sx={{ bgcolor: 'soft', borderColor: 'transparent' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: '16px !important' }}>
            <Box component="img" src={KITSUNE.happy} alt="" sx={{ width: 72, flexShrink: 0 }} />
            <Box>
              <Typography fontWeight={900}>ふりかえり完了！</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>分かったことを、次の計画に活かそう。</Typography>
              {status.closed && (
                <Button size="small" color="inherit" sx={{ color: 'text.secondary', ml: -1 }}
                  onClick={() => toggleCheck(period, REVIEW_DONE_KEY, false)}>完了を取り消す</Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : future ? (
        <Card data-tour="review-steps">
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: '16px !important' }}>
            <Box component="img" src={KITSUNE.looking} alt="" sx={{ width: 52, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>まだ始まっていない月だよ。</Typography>
          </CardContent>
        </Card>
      ) : (
        <Progress entered={entered} total={expense.length} drifts={drifts.length} untagged={status.untagged}
          actual={expense.reduce((a, c) => a + (c.actual ?? 0), 0)} planned={expense.reduce((a, c) => a + c.planned, 0)} />
      )}

      {/* 実績を入れて、ずれを考える */}
      <Section title="カテゴリごとの実績" done={allEntered && status.untagged === 0}
        action={<>
          <InfoTip label="実績の入れ方" text={`家計簿アプリのカテゴリ別の合計を入れます。\n計画と ${yen(minYen)} 以上ずれたカテゴリには、理由とメモの欄が出ます。`} />
          <IconButton size="small" aria-label="表示するずれの設定" href="#prefs-review" sx={{ color: 'text.secondary' }}><TuneIcon fontSize="small" /></IconButton>
        </>}>
        {expense.map((c, i) => {
          const d = driftOf.get(c.category.id);
          return (
            <Fragment key={c.category.id}>
              {i > 0 && <Divider />}
              <ActualRow row={c} period={period} plain />
              {d && <DriftInline drift={d} />}
            </Fragment>
          );
        })}
        {allEntered && drifts.length === 0 && (
          <Typography variant="body2" sx={{ mt: 1 }}>だいたい計画どおりだったよ。いい感じ！</Typography>
        )}
        {others.length > 0 && (
          <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&::before': { display: 'none' }, mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
              <Typography variant="body2" fontWeight={700} color="text.secondary">収入・返済・積み立て</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              {others.map((c, i) => (
                <Fragment key={c.category.id}>
                  {i > 0 && <Divider />}
                  <ActualRow row={c} period={period} plain />
                </Fragment>
              ))}
            </AccordionDetails>
          </Accordion>
        )}
      </Section>

      {/* 改善のヒント */}
      {hints.length > 0 && <HintsCard hints={hints} />}

      {!status.done && !future && (
        <Button variant="contained" size="large" disabled={!allEntered} onClick={() => toggleCheck(period, REVIEW_DONE_KEY, true)}>
          {allEntered ? 'ふりかえり完了' : `あと ${expense.length - entered} カテゴリで完了`}
        </Button>
      )}

    </Stack>
  );
}

function Section({ title, sub, done, action, children }: {
  title: string; sub?: string; done: boolean; action?: ReactNode; children: ReactNode;
}) {
  return (
    <Card>
      <CardContent sx={{ pb: '12px !important' }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          {done && <Avatar sx={{ width: 26, height: 26, fontSize: 14, fontWeight: 900, bgcolor: 'success.main', color: 'background.paper' }}>✓</Avatar>}
          <Typography variant="subtitle1" fontWeight={900} sx={{ flex: 1 }}>{title}</Typography>
          {action}
        </Stack>
        {sub ? <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75, mb: 1, lineHeight: 1.7 }}>{sub}</Typography>
          : <Box sx={{ mb: 0.5 }} />}
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * 上のまとめ（計画のまとめと同じ形）: 予算・使った・目立つずれの数字と、予算に収まっているかのバー。
 * 何カテゴリ入れたかは見出しの横に
 */
function Progress({ entered, total, drifts, untagged, actual, planned }: {
  entered: number; total: number; drifts: number; untagged: number; actual: number; planned: number;
}) {
  return (
    <Card data-tour="review-steps">
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="body2" fontWeight={900}>支出</Typography>
          <Chip size="small" variant="outlined" color={entered === total ? 'success' : 'default'}
            label={`入力 ${entered} / ${total}`} sx={{ height: 24, fontSize: 12, fontWeight: 700 }} />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
          <Figure label="予算" value={planned} />
          <Figure label="使った" value={actual} dot="primary.main" />
          <Figure label="目立つずれ" value={`${drifts}件`} sub={untagged > 0 ? `種類まだ ${untagged}` : undefined} />
        </Stack>
        <FitBar base={planned} segments={[{ value: actual, color: 'primary.main' }]} overText={(o) => `予算を ${yen(o)} こえた`} />
      </CardContent>
    </Card>
  );
}
