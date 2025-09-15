'use client';

import { BlacklistStatus, BlacklistReason, BlacklistType } from '@/types';

interface BlacklistFilterProps {
  statusFilter: typeof BlacklistStatus[keyof typeof BlacklistStatus] | '';
  reasonFilter: typeof BlacklistReason[keyof typeof BlacklistReason] | '';
  typeFilter: typeof BlacklistType[keyof typeof BlacklistType] | '';
  searchQuery: string;
  onStatusFilterChange: (value: typeof BlacklistStatus[keyof typeof BlacklistStatus] | '') => void;
  onReasonFilterChange: (value: typeof BlacklistReason[keyof typeof BlacklistReason] | '') => void;
  onTypeFilterChange: (value: typeof BlacklistType[keyof typeof BlacklistType] | '') => void;
  onSearchQueryChange: (value: string) => void;
}

export default function BlacklistFilter({
  statusFilter,
  reasonFilter,
  typeFilter,
  searchQuery,
  onStatusFilterChange,
  onReasonFilterChange,
  onTypeFilterChange,
  onSearchQueryChange
}: BlacklistFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as typeof BlacklistStatus[keyof typeof BlacklistStatus] | '')}
        className="border rounded px-3 py-2"
      >
        <option value="">Все статусы</option>
        <option value={BlacklistStatus.PENDING}>Ожидает рассмотрения</option>
        <option value={BlacklistStatus.APPROVED}>Одобрена</option>
        <option value={BlacklistStatus.REJECTED}>Отклонена</option>
        <option value={BlacklistStatus.REVOKED}>Отменена</option>
      </select>

      <select
        value={reasonFilter}
        onChange={(e) => onReasonFilterChange(e.target.value as typeof BlacklistReason[keyof typeof BlacklistReason] | '')}
        className="border rounded px-3 py-2"
      >
        <option value="">Все причины</option>
        <option value={BlacklistReason.SPAM}>Спам</option>
        <option value={BlacklistReason.ABUSE}>Оскорбления</option>
        <option value={BlacklistReason.INAPPROPRIATE_CONTENT}>Неподходящий контент</option>
        <option value={BlacklistReason.VIOLATION_OF_TERMS}>Нарушение правил</option>
        <option value={BlacklistReason.FRAUD}>Мошенничество</option>
        <option value={BlacklistReason.OTHER}>Другое</option>
      </select>

      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value as typeof BlacklistType[keyof typeof BlacklistType] | '')}
        className="border rounded px-3 py-2"
      >
        <option value="">Все типы</option>
        <option value={BlacklistType.TEMPORARY}>Временная</option>
        <option value={BlacklistType.PERMANENT}>Постоянная</option>
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