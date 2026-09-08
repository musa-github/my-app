export const DEFAULT_NOTES = [
  'This offer excludes VAT, Tax, and AIT.',
  'One-year warranty on all electrical equipment (excluding high voltage, earthquake, water damage).',
  'There is no warranty for the door motor.'
];

export const DEFAULT_PAYMENT_MODE = {
  mode: 'Payment by cash.',
  advance: '80% advance.',
  handover: '20% handover date.'
};

export const convertToWords = (num) => {
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const formatChunk = (n) => {
    let str = '';
    if (n >= 100) {
      str += `${single[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n >= 10 && n < 20) {
      str += `${double[n - 10]} `;
    } else {
      if (n >= 20) {
        str += `${tens[Math.floor(n / 20)]} `;
        n %= 10;
      }
      if (n > 0) {
        str += `${single[n]} `;
      }
    }
    return str.trim();
  };

  if (!num || num === 0) return 'Zero Taka Only';

  const [integerStr, decimalStr] = num.toFixed(2).split('.');
  let integerPart = parseInt(integerStr, 10);
  const decimalPart = parseInt(decimalStr, 10);

  if (isNaN(integerPart) || integerPart === 0) {
    return decimalPart > 0 ? `${decimalPart} Paisa Only` : 'Zero Taka Only';
  }

  let words = '';
  if (integerPart >= 10000000) {
    words += `${formatChunk(Math.floor(integerPart / 10000000))} Crore `;
    integerPart %= 10000000;
  }
  if (integerPart >= 100000) {
    words += `${formatChunk(Math.floor(integerPart / 100000))} Lakh `;
    integerPart %= 100000;
  }
  if (integerPart >= 1000) {
    words += `${formatChunk(Math.floor(integerPart / 1000))} Thousand `;
    integerPart %= 1000;
  }
  if (integerPart > 0) {
    words += formatChunk(integerPart);
  }

  words = `${words.trim()} Taka`;
  if (decimalPart > 0) {
    words += ` and ${formatChunk(decimalPart)} Paisa`;
  }

  return `${words} Only`;
};