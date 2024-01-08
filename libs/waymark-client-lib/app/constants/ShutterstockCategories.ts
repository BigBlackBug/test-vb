import { getImgixUrl } from 'shared/utils/urls';

export const shutterstockCategories: Array<{
  displayName: string;
  videoCategoryID: number;
  imageCategoryID: number;
  thumbnailURL: string;
}> = [
  {
    displayName: 'People',
    videoCategoryID: 13,
    imageCategoryID: 13,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/people_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Business & Finance',
    videoCategoryID: 4,
    imageCategoryID: 4,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/business_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Nature',
    videoCategoryID: 12,
    imageCategoryID: 12,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/nature_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Transportation',
    videoCategoryID: 19,
    imageCategoryID: 0,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/transportation_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Holidays',
    videoCategoryID: 8,
    imageCategoryID: 8,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/holidays_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Animals',
    videoCategoryID: 1,
    imageCategoryID: 1,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/animals_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Technology',
    videoCategoryID: 16,
    imageCategoryID: 16,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/technology_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Food & Drink',
    videoCategoryID: 6,
    imageCategoryID: 6,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/food_and_drink_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Sports & Recreation',
    videoCategoryID: 18,
    imageCategoryID: 18,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/sports_and_recreation_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Education',
    videoCategoryID: 5,
    imageCategoryID: 5,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/education_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Healthcare',
    videoCategoryID: 7,
    imageCategoryID: 7,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/healthcare_category_thumbnail.jpg',
    ),
  },
  {
    displayName: 'Science',
    videoCategoryID: 15,
    imageCategoryID: 15,
    thumbnailURL: getImgixUrl(
      'app/components/stock_video_categories/science_category_thumbnail.jpg',
    ),
  },
];
