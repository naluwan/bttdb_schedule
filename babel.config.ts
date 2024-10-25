module.exports = {
  presets: ['next/babel'], // 使用 Next.js 的 Babel 預設設定
  plugins: [
    '@babel/plugin-proposal-class-properties', // 如果套件需要，這可以處理 class properties
    '@babel/plugin-transform-runtime', // 處理 runtime 相關問題
  ],
};
