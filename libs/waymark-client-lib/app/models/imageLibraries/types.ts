import ImageAsset from './ImageAsset';

export enum ImageSources {
  AdminUpload = 'admin_upload',
  BusinessWebsite = 'business_website',
  Facebook = 'facebook',
  GooglePlaces = 'google_places',
  Shutterstock = 'shutterstock',
  UserUpload = 'user_upload',
  Yelp = 'yelp',
  Zillow = 'zillow',
}

export interface FormattedImageLibraryData {
  slug: string | null;
  displayName: string;
  images: Array<ImageAsset>;
  removedImages: Array<ImageAsset>;
}
