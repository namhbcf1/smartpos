// Vietnamese Computer Hardware POS Business Intelligence
// ComputerPOS Pro - Production Implementation

import React, { useState, useEffect, useMemo } from 'react';
import { posApi } from '../../services/api/posApi';
import { comprehensiveAPI } from '../../services/business/comprehensiveApi';
import { formatCurrency } from '../../lib/utils';

interface SegmentData {
  name: string;
  value: number;
  count: number;
  percentage: number;
}

interface CohortData {
  month: string;
  new_customers: number;
  retained_customers: number;
  retention_rate: number;
}

interface ForecastData {
  date: string;
  predicted_revenue: number;
  confidence: number;
}

const BusinessIntelligencePage: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState<'region' | 'tier' | 'category'>('region');
  
  // Data
  const [segmentData, setSegmentData] = useState<SegmentData[]>([]);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('segments');

  useEffect(() => {
    // Set default date range (last 12 months)
    const today = new Date();
    const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 12, today.getDate());
    
    setDateFrom(twelveMonthsAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadBusinessIntelligenceData();
    }
  }, [dateFrom, dateTo, groupBy]);

  const loadBusinessIntelligenceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load segment data from real API
      try {
        const segmentResponse = await comprehensiveAPI.analytics.getCustomerSegments({ from: dateFrom, to: dateTo, groupBy });
        setSegmentData(segmentResponse.data || []);
      } catch (error) {
        console.error('Failed to load segment data:', error);
        setSegmentData([]);
      }

      // Load cohort data from real API
      try {
        const cohortResponse = await comprehensiveAPI.analytics.getCohortAnalysis({ from: dateFrom, to: dateTo });
        setCohortData(cohortResponse.data || []);
      } catch (error) {
        console.error('Failed to load cohort data:', error);
        setCohortData([]);
      }

      // Load forecast data from real API
      try {
        const forecastResponse = await comprehensiveAPI.analytics.getRevenueForecast({ from: dateFrom, to: dateTo });
        setForecastData(forecastResponse.data || []);
      } catch (error) {
        console.error('Failed to load forecast data:', error);
        setForecastData([]);
      }

    } catch (error) {
      setError('Failed to load business intelligence data');
      console.error('Business intelligence data loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (index: number) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-success', 'bg-warning', 'bg-error'];
    return colors[index % colors.length];
  };

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-error';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 75) return 'text-warning';
    return 'text-error';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-8 text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">Đang tải dữ liệu phân tích kinh doanh...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">Lỗi tải dữ liệu</h2>
          <p className="text-base-content/70 mb-6">{error}</p>
          <button 
            className="btn btn-primary" onClick={loadBusinessIntelligenceData}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            📈 Phân tích kinh doanh (PRO)
          </h1>
          <div className="flex gap-2">
            <button 
              className="btn btn-outline btn-sm" onClick={loadBusinessIntelligenceData}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Từ ngày</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
                  value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Đến ngày</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
                  value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Nhóm theo</span>
            </label>
            <select 
              className="select select-bordered"
                  value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
            >
              <option value="region">Khu vực</option>
              <option value="tier">Nhóm khách hàng</option>
              <option value="category">Danh mục sản phẩm</option>
            </select>
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">&nbsp;</span>
            </label>
            <button className="btn btn-primary w-full">
              📊 Tạo báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-base-100 rounded-lg shadow-sm mb-4">
        <div className="tabs tabs-bordered">
          <button 
            className={`tab tab-lg ${activeTab === 'segments' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('segments')}
          >
            🎯 Phân khúc khách hàng
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'cohort' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('cohort')}
          >
            📊 Phân tích cohort
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'forecast' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            🔮 Dự báo doanh thu
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'segments' && (
        <div className="space-y-4">
          {/* Segment Overview */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-bold mb-4">🎯 Tổng quan phân khúc</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-primary text-primary-content">
                <div className="stat-title">Tổng doanh thu</div>
                <div className="stat-value">
                  {formatCurrency((Array.isArray(segmentData) ? segmentData : []).reduce((sum, seg) => sum + seg.value, 0))}
                </div>
                <div className="stat-desc">Từ {dateFrom} đến {dateTo}</div>
              </div>
              
              <div className="stat bg-secondary text-secondary-content">
                <div className="stat-title">Tổng khách hàng</div>
                <div className="stat-value">
                  {(Array.isArray(segmentData) ? segmentData : []).reduce((sum, seg) => sum + seg.count, 0)}
                </div>
                <div className="stat-desc">Khách hàng hoạt động</div>
              </div>
              
              <div className="stat bg-accent text-accent-content">
                <div className="stat-title">Trung bình/khách</div>
                <div className="stat-value">
                  {formatCurrency(
                    (Array.isArray(segmentData) && segmentData.length > 0 ?
                      segmentData.reduce((sum, seg) => sum + seg.value, 0) /
                      segmentData.reduce((sum, seg) => sum + seg.count, 0) : 0)
                  )}
                </div>
                <div className="stat-desc">Giá trị trung bình</div>
              </div>
            </div>
          </div>

          {/* Segment Details */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-bold mb-4">📊 Chi tiết phân khúc</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart Placeholder */}
              <div>
                <h3 className="text-lg font-bold mb-4">Biểu đồ phân khúc</h3>
                <div className="h-64 bg-base-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-base-content/70">Biểu đồ sẽ được hiển thị ở đây</p>
                    <p className="text-sm text-base-content/50">Tính năng đang được phát triển</p>
                  </div>
                </div>
              </div>
              
              {/* Segment Table */}
              <div>
                <h3 className="text-lg font-bold mb-4">Bảng dữ liệu</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Phân khúc</th>
                        <th>Doanh thu</th>
                        <th>Khách hàng</th>
                        <th>Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(segmentData) ? segmentData : []).map((segment, index) => (
                        <tr key={index}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded ${getSegmentColor(index)}`}></div>
                              {segment.name}
                            </div>
                          </td>
                          <td className="font-bold">{formatCurrency(segment.value)}</td>
                          <td>{segment.count}</td>
                          <td>
                            <span className="badge badge-primary">{segment.percentage}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cohort' && (
        <div className="space-y-4">
          {/* Cohort Overview */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-bold mb-4">📊 Tổng quan cohort</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-success text-success-content">
                <div className="stat-title">Tỷ lệ giữ chân TB</div>
                <div className="stat-value">
                  {(Array.isArray(cohortData) && cohortData.length > 0 ?
                    (cohortData.reduce((sum, cohort) => sum + cohort.retention_rate, 0) / cohortData.length).toFixed(1) : '0')}%
                </div>
                <div className="stat-desc">Trung bình các tháng</div>
              </div>
              
              <div className="stat bg-info text-info-content">
                <div className="stat-title">Khách hàng mới TB</div>
                <div className="stat-value">
                  {Array.isArray(cohortData) && cohortData.length > 0 ?
                    Math.round(cohortData.reduce((sum, cohort) => sum + cohort.new_customers, 0) / cohortData.length) : 0}
                </div>
                <div className="stat-desc">Mỗi tháng</div>
              </div>
              
              <div className="stat bg-warning text-warning-content">
                <div className="stat-title">Tổng khách hàng</div>
                <div className="stat-value">
                  {(Array.isArray(cohortData) ? cohortData : []).reduce((sum, cohort) => sum + cohort.new_customers, 0)}
                </div>
                <div className="stat-desc">Từ {dateFrom} đến {dateTo}</div>
              </div>
            </div>
          </div>

          {/* Cohort Table */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-bold mb-4">📈 Bảng cohort retention</h2>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th>Khách hàng mới</th>
                    <th>Khách hàng giữ lại</th>
                    <th>Tỷ lệ giữ chân</th>
                    <th>Xu hướng</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(cohortData) ? cohortData : []).map((cohort, index) => (
                    <tr key={index}>
                      <td className="font-bold">{cohort.month}</td>
                      <td>{cohort.new_customers}</td>
                      <td>{cohort.retained_customers}</td>
                      <td>
                        <span className={`font-bold ${getRetentionColor(cohort.retention_rate)}`}>
                          {cohort.retention_rate}%
                        </span>
                      </td>
                      <td>
                        {index > 0 && (
                          <span className={`badge ${
                            cohort.retention_rate > cohortData[index - 1].retention_rate 
                              ? 'badge-success' : 'badge-error'
                          }`}>
                            {cohort.retention_rate > cohortData[index - 1].retention_rate ? '↗️' : '↘️'}
                            {Math.abs(cohort.retention_rate - cohortData[index - 1].retention_rate).toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cohort Chart */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-bold mb-4">📊 Biểu đồ cohort</h2>
            <div className="h-64 bg-base-200 rounded flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-base-content/70">Biểu đồ cohort sẽ được hiển thị ở đây</p>
                <p className="text-sm text-base-content/50">Tính năng đang được phát triển</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-4">
          {/* Forecast Overview */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-bold mb-4">🔮 Tổng quan dự báo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-primary text-primary-content">
                <div className="stat-title">Doanh thu dự báo TB</div>
                <div className="stat-value">
                  {formatCurrency(
                    Array.isArray(forecastData) && forecastData.length > 0 ?
                      forecastData.reduce((sum, forecast) => sum + forecast.predicted_revenue, 0) / forecastData.length : 0
                  )}
                </div>
                <div className="stat-desc">30 ngày tới</div>
              </div>
              
              <div className="stat bg-secondary text-secondary-content">
                <div className="stat-title">Tổng doanh thu dự báo</div>
                <div className="stat-value">
                  {formatCurrency((Array.isArray(forecastData) ? forecastData : []).reduce((sum, forecast) => sum + forecast.predicted_revenue, 0))}
                </div>
                <div className="stat-desc">30 ngày tới</div>
              </div>
              
              <div className="stat bg-accent text-accent-content">
                <div className="stat-title">Độ tin cậy TB</div>
                <div className="stat-value">
                  {Array.isArray(forecastData) && forecastData.length > 0 ?
                    Math.round(forecastData.reduce((sum, forecast) => sum + forecast.confidence, 0) / forecastData.length) : 0}%
                </div>
                <div className="stat-desc">Mô hình dự báo</div>
              </div>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-bold mb-4">📈 Biểu đồ dự báo doanh thu</h2>
            <div className="h-64 bg-base-200 rounded flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🔮</div>
                <p className="text-base-content/70">Biểu đồ dự báo sẽ được hiển thị ở đây</p>
                <p className="text-sm text-base-content/50">Tính năng đang được phát triển</p>
              </div>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-bold mb-4">📋 Chi tiết dự báo</h2>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Doanh thu dự báo</th>
                    <th>Độ tin cậy</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(forecastData) ? forecastData : []).slice(0, 15).map((forecast, index) => (
                    <tr key={index}>
                      <td className="font-bold">{forecast.date}</td>
                      <td className="font-bold">{formatCurrency(forecast.predicted_revenue)}</td>
                      <td>
                        <span className={`badge ${getConfidenceColor(forecast.confidence)}`}>
                          {forecast.confidence.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          forecast.confidence >= 90 ? 'badge-success' :
                          forecast.confidence >= 75 ? 'badge-warning' : 'badge-error'
                        }`}>
                          {forecast.confidence >= 90 ? 'Cao' :
                           forecast.confidence >= 75 ? 'Trung bình' : 'Thấp'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {forecastData.length > 15 && (
                <div className="text-center mt-4">
                  <p className="text-base-content/70">
                    Hiển thị 15/30 ngày. 
                    <button className="btn btn-link btn-sm">Xem tất cả</button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4">
        <div className="alert alert-info">
          <div>
            <span className="font-bold">💡 Lưu ý:</span>
            <div className="text-sm mt-1">
              • Dữ liệu phân tích được cập nhật theo thời gian thực<br/>
              • Dự báo sử dụng thuật toán Moving Average (không sử dụng AI)<br/>
              • Độ tin cậy dựa trên độ lệch chuẩn của dữ liệu lịch sử
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligencePage;
