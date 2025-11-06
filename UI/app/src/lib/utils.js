import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date with Arabic text but English numerals 
 * @param {Date|string} date - The date to format
 * @param {Object} options - Formatting options (same as toLocaleDateString)
 * @returns {string} Formatted date with English numerals
 */
export function formatDateArabic(date, options = {}) {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Get Arabic formatted date
  const arabicDate = dateObj.toLocaleDateString("ar-EG", options);

  // Replace Arabic numerals (٠-٩) with English numerals (0-9)
  const arabicToEnglish = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };

  return arabicDate.replace(/[٠-٩]/g, (match) => arabicToEnglish[match]);
}
