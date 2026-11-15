import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';
import { outflows, type PeriodSummary } from '../../domain/cashflow';
import { yen } from '../../lib/money';
import { ScheduleList } from '../../components/ScheduleList';

const header = (title: string, sub?: string) => (
  <CardHeader title={title} titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
    subheader={sub} subheaderTypographyProps={{ variant: 'caption' }} sx={{ pb: 0.5 }} />
);

/** その月に口座から出ていくお金を日付順に（計画の下） */
export function OutflowsCard({ summary, title, tour }: { summary: PeriodSummary; title: string; tour?: string }) {
  const list = outflows(summary);
  const total = list.reduce((a, e) => a - e.amount, 0);
  return (
    <Card data-tour={tour}>
      {header(title, '口座から出ていくお金を日付順に。カード払いは引落の日にまとめて出るよ')}
      {list.length === 0 ? (
        <CardContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            定期項目に入出金日を入れると、ここに出るよ。
          </Typography>
        </CardContent>
      ) : (
        <ScheduleList
          rows={list.map((e, i) => ({
            key: `${i}:${e.label}`, date: e.date, title: e.label, amount: -e.amount,
            sub: [e.account && `${e.account}から`, e.card && (e.confirmed ? '確定' : '予測')].filter(Boolean).join('・') || undefined,
          }))}
          footer={(
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, pt: 1, pb: 1.5, mt: 0.5, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={700}>合計</Typography>
              <Typography variant="body2" fontWeight={900}>{yen(total)}</Typography>
            </Box>
          )} />
      )}
    </Card>
  );
}
