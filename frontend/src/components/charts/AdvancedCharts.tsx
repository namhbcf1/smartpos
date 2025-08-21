import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
)

interface ChartWrapperProps {
  title: string
  children: React.ReactNode
  className?: string
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className={className}
  >
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

// Sales trend chart
export const SalesTrendChart: React.FC = () => {
  const data = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    datasets: [
      {
        label: 'Doanh thu (triệu VNĐ)',
        data: [12, 19, 15, 25, 22, 30, 28],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Mục tiêu',
        data: [15, 20, 18, 28, 25, 32, 30],
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6b7280',
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: '#fff',
      },
    },
  }

  return (
    <ChartWrapper title="Xu hướng doanh thu">
      <Line data={data} options={options} />
    </ChartWrapper>
  )
}

// Product categories chart
export const ProductCategoriesChart: React.FC = () => {
  const data = {
    labels: ['Laptop', 'PC Desktop', 'Linh kiện', 'Phụ kiện', 'Gaming'],
    datasets: [
      {
        data: [35, 25, 20, 12, 8],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`
          }
        }
      },
    },
    cutout: '60%',
  }

  return (
    <ChartWrapper title="Phân bố sản phẩm theo danh mục">
      <Doughnut data={data} options={options} />
    </ChartWrapper>
  )
}

// Monthly comparison chart
export const MonthlyComparisonChart: React.FC = () => {
  const data = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    datasets: [
      {
        label: 'Tháng này',
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Tháng trước',
        data: [28, 48, 40, 19, 86, 27],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6b7280',
        },
      },
    },
  }

  return (
    <ChartWrapper title="So sánh theo tháng">
      <Bar data={data} options={options} />
    </ChartWrapper>
  )
}

// Performance radar chart
export const PerformanceRadarChart: React.FC = () => {
  const data = {
    labels: ['Doanh thu', 'Khách hàng', 'Sản phẩm', 'Đơn hàng', 'Chất lượng', 'Hiệu suất'],
    datasets: [
      {
        label: 'Hiệu suất hiện tại',
        data: [85, 75, 90, 80, 95, 88],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'Mục tiêu',
        data: [90, 85, 95, 90, 98, 92],
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(139, 92, 246)',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
      },
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(107, 114, 128, 0.3)',
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.3)',
        },
        pointLabels: {
          color: '#6b7280',
        },
        ticks: {
          color: '#6b7280',
          backdropColor: 'transparent',
        },
        min: 0,
        max: 100,
      },
    },
  }

  return (
    <ChartWrapper title="Hiệu suất tổng quan">
      <Radar data={data} options={options} />
    </ChartWrapper>
  )
}
