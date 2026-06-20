import { readdir } from "node:fs/promises";

const FEATURE_FOLDER_PATTERN = /^F-(\d{3,})-([a-z0-9]+(?:-[a-z0-9]+)*)$/u;

export type FeatureNumber = {
  number: number;
  id: string;
};

export type FeatureFolder = FeatureNumber & {
  slug: string;
  folderName: string;
};

export async function getNextFeatureNumber(featuresDirAbsolutePath: string): Promise<FeatureNumber> {
  const existingFolders = await readExistingFeatureFolders(featuresDirAbsolutePath);
  return getNextFeatureNumberFromFolders(existingFolders);
}

export async function getFeatureFolderForSlug(
  featuresDirAbsolutePath: string,
  slug: string
): Promise<FeatureFolder> {
  const existingFolders = await readExistingFeatureFolders(featuresDirAbsolutePath);
  const existingFolder = existingFolders
    .filter((folder) => folder.slug === slug)
    .sort((left, right) => left.number - right.number)[0];

  if (existingFolder !== undefined) {
    return existingFolder;
  }

  const nextFeatureNumber = getNextFeatureNumberFromFolders(existingFolders);

  return {
    ...nextFeatureNumber,
    slug,
    folderName: `${nextFeatureNumber.id}-${slug}`
  };
}

function getNextFeatureNumberFromFolders(existingFolders: FeatureFolder[]): FeatureNumber {
  const existingNumbers = existingFolders.map((folder) => folder.number);
  const highestNumber =
    existingNumbers.length === 0 ? 0 : Math.max(...existingNumbers);
  const nextNumber = highestNumber + 1;

  return {
    number: nextNumber,
    id: formatFeatureNumber(nextNumber)
  };
}

export function formatFeatureNumber(featureNumber: number): string {
  if (!Number.isInteger(featureNumber) || featureNumber < 1) {
    throw new Error("Feature number must be a positive integer.");
  }

  return `F-${String(featureNumber).padStart(3, "0")}`;
}

export function parseFeatureNumber(folderName: string): number | null {
  const match = FEATURE_FOLDER_PATTERN.exec(folderName);

  if (match === null) {
    return null;
  }

  return Number.parseInt(match[1] ?? "", 10);
}

async function readExistingFeatureFolders(
  featuresDirAbsolutePath: string
): Promise<FeatureFolder[]> {
  let entries;

  try {
    entries = await readdir(featuresDirAbsolutePath, { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => parseFeatureFolder(entry.name))
    .filter((featureFolder): featureFolder is FeatureFolder => featureFolder !== null);
}

function parseFeatureFolder(folderName: string): FeatureFolder | null {
  const match = FEATURE_FOLDER_PATTERN.exec(folderName);

  if (match === null) {
    return null;
  }

  const number = Number.parseInt(match[1] ?? "", 10);
  const id = formatFeatureNumber(number);
  const slug = match[2] ?? "";

  return {
    number,
    id,
    slug,
    folderName
  };
}
