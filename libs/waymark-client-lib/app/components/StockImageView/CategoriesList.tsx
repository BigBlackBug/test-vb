import { WaymarkButton } from 'shared/components/WaymarkButton';
import { shutterstockCategories } from 'app/constants/ShutterstockCategories';
import { useCategoryId, useSubmitSearchImages } from './state/stockImageSearchStore';

import * as styles from './CategoriesList.css';
import ProgressiveImage from 'shared/components/ProgressiveImage';

export default function CategoriesList() {
  const [, setCurrentCategoryID] = useCategoryId();

  const searchImages = useSubmitSearchImages();

  return (
    <div className={styles.CategoriesList}>
      {shutterstockCategories.map(({ imageCategoryID, displayName, thumbnailURL }) => (
        <WaymarkButton
          key={imageCategoryID}
          onClick={() => {
            setCurrentCategoryID(`${imageCategoryID}`);
            searchImages();
          }}
          className={styles.CategoryButton}
          isUppercase={false}
        >
          {thumbnailURL && <ProgressiveImage src={thumbnailURL} shouldCoverContainer alt="" />}
          <div className={styles.CategoryName}>{displayName}</div>
        </WaymarkButton>
      ))}
    </div>
  );
}
