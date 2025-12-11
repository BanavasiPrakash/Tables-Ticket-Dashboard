// src/components/AgentTicketAgeTable/DepartmentAgeTable.jsx

import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import {
  serialHeaderStyle,
  headerStyle3D,
  centerCellStyle,
  leftCellStyle,
  rowBaseStyle,
} from "./styles";

export default function DepartmentAgeTable({
  departmentRowsForDisplay,
  normalizedStatusKeys,
  statusOrder,
  statusColors,
}) {
  return (
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
          <th style={serialHeaderStyle}>SI. No.</th>
          <th style={{ ...headerStyle3D, textAlign: "left" }}>
            Department Name
          </th>
          <th style={headerStyle3D}>Total Ticket Count</th>
          <th style={headerStyle3D}>1 - 7 Days Tickets</th>
          <th style={headerStyle3D}>8 - 15 Days Tickets</th>
          <th style={headerStyle3D}>15+ Days Tickets</th>
        </tr>
      </thead>
      <tbody>
        {!departmentRowsForDisplay ||
        departmentRowsForDisplay.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              style={{
                textAlign: "center",
                padding: 16,
                color: "Black",
                fontSize: 12,
                background: "#181b26",
              }}
            >
              No department ticket data available
            </td>
          </tr>
        ) : (
          departmentRowsForDisplay.map((row, idx) => (
            <tr key={row.departmentName} style={rowBaseStyle(idx)}>
              <td style={centerCellStyle}>{row.si}</td>
              <td style={leftCellStyle}>{row.departmentName}</td>
              <td style={centerCellStyle}>{row.total}</td>

              {["1_7", "8_15", "15plus"].map((bucket) => (
                <td key={bucket} style={centerCellStyle}>
                  {normalizedStatusKeys.length === 0 ? (
                    <Tippy
                      content={
                        statusOrder
                          .map(
                            (statusKey) =>
                              row[
                                `tickets_${bucket}_${statusKey}_numbers`
                              ] || []
                          )
                          .reduce((a, b) => a.concat(b), [])
                          .join(", ") || "No tickets"
                      }
                    >
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: "12px",
                          color: "Black",
                          background: "none",
                          padding: "2px 0",
                          minWidth: "40px",
                          minHeight: "10px",
                          textAlign: "center",
                          display: "inline-block",
                        }}
                      >
                        {statusOrder.reduce(
                          (sum, key) =>
                            sum + (row[`tickets_${bucket}_${key}`] ?? 0),
                          0
                        )}
                      </span>
                    </Tippy>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {normalizedStatusKeys.map((statusKey) => (
                        <Tippy
                          key={statusKey}
                          content={
                            (row[
                              `tickets_${bucket}_${statusKey}_numbers`
                            ] || []).length > 0
                              ? row[
                                  `tickets_${bucket}_${statusKey}_numbers`
                                ].join(", ")
                              : "No tickets"
                          }
                        >
                          <span
                            className={`agent-status-box ${statusKey}`}
                            style={{
                              background: "#15171a",
                              color: "White",
                              fontWeight: 900,
                              fontSize: "12px",
                              minWidth: "40px",
                              minHeight: "36px",
                              margin: "2px 6px",
                              textAlign: "center",
                              boxShadow: "0 2px 8px #0a0a0a",
                              border: "none",
                              borderTop: `6px solid ${
                                statusColors[statusKey] || "#fff"
                              }`,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title={
                              statusKey.charAt(0).toUpperCase() +
                              statusKey.slice(1) +
                              " tickets"
                            }
                          >
                            {row[`tickets_${bucket}_${statusKey}`] ?? 0}
                          </span>
                        </Tippy>
                      ))}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
