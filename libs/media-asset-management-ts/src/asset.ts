import { z } from 'zod';

export const SourceAssetCategorySchema = z.object({
  source: z.string(),
  sourceCategoryID: z.string(),
  sourceCategoryName: z.string(),
});
export type SourceAssetCategory = z.infer<typeof SourceAssetCategorySchema>;

export enum AssetType {
  Audio = 'audio',
  Image = 'image',
  Video = 'video',
}

/**
 * Represents an asset in an external service.
 */
export const AssetSchema = z.object({
  categories: z.array(SourceAssetCategorySchema),
  description: z.string(),
  fileSize: z.number(),
  keywords: z.array(z.string()),
  previewURL: z.string().or(z.null()),
  searchID: z.string(),
  source: z.string(), // The name of the external service, e.g. Shutterstock
  sourceAssetID: z.string(), // Original asset ID in the external service
  thumbURL: z.string().or(z.null()),
  height: z.number(),
  width: z.number(),
});
export type Asset = z.infer<typeof AssetSchema>;

export enum AssetLicensePurpose {
  Preview = 'preview',
  RawPreview = 'rawpreview',
  Render = 'render',
}

/**
 * Represents an asset we've licensed.
 *
 * When licensing assets, we track the licensee (our customer's account ID, usually), the purpose
 * (e.g. previewing or rendering), the type of the asset, the ID we've assigned it, some of the
 * provider's metadata about the licensed asset (like the license ID and the URL to download it
 * from, though that's usually time-limited).
 */
export const AssetLicenseSchema = z.object({
  assetID: z.string(), // Our ID for the asset.
  assetType: z.nativeEnum(AssetType),
  licensee: z.string(), // Waymark account GUID
  purpose: z.nativeEnum(AssetLicensePurpose), // The reason we licensed the asset: preview, render, whatever.
  source: z.string(), // The name of the external service, e.g. Shutterstock
  sourceAssetID: z.string(), // Original asset ID in the external service
  sourceDownloadURL: z.string(), // URL from which the source asset can be downloaded
  sourceLicenseID: z.string(), // The ID of the license in the external service
});

// Make the AssetLicense type from the Zod schema
export type AssetLicense = z.infer<typeof AssetLicenseSchema>;
