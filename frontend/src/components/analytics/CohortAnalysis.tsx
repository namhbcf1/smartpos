import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress } from '@mui/material';

interface CohortData {
  cohort: string;
  period: number;
  customers: number;
  retentionRate: number;
  revenue: number;
  churnRate: number;
}

const CohortAnalysis: React.FC = () => {
  const [data, setData] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
      const res = await fetch(`${base}/api/analytics/cohort?months=6`, { headers: { 'X-Tenant-ID': 'default' }});
      const json = await res.json();
      setData(json.data || []);
    } catch (error) {
      console.error('Error fetching cohort:', error);
    } finally {
      setLoading(false);
    }
  };

  const cohorts = [...new Set(data.map(d => d.cohort))];
  const maxPeriod = Math.max(...data.map(d => d.period), 0);

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return '#4caf50';
    if (rate >= 60) return '#ff9800';
    if (rate >= 40) return '#ff5722';
    return '#f44336';
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Cohort Retention Analysis</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cohort</TableCell>
                {[...Array(maxPeriod + 1)].map((_, i) => (
                  <TableCell key={i} align="center">M{i}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cohorts.map(cohort => (
                <TableRow key={cohort}>
                  <TableCell>{cohort}</TableCell>
                  {[...Array(maxPeriod + 1)].map((_, period) => {
                    const item = data.find(d => d.cohort === cohort && d.period === period);
                    return (
                      <TableCell
                        key={period}
                        align="center"
                        sx={{
                          bgcolor: item ? getRetentionColor(item.retentionRate) : '#f5f5f5',
                          color: item ? 'white' : 'inherit',
                          fontWeight: item ? 'bold' : 'normal'
                        }}
                      >
                        {item ? `${item.retentionRate.toFixed(0)}%` : '-'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', borderRadius: 1 }} />
            <Typography variant="caption">80%+</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#ff9800', borderRadius: 1 }} />
            <Typography variant="caption">60-80%</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#ff5722', borderRadius: 1 }} />
            <Typography variant="caption">40-60%</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#f44336', borderRadius: 1 }} />
            <Typography variant="caption">&lt;40%</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CohortAnalysis;
