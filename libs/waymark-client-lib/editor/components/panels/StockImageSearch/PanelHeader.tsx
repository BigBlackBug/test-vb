// Editor
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import { WaymarkButton } from 'shared/components/WaymarkButton';

import { useImages, useReset } from 'app/components/StockImageView/state/stockImageSearchStore';

import HeaderButtonRow from 'editor/components/EditorControlPanelHeaderButtonRow';

export default function StockImageSearchPanelHeader() {
  const resetSearch = useReset();
  const searchImages = useImages();
  const hasActiveSearch = Boolean(searchImages);

  return (
    <HeaderButtonRow>
      <BaseHeaderBackButton />
      {hasActiveSearch ? (
        <WaymarkButton onClick={() => resetSearch()} colorTheme="BlackText">
          Categories
        </WaymarkButton>
      ) : null}
    </HeaderButtonRow>
  );
}
