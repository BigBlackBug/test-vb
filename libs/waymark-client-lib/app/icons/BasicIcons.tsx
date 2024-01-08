// Vendor
import { whiteColor, primaryColor } from 'styles/themes/waymark/colors.js';
import { defaultIconColor } from './constants';
import { IconProps, IconWithStrokeProps } from './types';

export const AddIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M16 7V25M25 16H7" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SubtractIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line
      x1="24.5"
      y1="16.5"
      x2="7.5"
      y2="16.5"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const UpArrowIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M6 22L16 11L26.5 22" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DownArrowIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M6 10L16 21L26.5 10" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LeftArrowIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M20 6L9 16L20 26.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RightArrowIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 6L23 16L12 26.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckMarkIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6 19.0769L12.9231 26L26 6"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M8 24.9706L24.9706 8M8 8L24.9706 24.9706"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MenuIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M6 21.5H26M6 11.5H26" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MoonIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7 22.99L7.13221 22.5078C6.92307 22.4505 6.7008 22.5345 6.58188 22.7158C6.46296 22.8972 6.4745 23.1345 6.61045 23.3035L7 22.99ZM17.9961 5L18.1283 4.5178C17.9192 4.46045 17.6969 4.54447 17.578 4.72581C17.4591 4.90716 17.4706 5.14449 17.6066 5.31345L17.9961 5ZM9.7477 23.8586C15.9802 23.8586 20.9993 18.6086 20.9993 12.1743H19.9993C19.9993 18.0939 15.3911 22.8586 9.7477 22.8586V23.8586ZM6.86779 23.4722C7.78745 23.7244 8.75283 23.8586 9.7477 23.8586V22.8586C8.84319 22.8586 7.9667 22.7366 7.13221 22.5078L6.86779 23.4722ZM6.61045 23.3035C8.67084 25.8641 11.7735 27.5 15.2484 27.5V26.5C12.0972 26.5 9.27366 25.0181 7.38955 22.6766L6.61045 23.3035ZM15.2484 27.5C21.4809 27.5 26.5 22.25 26.5 15.8157H25.5C25.5 21.7352 20.8918 26.5 15.2484 26.5V27.5ZM26.5 15.8157C26.5 10.4077 22.9584 5.84206 18.1283 4.5178L17.8639 5.4822C22.2476 6.68409 25.5 10.8457 25.5 15.8157H26.5ZM20.9993 12.1743C20.9993 9.32762 20.0183 6.71555 18.3857 4.68655L17.6066 5.31345C19.099 7.16826 19.9993 9.56007 19.9993 12.1743H20.9993Z"
      fill={color}
    />
  </svg>
);

export const SunIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M15.9999 3.28271V7.80445M24.9924 7.00756L21.7951 10.2049M28.7174 16.0001H24.1956M24.9926 24.9927L21.7953 21.7953M16.0001 28.7175V24.1958M7.00754 24.9927L10.2049 21.7953M3.28259 16.0001H7.80433M7.00733 7.00756L10.2047 10.2049M15.9999 23.9132C20.3702 23.9132 23.913 20.3704 23.913 16.0001C23.913 11.6299 20.3702 8.08707 15.9999 8.08707C11.6297 8.08707 8.0869 11.6299 8.0869 16.0001C8.0869 20.3704 11.6297 23.9132 15.9999 23.9132Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RestartIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M13.5385 23H15.5C20.1944 23 24 19.1944 24 14.5C24 9.80558 20.1944 6 15.5 6C10.8056 6 7 9.80558 7 14.5M16 19.5L12.5 23L16 26.5"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SearchIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M19.5 20L25.5 25.5M14 22C18.4183 22 22 18.4183 22 14C22 9.58172 18.4183 6 14 6C9.58172 6 6 9.58172 6 14C6 18.4183 9.58172 22 14 22Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SliderHandleGemIcon = ({
  fillColor = primaryColor,
  strokeColor = whiteColor,
  ...props
}: IconWithStrokeProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fill={fillColor}
      stroke={strokeColor}
      strokeLinejoin="round"
      d="M12,1 L23,12 L23,23 L1,23 L1,12 z"
    />
  </svg>
);

