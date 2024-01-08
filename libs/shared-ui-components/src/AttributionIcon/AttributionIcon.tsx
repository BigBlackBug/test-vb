import { WellsaidLabsIcon } from './WellsaidLabsIcon';
import { PlayHTIcon } from './PlayHTIcon';

interface AttributionIconProps {
  company: AttributionIconCompanies;
  width?: number;
  height?: number;
}

export enum AttributionIconCompanies {
  PlayHT = 'PlayHT',
  WellSaidLabs = 'WellSaid Labs',
}

const iconMap = {
  [AttributionIconCompanies.PlayHT]: PlayHTIcon,
  [AttributionIconCompanies.WellSaidLabs]: WellsaidLabsIcon,
};

export function AttributionIcon({ company }: AttributionIconProps) {
  return <div>{iconMap[company] && iconMap[company]()}</div>;
}

//style={{ width: width, height: height }}

export default AttributionIcon;
