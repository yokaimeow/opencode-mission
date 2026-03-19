import { toast } from 'sonner';
import type { ApiError } from './apiClient';

export function showError(error: unknown): void {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const apiError = error as ApiError;
    toast.error(apiError.error);
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
}

export function showSuccess(message: string): void {
  toast.success(message);
}

export function showInfo(message: string): void {
  toast(message);
}

export { toast };
