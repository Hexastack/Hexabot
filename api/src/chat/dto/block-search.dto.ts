/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { Transform, Type } from 'class-transformer';
// import {
//   IsInt,
//   IsNotEmpty,
//   IsOptional,
//   IsString,
//   Max,
//   Min,
// } from 'class-validator';

// import { SanitizeQueryPipe } from '@/common/pipes/sanitize-query.pipe';
// import { IsObjectId } from '@/utils/validation-rules/is-object-id';

// import { DEFAULT_BLOCK_SEARCH_LIMIT } from '../constants/block';

// export class BlockSearchQueryDto {
//   @ApiPropertyOptional({
//     description: 'Search term to filter blocks',
//     type: String,
//   })
//   @IsOptional()
//   @IsString()
//   @Transform(({ value }) => SanitizeQueryPipe.sanitize(value))
//   q?: string;

//   @ApiPropertyOptional({
//     description: `Maximum number of results to return (default: ${DEFAULT_BLOCK_SEARCH_LIMIT}, max: ${DEFAULT_BLOCK_SEARCH_LIMIT})`,
//     type: Number,
//     default: DEFAULT_BLOCK_SEARCH_LIMIT,
//     maximum: DEFAULT_BLOCK_SEARCH_LIMIT,
//     minimum: 1,
//   })
//   @IsOptional()
//   @Type(() => Number)
//   @IsInt()
//   @Min(1)
//   @Max(DEFAULT_BLOCK_SEARCH_LIMIT)
//   limit: number = DEFAULT_BLOCK_SEARCH_LIMIT;

//   @ApiPropertyOptional({
//     description: 'Category to filter search results',
//     type: String,
//   })
//   @IsOptional()
//   @IsNotEmpty()
//   @IsString()
//   @IsObjectId({ message: 'Category must be a valid objectId' })
//   category?: string;
// }
