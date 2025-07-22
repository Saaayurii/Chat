'use client';

interface RatingsFilterProps {
  minRating: number | '';
  maxRating: number | '';
  isVisibleFilter: boolean | '';
  searchQuery: string;
  onMinRatingChange: (value: number | '') => void;
  onMaxRatingChange: (value: number | '') => void;
  onVisibilityFilterChange: (value: boolean | '') => void;
  onSearchQueryChange: (value: string) => void;
}

export default function RatingsFilter({
  minRating,
  maxRating,
  isVisibleFilter,
  searchQuery,
  onMinRatingChange,
  onMaxRatingChange,
  onVisibilityFilterChange,
  onSearchQueryChange
}: RatingsFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
      <input
        type="number"
        min="1"
        max="5"
        placeholder="Мин. оценка"
        value={minRating}
        onChange={(e) => onMinRatingChange(e.target.value ? Number(e.target.value) : '')}
        className="border rounded px-3 py-2"
      />

      <input
        type="number"
        min="1"
        max="5"
        placeholder="Макс. оценка"
        value={maxRating}
        onChange={(e) => onMaxRatingChange(e.target.value ? Number(e.target.value) : '')}
        className="border rounded px-3 py-2"
      />

      <select
        value={isVisibleFilter.toString()}
        onChange={(e) => onVisibilityFilterChange(e.target.value === '' ? '' : e.target.value === 'true')}
        className="border rounded px-3 py-2"
      >
        <option value="">Все оценки</option>
        <option value="true">Видимые</option>
        <option value="false">Скрытые</option>
      </select>

      <input
        type="text"
        placeholder="Поиск..."
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        className="border rounded px-3 py-2"
      />
    </div>
  );
}