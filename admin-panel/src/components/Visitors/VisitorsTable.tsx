'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/Table';
import Pagination from '@/components/UI/Pagination';
import VisitorRow from './VisitorRow';

interface VisitorsTableProps {
  visitors: Array<{
    id: string;
    email: string;
    isActivated: boolean;
    isBlocked: boolean;
    createdAt: string;
    profile?: {
      fullName?: string;
      username?: string;
      avatarUrl?: string;
      isOnline?: boolean;
      phone?: string;
    };
  }>;
  visitorsData?: {
    total: number;
  };
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onChatOpen: (visitorId: string) => void;
  onBlockUser: (visitorId: string) => void;
  loading: boolean;
}

export default ({
  visitors,
  visitorsData,
  pageSize,
  currentPage,
  onPageChange,
  onChatOpen,
  onBlockUser,
  loading
}: VisitorsTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Список посетителей</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Посетитель</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Регистрация</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map(visitor => (
                <VisitorRow
                  key={visitor.id}
                  visitor={visitor}
                  onChatOpen={onChatOpen}
                  onBlockUser={onBlockUser}
                />
              ))}
            </TableBody>
          </Table>

          {visitorsData && visitorsData.total > pageSize && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(visitorsData.total / pageSize)}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);