/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { ContentCreateDto } from '@/cms/dto/content.dto';
import { Content, ContentModel } from '@/cms/schemas/content.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

import { installAttachmentFixtures } from './attachment';
import { installContentTypeFixtures } from './contenttype';

type TContentFixtures = FixturesTypeBuilder<Content, ContentCreateDto>;

export const contentDefaultValues: TContentFixtures['defaultValues'] = {
  status: true,
};

const contents: TContentFixtures['values'][] = [
  {
    title: 'Jean',
    dynamicFields: {
      subtitle: 'Jean Droit Taille Normale',
      image: {
        payload: {
          url: 'https://images-na.ssl-images-amazon.com/images/I/31DY09uzLDL._SX38_SY50_CR,0,0,38,50_.jpg',
        },
      },
    },
    entity: '0',
  },
  {
    title: 'Adaptateur',
    dynamicFields: {
      subtitle: 'Rankie Adaptateur DisplayPort vers VGA, 1080P Full HD, Noir',
      image: {
        payload: {
          url: 'https://images-eu.ssl-images-amazon.com/images/I/41mUnrSGKwL._SL75_.jpg',
        },
      },
    },
    entity: '0',
    status: false,
  },
  {
    title: 'Sac a Main Femmes Cuir',
    dynamicFields: {
      subtitle:
        'BestoU Sac a Main Femmes Cuir Bandoulieres Grand Sacs Porte Cabas (Marron)',
      image: {
        payload: {
          url: 'https://images-na.ssl-images-amazon.com/images/I/51AV-LVMMEL._SS36_.jpg',
        },
      },
    },
    entity: '0',
  },
  {
    title: 'Kitten Heel',
    dynamicFields: {
      subtitle: 'Kitten Heel Sling Back',
      image: {
        payload: {
          url: 'https://images-na.ssl-images-amazon.com/images/I/31qzy-FAE5L._SS47_.jpg',
        },
      },
    },
    entity: '0',
  },
  {
    title: 'A Collection of Nameless',
    dynamicFields: {
      subtitle:
        'Scenarios - A Collection of Nameless Detective Stories (English Edition)',
      image: {
        payload: {
          url: 'https://images-na.ssl-images-amazon.com/images/I/31qzy-FAE5L._SS47_.jpg',
        },
      },
    },
    entity: '0',
  },
  {
    title: 'Pizza Hut',
    dynamicFields: {
      address: '90،, Avenue Taher Ben Ammar, Tunis',
      image: {
        payload: {
          url: 'https://www.google.com/maps/uv?hl=fr&pb=!1s0x12fd336848aa1b4d:0xeccb5887cef91140!3m1!7e115!4shttps://lh5.googleusercontent.com/p/AF1QipNEPe0sTSH08WF57AXb1YfmFCDFJPKCUwW0Ervn%3Dw260-h175-n-k-no!5spizza+hut+address+-+Recherche+Google&imagekey=!1e10!2sAF1QipNEPe0sTSH08WF57AXb1YfmFCDFJPKCUwW0Ervn',
        },
      },
    },
    entity: '1',
  },
  {
    title: 'store 1',
    dynamicFields: {
      image: {
        type: 'image',
        payload: {
          id: null,
        },
      },
    },
    entity: '2',
  },
  {
    title: 'store 2',
    dynamicFields: {
      image: {
        type: 'image',
        payload: {
          id: null,
        },
      },
    },
    entity: '2',
  },
  {
    title: 'store 3',
    dynamicFields: {
      image: {
        type: 'image',
        payload: {
          url: 'https://remote.file/image.jpg',
        },
      },
    },
    entity: '2',
  },
];

export const contentFixtures = getFixturesWithDefaultValues<
  TContentFixtures['values']
>({
  fixtures: contents,
  defaultValues: contentDefaultValues,
});

export const installContentFixtures = async () => {
  const attachments = await installAttachmentFixtures();
  const contentTypes = await installContentTypeFixtures();
  const Content = mongoose.model(ContentModel.name, ContentModel.schema);
  return await Content.insertMany(
    contentFixtures.map((contentFixture) => {
      const attachment = attachments.find(
        ({ name }) => name === `${contentFixture.title.replace(' ', '')}.jpg`,
      );
      if (attachment) {
        contentFixture.dynamicFields.image.payload.id = attachment.id;
      }
      return {
        ...contentFixture,
        entity: contentTypes[parseInt(contentFixture.entity)].id,
      };
    }),
  );
};
