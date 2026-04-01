import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup.string().trim().min(3, '用户名至少 3 位').required('请输入用户名'),
  password: yup.string().min(6, '密码至少 6 位').required('请输入密码'),
});

export const registerSchema = yup.object({
  username: yup.string().trim().min(3, '用户名至少 3 位').required('请输入用户名'),
  password: yup.string().min(6, '密码至少 6 位').required('请输入密码'),
  confirmPassword: yup
    .string()
    .required('请确认密码')
    .oneOf([yup.ref('password')], '两次密码不一致'),
  nickname: yup.string().trim().min(2, '昵称至少 2 位').required('请输入昵称'),
});

export const budgetSchema = yup.object({
  amount: yup
    .number()
    .typeError('请输入有效数字')
    .positive('预算必须大于 0')
    .required('请输入预算金额'),
});
