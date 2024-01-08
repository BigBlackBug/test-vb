// Local
import { defaultIconColor, whiteIconColor } from './constants';
import { IconProps } from './types';

export const AllAspectRatiosIcon = ({ color = defaultIconColor, ...otherProps }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    {...otherProps}
  >
    <g fill="none" fillRule="evenodd" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5h14A1.5 1.5 0 0 1 24.5 3v26a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 29V3A1.5 1.5 0 0 1 9 1.5z" />
      <path d="M27.5 6v20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 26V6A1.5 1.5 0 0 1 6 4.5h20A1.5 1.5 0 0 1 27.5 6z" />
      <path d="M30.5 9v14a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 23V9A1.5 1.5 0 0 1 3 7.5h26A1.5 1.5 0 0 1 30.5 9z" />
    </g>
  </svg>
);

export const UnlockedAspectRatioIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" {...props}>
    <g fill="none" fillRule="evenodd" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24.5 12.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1h17zM16 17a2 2 0 0 0-1.389 3.44l-.491 2.462a.5.5 0 0 0 .49.598h2.78a.5.5 0 0 0 .49-.598l-.491-2.463A2 2 0 0 0 16 17zM22 12.5V6.238C22 3.345 24.686 1 28 1s6 2.345 6 5.238V9.5" />
    </g>
  </svg>
);

export const TallAspectRatioIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.5 3C7.5 2.17157 8.17157 1.5 9 1.5L23 1.5C23.8284 1.5 24.5 2.17157 24.5 3V29C24.5 29.8284 23.8284 30.5 23 30.5H9C8.17157 30.5 7.5 29.8284 7.5 29L7.5 3Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SquareAspectRatioIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M26 4.5C26.8284 4.5 27.5 5.17157 27.5 6L27.5 26C27.5 26.8284 26.8284 27.5 26 27.5L6 27.5C5.17157 27.5 4.5 26.8284 4.5 26L4.5 6C4.5 5.17157 5.17157 4.5 6 4.5L26 4.5Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WideAspectRatioIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M28 7.5C28.8284 7.5 29.5 8.17157 29.5 9L29.5 23C29.5 23.8284 28.8284 24.5 28 24.5L4 24.5C3.17157 24.5 2.5 23.8284 2.5 23L2.5 9C2.5 8.17157 3.17157 7.5 4 7.5L28 7.5Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TVReadyIcon = ({
  color = defaultIconColor,
  secondaryColor = whiteIconColor,
  ...props
}: IconProps & {
  secondaryColor?: string;
}) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.5625 2.35799C6.25184 2.04733 6.25184 1.54366 6.5625 1.233C6.87316 0.922335 7.37684 0.922335 7.6875 1.233L12.125 5.6705H12.2612L16.6987 1.233C17.0094 0.922335 17.5131 0.922335 17.8237 1.233C18.1344 1.54366 18.1344 2.04733 17.8237 2.35799L14.5112 5.6705H19.8C20.9201 5.6705 21.4802 5.6705 21.908 5.88848C22.2843 6.08023 22.5903 6.38619 22.782 6.76251C23 7.19034 23 7.75039 23 8.8705V17.4705C23 18.5906 23 19.1507 22.782 19.5785C22.5903 19.9548 22.2843 20.2608 21.908 20.4525C21.4802 20.6705 20.9201 20.6705 19.8 20.6705H19.8H4.2H4.19997C3.07989 20.6705 2.51984 20.6705 2.09202 20.4525C1.71569 20.2608 1.40973 19.9548 1.21799 19.5785C1 19.1507 1 18.5906 1 17.4705V8.87049C1 7.75039 1 7.19034 1.21799 6.76251C1.40973 6.38619 1.71569 6.08023 2.09202 5.88848C2.51984 5.6705 3.0799 5.6705 4.2 5.6705H9.875L6.5625 2.35799Z"
      fill={color}
    />
    <path
      d="M12.2424 10.6385V9.12647H5.10242V10.6385H7.79042V17.6705H9.55442V10.6385H12.2424ZM16.2972 17.6705L18.9492 9.12647H17.1492L16.1292 12.4505C15.7812 13.6025 15.4572 14.7785 15.2052 15.9425H15.1812C14.9292 14.7785 14.6172 13.6025 14.2572 12.4505L13.2372 9.12647H11.4372L14.0892 17.6705H16.2972Z"
      fill={secondaryColor}
    />
  </svg>
);

export const DigitalOnlyIcon = ({
  color = defaultIconColor,
  secondaryColor = whiteIconColor,
  ...props
}: IconProps & {
  secondaryColor?: string;
}) => (
  <svg
    width="12"
    height="19"
    viewBox="0 0 12 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="12" height="19" rx="2" fill={color} />
    <rect x="2" y="2" width="8" height="13" rx="1" fill={secondaryColor} />
    <rect x="5" y="16" width="2" height="2" rx="1" fill={secondaryColor} />
  </svg>
);

