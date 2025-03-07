/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import zookeeper from 'zookeeper';

@Injectable()
export class ZookeeperService implements OnModuleInit, OnModuleDestroy {
  private client: any;

  private isLeaderFlag = false;

  private intervalId: any;

  private readonly logger = new Logger(ZookeeperService.name);

  private readonly connectionString = process.env.ZOOKEEPER_HOST || 'zoo1:2181';

  async onModuleInit() {
    this.client = new zookeeper({
      connect: this.connectionString,
      timeout: 5000,
      debug_level: zookeeper.ZOO_LOG_LEVEL_WARN,
      host_order_deterministic: false,
    });

    this.client.connect((error: any) => {
      if (error) {
        this.logger.error('Zookeeper connection failed', error);
        return;
      }
      this.logger.log('Connected to Zookeeper');
      this.attemptToBecomeLeader();
    });
  }

  watchLeader() {
    this.logger.log('Watching leader every 2000s');
    this.intervalId = setInterval(() => {
      this.watchLeaderNode();
    }, 10000);
  }

  private attemptToBecomeLeader() {
    const leaderPath = '/leader';

    this.client.a_create(
      leaderPath,
      null,
      zookeeper.ZOO_EPHEMERAL,
      (error: any, path: string) => {
        if (error) {
          // Leader already exists, so this instance is not the leader.
          this.logger.warn('Leader already exists. Watching for changes...');
          // this.watchLeaderNode(leaderPath);
          this.isLeaderFlag = false;
          clearInterval(this.intervalId);
          this.watchLeader();
        } else {
          clearInterval(this.intervalId);
          // Successfully created the node: this instance is the leader.
          this.isLeaderFlag = true;
          this.logger.log(`Became leader! (node: ${path})`);
          this.startCronJobsAndSeedDb();
        }
      },
    );
  }

  private watchLeaderNode(path: string = '/leader') {
    // this.client.a_get(
    //   path,
    //   (event: any) => {
    //     this.logger.log('Leader node changed. Reattempting leader election...');
    //   },
    //   (error: any, stat: any, data: any) => {
    //     if (error) {
    //       this.logger.error('Error watching leader node', error);
    //     }
    //   },
    // );
    this.attemptToBecomeLeader();
  }

  private startCronJobsAndSeedDb() {
    // Your seeding and cron job logic goes here.
    this.logger.log('Seeding DB...');
    this.logger.log('Starting cron jobs...');
  }

  // This is the method that checks if the current instance is the leader.
  public isLeader(): boolean {
    return this.isLeaderFlag;
  }

  async onModuleDestroy() {
    if (this.client) {
      this.client.close();
      this.logger.log('Zookeeper connection closed.');
    }
  }
}
