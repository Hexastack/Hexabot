/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import { basename, join, resolve } from 'path';

export async function moveFile(
  sourcePath: string,
  destinationPath: string,
  overwrite: boolean = true,
): Promise<string> {
  // Check if the file exists at the destination
  try {
    if (overwrite) {
      await fs.promises.unlink(destinationPath); // Remove existing file if overwrite is true
    } else {
      await fs.promises.access(destinationPath);
      throw new Error(`File already exists at destination: ${destinationPath}`);
    }
  } catch {
    // Ignore if file does not exist
  }

  // Move the file
  await fs.promises.copyFile(sourcePath, destinationPath);
  await fs.promises.unlink(sourcePath);

  return destinationPath;
}

/**
 * Moves all files from a source folder to a destination folder.
 * @param sourceFolder - The folder containing the files to move.
 * @param destinationFolder - The folder where the files should be moved.
 * @param overwrite - Whether to overwrite files if they already exist at the destination (default: false).
 * @returns A promise that resolves when all files have been moved.
 */
export async function moveFiles(
  sourceFolder: string,
  destinationFolder: string,
  overwrite: boolean = true,
): Promise<void> {
  // Read the contents of the source folder
  const files = await fs.promises.readdir(sourceFolder);
  // Filter only files (skip directories)
  const filePaths: string[] = [];
  for (const file of files) {
    const filePath = join(sourceFolder, file);
    const stat = await fs.promises.stat(filePath);
    if (stat.isFile()) {
      filePaths.push(filePath);
    }
  }

  // Move each file to the destination folder
  for (const filePath of filePaths) {
    const fileName = basename(filePath);
    const destination = resolve(join(destinationFolder, fileName));
    await moveFile(filePath, destination, overwrite);
  }
}
