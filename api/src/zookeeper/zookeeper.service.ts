/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, Logger } from '@nestjs/common';
import zookeeper from 'zookeeper';

import { CustomEventEmitterService } from '@/custom-event-emitter/custom-event-emitter.service';

@Injectable()
export class ZookeeperService {
  private client: any;

  private isLeaderFlag = false;

  private readonly MASTER_NODE = '/master';

  private readonly logger = new Logger(ZookeeperService.name);

  private readonly connectionString = process.env.ZOOKEEPER_HOST || 'zoo1:2181';

  private count = 0;

  constructor(private customEventEmitterService: CustomEventEmitterService) {
    if (!this.client) {
      this.logger.log('Called consturctor');

      this.logger.log('Created many times', this.count);
      this.client = new zookeeper({
        connect: this.connectionString,
        timeout: 5000,
        debug_level: zookeeper.ZOO_LOG_LEVEL_WARN,
        host_order_deterministic: false,
      });

      this.client.connect(async (error: any) => {
        if (error) {
          this.logger.error('Zookeeper connection failed', error);
          return;
        }
        this.logger.log('✅ Connected to Zookeeper');
        await this.attemptToBecomeLeader();
      });
    }
  }

  /**
   * Tries to become the leader by creating an ephemeral node.
   */
  private async attemptToBecomeLeader() {
    return new Promise((resolve, reject) => {
      this.client.a_create(
        this.MASTER_NODE,
        'I am the master',
        zookeeper.ZOO_EPHEMERAL,
        (rc: number, error: any, path: string) => {
          if (rc === 0) {
            this.logger.log('🎉 This server is now the MASTER!');
            this.isLeaderFlag = true;
            // emit event to re-run logic in case of crash while running cron job, seeding db, running migrations
            this.customEventEmitterService.publicLeadershipEvent();
            resolve({ success: true });
          } else if (rc === zookeeper.ZNODEEXISTS) {
            this.logger.log(
              '🔹 Master already exists. Watching for changes...',
            );
            this.isLeaderFlag = false;
            this.watchMaster();
            resolve({ success: true });
          } else {
            this.logger.error('❌ Error while creating master node:', error);
            reject(error);
          }
        },
      );
    });
  }

  /**
   * Watches the master node for deletion using `w_exists()`.
   */
  private watchMaster() {
    this.client.w_exists(
      this.MASTER_NODE,
      async (rc: number, error: any, stat: any) => {
        if (rc === 0 && stat) {
          this.logger.log('👀 Watching master node for deletion...');
        } else {
          this.logger.log('⚠️ No master found. Trying to become master...');
          await this.attemptToBecomeLeader();
        }
      },
    );
  }

  /**
   * Checks if this instance is the leader.
   */
  public isLeader(): boolean {
    return this.isLeaderFlag;
  }
}
