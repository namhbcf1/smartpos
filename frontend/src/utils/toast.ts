import { enqueueSnackbar, VariantType } from 'notistack';

export function showToast(message: string, variant: VariantType = 'default') {
  enqueueSnackbar(message, { variant });
}

export function showSuccess(message: string) {
  showToast(message, 'success');
}

export function showError(message: string) {
  showToast(message, 'error');
}

