import React from "react";
import { Card } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { EmptyState } from "@shared/ui";

function shorten(label, max = 22) {
  const text = String(label || "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function SecretariasChart({ data = [] }) {
  const chartData = (data || []).map((item) => ({
    name: item.secretaria || "Não informada",
    count: item.count || 0,
  }));

  const yWidth = Math.min(
    180,
    Math.max(
      100,
      ...chartData.map((d) => Math.min(String(d.name).length * 7, 180))
    )
  );

  return (
    <Card className="border h-100">
      <Card.Header className="bg-white fw-semibold py-2">
        Top secretarias
      </Card.Header>
      <Card.Body>
        {chartData.length === 0 ? (
          <EmptyState
            icon="bi-bar-chart"
            title="Sem dados"
            description="Não há secretarias para exibir."
          />
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={yWidth}
                  tickFormatter={(v) => shorten(v, Math.floor(yWidth / 7))}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString("pt-BR"),
                    "Funcionários",
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Bar dataKey="count" fill="var(--brand-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
