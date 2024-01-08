import { useState } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import Star from './Star';
import { DEFAULT_SPACING, spacing, star, starRating } from './StarRating.css';
import classNames from 'classnames';

interface StarRatingProps {
  rating: number;
  onRatingSelected: (rating: number) => void;
  starSpacing: string;
  starSize: string;
  className?: string;
}

const StarRating = ({
  rating = 0,
  onRatingSelected,
  starSpacing = DEFAULT_SPACING,
  starSize = '32px',
  className,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className={classNames(starRating, className)}>
      {[1, 2, 3, 4, 5].map((starNumber: number) => {
        const isToggled = (hoverRating || rating) >= starNumber;
        return (
          <button
            key={starNumber}
            onMouseEnter={() => setHoverRating(starNumber)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onRatingSelected(starNumber)}
            style={assignInlineVars({
              [spacing]: starSpacing,
            })}
            className={star}
          >
            <Star toggled={isToggled} size={starSize} />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
