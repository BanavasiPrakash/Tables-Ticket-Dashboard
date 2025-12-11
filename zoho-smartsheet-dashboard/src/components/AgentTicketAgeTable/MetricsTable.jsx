// src/components/AgentTicketAgeTable/MetricsTable.jsx

import React from "react";
import {
  headerStyle3D,
  leftCellStyle,
  centerCellStyle,
  rowBaseStyle,
} from "./styles";
import {
  formatToIST,
  fromZohoHrsToHM,
  zohoHrsToMinutes,
  minutesToDaysLabel,
  getFirstResponseDateTime,
} from "./utils";

export default function MetricsTable({
  metricsColumns,
  sortedMetricsRows,
  agentAverageMap,
}) {
  return (
    <div
      style={{
        maxHeight: "150vh",
        overflowY: "auto",
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          fontSize: 12,
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr>
            {metricsColumns.map((col) => (
              <th
                key={col.key}
                style={
                  col.key === "agentName"
                    ? {
                        ...headerStyle3D,
                        textAlign: "left",
                        position: "sticky",
                        left: 0,
                        zIndex: 4,
                      }
                    : col.key === "departmentName"
                    ? { ...headerStyle3D, textAlign: "left" }
                    : headerStyle3D
                }
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedMetricsRows.length === 0 ? (
            <tr>
              <td
                colSpan={metricsColumns.length}
                style={{
                  textAlign: "center",
                  padding: 16,
                  color: "bLack",
                  fontSize: 12,
                  background: "#181b26",
                }}
              >
                No metrics data available.
              </td>
            </tr>
          ) : (
            (() => {
              const rows = [];
              let i = 0;

              while (i < sortedMetricsRows.length) {
                const agentName = sortedMetricsRows[i].agentName || "";
                let groupStart = i;
                let groupEnd = i;

                while (
                  groupEnd + 1 < sortedMetricsRows.length &&
                  (sortedMetricsRows[groupEnd + 1].agentName || "") ===
                    agentName
                ) {
                  groupEnd++;
                }

                const rowSpan = groupEnd - groupStart + 1;
                const avg = agentAverageMap[agentName];

                for (let r = groupStart; r <= groupEnd; r++) {
                  const row = sortedMetricsRows[r];
                  rows.push(
                    <tr
                      key={row.ticketNumber || `${agentName}_${r}`}
                      style={rowBaseStyle(r)}
                    >
                      {metricsColumns.map((col) => {
                        // Agent name with rowSpan, sticky left
                        if (col.key === "agentName") {
                          if (r === groupStart) {
                            const bg =
                              r % 2 === 0 ? "#b4c2e3ff" : "#eef1f5ff";
                            return (
                              <td
                                key={col.key}
                                rowSpan={rowSpan}
                                style={{
                                  ...leftCellStyle,
                                  position: "sticky",
                                  left: 0,
                                  zIndex: 3,
                                  background: bg,
                                }}
                              >
                                {agentName}
                              </td>
                            );
                          }
                          return null;
                        }

                        if (col.key === "stagingData") {
                          return (
                            <td key={col.key} style={centerCellStyle}>
                              {Array.isArray(row.stagingData) &&
                              row.stagingData.length > 0 ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                  }}
                                >
                                  {row.stagingData.map((s, i2) => (
                                    <div key={i2}>
                                      {s.status}: {s.handledTime}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        }

                        if (col.key === "agentsHandled") {
                          return (
                            <td key={col.key} style={centerCellStyle}>
                              {Array.isArray(row.agentsHandled) &&
                              row.agentsHandled.length > 0 ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                  }}
                                >
                                  {row.agentsHandled.map((a, i2) => (
                                    <div key={i2}>
                                      {a.agentName}: {a.handlingTime}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        }

                        if (col.key === "createdTime") {
                          return (
                            <td key={col.key} style={centerCellStyle}>
                              {formatToIST(row.createdTime)}
                            </td>
                          );
                        }

                        if (col.key === "firstResponseTime") {
                          const minutes = zohoHrsToMinutes(
                            row.firstResponseTime
                          );
                          const metricHM = fromZohoHrsToHM(
                            row.firstResponseTime
                          );
                          const firstRespDateTime = getFirstResponseDateTime(
                            row.createdTime,
                            row.firstResponseTime
                          );

                          if (minutes == null || minutes < 1) {
                            return (
                              <td key={col.key} style={centerCellStyle}>
                                <span>-</span>
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} style={centerCellStyle}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  lineHeight: 1.2,
                                }}
                              >
                                <span>{metricHM}</span>
                                {firstRespDateTime && (
                                  <span style={{ fontSize: 11 }}>
                                    {firstRespDateTime}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        }

                        if (col.key === "resolutionTime") {
                          const metricHM = fromZohoHrsToHM(row.resolutionTime);
                          const minutes = zohoHrsToMinutes(row.resolutionTime);
                          const daysLabel =
                            minutes != null
                              ? minutesToDaysLabel(minutes)
                              : "";

                          if (!metricHM && !daysLabel) {
                            return (
                              <td key={col.key} style={centerCellStyle}>
                                <span>-</span>
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} style={centerCellStyle}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  lineHeight: 1.2,
                                }}
                              >
                                <span>{metricHM || "-"}</span>
                                {daysLabel && (
                                  <span style={{ fontSize: 11 }}>
                                    {daysLabel}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        }

                        if (col.key === "avgFirstResponse") {
                          if (r === groupStart) {
                            const hm = avg?.avgFirstResponseHM || "-";
                            const minutes = avg?.avgFirstResponseMin;
                            const daysLabel =
                              minutes != null
                                ? minutesToDaysLabel(minutes)
                                : "";
                            return (
                              <td
                                key={col.key}
                                rowSpan={rowSpan}
                                style={centerCellStyle}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <span>{hm}</span>
                                  {daysLabel && (
                                    <span style={{ fontSize: 11 }}>
                                      {daysLabel}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          }
                          return null;
                        }

                        const value = row[col.key];
                        const isLeft =
                          col.key === "departmentName" ||
                          col.key === "status" ||
                          col.key === "ticketNumber";
                        return (
                          <td
                            key={col.key}
                            style={isLeft ? leftCellStyle : centerCellStyle}
                          >
                            {value ?? ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                i = groupEnd + 1;
              }

              return rows;
            })()
          )}
        </tbody>
      </table>
    </div>
  );
}
