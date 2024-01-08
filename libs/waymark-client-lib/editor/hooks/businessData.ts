import useDebounce from 'shared/hooks/useDebounce';
import { updateBusiness } from 'shared/api/graphql/businesses/mutations';
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';

export const useUpdateBusinessFormData = (businessGuid?: string | null) => {
  const onBusinessFormFieldChanged = useDebounce((formChange: Partial<CoreBusinessDetails>) => {
    if (!businessGuid) {
      return;
    }

    updateBusiness({
      guid: businessGuid,
      ...formChange,
    });
  }, 500);

  return onBusinessFormFieldChanged;
};
