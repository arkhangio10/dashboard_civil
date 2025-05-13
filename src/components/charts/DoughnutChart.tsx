// src/components/charts/DoughnutChart.tsx
import React from 'react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registrar los componentes de Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
  title?: string;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  height?: number;
  centerText?: {
    text: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
  };
  cutout?: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({
  labels,
  data,
  colors,
  title,
  legendPosition = 'right',
  height = 250,
  centerText,
  cutout = '70%'
}) => {
  // Colores por defecto si no se proporcionan
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

  // Plugin para mostrar texto en el centro del donut
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart: any) {
      if (centerText) {
        const width = chart.width;
        const height = chart.height;
        const ctx = chart.ctx;
        
        ctx.restore();
        const fontSize = centerText.fontSize || 16;
        const fontWeight = centerText.fontWeight || 'bold';
        ctx.font = `${fontWeight} ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        const text = centerText.text;
        const color = centerText.color || '#000';
        ctx.fillStyle = color;
        ctx.fillText(text, width / 2, height / 2);
        ctx.save();
      }
    }
  };

  // Opciones del gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: cutout,
    plugins: {
      legend: {
        position: legendPosition as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value.toFixed(1)} (${percentage}%)`;
          }
        }
      },
      title: {
        display: !!title,
        text: title || '',
        font: {
          size: 14,
          weight: 'bold' as const
        }
      }
    }
  };

  // Datos formateados para ChartJS
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors || defaultColors.slice(0, data.length),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)'
      }
    ]
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Doughnut data={chartData} options={options} plugins={centerText ? [centerTextPlugin] : []} />
    </div>
  );
};

export default DoughnutChart;