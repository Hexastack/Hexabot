/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { TFilterQuery } from 'mongoose';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginType } from '@/plugins/types';
import { UserService } from '@/user/services/user.service';
import { BaseController } from '@/utils/generics/base-controller';
import { DeleteResult } from '@/utils/generics/base-repository';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { BlockCreateDto, BlockUpdateDto } from '../dto/block.dto';
import {
  Block,
  BlockFull,
  BlockPopulate,
  BlockStub,
} from '../schemas/block.schema';
import { BlockService } from '../services/block.service';
import { CategoryService } from '../services/category.service';
import { LabelService } from '../services/label.service';

@UseInterceptors(CsrfInterceptor)
@Controller('Block')
export class BlockController extends BaseController<
  Block,
  BlockStub,
  BlockPopulate,
  BlockFull
> {
  constructor(
    private readonly blockService: BlockService,
    private readonly logger: LoggerService,
    private readonly categoryService: CategoryService,
    private readonly labelService: LabelService,
    private readonly userService: UserService,
    private pluginsService: PluginService<BaseBlockPlugin>,
  ) {
    super(blockService);
  }
  /**
   * Finds blocks based on the provided query parameters.
   * @param populate - An array of fields to populate in the returned blocks.
   * @param filters - Query filters to apply to the block search.
   * @returns A Promise that resolves to an array of found blocks.
   */

  @Get()
  async find(
    @Query(PopulatePipe)
    populate: string[],
    @Query(new SearchFilterPipe<Block>({ allowedFields: ['category'] }))
    filters: TFilterQuery<Block>,
  ): Promise<Block[] | BlockFull[]> {
    return this.canPopulate(populate)
      ? await this.blockService.findAndPopulate(filters)
      : await this.blockService.find(filters);
  }

  /**
   * Retrieves a custom block settings for a specific plugin.
   *
   * @param pluginId - The name of the plugin for which settings are to be retrieved.
   *
   * @returns An array containing the settings of the specified plugin.
   */
  @Get('customBlocks/settings')
  findSettings(@Query('plugin') pluginId: string) {
    try {
      if (!pluginId) {
        throw new BadRequestException(
          'Plugin id must be supplied as a query param',
        );
      }

      const plugin = this.pluginsService.getPlugin(PluginType.block, pluginId);

      if (!plugin) {
        throw new NotFoundException('Plugin Not Found');
      }

      return plugin.settings;
    } catch (e) {
      this.logger.error('Unable to fetch plugin settings', e);
      throw e;
    }
  }

  /**
   * Retrieves all custom blocks (plugins) along with their associated block template.
   *
   * @returns An array containing available custom blocks.
   */
  @Get('customBlocks')
  findAll() {
    try {
      const plugins = this.pluginsService
        .getAllByType(PluginType.block)
        .map((p) => ({
          title: p.title,
          name: p.id,
          template: {
            ...p.template,
            message: {
              plugin: p.id,
              args: p.settings.reduce(
                (acc, setting) => {
                  acc[setting.id] = setting.value;
                  return acc;
                },
                {} as { [key: string]: any },
              ),
            },
          },
          effects: typeof p.effects === 'object' ? Object.keys(p.effects) : [],
        }));
      return plugins;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  // @TODO : remove once old frontend is abandoned
  /**
   * Retrieves the effects of all plugins that have effects defined.
   *
   * @returns An array containing objects representing the effects of plugins.
   */
  @Get('effects')
  findEffects(): {
    name: string;
    title: any;
  }[] {
    try {
      const plugins = this.pluginsService.getAllByType(PluginType.block);
      const effects = Object.keys(plugins)
        .filter(
          (plugin) =>
            typeof plugins[plugin].effects === 'object' &&
            Object.keys(plugins[plugin].effects).length > 0,
        )
        .map((plugin) => ({
          name: plugin,
          title: plugins[plugin].title,
        }));

      return effects;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * Retrieves a single block by its ID.
   *
   * @param id - The ID of the block to retrieve.
   * @param populate - An array of fields to populate in the retrieved block.
   * @returns A Promise that resolves to the retrieved block.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<Block | BlockFull> {
    const doc = this.canPopulate(populate)
      ? await this.blockService.findOneAndPopulate(id)
      : await this.blockService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Block by id ${id}`);
      throw new NotFoundException(`Block with ID ${id} not found`);
    }
    return doc;
  }

  /**
   * Creates a new block.
   *
   * @param block - The data of the block to be created.
   * @returns A Promise that resolves to the created block.
   */

  @CsrfCheck(true)
  @Post()
  async create(@Body() block: BlockCreateDto): Promise<Block> {
    this.validate({
      dto: block,
      allowedIds: {
        category: (await this.categoryService.findOne(block.category))?.id,
        attachedBlock: (await this.blockService.findOne(block.attachedBlock))
          ?.id,
        nextBlocks: (
          await this.blockService.find({
            _id: {
              $in: block.nextBlocks,
            },
          })
        ).map(({ id }) => id),
        assign_labels: (
          await this.labelService.find({
            _id: {
              $in: block.assign_labels,
            },
          })
        ).map(({ id }) => id),
        trigger_labels: (
          await this.labelService.find({
            _id: {
              $in: block.trigger_labels,
            },
          })
        ).map(({ id }) => id),
      },
    });
    // TODO: the validate function doesn't support nested objects, we need to refactor it to support nested objects
    if (block.options?.assignTo) {
      const user = await this.userService.findOne(block.options.assignTo);
      if (!user) {
        throw new BadRequestException(
          `options.assignTo with ID ${block.options.assignTo} not found`,
        );
      }
    }

    return await this.blockService.create(block);
  }

  /**
   * Updates a specific block by ID.
   *
   * @param id - The ID of the block to update.
   * @param blockUpdate - The data to update the block with.
   * @returns A Promise that resolves to the updated block if successful.
   */
  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() blockUpdate: BlockUpdateDto,
  ): Promise<Block> {
    const result = await this.blockService.updateOne(id, blockUpdate);
    if (!result) {
      this.logger.warn(`Unable to update Block by id ${id}`);
      throw new NotFoundException(`Block with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Deletes a specific block by ID.
   *
   * @param id - The ID of the block to delete.
   * @returns A Promise that resolves to the deletion result.
   */
  @CsrfCheck(true)
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.blockService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Block by id ${id}`);
      throw new NotFoundException(`Block with ID ${id} not found`);
    }
    return result;
  }
}
