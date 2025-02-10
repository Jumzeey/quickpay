import React, { Fragment } from "react";
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

interface chartOptions {
  responsive: boolean;
  scales: any;
  maintainAspectRatio: boolean;
  plugins: any;
}

export const options: chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      grid: {
        display: true,
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      labels: {
        usePointStyle: true,
        boxWidth: 6,
        boxHeight: 6,
      },
    },
  },
};

const BarChart: React.FC<Props> = ({
  settlementBalance,
  isLoading,
  showBalance,
  settlements,
}) => {
  const data = {
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

  return (
    <div className="bg-white p-5 rounded-xl h-[480px]">
      {isLoading ? (
        <div className="">
          <Skeleton className="h-2.5" width={200} />
          <Skeleton className="h-2.5" width={100} />

          <div className="mt-16">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-2.5 mb-5" />
            ))}
          </div>
        </div>
      ) : (
        <Fragment>
          <div className="flex justify-between">
            <div>
              <span className="text-grey-400 text-base font-medium">
                Settlement Balance
              </span>
              <h1 className="font-semibold mt-2 text-xl text-grey-400">
                {showBalance ? settlementBalance : "********"}
              </h1>
            </div>

            <div>
              <p className="text-xs">showing balance for last 7 days</p>
            </div>
          </div>

          <div className="h-[300px]">
            <Bar options={options} data={data} />
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
        </Fragment>
      )}
    </div>
  );
};

export default BarChart;
