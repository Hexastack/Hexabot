module.exports = {
  extends: './.eslintrc.js',
  rules: {
    'header/header': [
      2,
      'block',
      [
        '',
        ' * Hexabot — Fair Core License (FCL-1.0-ALv2)',
        ' * Copyright (c) ' + new Date().getFullYear() + ' Hexastack.',
        ' * Full terms: see LICENSE.md.',
        ' ',
      ],
      2,
    ],
  },
};
