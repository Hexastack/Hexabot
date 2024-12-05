/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from "react";

const FileIcon: FC<SVGProps<SVGSVGElement>> = ({
  viewBox = "0 0 512 512",
  ...rest
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} {...rest}>
      <g data-name="1">
        <path d="M378.83 450H150a50.17 50.17 0 01-50.11-50.11V98.11A50.17 50.17 0 01150 48h150.1a15 15 0 0110.61 4.39l113.84 113.88a15 15 0 014.39 10.61v223A50.17 50.17 0 01378.83 450zM150 78a20.13 20.13 0 00-20.11 20.11v301.78A20.13 20.13 0 00150 420h228.83a20.13 20.13 0 0020.11-20.11v-216.8L293.85 78z" />
        <path d="M413.94 191.88h-78.77a50.17 50.17 0 01-50.11-50.11V63a15 15 0 0130 0v78.77a20.13 20.13 0 0020.11 20.11h78.77a15 15 0 010 30zM264.4 375a15 15 0 01-10.61-4.4l-54.45-54.44a15 15 0 1121.21-21.22l43.85 43.84 43.84-43.84a15 15 0 1121.21 21.22L275 370.55a15 15 0 01-10.6 4.45z" />
        <path d="M264.4 365a15 15 0 01-15-15V231a15 15 0 0130 0v119a15 15 0 01-15 15z" />
      </g>
    </svg>
  );
};

export default FileIcon;
