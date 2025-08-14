/**
 * Synchronization Test Runner Component
 * UI component to run and display synchronization test results
 * Rules.md compliant - tests real backend integration
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { runSynchronizationTests } from '../tests/synchronizationTests';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

const SynchronizationTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [hasRun, setHasRun] = useState(false);

  /**
   * Run all synchronization tests
   */
  const handleRunTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setHasRun(false);

    try {
      const results = await runSynchronizationTests();
      setTestResults(results);
      setHasRun(true);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Get overall test statistics
   */
  const getOverallStats = () => {
    const totalTests = testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = testResults.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = testResults.reduce((sum, suite) => sum + suite.totalDuration, 0);

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
    };
  };

  /**
   * Get status color for test results
   */
  const getStatusColor = (passed: boolean) => {
    return passed ? 'success' : 'error';
  };

  /**
   * Format duration
   */
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const overallStats = hasRun ? getOverallStats() : null;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            🧪 Kiểm tra đồng bộ Frontend-Backend
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Công cụ này kiểm tra tính đồng bộ giữa frontend và backend, bao gồm:
            API endpoints, xác thực, real-time communication, xử lý lỗi và tính nhất quán dữ liệu.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleRunTests}
              disabled={isRunning}
              size="large"
            >
              {isRunning ? 'Đang chạy kiểm tra...' : 'Chạy kiểm tra đồng bộ'}
            </Button>
          </Box>

          {isRunning && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Đang thực hiện các bài kiểm tra...
              </Typography>
            </Box>
          )}

          {hasRun && overallStats && (
            <>
              {/* Overall Results Summary */}
              <Alert 
                severity={overallStats.totalFailed === 0 ? 'success' : 'warning'} 
                sx={{ mb: 3 }}
              >
                <Typography variant="h6">
                  Kết quả tổng quan
                </Typography>
                <Typography>
                  {overallStats.totalPassed}/{overallStats.totalTests} bài kiểm tra thành công 
                  ({overallStats.successRate.toFixed(1)}%) - 
                  Thời gian: {formatDuration(overallStats.totalDuration)}
                </Typography>
              </Alert>

              {/* Statistics Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {overallStats.totalTests}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tổng số test
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {overallStats.totalPassed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Thành công
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {overallStats.totalFailed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Thất bại
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {overallStats.successRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tỷ lệ thành công
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Detailed Test Results */}
              <Typography variant="h5" gutterBottom>
                Chi tiết kết quả
              </Typography>

              {testResults.map((suite, index) => (
                <Accordion key={index} defaultExpanded={suite.failedTests > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {suite.suiteName}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                        <Chip
                          label={`${suite.passedTests}/${suite.totalTests}`}
                          color={suite.failedTests === 0 ? 'success' : 'warning'}
                          size="small"
                        />
                        <Chip
                          label={formatDuration(suite.totalDuration)}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {suite.results.map((test, testIndex) => (
                        <ListItem key={testIndex}>
                          <ListItemIcon>
                            {test.passed ? (
                              <CheckIcon color="success" />
                            ) : (
                              <ErrorIcon color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={test.testName}
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Thời gian: {formatDuration(test.duration)}
                                </Typography>
                                {test.error && (
                                  <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                                    Lỗi: {test.error}
                                  </Typography>
                                )}
                                {test.details && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                    Chi tiết: {JSON.stringify(test.details, null, 2)}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}

              {/* Recommendations */}
              {overallStats.totalFailed > 0 && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    💡 Khuyến nghị
                  </Typography>
                  <Typography>
                    Có {overallStats.totalFailed} bài kiểm tra thất bại. Vui lòng:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary="Kiểm tra kết nối mạng và trạng thái backend" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary="Xem lại cấu hình API endpoints" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary="Kiểm tra quyền truy cập và xác thực" />
                    </ListItem>
                  </List>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SynchronizationTestRunner;
