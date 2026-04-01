import {AccountType, BillType} from '@/types/bill';

export const APP_NAME = '记账本';
export const STORAGE_KEY = 'account-app-local-store';
export const DATA_MODE: 'local' | 'remote' = 'local';

export const billTypeOptions: Array<{label: string; value: BillType}> = [
  {label: '支出', value: 'EXPENSE'},
  {label: '收入', value: 'INCOME'},
];

export const accountTypeOptions: Array<{label: string; value: AccountType}> = [
  {label: '微信', value: 'WECHAT'},
  {label: '支付宝', value: 'ALIPAY'},
  {label: '银行卡', value: 'BANK_CARD'},
  {label: '现金', value: 'CASH'},
  {label: '其他', value: 'OTHER'},
];

export const filterTypeOptions: Array<{label: string; value: BillType | 'ALL'}> = [
  {label: '全部', value: 'ALL'},
  {label: '支出', value: 'EXPENSE'},
  {label: '收入', value: 'INCOME'},
];
