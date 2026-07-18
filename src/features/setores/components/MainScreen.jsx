import React from "react";
import { Navigate } from "react-router-dom";

/** @deprecated Use EstruturaPage (/estrutura) */
export default function MainScreen() {
  return <Navigate to="/dashboard" replace />;
}
