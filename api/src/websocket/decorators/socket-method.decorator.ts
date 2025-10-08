/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
