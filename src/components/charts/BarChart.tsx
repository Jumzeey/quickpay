import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Button from "../button";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Link from "next/link";
import { motion } from "framer-motion";

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
    <div className="bg-white p-5 rounded-xl h-[480px] shadow-md">
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
          <div className="flex justify-between">
            <div>
              <span className="text-grey-400 text-base font-medium">
                Settlement Balance
              </span>
              <h1 className="font-semibold mt-2 text-xl text-grey-400">
                {showBalance ? settlementBalance : "********"}
              </h1>
            </div>
            <p className="text-xs">Showing balance for last 7 days</p>
          </div>

          <div className="h-[300px]">
            <Bar options={chartOptions} data={chartData} />
          </div>

          <Link href="/your-business/settlement-history">
            <Button
              text="See all settlements"
              ariaLabel="Settlements button"
              className="mx-auto my-[25px]"
              medium
              plain
            />
          </Link>
        </>
      )}
    </div>
  );
};

export default BarChart;
