/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

const passthrough = (value: string) => value;
const chalkMock = {
  blue: passthrough,
  bold: passthrough,
  yellow: passthrough,
  cyan: passthrough,
  red: passthrough,
  green: passthrough,
  bgYellow: passthrough,
  gray: passthrough,
};

export default chalkMock;