export const FilterMenuIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="21"
    height="22"
    viewBox="0 0 21 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5.25 7.625H15.75M7.5 11.375H13.5M9 15.125H12M10.5 20.75C15.8848 20.75 20.25 16.3848 20.25 11C20.25 5.61522 15.8848 1.25 10.5 1.25C5.11522 1.25 0.75 5.61522 0.75 11C0.75 16.3848 5.11522 20.75 10.5 20.75Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const HistoryIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M8.50832 7.82404V7.83452L8.5158 7.84187L10.4323 9.72505C10.4323 9.72508 10.4324 9.72512 10.4324 9.72515C10.5277 9.82054 10.575 9.93363 10.575 10.0657C10.575 10.1978 10.5277 10.311 10.4323 10.4064C10.3367 10.502 10.2263 10.549 10.1 10.549C9.97372 10.549 9.86329 10.502 9.76766 10.4064L9.76752 10.4062L7.701 8.37303C7.70098 8.37301 7.70096 8.37299 7.70094 8.37297C7.64747 8.31949 7.61088 8.26418 7.59015 8.20716C7.56895 8.14886 7.55832 8.08787 7.55832 8.02404V5.17404C7.55832 5.03563 7.60331 4.92273 7.69266 4.83338C7.78201 4.74403 7.89491 4.69904 8.03332 4.69904C8.17173 4.69904 8.28463 4.74403 8.37398 4.83338C8.46333 4.92273 8.50832 5.03563 8.50832 5.17404V7.82404ZM2.07474 8.80389L2.07474 8.80384C2.05332 8.65391 2.08283 8.52747 2.16165 8.42237C2.24008 8.31781 2.35245 8.25964 2.50177 8.24898L2.50206 8.24895C2.62809 8.23845 2.73782 8.27749 2.83282 8.36722C2.92884 8.4579 2.98724 8.56676 3.0086 8.69446C3.19832 9.94434 3.7454 10.9884 4.64967 11.8257C5.55454 12.6636 6.65515 13.0824 7.94999 13.0824C9.36767 13.0824 10.5685 12.5853 11.5511 11.5916C12.5336 10.598 13.025 9.39162 13.025 7.97404C13.025 6.58949 12.5278 5.41908 11.534 4.46434C10.5404 3.50981 9.34524 3.03237 7.94999 3.03237C7.19047 3.03237 6.47816 3.20554 5.81344 3.55187C5.14951 3.89778 4.57201 4.35532 4.08106 4.92438L4.0454 4.96571H4.09999H5.34999C5.4884 4.96571 5.60129 5.0107 5.69064 5.10005C5.77999 5.1894 5.82499 5.3023 5.82499 5.44071C5.82499 5.57912 5.77999 5.69201 5.69064 5.78136C5.60129 5.87071 5.4884 5.91571 5.34999 5.91571H2.86665C2.72824 5.91571 2.61535 5.87071 2.526 5.78136C2.43665 5.69201 2.39165 5.57912 2.39165 5.44071V2.97404C2.39165 2.83563 2.43665 2.72273 2.526 2.63338C2.61535 2.54403 2.72824 2.49904 2.86665 2.49904C3.00506 2.49904 3.11796 2.54403 3.20731 2.63338C3.29666 2.72273 3.34165 2.83563 3.34165 2.97404V4.24071V4.30857L3.38568 4.25692C3.96125 3.58174 4.64463 3.05053 5.43598 2.66316C6.22698 2.27596 7.06489 2.08237 7.94999 2.08237C8.78012 2.08237 9.56012 2.23731 10.2902 2.54705C11.0208 2.85699 11.6598 3.28027 12.2075 3.8169C12.7552 4.35349 13.1867 4.98138 13.5021 5.70075C13.8173 6.41962 13.975 7.19396 13.975 8.02404C13.975 8.85412 13.8173 9.63406 13.502 10.3641C13.1866 11.0946 12.7551 11.7308 12.2074 12.2729C11.6597 12.8151 11.0206 13.2439 10.2901 13.5594C9.56001 13.8747 8.78006 14.0324 7.94999 14.0324C6.40034 14.0324 5.08705 13.5345 4.00861 12.539C2.92964 11.543 2.28507 10.2983 2.07474 8.80389Z"
      fill={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AlertIcon = ({ color = defaultIconColor, ...props }: IconProps) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M15.9998 6.66675C15.2635 6.66675 14.6665 7.2637 14.6665 8.00008V18.6667C14.6665 19.4031 15.2635 20.0001 15.9998 20.0001C16.7362 20.0001 17.3332 19.4031 17.3332 18.6667V8.00008C17.3332 7.2637 16.7362 6.66675 15.9998 6.66675ZM15.9998 25.3334C16.7362 25.3334 17.3332 24.7365 17.3332 24.0001C17.3332 23.2637 16.7362 22.6667 15.9998 22.6667C15.2635 22.6667 14.6665 23.2637 14.6665 24.0001C14.6665 24.7365 15.2635 25.3334 15.9998 25.3334Z"
      fill={color}
    />
    <path
      d="M15.9998 28.3334C22.8113 28.3334 28.3332 22.8116 28.3332 16.0001C28.3332 9.18857 22.8113 3.66675 15.9998 3.66675C9.18833 3.66675 3.6665 9.18857 3.6665 16.0001C3.6665 22.8116 9.18833 28.3334 15.9998 28.3334ZM15.9998 29.3334C23.3636 29.3334 29.3332 23.3639 29.3332 16.0001C29.3332 8.63628 23.3636 2.66675 15.9998 2.66675C8.63604 2.66675 2.6665 8.63628 2.6665 16.0001C2.6665 23.3639 8.63604 29.3334 15.9998 29.3334Z"
      stroke={color}
    />
  </svg>
);
