// src/components/charts/LineChart.tsx
import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DatasetProps {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
  borderDash?: number[];
  pointRadius?: number;
}

interface LineChartProps {
  labels: string[];
  datasets: DatasetProps[];
  title?: string;
  yAxisTitle?: string;
  xAxisTitle?: string;
  beginAtZero?: boolean;
  height?: number;
  maintainAspectRatio?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  labels,
  datasets,
  title,
  yAxisTitle,
  xAxisTitle,
  beginAtZero = true,
  height = 300,
  maintainAspectRatio = false
}) => {
  // Opciones del gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: maintainAspectRatio,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 12
        },
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        cornerRadius: 6
      },
      title: {
        display: !!title,
        text: title || '',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      }
    },
    scales: {
      y: {
        beginAtZero: beginAtZero,
        title: {
          display: !!yAxisTitle,
          text: yAxisTitle || '',
          font: {
            size: 13
          }
        }
      },
      x: {
        title: {
          display: !!xAxisTitle,
          text: xAxisTitle || '',
          font: {
            size: 13
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // Color por defecto si no se proporciona
  const defaultColor = 'rgba(24, 78, 142, 1)';
  const defaultBgColor = 'rgba(24, 78, 142, 0.1)';

  // Datos formateados para ChartJS
  const data = {
    labels,
    datasets: datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.borderColor || defaultColor,
      backgroundColor: dataset.backgroundColor || defaultBgColor,
      fill: dataset.fill !== undefined ? dataset.fill : true,
      tension: dataset.tension || 0.3,
      borderDash: dataset.borderDash || [],
      pointRadius: dataset.pointRadius
    }))
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default LineChart;