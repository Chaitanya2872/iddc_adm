import { Navigate, Route, Routes } from "react-router-dom";
import { TokenGate } from "@/components/TokenGate";
import { StructuresPage } from "@/pages/StructuresPage";
import { StructureDetailPage } from "@/pages/StructureDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<TokenGate />} />
      <Route
        path="/structures"
        element={
          <TokenGate>
            <StructuresPage />
          </TokenGate>
        }
      />
      <Route
        path="/structures/:id"
        element={
          <TokenGate>
            <StructureDetailPage />
          </TokenGate>
        }
      />
      <Route path="*" element={<Navigate replace to="/login" />} />
    </Routes>
  );
}
