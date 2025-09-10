"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { usersAPI } from "@/core/api";
import { UserRole } from "@/types";

var useColleagues = () => {
  var { user } = useAuthStore();
  var { 0: searchQuery, 1: setSearchQuery } = useState("");
  var { 0: currentPage, 1: setCurrentPage } = useState(1);
  var { 0: debouncedSearchQuery, 1: setDebouncedSearchQuery } = useState("");

  React.useEffect(() => {
    var timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  var { data: colleaguesData, isLoading } = useQuery({
    queryKey: ["colleagues", currentPage, debouncedSearchQuery],
    queryFn: () => {
      return usersAPI.getUsers({
        page: currentPage,
        limit: 10,
        role: undefined,
        search: debouncedSearchQuery || undefined,
      }).then((response) => {
        var colleagues = response.data.data.filter(
          (colleague: any) =>
            colleague.role !== UserRole.VISITOR && colleague._id !== user?.id
        );

        return {
          ...response.data,
          data: colleagues,
        };
      });
    },
  });

  var handleStartChat = (colleagueId: string) => {
    console.log("Start chat with colleague:", colleagueId);
  };

  return {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    colleaguesData,
    isLoading,
    handleStartChat,
  };
};

export default useColleagues;