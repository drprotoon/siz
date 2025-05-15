import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  // Converter para número se for string
  let numericAmount: number;

  if (typeof amount === 'string') {
    // Remover caracteres não numéricos, exceto ponto decimal
    numericAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
  } else {
    numericAmount = amount;
  }

  // Verificar se é um número válido
  if (isNaN(numericAmount)) {
    console.warn('Valor inválido passado para formatCurrency:', amount);
    numericAmount = 0;
  }

  // Garantir que o valor tenha 2 casas decimais
  // Usar toFixed diretamente no número, não em uma string
  const formattedAmount = Math.round(numericAmount * 100) / 100;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(formattedAmount);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getDiscountPercentage(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function formatPostalCode(postalCode: string): string {
  const digits = postalCode.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.substring(0, 5)}-${digits.substring(5, 8)}`;
}

export function isValidPostalCode(postalCode: string): boolean {
  const digits = postalCode.replace(/\D/g, '');
  return digits.length === 8;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
