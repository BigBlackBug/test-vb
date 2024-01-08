interface StarProps {
  toggled: boolean;
  size: string;
}

const Star = ({ toggled, size }: StarProps) => {
  const fillColor = toggled ? '#ffbf00' : '#cbd3e3';

  return (
    <svg
      style={{ fill: fillColor, transition: 'fill 0.18s ease-in-out' }}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m15.89,24.16l-7.61,4.02l1.46,-8.48l-6.15,-6.02l8.48,-1.23l3.82,-7.71l3.82,7.71l8.48,1.23l-6.15,6.02l1.46,8.48l-7.61,-4.02z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Star;
