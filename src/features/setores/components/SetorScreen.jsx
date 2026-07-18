import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { isObjectId, resolveCurrentSetorId } from "../utils/setorNavigation";

/** @deprecated Use EstruturaPage (/estrutura/:nodeId) */
export default function SetorScreen() {
  const { setorId, "*": subPath } = useParams();
  const currentId = resolveCurrentSetorId(setorId, subPath);
  if (currentId && isObjectId(currentId)) {
    return <Navigate to={`/estrutura/${currentId}`} replace />;
  }
  return <Navigate to="/estrutura" replace />;
}
