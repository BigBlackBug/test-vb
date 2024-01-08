import { SearchContext } from './search';

// The following 3 enums are based on `ivory/web/business/models/business_image.py`
export enum ImageType {
  Unknown = 'unknown',
  BusinessImage = 'business_image',
  ImportedImage = 'imported_image',
  LogoImage = 'logo_image',
  ProfileImage = 'profile_image',
  StockImage = 'stock_image',
}

export enum ImageSourceMethod {
  Unknown = 'unknown',
  SearchResult = 'search_result',
  Upload = 'upload',
  Stock = 'stock',
  Industry = 'industry',
}

export enum ImageSource {
  Unknown = 'unknown',
  AdminUpload = 'admin_upload',
  BusinessWebsite = 'business_website',
  Facebook = 'facebook',
  GooglePlaces = 'google_places',
  Unsplash = 'unsplash',
  UserUpload = 'user_upload',
  Shutterstock = 'shutterstock',
  Yelp = 'yelp',
  Zillow = 'zillow',
}

export type StockImage = {
  sourceURL: string;
  sourceAssetID: string;
  s3FileName: string;
  imageType: ImageType;
  imageSource: ImageSource;
  imageWidth: number;
  imageHeight: number;
  caption: string;
  sourceSearchID: string;
};

export interface ImageDestination {
  s3Bucket: string;
  s3FileNamePrefix: string;
  s3BucketRegion: string;
}

export interface ImageProcessingQueueRequest {
  imageID: string;
  s3Bucket: string;
  s3FileName: string;
  imageSource: ImageSource;
  imageType: ImageType;
}

export interface ProcessedImageData {
  imageID: string;
  url: string;
  s3FileName: string;
  imageType: ImageType;
  imageSource: ImageSource;
  contentType: string;
  width: number;
  height: number;
  isQualityImage: boolean;
  isComplexImage: boolean;
  entropy: number;
  textAreaPercentage: number;
  textLength: number;
  wordCount: number;
  hasTooMuchText: boolean;
  colors: string[];
  everypixelScore?: number;
  iqaScore?: number;
  caption?: string;
}

export interface ExtractedImage {
  imageLibraryID: number;
  sourceURL: string;
  s3FileName: string;
  imageType: ImageType;
  imageSource: ImageSource;
  imageWidth: number;
  imageHeight: number;
  colors: string[];
}

export interface ImageProcessingResponse {
  searchContext?: object;
  sharedSecret: string;
  image: ExtractedImage;
}

export interface ImageProcessingCallback {
  callbackURL: string;
  searchContext?: SearchContext;
}

export type ImageProcessingRequest = {
  imageDestination: ImageDestination;
  imageCallback: ImageProcessingCallback;
  imageSource: ImageSource;
  imageType: ImageType;
  imageURL: string;
};
