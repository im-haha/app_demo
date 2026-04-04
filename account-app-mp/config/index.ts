import path from 'path';
import {defineConfig} from '@tarojs/cli';
import devConfig from './dev';
import prodConfig from './prod';

const sourceRoot = path.resolve(__dirname, '..', 'src');

export default defineConfig<'webpack5'>(Object.assign(
  {
    projectName: 'account-app-mp',
    date: '2026-04-02',
    designWidth: 750,
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'webpack5',
    plugins: ['@tarojs/plugin-framework-react'],
    alias: {
      '@': sourceRoot,
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
        },
        url: {
          enable: true,
          config: {
            limit: 1024,
          },
        },
        cssModules: {
          enable: false,
        },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
    },
  },
  process.env.NODE_ENV === 'development' ? devConfig : prodConfig,
));
