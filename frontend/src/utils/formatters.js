/**
 * Data Formatters
 * Functions to format data for display
 */

// Format date
export const formatDate = (date, format = 'dd/MM/yyyy') => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    default:
      return date;
  }
};

// Format currency
export const formatCurrency = (amount, currency = 'TND') => {
  if (isNaN(amount)) return '0.00';
  return `${parseFloat(amount).toFixed(2)} ${currency}`;
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `+216 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Format CIN
export const formatCIN = (cin) => {
  if (!cin) return '';
  return cin.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
};

// Truncate text
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Capitalize first letter
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Convert to title case
export const toTitleCase = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (isNaN(value)) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

// Format status badge
export const formatStatus = (status) => {
  const statusMap = {
    'Nouveau': '🟢 Nouveau',
    'En cours': '🟡 En cours',
    'Soumis': '🔵 Soumis',
    'Soutenu': '✅ Soutenu',
    'Approuvé': '✅ Approuvé',
    'Rejeté': '❌ Rejeté',
  };
  return statusMap[status] || status;
};

// Format time (HH:mm)
export const formatTime = (hours, minutes) => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export default {
  formatDate,
  formatCurrency,
  formatPhone,
  formatCIN,
  truncateText,
  capitalize,
  toTitleCase,
  formatFileSize,
  formatPercentage,
  formatStatus,
  formatTime,
};
