/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { credentialSchema, credentialFullSchema } from '@hexabot-ai/types';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { CredentialDto } from '../dto/credential.dto';

import { UserOrmEntity } from './user.entity';

@Entity({ name: 'credentials' })
@Index(['name'], { unique: true })
export class CredentialOrmEntity extends BaseOrmEntity<CredentialDto> {
  plainCls = credentialSchema;

  fullCls = credentialFullSchema;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  value!: string;

  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_id' })
  @AsRelation()
  owner!: UserOrmEntity;

  @RelationId((credential: CredentialOrmEntity) => credential.owner)
  private readonly ownerId!: string;
}
