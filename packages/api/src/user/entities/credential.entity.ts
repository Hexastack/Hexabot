/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { EntityDto } from '@/database/decorators/dto-transforms.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import {
  Credential,
  CredentialDto,
  CredentialFull,
} from '../dto/credential.dto';

import { UserOrmEntity } from './user.entity';

@Entity({ name: 'credentials' })
@Index(['name'], { unique: true })
@EntityDto<CredentialDto>({ plain: Credential, full: CredentialFull })
export class CredentialOrmEntity extends BaseOrmEntity<CredentialDto> {
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
