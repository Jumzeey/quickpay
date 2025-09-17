import { CurrencyOption } from '@/stores/useCurrency';
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import * as Yup from 'yup';

export const capitalizeFirstLetterOfEachWord = (sentence: string) => {
  if (!sentence) {
    return sentence;
  }

  return sentence
    .split(' ')
    .map(word => {
      if (word.length === 0) {
        return word;
      }
      const firstLetter = word[0].toUpperCase();
      const restOfString = word.slice(1).toLowerCase();
      return `${firstLetter}${restOfString}`;
    })
    .join(' ');
}

export const capitalizeFirstLetter = (sentence: string) => {
  if (!sentence) {
    return sentence;
  }

  return sentence
    .split(' ')
    .map(word => {
      if (word.length === 0) {
        return word;
      }
      const firstLetter = word[0].toUpperCase();
      const restOfString = word.slice(1).toLowerCase();
      return `${firstLetter}${restOfString}`;
    })
    .join(' ');
};

export const formattedBalance = {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export const numberWithCommas = (number: string | number | undefined) => {
  return number?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function humanize(str: string) {
  return str.replace(/[-_]/g, ' ');
}

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    notifySuccess('Copied!');
  } catch (error) {
    console.error('Unable to copy text to clipboard:', error);
  }
};

export const getStatusColor = (status: string) => {
  if (!status) return 'inherit';

  status = status.toLowerCase();
  switch (status) {
    case 'pending':
      return '#C8AC16';
    case 'batched':
      return '#6B46C1';
    case 'processing':
      return '#FF8C00';
    case 'sent':
      return '#4169E1';
    case 'confirmed':
      return '#32CD32';
    case 'completed':
    case 'successful':
      return '#2BD325';
    case 'failed':
      return '#FD2727';
    case 'cancelled':
      return '#DC143C';
    case 'rejected':
      return '#B22222';
    case 'on_hold':
      return '#FFD700';
    case 'settled':
      return '#008000';
    case 'approved':
      return '#005BB0';
    case 'overdue':
      return '#FF0000';
    default:
      return 'inherit';
  }
};

export const notifyInfo = (message: string) => {
  return toast.info(message);
};

export const notifyError = (errorMessage: string) => {
  return toast.error(errorMessage);
};

export const notifySuccess = (successMessage: string) => {
  return toast.success(successMessage);
};

export const getToken = () => {
  return Cookies.get('accessToken');
};

export const removeCommasFromValue = (value: string) => {
  return value?.replace(/,/g, '');
};

export const handleLogOut = async () => {
  try {
    Cookies.remove('accessToken');
    localStorage.clear();
    window.location.href = '/onboarding/sign-in';
  } catch (error) {
    notifyError('Log Out Failed');
  }
};

export const truncateText = (text: any, length = 20) => {
  if (!text) return 'N/A';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

export const downloadFile = (url: string) => {
  window.location.href = url;
};

export const formatDate = (date: any) => {
  return format(new Date(date), 'yyyy-MM-dd');
};

export const formatDateTime = (dateTimeString: any) => {
  return format(new Date(dateTimeString), 'MMMM do, yyyy, h:mm:ss a');
};

export const formatDateTime2 = (date: string): string[] => {
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return [formattedDate, formattedTime];
};

export const formattedDate = (dateString: string): string | null => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
      return null;
    }

    const dayOfMonth = date.getDate();
    let suffix = 'th';

    if (dayOfMonth === 1 || dayOfMonth === 21 || dayOfMonth === 31) {
      suffix = 'st';
    } else if (dayOfMonth === 2 || dayOfMonth === 22) {
      suffix = 'nd';
    } else if (dayOfMonth === 3 || dayOfMonth === 23) {
      suffix = 'rd';
    }

    return date
      .toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      .replace(/(\d+)(,)/, `$1${suffix}$2`); //Corrected regex
  } catch {
    return null;
  }
};

