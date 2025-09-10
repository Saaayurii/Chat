"use client";

import { Search, Users } from "lucide-react";
import { UserRole } from "@/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import { Input } from "@/components/UI/Input";
import { Badge, Loading } from "@/components/UI";
import ColleagueCard from "@/components/Colleagues/ColleagueCard";
import PaginationControls from "@/components/Colleagues/PaginationControls";
import useColleagues from "@/hooks/useColleagues";

var OperatorColleaguesPageContent = () => {
  var {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    colleaguesData,
    isLoading,
    handleStartChat,
  } = useColleagues();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Коллеги</h1>
          </div>
          <p className="text-muted-foreground">
            Список всех операторов и администраторов системы
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск коллег по имени или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Список коллег</span>
              {colleaguesData?.total && (
                <Badge variant="secondary" className="ml-2">
                  {colleaguesData.total} человек
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loading className="mr-2" />
                <span>Загрузка коллег...</span>
              </div>
            ) : !colleaguesData?.data || colleaguesData.data.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Коллеги не найдены</p>
              </div>
            ) : (
              <div className="space-y-4">
                {colleaguesData.data.map((colleague: any) => (
                  <ColleagueCard
                    key={colleague._id}
                    colleague={colleague}
                    onStartChat={handleStartChat}
                  />
                ))}
              </div>
            )}

            {colleaguesData && colleaguesData.totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={colleaguesData.totalPages}
                total={colleaguesData.total}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

var OperatorColleaguesPage = () => (
  <ProtectedRoute requiredRole={UserRole.OPERATOR}>
    <OperatorColleaguesPageContent />
  </ProtectedRoute>
);

export default OperatorColleaguesPage;