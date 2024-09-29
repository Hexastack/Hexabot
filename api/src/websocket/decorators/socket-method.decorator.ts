/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { SocketEventMetadataStorage } from '../storage/socket-event-metadata.storage';

export const SocketGet = (path: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SocketEventMetadataStorage.addEventMetadata(target, propertyKey, {
      socketMethod: 'get',
      path,
      method: descriptor.value,
    });
  };
};

export const SocketPost = (path: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SocketEventMetadataStorage.addEventMetadata(target, propertyKey, {
      socketMethod: 'post',
      path,
      method: descriptor.value,
    });
  };
};

export const SocketPut = (path: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SocketEventMetadataStorage.addEventMetadata(target, propertyKey, {
      socketMethod: 'put',
      path,
      method: descriptor.value,
    });
  };
};

export const SocketPatch = (path: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SocketEventMetadataStorage.addEventMetadata(target, propertyKey, {
      socketMethod: 'patch',
      path,
      method: descriptor.value,
    });
  };
};

export const SocketDelete = (path: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SocketEventMetadataStorage.addEventMetadata(target, propertyKey, {
      socketMethod: 'delete',
      path,
      method: descriptor.value,
    });
  };
};

export const SocketOptions = (path: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SocketEventMetadataStorage.addEventMetadata(target, propertyKey, {
      socketMethod: 'options',
      path,
      method: descriptor.value,
    });
  };
};

export const SocketHead = (path: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SocketEventMetadataStorage.addEventMetadata(target, propertyKey, {
      socketMethod: 'head',
      path,
      method: descriptor.value,
    });
  };
};
