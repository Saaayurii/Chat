'use client';

import { MessageSquare, Ban, Globe, Mail, Phone, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/Avatar';
import Badge from '@/components/UI/Badge';
import Button from '@/components/UI/Button';
import { TableCell, TableRow } from '@/components/UI/Table';
import { PresenceIndicator, PresenceStatus } from '@/components/Presence';

interface VisitorRowProps {
  visitor: {
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
  };
  onChatOpen: (visitorId: string) => void;
  onBlockUser: (visitorId: string) => void;
}

var getStatusBadge = (visitor) => 
  visitor.isBlocked ? <Badge variant="destructive">Заблокирован</Badge> :
  visitor.isActivated ? <Badge variant="success">Авторизован</Badge> :
  <Badge variant="secondary">Не авторизован</Badge>;

var getPresenceStatus = (isOnline) => 
  isOnline ? PresenceStatus.ONLINE : PresenceStatus.OFFLINE;

export default ({ visitor, onChatOpen, onBlockUser }: VisitorRowProps) => (
  <TableRow>
    <TableCell>
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={visitor.profile?.avatarUrl}
            alt={visitor.profile?.fullName}
          />
          <AvatarFallback>
            {visitor.profile?.fullName
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-medium text-foreground">
              {visitor.profile?.fullName ||
                visitor.profile?.username ||
                'Неизвестный'}
            </p>
            <PresenceIndicator
              status={getPresenceStatus(visitor.profile?.isOnline || false)}
              size="sm"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            ID: {visitor.id}
          </p>
        </div>
      </div>
    </TableCell>

    <TableCell>
      <div className="space-y-1">
        {getStatusBadge(visitor)}
      </div>
    </TableCell>

    <TableCell>
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">Веб-сайт</span>
      </div>
    </TableCell>

    <TableCell>
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{visitor.email}</span>
        </div>
        {visitor.profile?.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{visitor.profile.phone}</span>
          </div>
        )}
      </div>
    </TableCell>

    <TableCell>
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {new Date(visitor.createdAt).toLocaleDateString()}
        </span>
      </div>
    </TableCell>

    <TableCell>
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChatOpen(visitor.id)}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Чат
        </Button>
        {!visitor.isBlocked && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onBlockUser(visitor.id)}
          >
            <Ban className="h-4 w-4 mr-1" />
            Заблокировать
          </Button>
        )}
      </div>
    </TableCell>
  </TableRow>
);