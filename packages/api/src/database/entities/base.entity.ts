/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  EntityManager,
  PrimaryColumn,
} from 'typeorm';

export abstract class BaseOrmEntity {
  private static entityManagerProvider?: () => EntityManager;

  @PrimaryColumn()
  id!: string;

  @Column({ name: 'created_at', nullable: true })
  createdAt!: Date;

  @Column({ name: 'updated_at', nullable: true })
  updatedAt!: Date;

  @BeforeInsert()
  protected setDefaults(): void {
    const now = new Date();
    if (!this.id) {
      this.id = randomUUID();
    }
    this.createdAt = this.createdAt ?? now;
    this.updatedAt = this.updatedAt ?? now;
  }

  @BeforeUpdate()
  protected touchUpdatedAt(): void {
    this.updatedAt = new Date();
  }

  static registerEntityManagerProvider(provider: () => EntityManager): void {
    this.entityManagerProvider = provider;
  }

  protected static getEntityManager(): EntityManager {
    if (!this.entityManagerProvider) {
      throw new Error(
        `Entity manager provider not registered for ${this.name}`,
      );
    }

    try {
      const manager = this.entityManagerProvider();
      if (!manager) {
        throw new Error('Entity manager provider returned no manager');
      }
      return manager;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Unable to resolve entity manager for ${this.name}: ${reason}`,
      );
    }
  }
}