export const EssentialsIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M16.5 16C16.5 16 17.5633 24.6497 14.8811 27.3318C12.199 30.014 7.85032 30.014 5.16815 27.3318C2.48597 24.6497 2.48597 20.301 5.16815 17.6188C7.85032 14.9367 16.5 16 16.5 16Z"
      stroke={color}
    />
    <path
      d="M16.5 16.0001C16.5 16.0001 25.1497 17.0634 27.8318 14.3813C30.514 11.6991 30.514 7.35044 27.8318 4.66827C25.1497 1.9861 20.801 1.9861 18.1188 4.66827C15.4367 7.35044 16.5 16.0001 16.5 16.0001Z"
      stroke={color}
    />
  </svg>
);

export const PromoteMyBusinessIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.36738 35.1975C3.78757 33.0337 3.49767 31.9517 3.69733 31.0124C3.87295 30.1861 4.30565 29.4367 4.93339 28.8715C5.64705 28.2289 6.72899 27.939 8.89286 27.3592L44.8253 17.7311C46.9892 17.1513 48.0711 16.8614 49.0104 17.0611C49.8367 17.2367 50.5862 17.6694 51.1514 18.2971C51.794 19.0108 52.0839 20.0927 52.6637 22.2566L57.633 40.8024C58.2128 42.9662 58.5027 44.0482 58.303 44.9875C58.1274 45.8138 57.6947 46.5632 57.067 47.1285C56.3533 47.771 55.2714 48.0609 53.1075 48.6407L17.1751 58.2688C15.0112 58.8486 13.9293 59.1385 12.9899 58.9389C12.1637 58.7632 11.4142 58.3305 10.849 57.7028C10.2064 56.9891 9.91651 55.9072 9.3367 53.7433L4.36738 35.1975Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.25684 34.7876L52.5526 21.8468L57.7414 41.2119L9.4457 54.1527L4.25684 34.7876Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line x1="22.8944" y1="6.44721" x2="12.8944" y2="26.4472" stroke={color} />
    <line x1="24.5547" y1="6.16795" x2="42.5547" y2="18.1679" stroke={color} />
    <circle cx="23" cy="5" r="2" stroke={color} />
  </svg>
);

export const PromoteEventCalendarIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line x1="8" y1="23" x2="56" y2="23" stroke={color} />
    <line x1="17" y1="5" x2="17" y2="11" stroke={color} strokeLinecap="round" />
    <line x1="47" y1="5" x2="47" y2="11" stroke={color} strokeLinecap="round" />
    <line x1="32" y1="31" x2="32" y2="47" stroke={color} strokeLinecap="round" />
    <path d="M7 23H57V50C57 53.866 53.866 57 50 57H14C10.134 57 7 53.866 7 50V23Z" stroke={color} />
    <path d="M7 14C7 10.134 10.134 7 14 7H50C53.866 7 57 10.134 57 14V23H7V14Z" stroke={color} />
  </svg>
);

export const PromoteJobListingIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5 34C5 33.4477 5.44772 33 6 33H56C56.5523 33 57 33.4477 57 34V50C57 52.7614 54.7614 55 52 55H10C7.23858 55 5 52.7614 5 50V34Z"
      stroke={color}
    />
    <path
      d="M19 14C19 14.5523 19.4477 15 20 15H42C42.5523 15 43 14.5523 43 14C43 11.2386 40.7614 9 38 9H24C21.2386 9 19 11.2386 19 14Z"
      stroke={color}
    />
    <path
      d="M3 20C3 17.2386 5.23858 15 8 15H54C56.7614 15 59 17.2386 59 20V32C59 32.5523 58.5523 33 58 33H4C3.44772 33 3 32.5523 3 32V20Z"
      stroke={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M28 29C28 28.0681 28 27.6022 28.1522 27.2346C28.3552 26.7446 28.7446 26.3552 29.2346 26.1522C29.6022 26 30.0681 26 31 26C31.9319 26 32.3978 26 32.7654 26.1522C33.2554 26.3552 33.6448 26.7446 33.8478 27.2346C34 27.6022 34 28.0681 34 29V35C34 35.9319 34 36.3978 33.8478 36.7654C33.6448 37.2554 33.2554 37.6448 32.7654 37.8478C32.3978 38 31.9319 38 31 38C30.0681 38 29.6022 38 29.2346 37.8478C28.7446 37.6448 28.3552 37.2554 28.1522 36.7654C28 36.3978 28 35.9319 28 35L28 29Z"
      fill="white"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PromoteOtherIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="32" cy="32" r="3" stroke={color} />
    <circle cx="32" cy="52" r="7" stroke={color} />
    <circle cx="12" cy="32" r="7" transform="rotate(90 12 32)" stroke={color} />
    <circle cx="32" cy="12" r="7" stroke={color} />
    <circle cx="52" cy="32" r="7" transform="rotate(90 52 32)" stroke={color} />
    <line x1="45" y1="32" x2="35" y2="32" stroke={color} />
    <line x1="32" y1="45" x2="32" y2="35" stroke={color} />
    <line x1="29" y1="32" x2="19" y2="32" stroke={color} />
    <line x1="32" y1="29" x2="32" y2="19" stroke={color} />
  </svg>
);
