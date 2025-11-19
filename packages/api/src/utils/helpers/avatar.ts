/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from 'path';
import { Readable } from 'stream';

import { StreamableFile } from '@nestjs/common';
import { Resvg } from '@resvg/resvg-js';

import { isEmpty } from './misc';
import { generateBotAvatarSvg, generateUIAvatarSvg } from './svg';

export const generateAvatarSvg = async (svg: string) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'height', value: 50 },
    textRendering: 1,

    font: {
      fontFiles: [path.join(process.cwd(), 'assets/Roboto-Regular.ttf')],
    },
  });
  const renderedSvg = resvg.render();
  const renderedImage = renderedSvg.asPng();
  const readable = Readable.from(renderedImage);

  return new StreamableFile(readable, { type: 'image/png' });
};

export const generateInitialsAvatar = async (name: {
  first_name: string;
  last_name: string;
}) => {
  const svg = generateUIAvatarSvg({
    text: getInitials(name),
    bgColor: '#DBDBDB',
  });

  return await generateAvatarSvg(svg);
};

export const getBotAvatar = async (color: string) => {
  const svg = generateBotAvatarSvg({ bgColor: color });

  return await generateAvatarSvg(svg);
};

const getInitials = (name: { first_name: string; last_name: string }) => {
  if (isEmpty(name.first_name)) {
    const string = name.first_name.trim().slice(0, 2);

    return string.toUpperCase();
  }
  if (isEmpty(name.last_name)) {
    const string = name.last_name.trim().slice(0, 2);

    return string.toUpperCase();
  }

  return `${name.first_name.trim()[0]}${
    name.last_name.trim()[0]
  }`.toUpperCase();
};
