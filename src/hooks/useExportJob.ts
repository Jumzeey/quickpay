import api from "@/util/api";
import { notifyError, notifySuccess } from "@/util/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type ExportType =
  | "settlement-transactions"
  | "wallet-history"
  | "payouts"
  | "collections"
  | "activities"
  | string;

interface ExportJobState {
  jobId: string | null;
  status: "idle" | "pending" | "polling" | "completed" | "failed";
  downloadUrl: string | null;
  progress: number;
  error: string | null;
}

interface ExportOptions {
  // The full endpoint for initiating the export
  exportEndpoint: string;
  // The endpoint pattern for checking status (will be formatted with jobId)
  statusEndpoint: string;
  // Query parameters for the export request
  params?: Record<string, any>;
  // Identifier for this type of export
  exportType: ExportType;
  // Optional callback when export completes
  onSuccess?: (url: string) => void;
  // Optional callback for errors
  onError?: (error: Error) => void;
  // How often to poll for status (ms)
  pollingInterval?: number;
  // Maximum number of polling attempts
  maxRetries?: number;
}

export const useExportJob = () => {
  const [state, setState] = useState<ExportJobState>({
    jobId: null,
    status: "idle",
    downloadUrl: null,
    progress: 0,
    error: null,
  });

  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  // Cleanup polling timeout on unmount
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  const [persistedJobs, setPersistedJobs] = useLocalStorage<
    Record<
      string,
      {
        jobId: string;
        exportType: ExportType;
        timestamp: number;
        statusEndpoint: string;
      }
    >
  >("export-jobs", {});

  // Initialize with any persisted job
  useEffect(() => {
    const pendingJobs = Object.values(persistedJobs).filter(
      (job: any) => job.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Jobs less than 24 hours old
    );

    if (pendingJobs.length > 0) {
      // Sort by timestamp, newest first
      pendingJobs.sort((a: any, b: any) => b.timestamp - a.timestamp);
      const latestJob: any = pendingJobs[0];

      setState((prev) => ({
        ...prev,
        jobId: latestJob.jobId,
        status: "polling",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMaxRetries = () => {
    setState((prev) => ({
      ...prev,
      status: "failed",
      error: "Export timed out",
    }));
    notifyError("Export timed out. Please try again.");
    return;
  };

  const checkExportStatus = useCallback(
    async (
      jobId: string,
      statusEndpoint: string,
      options: {
        onSuccess?: (url: string) => void;
        pollingInterval?: number;
        maxRetries?: number;
      } = {}
    ) => {
      const { pollingInterval = 3000, maxRetries = 20 } = options;
      let retries = 0;

      const checkStatus = async (): Promise<void> => {
        if (cancelledRef.current) return;
        if (retries >= maxRetries) return handleMaxRetries();

        try {
          // Replace :id with the actual jobId
          const formattedEndpoint = statusEndpoint.replace(":id", jobId);
          const response = await api.get(formattedEndpoint);

          // Bail out if component has unmounted during the async call
          if (cancelledRef.current) return;

          // Update progress if available (add a default fallback if your API doesn't provide progress)
          if (response?.data?.progress) {
            setState((prev) => ({ ...prev, progress: response.data.progress }));
          } else if (response?.data?.status === "pending") {
            // If pending but no progress info, show incremental progress based on retries
            const calculatedProgress = Math.min(
              90,
              (retries / maxRetries) * 100
            );
            setState((prev) => ({ ...prev, progress: calculatedProgress }));
          }

          console.log("Export status response:", response.data);

          // Check if export is completed
          const urlChecker =
            response?.data?.file_url ||
            response?.data?.export_link ||
            response?.data?.s3_link;
          if (response?.data?.status === "completed" && urlChecker) {
            const downloadUrl = urlChecker;
            setState((prev) => ({
              ...prev,
              status: "completed",
              downloadUrl,
              progress: 100,
            }));

            // Automatically download the file
            // downloadFile(downloadUrl);

            // Remove job from persisted storage
            const updatedJobs = { ...persistedJobs };
            delete updatedJobs[jobId];
            setPersistedJobs(updatedJobs);

            if (options.onSuccess) {
              options.onSuccess(response.data.file_url);
            }

            notifySuccess("Export completed successfully!");
            return;
          }

          // Check for failure status
          if (response?.data?.status === "failed") {
            setState((prev) => ({
              ...prev,
              status: "failed",
              error: response?.data?.message || "Export failed",
            }));
            notifyError(
              response?.data?.message || "Export failed. Please try again."
            );

            // Remove job from persisted storage
            const updatedJobs = { ...persistedJobs };
            delete updatedJobs[jobId];
            setPersistedJobs(updatedJobs);

            return;
          }

          // Still processing, continue polling (with cleanup tracking)
          retries++;
          if (!cancelledRef.current) {
            pollingTimeoutRef.current = setTimeout(
              checkStatus,
              pollingInterval
            );
          }
        } catch (error: any) {
          if (cancelledRef.current) return;
          setState((prev) => ({
            ...prev,
            status: "failed",
            error: error.message || "Failed to check export status",
          }));
          notifyError("Failed to check export status");
        }
      };

      setState((prev) => ({ ...prev, status: "polling", jobId }));
      checkStatus();
    },
    [persistedJobs, setPersistedJobs]
  );

  const startExport = useCallback(
    async (options: ExportOptions) => {
      const {
        exportEndpoint,
        statusEndpoint,
        params = {},
        exportType,
        onSuccess,
        onError,
        pollingInterval,
        maxRetries,
      } = options;

      try {
        setState((prev) => ({
          ...prev,
          status: "pending",
          error: null,
          downloadUrl: null,
          progress: 0,
        }));

        // Add export=true to params
        const exportParams = { ...params, export: true };

        console.log({ exportParams });

        // Make the export request
        const response = await api.get(exportEndpoint, {
          params: exportParams,
        });

        console.log({ response });
        // Check if export is already completed (immediate completion case)
        if (
          response?.data?.status === "completed" &&
          (response?.data?.file_url || response?.data?.export_link)
        ) {
          const downloadUrl =
            response.data.file_url || response.data.export_link;
          // Handle immediate completion
          setState((prev) => ({
            ...prev,
            status: "completed",
            downloadUrl,
            progress: 100,
          }));

          // Automatically download the file
          // downloadFile(downloadUrl);

          if (onSuccess) {
            onSuccess(downloadUrl);
          }

          notifySuccess("Export completed successfully!");
          return response.data.job_id;
        }

        const jobId = response?.data.job_id;
        if (!jobId) {
          throw new Error("No job ID received from the server");
        }

        // Persist the job
        setPersistedJobs((prev) => ({
          ...prev,
          [jobId]: {
            jobId,
            exportType,
            statusEndpoint,
            timestamp: Date.now(),
          },
        }));

        // Start polling for the export status
        checkExportStatus(jobId.toString(), statusEndpoint, {
          onSuccess,
          pollingInterval,
          maxRetries,
        });

        return jobId;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: error.message || "Failed to start export",
        }));

        if (onError) {
          onError(error);
        }

        notifyError(error.message || "Failed to start export");
        return null;
      }
    },
    [checkExportStatus, setPersistedJobs]
  );

  const cancelExport = useCallback(() => {
    // Clear any active polling timeout
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    if (state.jobId) {
      // Just remove from persisted storage, don't cancel on server
      const updatedJobs = { ...persistedJobs };
      delete updatedJobs[state.jobId];
      setPersistedJobs(updatedJobs);
    }

    setState({
      jobId: null,
      status: "idle",
      downloadUrl: null,
      progress: 0,
      error: null,
    });
  }, [state.jobId, persistedJobs, setPersistedJobs]);

  const resumeExport = useCallback(
    (jobId: string, statusEndpoint: string) => {
      checkExportStatus(jobId, statusEndpoint);
    },
    [checkExportStatus]
  );

  return {
    ...state,
    startExport,
    checkExportStatus,
    cancelExport,
    resumeExport,
    isLoading: state.status === "pending" || state.status === "polling",
    isCompleted: state.status === "completed",
    isFailed: state.status === "failed",
    pendingJobs: Object.values(persistedJobs)
      .filter((job: any) => job.timestamp > Date.now() - 24 * 60 * 60 * 1000)
      .sort((a: any, b: any) => b.timestamp - a.timestamp),
  };
};
