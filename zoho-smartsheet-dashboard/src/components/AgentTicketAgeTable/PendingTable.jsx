// src/components/AgentTicketAgeTable/PendingTable.jsx

import React from "react";
import {
  headerStyle3D,
  leftCellStyle,
  centerCellStyle,
  rowBaseStyle,
} from "./styles";
import { formatDateWithMonthName } from "./utils";

export default function PendingTable({
  pendingTableColumns,
  searchedGroupedPendingRows,
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
          {pendingTableColumns.map((col) => (
            <th
              key={col.key}
              style={
                col.key === "name"
                  ? {
                      ...headerStyle3D,
                      textAlign: "left",
                      position: "sticky",
                      left: 0,
                      zIndex: 4,
                    }
                  : col.key === "department"
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
        {searchedGroupedPendingRows.length === 0 ? (
          <tr>
            <td
              colSpan={pendingTableColumns.length}
              style={{
                textAlign: "center",
                padding: 16,
                color: "white",
                fontSize: 12,
                background: "#181b26",
              }}
            >
              No pending status tickets found.
            </td>
          </tr>
        ) : (
          searchedGroupedPendingRows.map((row, idx) => {
            const stripeBg =
              idx % 2 === 0 ? "#b4c2e3ff" : "#eef1f5ff";
            return (
              <tr
                key={`${row.name}_${row.ticketNumber}_${idx}`}
                style={rowBaseStyle(idx)}
              >
                {row._isFirst ? (
                  <td
                    style={{
                      ...leftCellStyle,
                      position: "sticky",
                      left: 0,
                      zIndex: 3,
                      background: stripeBg,
                    }}
                    rowSpan={row._rowSpan}
                  >
                    {row.name}
                  </td>
                ) : null}

                <td style={leftCellStyle}>{row.department}</td>

                {row._isFirst ? (
                  <td style={centerCellStyle} rowSpan={row._rowSpan}>
                    {row.totalTickets}
                  </td>
                ) : null}

                <td style={centerCellStyle}>{row.status}</td>
                <td style={centerCellStyle}>{row.ticketNumber}</td>

                <td style={centerCellStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <span>
                      {
                        formatDateWithMonthName(
                          row.ticketCreated
                        ).split(",")[0]
                      }
                    </span>
                    <span>
                      {
                        formatDateWithMonthName(
                          row.ticketCreated
                        ).split(",")[1]
                      }
                    </span>
                  </div>
                </td>

                <td style={centerCellStyle}>
                  {row.daysNotResponded !== "" &&
                  Number(row.daysNotResponded) < 1
                    ? 0
                    : row.daysNotResponded}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
