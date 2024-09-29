/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

const CHIP_COMMON_STYLE = {
  border: "1px solid",
  fontSize: "12px",
  boxShadow: "none",
  fontWeight: "500",
};
const CHIP_ERROR_STYLE = {
  ...CHIP_COMMON_STYLE,
  color: "#f56c6c",
  borderColor: "hsla(0,87%,69%,.2)",
  backgroundColor: "hsla(0,87%,69%,.1)",
};
const CHIP_SUCCESS_STYLE = {
  ...CHIP_COMMON_STYLE,
  color: "#67c23a",
  borderColor: "rgba(103,194,58,.2)",
  backgroundColor: "rgba(103,194,58,.1)",
};
const CHIP_TITLE_STYLE = {
  ...CHIP_COMMON_STYLE,
  fontWeight: 700,
  color: "#1AA089",
  borderColor: "rgba(40,144,132,.2)",
  backgroundColor: "rgba(40,144,132,.1)",
};
const CHIP_INFO_STYLE = {
  ...CHIP_COMMON_STYLE,
  color: "#1AA089",
  borderColor: "rgba(40,144,132,.2)",
  backgroundColor: "rgba(40, 144, 132, .1)",
};
const CHIP_INBOX_STYLE = {
  ...CHIP_COMMON_STYLE,
  color: "#909399",
  borderColor: "hsla(220,4%,58%,.2)",
  backgroundColor: "hsla(220,4%,58%,.1)",
};
const CHIP_TEST_STYLE = {
  ...CHIP_COMMON_STYLE,
  color: "#e6a23c",
  borderColor: "rgba(230,162,60,.2)",
  backgroundColor: "rgba(230,162,60,.1)",
};
const CHIP_AVAILABLE_STYLE = {
  ...CHIP_COMMON_STYLE,
  color: "#67c23a",
  borderColor: "rgba(103, 194, 58,  0.2)",
  backgroundColor: "rgba(103, 194, 58, 0.1)",
};
const CHIP_UNAVAILABLE_STYLE = {
  ...CHIP_COMMON_STYLE,
  color: "#e6a23c",
  borderColor: "rgba(230, 162, 60, 0.2)",
  backgroundColor: "rgba(230, 162, 60, 0.1)",
};

export const ChipStyles = {
  disabled: CHIP_ERROR_STYLE,
  enabled: CHIP_SUCCESS_STYLE,
  title: CHIP_TITLE_STYLE,
  role: CHIP_INFO_STYLE,
  inbox: CHIP_INBOX_STYLE,
  test: CHIP_TEST_STYLE,
  available: CHIP_AVAILABLE_STYLE,
  unavailable: CHIP_UNAVAILABLE_STYLE,
} as const;
