/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
} from '@nestjs/common';
import { FindManyOptions, In } from 'typeorm';

import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginName, PluginType } from '@/plugins/types';
import { UserService } from '@/user/services/user.service';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { DeleteResult } from '@/utils/generics/base-orm.repository';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  Block,
  BlockCreateDto,
  BlockDtoConfig,
  BlockFull,
  BlockSearchQueryDto,
  BlockTransformerDto,
  BlockUpdateDto,
  SearchRankedBlock,
} from '../dto/block.dto';
import { BlockOrmEntity } from '../entities/block.entity';
import { BlockService } from '../services/block.service';

@Controller('Block')
export class BlockController extends BaseOrmController<
  BlockOrmEntity,
  BlockTransformerDto,
  BlockDtoConfig
> {
  constructor(
    private readonly blockService: BlockService,
    private readonly userService: UserService,
    private pluginsService: PluginService<BaseBlockPlugin<any>>,
  ) {
    super(blockService);
  }

  /**
   * Text search for blocks.
   *
   * Example: GET /block/search?q=UserSearchPhrase&limit=50
   *
   * @param {string} q - The search term.
   * @param {number} [limit] - The maximum number of results to return.
   * @param {string} [category] - The category to filter the search results.
   * @returns {Promise<SearchRankedBlock[]>} A promise that resolves to an array of ranked block search results.
   */
  @Get('search')
  async search(
    @Query()
    { q, limit, category }: BlockSearchQueryDto,
  ): Promise<SearchRankedBlock[]> {
    if (!q) return [];

    return await this.blockService.search(q, limit, category);
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
    @Query(
      new TypeOrmSearchFilterPipe<BlockOrmEntity>({
        allowedFields: [
          'category.id',
          'name',
          'starts_conversation',
          'builtin',
        ],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<BlockOrmEntity>,
  ): Promise<Block[] | BlockFull[]> {
    const queryOptions = options ?? {};
    return this.canPopulate(populate)
      ? await this.blockService.findAndPopulate(queryOptions)
      : await this.blockService.find(queryOptions);
  }

  /**
   * Retrieves a custom block settings for a specific plugin.
   *
   * @param pluginName - The name of the plugin for which settings are to be retrieved.
   *
   * @returns An array containing the settings of the specified plugin.
   */
  @Get('customBlocks/settings')
  async findSettings(@Query('plugin') pluginName: PluginName) {
    try {
      if (!pluginName) {
        throw new BadRequestException(
          'Plugin name must be supplied as a query param',
        );
      }

      const plugin = this.pluginsService.getPlugin(
        PluginType.block,
        pluginName,
      );

      if (!plugin) {
        throw new NotFoundException('Plugin Not Found');
      }

      return await plugin.getDefaultSettings();
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
  async findAll() {
    try {
      const plugins = this.pluginsService
        .getAllByType(PluginType.block)
        .map(async (p) => {
          const defaultSettings = await p.getDefaultSettings();

          return {
            id: p.getName(),
            namespace: p.getNamespace(),
            template: {
              ...p.template,
              message: {
                plugin: p.name,
                args: defaultSettings.reduce(
                  (acc, setting) => {
                    acc[setting.label] = setting.value;
                    return acc;
                  },
                  {} as { [key: string]: any },
                ),
              },
            },
            effects:
              typeof p.effects === 'object' ? Object.keys(p.effects) : [],
          };
        });
      return await Promise.all(plugins);
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
  @Post()
  async create(@Body() block: BlockCreateDto): Promise<Block> {
    // TODO: typeorm fk constraint doesn't support nested objects, we need to refactor it to support nested objects
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
   * Updates multiple blocks by their IDs.
   * @param ids - IDs of blocks to be updated.
   * @param payload - The data to update blocks with.
   * @returns A Promise that resolves to the updates if successful.
   */
  @Patch('bulk')
  async updateMany(@Body() body: { ids: string[]; payload: BlockUpdateDto }) {
    if (!body.ids || body.ids.length === 0) {
      throw new BadRequestException('No IDs provided  to perform the update');
    }
    const updates = await this.blockService.updateMany(
      { where: { id: In(body.ids) } },
      body.payload,
    );

    return updates;
  }

  /**
   * Updates a specific block by ID.
   *
   * @param id - The ID of the block to update.
   * @param blockUpdate - The data to update the block with.
   * @returns A Promise that resolves to the updated block if successful.
   */
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() blockUpdate: BlockUpdateDto,
  ): Promise<Block> {
    return await this.blockService.updateOne(id, blockUpdate);
  }

  /**
   * Deletes a specific block by ID.
   *
   * @param id - The ID of the block to delete.
   * @returns A Promise that resolves to the deletion result.
   */
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

  /**
   * Deletes multiple blocks by their IDs.
   * @param ids - IDs of blocks to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    if (!ids?.length) {
      throw new BadRequestException('No IDs provided for deletion.');
    }
    const deleteResult = await this.blockService.deleteMany({
      where: { id: In(ids) },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(`Unable to delete blocks with provided IDs: ${ids}`);
      throw new NotFoundException('Blocks with provided IDs not found');
    }

    this.logger.log(`Successfully deleted blocks with IDs: ${ids}`);
    return deleteResult;
  }
}
