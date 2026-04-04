import Taro from '@tarojs/taro';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as {message?: unknown}).message ?? '');
  }
  return '';
}

export async function safeShowToast(options: Taro.showToast.Option): Promise<void> {
  try {
    await Taro.showToast(options);
  } catch (error) {
    console.warn('[toast] ignored:', getErrorMessage(error));
  }
}

export async function safeReLaunch(url: string): Promise<void> {
  try {
    await Taro.reLaunch({url});
    return;
  } catch (error) {
    console.warn('[nav] reLaunch failed:', getErrorMessage(error));
  }

  try {
    await Taro.redirectTo({url});
  } catch (fallbackError) {
    console.warn('[nav] redirectTo failed:', getErrorMessage(fallbackError));
  }
}
