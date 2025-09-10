"use client";

import { Search } from "lucide-react";
import Button from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { Input } from "@/components/UI/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/UI/Select";
import { UserRole } from "@/types";

interface UsersFiltersProps {
  searchQuery: string;
  selectedRole: UserRole | "";
  onSearchChange: (query: string) => void;
  onRoleChange: (role: UserRole | "") => void;
  onReset: () => void;
}

export var UsersFilters = ({
  searchQuery,
  selectedRole,
  onSearchChange,
  onRoleChange,
  onReset,
}: UsersFiltersProps) => (
  <Card className="p-6">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск по имени, email или телефону..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="w-full md:w-48">
        <Select
          value={selectedRole || "all"}
          onValueChange={(value) =>
            onRoleChange(value === "all" ? "" : (value as UserRole))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Все роли" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value={UserRole.ADMIN}>Администратор</SelectItem>
            <SelectItem value={UserRole.OPERATOR}>Оператор</SelectItem>
            <SelectItem value={UserRole.VISITOR}>Посетитель</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={onReset}>
        Сбросить
      </Button>
    </div>
  </Card>
);