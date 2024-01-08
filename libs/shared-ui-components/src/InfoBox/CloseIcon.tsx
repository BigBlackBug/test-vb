export interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
  color?: string;
  title?: string;
}

export const CloseIcon = ({ color = 'currentColor', ...props }: IconProps) => (
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
