// src/components/AgentTicketAgeTable/ArchivedTable.jsx

import React from "react";
import {
  headerStyle3D,
  leftCellStyle,
  centerCellStyle,
  rowBaseStyle,
} from "./styles";
import { formatToIST } from "./utils";

export default function ArchivedTable({
  archivedColumns,
  filteredArchivedRows,
  pagedArchivedRows,
  archivedPage,
  archivedPageSize,
  archivedTotalPages,
  setArchivedPage,
}) {
  const serialWidth = 60; // width for SI. NO.

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
          {archivedColumns.map((col) => (
            <th
              key={col.key}
              style={
                col.key === "siNo"
                  ? {
                      ...headerStyle3D,
                      position: "sticky",
                      left: 0,
                      zIndex: 5,
                    }
                  : col.key === "agentName"
                  ? {
                      ...headerStyle3D,
                      textAlign: "left",
                      position: "sticky",
                      left: serialWidth,
                      zIndex: 5,
                    }
                  : col.key === "subject"
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
        {filteredArchivedRows.length === 0 ? (
          <tr>
            <td
              colSpan={archivedColumns.length}
              style={{
                textAlign: "center",
                padding: 16,
                color: "White",
                fontSize: 12,
                background: "#181b26",
              }}
            >
              No archived tickets loaded.
            </td>
          </tr>
        ) : (
          pagedArchivedRows.map((row, index) => {
            const stripeBg =
              index % 2 === 0 ? "#b4c2e3ff" : "#eef1f5ff";
            return (
              <tr
                key={row.ticketNumber || row.siNo}
                style={rowBaseStyle(index)}
              >
                {/* Serial number across pages, sticky */}
                <td
                  style={{
                    ...centerCellStyle,
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    background: stripeBg,
                  }}
                >
                  {(archivedPage - 1) * archivedPageSize + index + 1}
                </td>

                {/* Agent name, sticky next to serial */}
                <td
                  style={{
                    ...leftCellStyle,
                    position: "sticky",
                    left: serialWidth,
                    zIndex: 3,
                    background: stripeBg,
                  }}
                >
                  {row.agentName}
                </td>

                <td style={leftCellStyle}>{row.departmentName}</td>
                <td style={centerCellStyle}>{row.ticketNumber}</td>
                <td style={leftCellStyle}>{row.subject}</td>
                <td style={centerCellStyle}>{row.status}</td>
                <td style={centerCellStyle}>
                  {formatToIST(row.createdTime)}
                </td>
                <td style={centerCellStyle}>
                  {formatToIST(row.closedTime)}
                </td>
                <td style={centerCellStyle}>{row.resolutionTimeHours}</td>
              </tr>
            );
          })
        )}
      </tbody>

      {filteredArchivedRows.length > archivedPageSize && (
        <tfoot>
          <tr>
            <td
              colSpan={archivedColumns.length}
              style={{ padding: 12, textAlign: "center" }}
            >
              <button
                onClick={() => setArchivedPage((p) => Math.max(1, p - 1))}
                disabled={archivedPage === 1}
                style={{ marginRight: 8 }}
              >
                Prev
              </button>
              <span style={{ margin: "0 8px" }}>
                Page {archivedPage} of {archivedTotalPages}
              </span>
              <button
                onClick={() =>
                  setArchivedPage((p) =>
                    Math.min(archivedTotalPages, p + 1)
                  )
                }
                disabled={archivedPage === archivedTotalPages}
                style={{ marginLeft: 8 }}
              >
                Next
              </button>
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
