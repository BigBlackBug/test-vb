// Vendor
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker/locale/en';

// Local
import { BFSFontVariant } from 'libs/shared-types';

export const BFSFontVariantFactory = Factory.define<BFSFontVariant>(() => ({
  uuid: faker.datatype.uuid(),
  isItalic: faker.datatype.boolean(),
  weightIndex: faker.datatype.number({ min: 1, max: 9 }) * 100,
}));

export default BFSFontVariantFactory;
