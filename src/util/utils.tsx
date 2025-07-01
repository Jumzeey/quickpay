import Cookies from 'js-cookie';
import moment from 'moment';
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
  switch (status) {
    case 'Successful':
      return '#2BD325';
    case 'Pending':
      return '#B5A818';
    case 'Failed':
      return '#FD2727';
    default:
      return 'inherit';
  }
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
  return moment(date).format('YYYY-MM-DD');
};

export const formatDateTime = (dateTimeString: any) => {
  return moment(dateTimeString).format('MMMM Do, YYYY, h:mm:ss A');
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
  const currencySymbol = currency === "NGN" ? "₦" : "$";
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

export const replaceCurrencySymbol = (amount: string): string => {
  if (!amount) return amount;

  const currencySymbols: Record<string, string> = {
    'NGN': '₦',
    'USD': '$',
  };

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