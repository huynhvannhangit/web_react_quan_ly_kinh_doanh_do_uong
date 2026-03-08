import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-center pt-4">
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] text-slate-600 mr-2">
          Tổng cộng {totalItems} bản ghi
        </span>

        {totalPages > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 rounded-[2px] border-slate-300 text-slate-600 disabled:bg-slate-50 disabled:text-slate-300"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                page = Math.min(currentPage - 2 + i, totalPages - 4 + i);
              }
              return (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 p-0 rounded-[2px] text-[13px] transition-colors ${
                    currentPage === page
                      ? "border-blue-600 text-blue-600 bg-white hover:border-blue-500 hover:text-blue-500 font-medium"
                      : "border-slate-300 text-slate-600 hover:text-blue-500 hover:border-blue-500 bg-white"
                  }`}
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 rounded-[2px] border-slate-300 text-slate-600 disabled:bg-slate-50 disabled:text-slate-300"
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
