// src/components/AgentTicketAgeTable/AgentTicketAgeTable.jsx

import React, { useEffect, useMemo, useState } from "react";

import MetricsTable from "./MetricsTable";
import PendingTable from "./PendingTable";
import ArchivedTable from "./ArchivedTable";
import DepartmentAgeTable from "./DepartmentAgeTable";
import AgentAgeTable from "./AgentAgeTable";

import {
  formatDateWithMonthName,
  formatToIST,
  fromZohoHrsToHM,
  zohoHrsToMinutes,
  minutesToHM,
  minutesToDaysLabel,
  getFirstResponseDateTime,
  normalizeStatus,
} from "./utils";

import {
  baseFont,
  centerCellStyle,
  leftCellStyle,
  centerCellStyleHovered,
  serialHeaderStyle,
  headerStyle3D,
  rowBaseStyle,
} from "./styles";

const statusColors = {
  open: "#bd2331",
  hold: "#ffc107",
  inProgress: "#8fc63d",
  escalated: "#ef6724",
  unassigned: "#1e4489",
};

export default function AgentTicketAgeTable({
  membersData,
  metricsRows = [],
  onClose,
  selectedAges = ["fifteenDays", "sixteenToThirty", "month"],
  selectedStatuses = [],
  showTimeDropdown,
  selectedDepartmentId,
  selectedAgentNames = [],
  departmentsMap = {},
  departmentViewEnabled,
  setDepartmentViewEnabled,
  archivedRows = [],
}) {
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const showMetricsTable = selectedAges.includes("metrics");
  const showPendingTable = selectedAges.includes("pending");
  const showArchivedTable = selectedAges.includes("archived");

  const archivedColumns = [
    { key: "siNo", label: "SI. NO." },
    { key: "agentName", label: "Agent Name" },
    { key: "departmentName", label: "Department" },
    { key: "ticketNumber", label: "Ticket Number" },
    { key: "subject", label: "Subject" },
    { key: "status", label: "Status" },
    { key: "createdTime", label: "Created" },
    { key: "closedTime", label: "Closed" },
    { key: "resolutionTimeHours", label: "Resolution Time (Hours)" },
  ];

  const ageColumns = [
    {
      key: "fifteenDays",
      label: "1 - 15 Days Tickets",
      ageProp: "BetweenOneAndFifteenDays",
    },
    {
      key: "sixteenToThirty",
      label: "16 - 30 Days Tickets",
      ageProp: "BetweenSixteenAndThirtyDays",
    },
    { key: "month", label: "30+ Days Tickets", ageProp: "OlderThanThirtyDays" },
  ];

  const metricsColumns = [
    { key: "agentName", label: "Agent Name" },
    { key: "ticketNumber", label: "Ticket Number" },
    { key: "status", label: "Ticket Status" },
    { key: "departmentName", label: "Department" },
    { key: "createdTime", label: "Ticket Created (IST)" },
    { key: "firstResponseTime", label: "First Response Time" },
    { key: "resolutionTime", label: "Resolution Time" },
    { key: "threadCount", label: "Threads" },
    { key: "responseCount", label: "User Response" },
    { key: "outgoingCount", label: "Agent Response" },
    { key: "reopenCount", label: "Reopens" },
    { key: "reassignCount", label: "Reassigns" },
    { key: "stagingData", label: "Staging (Status / Time)" },
    { key: "agentsHandled", label: "Agents (Name / Time)" },
    { key: "avgFirstResponse", label: "Avg First Response Time & Days" },
  ];

  const visibleAgeColumns = ageColumns.filter((col) =>
    selectedAges.includes(col.key)
  );

  const columnsToShow = [
    { key: "serial", label: "SI. NO." },
    { key: "name", label: "Agent Name" },
    ...(selectedDepartmentId
      ? [{ key: "department", label: "Department" }]
      : []),
    { key: "total", label: "Total Ticket Count" },
    ...visibleAgeColumns,
  ];

  const statusOrder = ["open", "hold", "inProgress", "escalated"];

  const statusMapSort = {
    open: 0,
    hold: 1,
    inprogress: 2,
    inProgress: 2,
    escalated: 3,
  };

  const normalizedStatusKeys =
    selectedStatuses && selectedStatuses.length > 0
      ? selectedStatuses.map((st) => normalizeStatus(st.value || st))
      : [];

  const pendingTableColumns = [
    { key: "name", label: "Agent Name" },
    { key: "department", label: "Department Name" },
    { key: "totalTickets", label: "Total Pending Tickets" },
    { key: "status", label: "Ticket Status" },
    { key: "ticketNumber", label: "Ticket Number" },
    { key: "ticketCreated", label: "Ticket Created Date & Time" },
    { key: "daysNotResponded", label: "Ticket Age Days " },
  ];

  const normalizedStatusKeysSet =
    normalizedStatusKeys.length > 0 ? new Set(normalizedStatusKeys) : null;

  // ------------------- METRICS TABLE DATA & FILTERS -------------------

  const filteredMetricsRows = useMemo(() => {
    if (!metricsRows || !Array.isArray(metricsRows)) return [];

    return metricsRows.filter((row) => {
      const agentOk =
        !selectedAgentNames?.length ||
        selectedAgentNames.includes(row.agentName);

      const departmentOk =
        !selectedDepartmentId ||
        row.departmentId === selectedDepartmentId ||
        row.departmentName === departmentsMap[selectedDepartmentId]?.name;

      const rowStatusNorm = normalizeStatus(row.status);
      const statusOk =
        !normalizedStatusKeys?.length ||
        normalizedStatusKeys.includes(rowStatusNorm);

      return agentOk && departmentOk && statusOk;
    });
  }, [
    metricsRows,
    selectedAgentNames,
    selectedDepartmentId,
    departmentsMap,
    normalizedStatusKeys,
  ]);

  const sortedMetricsRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let rows = [...filteredMetricsRows];

    if (q) {
      rows = rows.filter((r) => {
        const combined = `${r.agentName || ""} ${r.ticketNumber || ""} ${
          r.status || ""
        } ${r.departmentName || ""} ${r.createdTime || ""}`.toLowerCase();
        return combined.includes(q);
      });
    }

    return rows.sort((a, b) =>
      (a.agentName || "").localeCompare(b.agentName || "", undefined, {
        sensitivity: "base",
      })
    );
  }, [filteredMetricsRows, searchTerm]);

  const agentAverageMap = useMemo(() => {
    const acc = {};

    sortedMetricsRows.forEach((row) => {
      const name = row.agentName || "Unknown";
      if (!acc[name]) {
        acc[name] = { frSum: 0, frCount: 0, resSum: 0, resCount: 0 };
      }

      const frMin = zohoHrsToMinutes(row.firstResponseTime);
      if (frMin !== null) {
        acc[name].frSum += frMin;
        acc[name].frCount += 1;
      }

      const resMin = zohoHrsToMinutes(row.resolutionTime);
      if (resMin !== null) {
        acc[name].resSum += resMin;
        acc[name].resCount += 1;
      }
    });

    const out = {};
    Object.entries(acc).forEach(([name, v]) => {
      const frAvgMin = v.frCount ? Math.round(v.frSum / v.frCount) : null;
      const resAvgMin = v.resCount ? Math.round(v.resSum / v.resCount) : null;
      out[name] = {
        avgFirstResponseHM: frAvgMin != null ? minutesToHM(frAvgMin) : "-",
        avgFirstResponseMin: frAvgMin,
        avgResolutionHM: resAvgMin != null ? minutesToHM(resAvgMin) : "-",
        avgResolutionMin: resAvgMin,
      };
    });
    return out;
  }, [sortedMetricsRows]);

  // ---- METRICS PAGINATION (UI OUTSIDE TABLE) ----

   const [metricsPage, setMetricsPage] = useState(1);
  const metricsPageSize = 200;

  useEffect(() => {
    setMetricsPage(1);
  }, [searchTerm, selectedAgentNames, selectedDepartmentId, selectedStatuses]);

  const metricsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedMetricsRows.length / metricsPageSize)),
    [sortedMetricsRows.length]
  );

  const pagedMetricsRows = useMemo(() => {
    const start = (metricsPage - 1) * metricsPageSize;
    return sortedMetricsRows.slice(start, start + metricsPageSize);
  }, [sortedMetricsRows, metricsPage, metricsPageSize]);

  // ------------------- PENDING TABLE DATA -------------------

  const pendingTableRows = useMemo(() => {
    if (!membersData || !Array.isArray(membersData)) return [];

    let filteredAgents = membersData;

    if (selectedDepartmentId) {
      filteredAgents = filteredAgents.filter(
        (agent) =>
          Array.isArray(agent.departmentIds) &&
          agent.departmentIds.includes(selectedDepartmentId)
      );
    }

    if (selectedAgentNames && selectedAgentNames.length > 0) {
      filteredAgents = filteredAgents.filter((agent) =>
        selectedAgentNames.includes(agent.name)
      );
    }

    let rows = [];

    filteredAgents.forEach((agent) => {
      (agent.pendingTickets || [])
        .filter(
          (tkt) =>
            !selectedDepartmentId ||
            tkt.departmentId === selectedDepartmentId ||
            tkt.departmentName === departmentsMap[selectedDepartmentId]?.name
        )
        .forEach((tkt) => {
          const tktNorm = normalizeStatus(tkt.status);

          if (normalizedStatusKeysSet && !normalizedStatusKeysSet.has(tktNorm))
            return;

          let sortKey = tktNorm === "inprogress" ? "inProgress" : tktNorm;

          let dr =
            tkt.daysNotResponded !== undefined &&
            tkt.daysNotResponded !== "" &&
            !isNaN(Number(tkt.daysNotResponded))
              ? Number(tkt.daysNotResponded) < 1
                ? 0
                : Number(tkt.daysNotResponded)
              : "";

          rows.push({
            name: agent.name || "",
            department: tkt.departmentName || "",
            status: tkt.status || "",
            statusSort: statusMapSort[sortKey] ?? 99,
            ticketNumber: tkt.ticketNumber || "",
            ticketCreated: tkt.ticketCreated || "",
            daysNotResponded: dr,
          });
        });
    });

    return rows.sort((a, b) => {
      const nameCmp = a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      });
      if (nameCmp !== 0) return nameCmp;
      return (a.statusSort ?? 99) - (b.statusSort ?? 99);
    });
  }, [
    membersData,
    selectedDepartmentId,
    selectedAgentNames,
    normalizedStatusKeysSet,
    departmentsMap,
  ]);

  const groupedPendingRows = useMemo(() => {
    const grouped = {};
    pendingTableRows.forEach((row) => {
      if (!grouped[row.name]) grouped[row.name] = [];
      grouped[row.name].push(row);
    });

    const finalRows = [];
    Object.keys(grouped).forEach((agent) => {
      const totalTickets = grouped[agent].length;
      grouped[agent].forEach((row, i) => {
        finalRows.push({
          ...row,
          totalTickets,
          _isFirst: i === 0,
          _rowSpan: grouped[agent].length,
        });
      });
    });
    return finalRows;
  }, [pendingTableRows]);

  const searchedGroupedPendingRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return groupedPendingRows;

    const filtered = pendingTableRows.filter((row) => {
      const combined = `${row.name} ${row.department} ${row.status} ${
        row.ticketNumber
      } ${row.ticketCreated} ${row.daysNotResponded}`.toLowerCase();
      return combined.includes(q);
    });

    const grouped = {};
    filtered.forEach((row) => {
      if (!grouped[row.name]) grouped[row.name] = [];
      grouped[row.name].push(row);
    });

    const finalRows = [];
    Object.keys(grouped).forEach((agent) => {
      const totalTickets = grouped[agent].length;
      grouped[agent].forEach((row, i) => {
        finalRows.push({
          ...row,
          totalTickets,
          _isFirst: i === 0,
          _rowSpan: grouped[agent].length,
        });
      });
    });
    return finalRows;
  }, [pendingTableRows, groupedPendingRows, searchTerm]);

  // ------------------- DEPARTMENT VIEW DATA -------------------

  const departmentRows = useMemo(() => {
    if (!departmentViewEnabled) return null;

    const byDept = {};
    Object.entries(departmentsMap).forEach(([deptId, info]) => {
      byDept[deptId] = {
        departmentName: info.name || deptId,
        ticketSet: new Set(),
        tickets_1_7_open: 0,
        tickets_1_7_hold: 0,
        tickets_1_7_inProgress: 0,
        tickets_1_7_escalated: 0,
        tickets_8_15_open: 0,
        tickets_8_15_hold: 0,
        tickets_8_15_inProgress: 0,
        tickets_8_15_escalated: 0,
        tickets_15plus_open: 0,
        tickets_15plus_hold: 0,
        tickets_15plus_inProgress: 0,
        tickets_15plus_escalated: 0,
        tickets_1_7_open_numbers: [],
        tickets_1_7_hold_numbers: [],
        tickets_1_7_inProgress_numbers: [],
        tickets_1_7_escalated_numbers: [],
        tickets_8_15_open_numbers: [],
        tickets_8_15_hold_numbers: [],
        tickets_8_15_inProgress_numbers: [],
        tickets_8_15_escalated_numbers: [],
        tickets_15plus_open_numbers: [],
        tickets_15plus_hold_numbers: [],
        tickets_15plus_inProgress_numbers: [],
        tickets_15plus_escalated_numbers: [],
      };
    });

    (membersData || []).forEach((agent) => {
      Object.entries(agent.departmentAgingCounts || {}).forEach(
        ([deptId, agingCounts]) => {
          if (!byDept[deptId]) return;

          statusOrder.forEach((key) => {
            (agingCounts[`${key}BetweenOneAndSevenDaysTickets`] || []).forEach(
              (ticketNum) => {
                byDept[deptId][`tickets_1_7_${key}`] += 1;
                byDept[deptId][`tickets_1_7_${key}_numbers`].push(ticketNum);
              }
            );

            (
              agingCounts[`${key}BetweenEightAndFifteenDaysTickets`] || []
            ).forEach((ticketNum) => {
              byDept[deptId][`tickets_8_15_${key}`] += 1;
              byDept[deptId][`tickets_8_15_${key}_numbers`].push(ticketNum);
            });

            (agingCounts[`${key}OlderThanFifteenDaysTickets`] || []).forEach(
              (ticketNum) => {
                byDept[deptId][`tickets_15plus_${key}`] += 1;
                byDept[deptId][`tickets_15plus_${key}_numbers`].push(ticketNum);
              }
            );
          });
        }
      );
    });

    const sortedRows = Object.entries(byDept)
      .map(([deptId, data]) => ({
        ...data,
        total:
          data.tickets_1_7_open +
          data.tickets_1_7_hold +
          data.tickets_1_7_inProgress +
          data.tickets_1_7_escalated +
          data.tickets_8_15_open +
          data.tickets_8_15_hold +
          data.tickets_8_15_inProgress +
          data.tickets_8_15_escalated +
          data.tickets_15plus_open +
          data.tickets_15plus_hold +
          data.tickets_15plus_inProgress +
          data.tickets_15plus_escalated,
      }))
      .sort((a, b) =>
        a.departmentName.localeCompare(b.departmentName, undefined, {
          sensitivity: "base",
        })
      )
      .map((row, idx) => ({
        si: idx + 1,
        ...row,
      }));

    return sortedRows;
  }, [membersData, departmentsMap, departmentViewEnabled, statusOrder]);

  const departmentRowsForDisplay = useMemo(() => {
    if (!departmentRows) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return departmentRows;

    return departmentRows.filter((row) => {
      const combined = `${row.departmentName} ${row.total}`.toLowerCase();
      return combined.includes(q);
    });
  }, [departmentRows, searchTerm]);

  // ------------------- AGENT-WISE AGE DATA -------------------

  function aggregateTickets(agentRow, ageProp, status) {
    const agent = agentRow;
    if (!selectedDepartmentId && agent.departmentAgingCounts) {
      return Object.values(agent.departmentAgingCounts).flatMap(
        (age) => age?.[status + ageProp + "Tickets"] || []
      );
    }
    return selectedDepartmentId &&
      agent.departmentAgingCounts?.[selectedDepartmentId]
      ? agent.departmentAgingCounts[selectedDepartmentId][
          status + ageProp + "Tickets"
        ] || []
      : [];
  }

  function countFromArray(agentRow, ageProp, status) {
    return aggregateTickets(agentRow, ageProp, status).length;
  }

  const tableRows = (membersData || [])
    .filter((agent) => {
      if (selectedDepartmentId) {
        const agentHasTickets =
          (agent.departmentTicketCounts?.[selectedDepartmentId] || 0) > 0 ||
          Object.values(
            agent.departmentAgingCounts?.[selectedDepartmentId] || {}
          ).some((v) => v > 0);

        const nameMatch =
          !selectedAgentNames.length ||
          selectedAgentNames.includes(agent.name.trim());
        return agentHasTickets && nameMatch;
      } else {
        const t = agent.tickets || {};
        return (
          (t.open || 0) +
            (t.hold || 0) +
            (t.escalated || 0) +
            (t.unassigned || 0) +
            (t.inProgress || 0) >
          0
        );
      }
    })
    .map((agent) => {
      let agingCounts = {};
      if (selectedDepartmentId) {
        agingCounts = agent.departmentAgingCounts?.[selectedDepartmentId] || {};
      } else if (agent.tickets) {
        agingCounts = agent.tickets;
      }
      return {
        name: agent.name,
        agingCounts,
        departmentAgingCounts: agent.departmentAgingCounts,
        departmentName: selectedDepartmentId
          ? departmentsMap?.[selectedDepartmentId]?.name || selectedDepartmentId
          : "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const tableRowsForDisplay = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tableRows;

    return tableRows.filter((row) => {
      const nameMatch = (row.name || "").toLowerCase().includes(q);
      const deptMatch = (row.departmentName || "").toLowerCase().includes(q);

      const ticketMatch = visibleAgeColumns.some((col) =>
        statusOrder.some((status) =>
          aggregateTickets(row, col.ageProp, status).some((num) =>
            String(num).toLowerCase().includes(q)
          )
        )
      );

      return nameMatch || deptMatch || ticketMatch;
    });
  }, [tableRows, visibleAgeColumns, searchTerm, statusOrder]);

  // ------------------- ARCHIVED TABLE FILTER + PAGINATION -------------------

  const filteredArchivedRows = useMemo(() => {
    const raw = searchTerm.trim();
    let rows = [...archivedRows];

    if (!raw) {
      return rows.sort((a, b) =>
        String(a.agentName || "")
          .toLowerCase()
          .localeCompare(String(b.agentName || "").toLowerCase())
      );
    }

    const q = raw.toLowerCase();
    const isNumeric = /^\d+$/.test(q);

    rows = rows.filter((row) => {
      const agent = String(row.agentName || "").toLowerCase();
      const ticketNo = String(row.ticketNumber || "").trim().toLowerCase();

      if (isNumeric) {
        return ticketNo === q;
      }

      const words = agent.split(/\s+/).filter(Boolean);
      return words.some((w) => w.startsWith(q));
    });

    return rows.sort((a, b) =>
      String(a.agentName           || "")
        .toLowerCase()
        .localeCompare(String(b.agentName || "").toLowerCase())
    );
  }, [archivedRows, searchTerm]);

  const [archivedPage, setArchivedPage] = useState(1);
  const archivedPageSize = 500;

  useEffect(() => {
    setArchivedPage(1);
  }, [searchTerm]);

  const archivedTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredArchivedRows.length / archivedPageSize)),
    [filteredArchivedRows.length]
  );

  const pagedArchivedRows = useMemo(() => {
    const start = (archivedPage - 1) * archivedPageSize;
    return filteredArchivedRows.slice(start, start + archivedPageSize);
  }, [filteredArchivedRows, archivedPage, archivedPageSize]);

  // ------------------- GLOBAL DOUBLE-CLICK CLOSE -------------------

  useEffect(() => {
    const handleDoubleClick = () => {
      if (onClose) onClose();
    };
    window.addEventListener("dblclick", handleDoubleClick);
    return () => window.removeEventListener("dblclick", handleDoubleClick);
  }, [onClose]);

  // ------------------- TITLE + SEARCH LABEL -------------------

  const currentTableTitle = useMemo(() => {
    if (showMetricsTable) return "Ticket Metrics Data";
    if (showPendingTable) return "Pending Status Tickets";
    if (showArchivedTable) return "Archived Tickets";
    if (departmentViewEnabled) return "Department-wise Ticket Age";
    if (selectedDepartmentId && departmentsMap[selectedDepartmentId]?.name) {
      return `${departmentsMap[selectedDepartmentId].name} - Agent-wise Ticket Age`;
    }
    return "Agent-wise Ticket Age";
  }, [
    showMetricsTable,
    showPendingTable,
    showArchivedTable,
    departmentViewEnabled,
    selectedDepartmentId,
    departmentsMap,
  ]);

  const currentSearchPlaceholder = useMemo(() => {
    if (showMetricsTable)
      return "Search agent / ticket / status / department...";
    if (showPendingTable) return "Search agent / ticket / status...";
    if (showArchivedTable) return "Search agent / ticket...";
    if (departmentViewEnabled) return "Search by department...";
    return "Search agent / ticket...";
  }, [showMetricsTable, showPendingTable, showArchivedTable, departmentViewEnabled]);

  // ------------------- RENDER -------------------

  return (
    <div style={{ fontFamily: baseFont }}>
      {/* Title + Search row */}
      <div
        style={{
          maxWidth: "100%",
          margin: "10px auto 4px auto",
          padding: "0 5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div
          style={{
            padding: "7px 7px",
            borderRadius: 4,
            background: "linear-gradient(135deg,#1E4489 70%,#1E4489 100%)",
            color: "white",
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: 1,
            textTransform: "uppercase",
            boxShadow: "0 0 16px rgba(0,0,0,0.45)",
            whiteSpace: "nowrap",
          }}
        >
          {currentTableTitle}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={currentSearchPlaceholder}
          style={{
            minWidth: 240,
            maxWidth: 360,
            padding: "5px 5px",
            borderRadius: 4,
            border: "2px solid #34495e",
            outline: "none",
            fontSize: 12,
            fontWeight: 900,
            fontFamily: baseFont,
            background: "white",
            color: "Black",
            boxShadow: "0 0 10px rgba(0,0,0,0.4)",
            textAlign: "left",
          }}
        />
      </div>

            {/* Main scroll container: only the tables scroll */}
      <div
        style={{
          margin: "8px auto 8px auto",
          border: "2px solid #32406b",
          background: "white",
          width: "100%",
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "70vh",
        }}
      >
        {/* 1. METRICS TABLE VIEW */}
        {showMetricsTable ? (
          <MetricsTable
            metricsColumns={metricsColumns}
            sortedMetricsRows={pagedMetricsRows}
            agentAverageMap={agentAverageMap}
          />
        ) : // 2. PENDING STATUS TABLE VIEW
        showPendingTable ? (
          <PendingTable
            pendingTableColumns={pendingTableColumns}
            searchedGroupedPendingRows={searchedGroupedPendingRows}
          />
        ) : // 3. ARCHIVED TICKETS TABLE VIEW
        showArchivedTable ? (
          <ArchivedTable
            archivedColumns={archivedColumns}
            filteredArchivedRows={filteredArchivedRows}
            pagedArchivedRows={pagedArchivedRows}
            archivedPage={archivedPage}
            archivedPageSize={archivedPageSize}
            archivedTotalPages={archivedTotalPages}
            setArchivedPage={setArchivedPage}
          />
        ) : // 4. DEPARTMENT-WISE AGE TABLE VIEW
        departmentViewEnabled ? (
          <DepartmentAgeTable
            departmentRowsForDisplay={departmentRowsForDisplay}
            normalizedStatusKeys={normalizedStatusKeys}
            statusOrder={statusOrder}
            statusColors={statusColors}
          />
        ) : (
          // 5. AGENT-WISE TICKET AGE TABLE VIEW
          <AgentAgeTable
            columnsToShow={columnsToShow}
            tableRowsForDisplay={tableRowsForDisplay}
            visibleAgeColumns={visibleAgeColumns}
            normalizedStatusKeys={normalizedStatusKeys}
            statusOrder={statusOrder}
            aggregateTickets={aggregateTickets}
            countFromArray={countFromArray}
            hoveredRowIndex={hoveredRowIndex}
            setHoveredRowIndex={setHoveredRowIndex}
            selectedDepartmentId={selectedDepartmentId}
            departmentsMap={departmentsMap}
          />
        )}
      </div>

      {/* Metrics pagination OUTSIDE table height & scroll area */}
      {showMetricsTable && sortedMetricsRows.length > metricsPageSize && (
        <div
          style={{
            padding: "8px 12px 16px 12px",
            textAlign: "center",
            color: "white",
            fontSize: 12,
          }}
        >
          <button
            onClick={() => setMetricsPage((p) => Math.max(1, p - 1))}
            disabled={metricsPage === 1}
            style={{ marginRight: 8 }}
          >
            Prev
          </button>
          <span style={{ margin: "0 8px" }}>
            Page {metricsPage} of {metricsTotalPages}
          </span>
          <button
            onClick={() =>
              setMetricsPage((p) => Math.min(metricsTotalPages, p + 1))
            }
            disabled={metricsPage === metricsTotalPages}
            style={{ marginLeft: 8 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
