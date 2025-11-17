module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [ 'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@src': './src',
          '@components': './src/components',
          '@constants': './src/constants',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@theme': './src/theme',
          '@api': './src/api',
          '@websocket': './src/websocket',
          '@assets': './src/assets',
          '@utils': './src/utils',
          '@hooks': './src/hooks',
        },
      }
    ],
    'react-native-worklets/plugin',
  ],
};
