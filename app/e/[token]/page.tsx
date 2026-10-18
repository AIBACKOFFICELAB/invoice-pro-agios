"use client";

import React, { use } from "react";
import { PublicDocument } from "@/components/public-document";

export default function PublicEstimatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <PublicDocument token={token} kind="estimate" />;
}