export const formatBalance = (number: number | undefined | null, currency?: string): string => {
  const currencySymbol = currency ? currencySymbols[currency] || '' : '';
  if (!number || isNaN(number) || number === undefined || number === null) {
    return `${currencySymbol}0.00`; // Default value when input is undefined or null
  }

  return `${currencySymbol}${number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Define the list of Nigerian phone number prefixes (without the leading zero)
const nigerianPhonePrefixes = [
  // MTN prefixes
  '703',
  '706',
  '803',
  '806',
  '810',
  '813',
  '814',
  '816',
  '903',
  '906',
  '913',
  '916',
  // Airtel prefixes
  '701',
  '708',
  '802',
  '808',
  '812',
  '901',
  '902',
  '904',
  '907',
  '912',
  // 9mobile prefixes
  '809',
  '817',
  '818',
  '908',
  '909',
  // Glo prefixes
  '705',
  '805',
  '807',
  '811',
  '815',
  '905',
  '915',
  // Other Nigerian numbers can also be added here
];

const nigerianPhoneNumberRegex = new RegExp(
  `^(\\+234)?(${nigerianPhonePrefixes.join('|')})\\d{7}$`
);

// Create a reusable Yup validation schema for Nigerian phone numbers
export const nigerianPhoneNumberSchema = Yup.string()
  .required('Phone number is required!')
  .transform(function (value) {
    // Remove spaces or dashes if any
    let normalizedValue = value.replace(/\s|-/g, '');

    // If the number does not start with '+234', add the prefix
    if (!normalizedValue.startsWith('+234')) {
      // If the number starts with '0', remove the '0' and add '+234'
      if (normalizedValue.startsWith('0')) {
        normalizedValue = `+234${normalizedValue.slice(1)}`;
      } else {
        // Add '+234' to numbers starting directly with the prefix
        normalizedValue = `+234${normalizedValue}`;
      }
    }

    return normalizedValue;
  })
  .matches(
    nigerianPhoneNumberRegex,
    'Please enter a valid Nigerian phone number.'
  );

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function dateFormat(dateString: string): string {
  const date = new Date(dateString);

  const day = date.toLocaleString('en-GB', { day: '2-digit' });
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.toLocaleString('en-GB', { year: 'numeric' });
  const time = date.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${day} ${month}, ${year} ${time}`;
}

export const currencySymbols: Record<string, string> = {
  'NGN': '₦',
  'USD': '$',
  'GHS': '₵',
  'EUR': '€',
  'GBP': '£',
  'KES': 'KSh',
  'ZMW': 'ZMW',
};

export const replaceCurrencySymbol = (amount: string): string => {
  if (!amount) return amount;

  // Replace any currency at the start of the string with right symbol
  for (const [symbol, code] of Object.entries(currencySymbols)) {
    if (amount.startsWith(symbol)) {
      return amount.replace(symbol, code);
    }
  }

  return amount;
}

export const formatAmount = (amountStr: string): string => {
  if (!amountStr || typeof amountStr !== 'string' || amountStr.length < 2) return amountStr;

  const currencySymbol = amountStr.charAt(0);
  let rest = amountStr.slice(1).trim();
  let isNegative = false;

  // Check for a negative sign in the amount
  if (rest.startsWith('-')) {
    isNegative = true;
    rest = rest.slice(1).trim();
  }

  const numberPart = parseFloat(
    rest
      .replace(/,/g, '')
      .replace(/[^0-9.]/g, '')
      .trim()
  );

  if (isNaN(numberPart)) return `${currencySymbol}0.00`;

  // Format the number with commas
  const formattedNumberPart = numberPart
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return isNegative
    ? `-${currencySymbol}${formattedNumberPart}`
    : `${currencySymbol}${formattedNumberPart}`;
};

export interface Modules {
  id: number;
  user_id: number;
  product: string;
  sub_product: {
    payment_type?: string[];
    currency?: string[];
  };
}

export const getAllCurrencies = (modules: Modules[]): { value: CurrencyOption; label: string }[] => {
  const currencySet = new Set<string>();

  modules.forEach((module) => {
    if (module.sub_product.currency) {
      module.sub_product.currency.forEach((currency) => {
        currencySet.add(currency);
      });
    }
  });

  return Array.from(currencySet).map(currency => ({
    value: currency as CurrencyOption,
    label: `${currencySymbols[currency] || ''} ${currency}`
  }));
};

export const allCardCurrencies = ['NGN', 'USD', 'GHS']

export const mapCurrencyCodesToOptions = (currencyCodes: string[]): { value: string; label: string }[] => {
  const isAllCurrency = currencyCodes.at(0)?.toLowerCase() === "all";
  if (isAllCurrency) {
    currencyCodes = Object.keys(currencySymbols);
  }

  return currencyCodes.map(code => ({
    value: code,
    label: `${currencySymbols[code] || ''} ${code}`
  }));
};

export const isImageFile = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png'].includes(extension || '');
};

export const getPreviewUrl = (file: File) => {
  return URL.createObjectURL(file);
};

export const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'file-pdf';
    case 'doc':
    case 'docx':
      return 'file-text';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'file-image';
    default:
      return 'file';
  }
};