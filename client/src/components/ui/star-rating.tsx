import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  readOnly?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  count,
  size = 16,
  readOnly = true,
  onChange
}: StarRatingProps) {
  const totalStars = 5;
  
  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex items-center">
      <div className="flex text-yellow-400">
        {[...Array(totalStars)].map((_, index) => {
          // For each position, determine what type of star to show
          const value = index + 1;
          const isHalfStar = value - 0.5 === rating;
          const isFullStar = value <= rating;
          
          return (
            <span 
              key={index}
              className={`cursor-${readOnly ? 'default' : 'pointer'}`}
              onClick={() => handleClick(index)}
            >
              {isFullStar ? (
                <Star fill="currentColor" size={size} />
              ) : isHalfStar ? (
                <StarHalf fill="currentColor" size={size} />
              ) : (
                <Star size={size} />
              )}
            </span>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-gray-500 text-sm ml-1">({count})</span>
      )}
    </div>
  );
}
