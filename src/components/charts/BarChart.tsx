import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import { Bar } from "react-chartjs-2";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  settlementBalance: string;
  isLoading: boolean;
  showBalance: boolean;
  settlements: any[];
}

const BarChart: React.FC<Props> = ({
  settlementBalance,
  isLoading,
  showBalance,
  settlements,
}) => {
  const chartData = {
    labels: settlements?.map((data: any) => data.day),
    datasets: [
      {
        label: "Weekly Settlement History",
        data: settlements?.map((data: any) => data.total_amount),
        backgroundColor: [
          "#2B8A85",
          "#F8C232",
          "#F6941C",
          "#F56422",
          "#CC4C58",
          "#5F4D98",
          "#17578D",
        ],
        barThickness: 25,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { display: true } },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: {
        display: true,
        labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 },
      },
    },
  };

  return (
    <div className="bg-white p-5 rounded-xl h-[480px]">
      {isLoading ? (
        <>
          <Skeleton className="h-2.5" width={200} />
          <Skeleton className="h-2.5" width={100} />
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
          {/* <div className="flex justify-between"> */}
          <div className="w-full">
            <p className="text-[#7F7F7F] text-base font-medium">
              Settlement Balance
              <span className="text-xs ml-1">(last 7 days):</span>
            </p>

            <div className="mt-2 w-full flex items-center justify-between">
              <h1 className="font-semibold text-lg text-[#090727]">
                {showBalance ? settlementBalance : "********"}
              </h1>

              <Link href="/settlements">
                <span className="underline text-primary text-[13px] font-medium">
                  View all Settlements
                </span>
              </Link>
            </div>
          </div>

          <div className="h-[370px]">
            <Bar options={chartOptions} data={chartData} />
          </div>
        </>
      )}
    </div>
  );
};

export default BarChart;
