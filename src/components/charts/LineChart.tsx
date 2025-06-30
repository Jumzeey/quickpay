import React, { ChangeEvent } from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import Select from "../select";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { motion } from "framer-motion";

defaults.maintainAspectRatio = false;
defaults.responsive = true;
defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.color = "black";

interface LineChartProps {
  secondOptions: any[];
  selectedOption: string;
  handleChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

interface ChartProps {
  labels: string[];
  chartData: any[];
  lineChartProps: LineChartProps;
  isLoading: boolean;
  isChartRefresh: boolean;
}

const LineChart = ({
  labels,
  chartData,
  lineChartProps,
  isLoading,
  isChartRefresh,
}: ChartProps) => {
  const { secondOptions, selectedOption, handleChange } = lineChartProps || {};

  const chartConfig = {
    labels,
    datasets: [
      {
        label: "Pay Out",
        data: chartData?.map((data: any) => data.disbursements),
        fill: false,
        borderColor: "#cc3a40",
        backgroundColor: "#cc3a40",
      },
      {
        label: "Pay In",
        data: chartData?.map((data: any) => data.collections),
        fill: false,
        borderColor: "#59bc79",
        backgroundColor: "#59bc79",
      },
    ],
  };

  const chartOptions = {
    elements: {
      line: { tension: 0.2 },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          font: { size: 12, family: "Inter, sans-serif" },
        },
      },
    },
    scales: {
      y: { grid: { display: true, color: "#e5e7eb" } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="bg-white pt-5 px-5 pb-10 rounded-xl h-[480px]">
      {isLoading ? (
        <>
          <div className="flex justify-between items-center">
            <Skeleton width={170} height={20} />
            <Skeleton width={120} height={40} />
          </div>
          <div className="mt-16">
            {Array.from({ length: 7 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Skeleton className="h-2.5 mb-5" />
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-grey-400">
              Pay Outs and Pay Ins
            </span>
            <Select
              options={secondOptions}
              value={selectedOption}
              onChange={handleChange}
              forCharts
            />
          </div>

          {isChartRefresh ? (
            <div className="h-[480px] flex flex-col items-center justify-center">
              <svg
                className="animate-spin w-10 text-[#164988]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm font-medium mt-2">Loading chart data...</p>
            </div>
          ) : (
            <Line data={chartConfig} options={chartOptions} />
          )}
        </>
      )}
    </div>
  );
};

export default LineChart;
