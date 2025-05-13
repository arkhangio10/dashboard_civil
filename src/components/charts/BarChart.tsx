// src/components/charts/BarChart.tsx
import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DatasetProps {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

interface BarChartProps {
  labels: string[];
  datasets: DatasetProps[];
  title?: string;
  yAxisTitle?: string;
  xAxisTitle?: string;
  beginAtZero?: boolean;
  horizontal?: boolean;
  height?: number;
  stacked?: boolean;
  showLegend?: boolean;
  maxBarThickness?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  labels,
  datasets,
  title,
  yAxisTitle,
  xAxisTitle,
  beginAtZero = true,
  horizontal = false,
  height = 300,
  stacked = false,
  showLegend = true,
  maxBarThickness
}) => {
  // Opciones del gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: {
      legend: {
        display: showLegend,
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
      x: {
        stacked: stacked,
        title: {
          display: !!xAxisTitle,
          text: xAxisTitle || '',
          font: {
            size: 13
          }
        },
        ticks: {
          maxRotation: horizontal ? 0 : 45,
          minRotation: horizontal ? 0 : 45
        }
      },
      y: {
        stacked: stacked,
        beginAtZero: beginAtZero,
        title: {
          display: !!yAxisTitle,
          text: yAxisTitle || '',
          font: {
            size: 13
          }
        }
      }
    }
  };

  // Color por defecto si no se proporciona
  const defaultColors = [
    'rgba(24, 78, 142, 0.7)',    // Azul principal
    'rgba(40, 167, 69, 0.7)',    // Verde
    'rgba(23, 162, 184, 0.7)',   // Cian
    'rgba(220, 53, 69, 0.7)',    // Rojo
    'rgba(255, 193, 7, 0.7)',    // Amarillo
    'rgba(108, 117, 125, 0.7)',  // Gris
    'rgba(111, 66, 193, 0.7)',   // Morado
    'rgba(253, 126, 20, 0.7)'    // Naranja
  ];

  // Datos formateados para ChartJS
  const data = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.backgroundColor || defaultColors[index % defaultColors.length],
      borderColor: dataset.borderColor || 'rgba(0, 0, 0, 0.1)',
      borderWidth: dataset.borderWidth || 1,
      barThickness: maxBarThickness ? 'flex' : undefined,
      maxBarThickness: maxBarThickness
    }))
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Bar options={options} data={data} />
    </div>
  );
};

export default BarChart;