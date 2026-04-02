export default defineAppConfig({
  pages: [
    'pages/auth/index',
    'pages/home/index',
    'pages/bills/index',
    'pages/mine/index',
  ],
  window: {
    navigationBarTitleText: '记账本',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#F6F1E8',
    backgroundColor: '#F6F1E8',
    backgroundTextStyle: 'light',
  },
});
