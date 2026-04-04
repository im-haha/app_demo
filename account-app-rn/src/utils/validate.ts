import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup.string().trim().min(3, '账本账号至少 3 位').required('请输入账本账号'),
  password: yup.string().min(6, '解锁口令至少 6 位').required('请输入解锁口令'),
});

export const registerSchema = yup.object({
  username: yup.string().trim().min(3, '账本账号至少 3 位').required('请输入账本账号'),
  password: yup.string().min(6, '解锁口令至少 6 位').required('请输入解锁口令'),
  confirmPassword: yup
    .string()
    .required('请确认解锁口令')
    .oneOf([yup.ref('password')], '两次口令不一致'),
  nickname: yup.string().trim().min(2, '昵称至少 2 位').required('请输入昵称'),
});

export const budgetSchema = yup.object({
  amount: yup
    .number()
    .typeError('请输入有效数字')
    .positive('预算必须大于 0')
    .required('请输入预算金额'),
});
