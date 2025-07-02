'use client';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ rating, interactive = false, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={interactive && onChange ? () => onChange(star) : undefined}
          className={`text-xl ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          } ${interactive ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
          disabled={!interactive}
        >
          ★
        </button>
      ))}
    </div>
  );
}