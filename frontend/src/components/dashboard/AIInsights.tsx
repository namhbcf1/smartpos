import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Stack,
  Grow,
  Fade,
} from '@mui/material';
import {
  Psychology,
  AutoAwesome,
} from '@mui/icons-material';

interface AIInsightsProps {
  aiInsights: string[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ aiInsights }) => {
  if (aiInsights.length === 0) return null;

  return (
    <Grid item xs={12}>
      <Grow in={true} timeout={1000}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
            <Psychology sx={{ fontSize: 120 }} />
          </Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <AutoAwesome sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              AI Insights & Recommendations
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {aiInsights.map((insight, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Fade in={true} timeout={1500 + index * 200}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {insight}
                    </Typography>
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grow>
    </Grid>
  );
};

export default AIInsights;
