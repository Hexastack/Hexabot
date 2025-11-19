const passthrough = (value: string) => value;

const chalkMock = {
  blue: passthrough,
  yellow: passthrough,
  cyan: passthrough,
  red: passthrough,
  green: passthrough,
  bgYellow: passthrough,
  gray: passthrough,
};

export default chalkMock;
