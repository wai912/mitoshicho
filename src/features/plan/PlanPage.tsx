import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Card, CardContent, CardHeader, Chip, Stack, Typography,
} from '@mui/material';
import { useMemo, type ReactNode } from 'react';
import { summarize, type CategoryRow, type PeriodSummary } from '../../domain/cashflow';
import { addPeriods, periodRule } from '../../domain/period';
import { DRIFT_LABEL, driftHints, type DriftHint } from '../../domain/review';
import type { AppData, CategoryActual, CategoryKind } from '../../domain/types';
import { yen } from '../../lib/money';
import { PeriodNav } from '../../components/PeriodNav';
import { InfoTip } from '../../components/InfoTip';
import { FitBar, Figure } from '../../components/FitBar';
import { CategoryItems } from '../budget/parts';
import { OutflowsCard } from '../home/Outlook';

/** 計画: カテゴリごとの予算を、先月のずれをふまえてざっくり決める。下に出金予定 */
export function PlanPage({ data, period, setPeriod, current, menu }: {
  data: AppData; period: string; setPeriod: (p: string) => void; current: string; menu?: ReactNode;
}) {
  const startDay = periodRule(data.settings);
  const focus = data.settings.planFocus ?? 'budget';
  const s = useMemo(() => summarize(data, period, current), [data, period, current]);
  const prev = addPeriods(period, -1);
  // 先月の実績（ふりかえりで入れた合計と、付けた理由・メモ）。カテゴリごと
  const lastMonth = useMemo(() => new Map(data.categoryActuals.filter((a) => a.periodId === prev).map((a) => [a.categoryId, a])), [data, prev]);
  // この月の前の3か月で続いているずれ（ふりかえりの「改善のヒント」と同じもの）。カテゴリごとに1つ
  const hints = useMemo(() => {
    const m = new Map<string, DriftHint>();
    for (const h of driftHints(data, period)) if (!m.has(h.category.id)) m.set(h.category.id, h);
    return m;
  }, [data, period]);

  const total = (k: CategoryKind[]) => s.categories.filter((c) => k.includes(c.kind)).reduce((a, c) => a + c.planned, 0);
  const income = total(['income']);
  const spend = total(['expense', 'debt']);
  const saving = total(['saving']);
  const expense = s.categories.filter((c) => c.kind === 'expense');
  const others = s.categories.filter((c) => c.kind !== 'expense');

  return (
    <Stack spacing={2}>
      <PeriodNav value={period} onChange={setPeriod} startDay={startDay} current={current} leading={menu} />

      <Card data-tour="summary">
        <CardContent sx={{ pb: '16px !important' }}>
          {/* 「予算」（カードは使う月で数える）と「口座のお金」（カードは引き落とされる月で数える）。設定で選んだほうを大きく、もう一方は1行で */}
          {focus === 'cash' ? <>
            <CashMain s={s} />
            <BudgetLine income={income} spend={spend} saving={saving} />
          </> : <>
            <BudgetMain income={income} spend={spend} saving={saving} />
            <CashLine s={s} />
          </>}
        </CardContent>
      </Card>

      <Card data-tour="plan-categories">
        <CardHeader title="カテゴリごとの予算" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} sx={{ pb: 0 }} />
        <CardContent sx={{ pt: 1, pb: '8px !important' }}>
          {expense.map((c) => <CategoryRowView key={c.category.id} row={c} last={lastMonth.get(c.category.id)} hint={hints.get(c.category.id)} period={period} data={data} />)}
          {others.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight={700} component="p" sx={{ mt: 2, mb: 0.5 }}>収入・返済・積み立て</Typography>
              {others.map((c) => <CategoryRowView key={c.category.id} row={c} period={period} data={data} />)}
            </>
          )}
        </CardContent>
      </Card>

      <OutflowsCard summary={s} title="出金予定" />

    </Stack>
  );
}

const cashResult = (s: PeriodSummary) => (s.buffer < 0 ? `${yen(-s.buffer)} 足りない` : `${yen(s.buffer)} 残る`);
const cashFormula = (s: PeriodSummary) =>
  `収入 ${yen(s.incomeTotal)} − 口座から出るお金 ${yen(s.directOutTotal)} − カードの引落 ${yen(s.cardBillTotal)}`
  + (s.receivableTotal > 0 ? ` + 立替の回収 ${yen(s.receivableTotal)}` : '');
const BUDGET_NOTE = 'カードで払うものは、使う月で数えます。';
const CASH_NOTE = 'カードで払うものは、引き落とされる月で数えます。給料日のチェックの「残るお金」と同じ計算です。';
const OVER_TIP = '積み立てを減らすか、貯金から出すか決めておこう。';
const SHORT_TIP = 'この月は出ていくお金が多めです。積み立てを少し減らすか、貯金から出すか決めておこう。';

