const fullConfig = require('./eslint.config.cjs');

const config = fullConfig.map((entry) => {
  if (!entry.languageOptions?.parserOptions) {
    return entry;
  }

  return {
    ...entry,
    languageOptions: {
      ...entry.languageOptions,
      parserOptions: {
        ...entry.languageOptions.parserOptions,
        project: undefined,
      },
    },
  };
});

module.exports = config;
