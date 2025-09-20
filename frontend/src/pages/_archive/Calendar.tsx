import React, { useState } from 'react';
import { Container, Typography, Box, Card, CardContent, Button, Grid, Chip } from '@mui/material';
import { CalendarToday, Add, Event, Schedule } from '@mui/icons-material';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const events = [
    { id: 1, title: 'Họp team', date: '2024-01-15', time: '09:00', type: 'meeting' },
    { id: 2, title: 'Kiểm tra tồn kho', date: '2024-01-16', time: '14:00', type: 'task' },
    { id: 3, title: 'Báo cáo tháng', date: '2024-01-20', time: '10:00', type: 'report' },
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'primary';
      case 'task': return 'secondary';
      case 'report': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Lịch làm việc
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Thêm sự kiện
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lịch tháng
              </Typography>
              <Box 
                sx={{ 
                  height: 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed #ccc',
                  borderRadius: 2
                }}
              >
                <Box textAlign="center">
                  <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    Lịch sẽ được hiển thị ở đây
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sự kiện sắp tới
              </Typography>
              {events.map((event) => (
                <Box key={event.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Event sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="subtitle2">{event.title}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Schedule sx={{ mr: 1, fontSize: 14 }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.date} - {event.time}
                    </Typography>
                  </Box>
                  <Chip 
                    label={event.type} 
                    size="small" 
                    color={getEventColor(event.type) as any}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