/** 予算を大きく（設定で「予算」を選んだとき）。3つの数字と、収入にどれだけ収まっているかのバー */
function BudgetMain({ income, spend, saving }: { income: number; spend: number; saving: number }) {
  return (
    <Box>
      <SectionLabel title="予算" note={BUDGET_NOTE} />
      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
        <Figure label="収入" value={income} />
        <Figure label="使う予定" value={spend} dot="primary.main" />
        <Figure label="積み立て" value={saving} dot="success.main" />
      </Stack>
      <PlanBar income={income} spend={spend} saving={saving} />
    </Box>
  );
}

/** 使う予定と積み立てが、収入に収まっているか */
function PlanBar({ income, spend, saving }: { income: number; spend: number; saving: number }) {
  return (
    <FitBar base={income} segments={[{ value: spend, color: 'primary.main' }, { value: saving, color: 'success.main' }]}
      overText={(o) => `収入を ${yen(o)} こえている`} overTip={<InfoTip label="こえたときは" text={OVER_TIP} />} />
  );
}

/** 口座のお金を大きく（設定で「口座のお金」を選んだとき）。給料日のチェックの「残るお金」と同じ計算 */
function CashMain({ s }: { s: PeriodSummary }) {
  return (
    <Box>
      <SectionLabel title="口座のお金" note={CASH_NOTE} />
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
        <Typography variant="h5" component="p" fontWeight={900} color={s.buffer < 0 ? 'error.main' : 'text.primary'}>
          {cashResult(s)}
        </Typography>
        {s.buffer < 0 && <InfoTip label="足りないときは" text={SHORT_TIP} />}
      </Stack>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.25, lineHeight: 1.7 }}>{cashFormula(s)}</Typography>
    </Box>
  );
}

/** 予算を1行で（設定で「口座のお金」を選んだとき） */
function BudgetLine({ income, spend, saving }: { income: number; spend: number; saving: number }) {
  return (
    <Box sx={{ mt: 1.5, pt: 1.25, borderTop: 1, borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <SectionLabel title="予算" note={BUDGET_NOTE} />
        <Typography variant="body2" color="text.secondary">収入 {yen(income)}</Typography>
      </Stack>
      <PlanBar income={income} spend={spend} saving={saving} />
    </Box>
  );
}

/**
 * 口座のお金を1行で（設定で「予算」を選んだとき）。
 * 足りなくなる月だけは、見のがさないように色を付ける
 */
function CashLine({ s }: { s: PeriodSummary }) {
  const short = s.buffer < 0;
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}
      sx={{ mt: 1.5, pt: 1.25, borderTop: 1, borderColor: 'divider', ...(short && { mx: -1, px: 1, pb: 1, borderRadius: '8px', bgcolor: 'soft', borderTop: 0 }) }}>
      <SectionLabel title="口座のお金" note={`${CASH_NOTE}\n${cashFormula(s)}`} />
      <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
        <Typography fontWeight={900} color={short ? 'error.main' : 'text.primary'}>{cashResult(s)}</Typography>
        {short && <InfoTip label="足りないときは" text={SHORT_TIP} />}
      </Stack>
    </Stack>
  );
}

/** 見出しと、その補足をしまった「ⓘ」 */
function SectionLabel({ title, note }: { title: string; note: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography variant="body2" fontWeight={900}>{title}</Typography>
      <InfoTip label={`${title}の数え方`} text={note} />
    </Stack>
  );
}

/** カテゴリ1行。先月の実績（使った金額と、付けた理由・メモ）があれば小さく添える。開くと項目ごとの金額 */
function CategoryRowView({ row, last, hint, period, data }: {
  row: CategoryRow; last?: CategoryActual; hint?: DriftHint; period: string; data: AppData;
}) {
  return (
    <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&::before': { display: 'none' }, borderBottom: 1, borderColor: 'divider' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, '& .MuiAccordionSummary-content': { my: 1.25, minWidth: 0 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ minWidth: 0 }}>{row.category.name}</Typography>
              {/* 改善のヒントがあるカテゴリ。開くとヒントの文が出る */}
              {hint && <LightbulbOutlinedIcon color="primary" sx={{ fontSize: 18, flexShrink: 0 }} titleAccess="改善のヒントあり" />}
            </Stack>
            <Typography fontWeight={700} sx={{ flexShrink: 0, mr: 1 }}>{yen(row.planned)}</Typography>
          </Stack>
          {last && (
            <Chip size="small" variant="outlined" sx={{ mt: 0.5, height: 24, fontSize: 12, maxWidth: '100%' }}
              label={`先月 ${yen(last.amount)}${last.driftKind ? `・${DRIFT_LABEL[last.driftKind]}` : ''}${last.memo ? `「${last.memo}」` : ''}`} />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, pt: 0 }}>
        {hint && (
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, p: 1.25, borderRadius: '8px', bgcolor: 'soft' }}>
            <LightbulbOutlinedIcon color="primary" sx={{ fontSize: 18, mt: 0.25, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{hint.text}</Typography>
          </Stack>
        )}
        <CategoryItems row={row} period={period} data={data} />
      </AccordionDetails>
    </Accordion>
  );
}
