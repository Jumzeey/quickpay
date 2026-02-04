/**
 * Extract column headers from CSV or Excel file.
 * For CSV: reads first line and splits by comma.
 * For Excel: uses xlsx to read first row of first sheet.
 */
export async function extractFileHeaders(file: File): Promise<string[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    return extractCsvHeaders(file);
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    return extractExcelHeaders(file);
  }

  return [];
}

function extractCsvHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || "";
        const firstLine = text.split(/\r?\n/)[0] || "";
        const headers = firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, "")).filter(Boolean);
        resolve(headers);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });
}

async function extractExcelHeaders(file: File): Promise<string[]> {
  const XLSX = await import("xlsx");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve([]);
          return;
        }
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve([]);
          return;
        }
        const sheet = workbook.Sheets[firstSheetName];
        const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
        const headers: string[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          const cell = sheet[cellAddress];
          const value = cell ? (cell.w ?? cell.v ?? "") : "";
          headers.push(String(value).trim());
        }
        resolve(headers.filter(Boolean));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Required fields the backend expects for bulk payout. Labels are for UI only.
 * The actual key sent in mapping_headers[...] is NEVER from here — it is always
 * the exact column name from the user's file (e.g. "fela number", "blah blah number",
 * "act_num", "Account No", etc.). We only define what value the backend expects
 * for each required field (account_number, bank_name, amount, account_name).
 */
export const BULK_PAYOUT_MAPPING_KEYS = [
  { key: "acct_no", label: "Account Number", backendValue: "account_number" },
  { key: "bank", label: "Bank", backendValue: "bank_name" },
  { key: "amnt", label: "Amount", backendValue: "amount" },
  { key: "acct_name", label: "Account Name", backendValue: "account_name" },
] as const;

export type BulkPayoutMappingKey = (typeof BULK_PAYOUT_MAPPING_KEYS)[number]["key"];

/**
 * Build mapping_headers for the API.
 * Key = exact column header from the user's file (no hardcoding — e.g. "fela number", "blah blah number").
 * Value = backend expected field name (account_number, bank_name, amount, account_name).
 */
export function buildMappingHeaders(
  headerMapping: Record<BulkPayoutMappingKey, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  BULK_PAYOUT_MAPPING_KEYS.forEach(({ key, backendValue }) => {
    const fileHeader = headerMapping[key];
    if (fileHeader?.trim()) {
      result[fileHeader.trim()] = backendValue;
    }
  });
  return result;
}

const PREVIEW_MAX_ROWS = 10;

/**
 * Parse a CSV line respecting quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

/**
 * Get preview rows from CSV file. Returns headers and first N rows as objects keyed by header.
 */
function getCsvPreview(file: File, maxRows: number): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || "";
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }
        const headers = parseCsvLine(lines[0]);
        const rows: Record<string, string>[] = [];
        for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
          const values = parseCsvLine(lines[i]);
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] ?? "";
          });
          rows.push(row);
        }
        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });
}

/**
 * Get preview rows from Excel file.
 */
async function getExcelPreview(
  file: File,
  maxRows: number
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const XLSX = await import("xlsx");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ headers: [], rows: [] });
          return;
        }
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({ headers: [], rows: [] });
          return;
        }
        const sheet = workbook.Sheets[firstSheetName];
        const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (raw.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }
        const headers = (raw[0] as string[]).map((h) => String(h ?? "").trim()).filter(Boolean);
        const rows: Record<string, string>[] = [];
        for (let i = 1; i < Math.min(raw.length, maxRows + 1); i++) {
          const values = raw[i] as string[];
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = String(values?.[idx] ?? "").trim();
          });
          rows.push(row);
        }
        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get preview of file content (first N rows) for confirmation. Keys are file column headers.
 */
export async function getFilePreview(
  file: File,
  maxRows: number = PREVIEW_MAX_ROWS
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".csv")) {
    return getCsvPreview(file, maxRows);
  }
  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    return getExcelPreview(file, maxRows);
  }
  return { headers: [], rows: [] };
}
