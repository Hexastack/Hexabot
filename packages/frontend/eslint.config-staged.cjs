const baseConfig = require('./eslint.config.cjs');

const createConfig =
  typeof baseConfig.createConfig === 'function'
    ? baseConfig.createConfig
    : () => baseConfig;

module.exports = createConfig({
  headerYear: String(new Date().getFullYear()),
});
