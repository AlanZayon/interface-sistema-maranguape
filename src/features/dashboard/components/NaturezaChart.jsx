import React from "react";
import { Card } from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { EmptyState } from "@shared/ui";

const COLORS = {
  EFETIVO: "#0d6efd",
  TEMPORARIO: "#ffc107",
  COMISSIONADO: "#198754",
  default: "#6c757d",
};

export default function NaturezaChart({ data = [] }) {
  const chartData = (data || []).map((item) => ({
    name: item.natureza || "Não informada",
    value: item.count || 0,
  }));

  return (
    <Card className="border h-100">
      <Card.Header className="bg-white fw-semibold py-2">
        Headcount por natureza
      </Card.Header>
      <Card.Body>
        {chartData.length === 0 ? (
          <EmptyState
            icon="bi-pie-chart"
            title="Sem dados"
            description="Não há funcionários para agrupar."
          />
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[entry.name] || COLORS.default}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString("pt-BR"),
                    "Funcionários",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
