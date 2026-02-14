"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlaceholderPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Trang này hiện đang được xây dựng. Vui lòng quay lại sau.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
