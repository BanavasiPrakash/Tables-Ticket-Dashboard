// // React imports
// import React, { useEffect, useMemo, useState } from "react";

// // Tooltip library for hover popups
// import Tippy from "@tippyjs/react";
// import "tippy.js/dist/tippy.css";

// // Mapping of status → color (used for status boxes)
// const statusColors = {
//   open: "#bd2331",
//   hold: "#ffc107",
//   inProgress: "#8fc63d",
//   escalated: "#ef6724",
//   unassigned: "#1e4489",
// };

// /**
//  * Convert a date string to "DD Month YYYY, HH:MM" format.
//  * Supports:
//  *   - "dd/mm/yyyy, hh:mm"
//  *   - "dd-mm-yyyy, hh:mm"
//  * Fallback: uses Date() parsing and then formats.
//  */
// function formatDateWithMonthName(dateString) {
//   if (!dateString) return "";
//   let match = dateString.match(
//     /^(\d{2})[\/\-](\d{2})[\/\-](\d{4}),?\s*(\d{2}):(\d{2})/
//   );
//   if (match) {
//     const [_, dd, mm, yyyy, HH, MM] = match;
//     const months = [
//       "January",
//       "February",
//       "March",
//       "April",
//       "May",
//       "June",
//       "July",
//       "August",
//       "September",
//       "October",
//       "November",
//       "December",
//     ];
//     const mIndex = parseInt(mm, 10) - 1;
//     return `${dd} ${months[mIndex]} ${yyyy}, ${HH}:${MM}`;
//   }

//   // Fallback to native Date parsing
//   const dt = new Date(dateString);
//   if (!isNaN(dt)) {
//     const day = dt.getDate().toString().padStart(2, "0");
//     const month = dt.toLocaleString("default", { month: "long" });
//     const year = dt.getFullYear();
//     const hour = dt.getHours().toString().padStart(2, "0");
//     const minute = dt.getMinutes().toString().padStart(2, "0");
//     return `${day} ${month} ${year}, ${hour}:${minute}`;
//   }
//   return dateString;
// }

// /**
//  * Given a start date string, calculate:
//  *   - hm: "H:MM" duration from start time to now
//  *   - days: "X Days"
//  */
// function getDurationHMAndDays(fromDateString) {
//   if (!fromDateString) return { hm: "", days: "" };

//   const start = new Date(fromDateString);
//   if (isNaN(start)) return { hm: "", days: "" };

//   const now = new Date();
//   const diffMs = now.getTime() - start.getTime();

//   // If date is in future, we just show 0
//   if (diffMs < 0) return { hm: "0:00", days: "0 Days" };

//   const totalSeconds = Math.floor(diffMs / 1000);
//   const days = Math.floor(totalSeconds / (24 * 3600));
//   const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const hh = hours.toString();
//   const mm = minutes.toString().padStart(2, "0");

//   return { hm: `${hh}:${mm}`, days: `${days} Days` };
// }

// /**
//  * Convert Zoho-style "H:MM hrs" to "H:MM".
//  * Example: "0:30 hrs" → "0:30"
//  */
// function fromZohoHrsToHM(hrsString) {
//   if (!hrsString) return "";
//   const m = String(hrsString).trim().match(/^(\d+):(\d{2})\s*hrs$/i);
//   if (!m) return hrsString;
//   const hours = parseInt(m[1], 10);
//   const minutes = parseInt(m[2], 10);
//   const hh = hours.toString();
//   const mm = minutes.toString().padStart(2, "0");
//   return `${hh}:${mm}`;
// }

// /**
//  * Convert Zoho-style "H:MM hrs" to total minutes.
//  * Returns null if invalid.
//  */
// function zohoHrsToMinutes(hrsString) {
//   if (!hrsString) return null;
//   const m = String(hrsString).trim().match(/^(\d+):(\d{2})\s*hrs$/i);
//   if (!m) return null;
//   const h = parseInt(m[1], 10);
//   const mm = parseInt(m[2], 10);
//   return h * 60 + mm;
// }

// /**
//  * Convert total minutes to "H:MM" format.
//  */
// function minutesToHM(totalMinutes) {
//   if (totalMinutes == null || isNaN(totalMinutes)) return "";
//   const h = Math.floor(totalMinutes / 60);
//   const m = totalMinutes % 60;
//   return `${h}:${m.toString().padStart(2, "0")}`;
// }

// /**
//  * Convert total minutes to a "X Days" label.
//  * Used for average time → day count display.
//  */
// function minutesToDaysLabel(totalMinutes) {
//   if (totalMinutes == null || isNaN(totalMinutes)) return "";
//   const days = Math.floor(totalMinutes / (60 * 24));
//   return `${days} Days`;
// }

// /**
//  * Convert any date string to IST formatted string.
//  * Format: dd/mm/yyyy, hh:mm (IST)
//  */
// function formatToIST(dateString) {
//   if (!dateString) return "";
//   const d = new Date(dateString);
//   if (isNaN(d)) return dateString;
//   return d.toLocaleString("en-IN", {
//     timeZone: "Asia/Kolkata",
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// /**
//  * First Response exact datetime:
//  * createdTime + firstResponseTime (in minutes)
//  * - if < 1 minute → return "" (no datetime)
//  */
// function getFirstResponseDateTime(createdTime, firstResponseHrsString) {
//   if (!createdTime || !firstResponseHrsString) return "";

//   const mins = zohoHrsToMinutes(firstResponseHrsString);
//   if (mins == null || mins < 1) return ""; // less than 1 minute → no timestamp

//   const base = new Date(createdTime);
//   if (isNaN(base)) return "";

//   const dt = new Date(base.getTime() + mins * 60 * 1000);
//   return formatToIST(dt);
// }

// /**
//  * Normalize status text to canonical keys.
//  * Examples:
//  *   "On Hold" → "hold"
//  *   "in-progress" → "inProgress"
//  */
// function normalizeStatus(text) {
//   if (!text) return "";
//   const t = text.replace(/[\s\-_]/g, "").toLowerCase();
//   if (t === "hold" || t === "onhold") return "hold";
//   if (t === "inprogress" || t === "in-progress" || t === "in_progress")
//     return "inProgress";
//   if (t === "open") return "open";
//   if (t === "escalated") return "escalated";
//   return t;
// }

// // Various status text → our normalized keys (kept for reference / future use)
// const statusKeyMap = {
//   open: "open",
//   hold: "hold",
//   "on-hold": "hold",
//   onhold: "hold",
//   "in-progress": "inProgress",
//   inprogress: "inProgress",
//   in_progress: "inProgress",
//   escalated: "escalated",
// };

// /**
//  * Main component:
//  * Shows different ticket tables (Agent Age / Metrics / Pending / Department view / Archived)
//  * depending on the props and selected toggles.
//  */
// export default function AgentTicketAgeTable({
//   membersData,
//   metricsRows = [],
//   onClose,
//   selectedAges = ["fifteenDays", "sixteenToThirty", "month"],
//   selectedStatuses = [],
//   showTimeDropdown,
//   selectedDepartmentId,
//   selectedAgentNames = [],
//   departmentsMap = {},
//   departmentViewEnabled,
//   setDepartmentViewEnabled,
//   archivedRows = [], // archived tickets from backend
// }) {
//   // Row hover index for agent-age table (for highlighting)
//   const [hoveredRowIndex, setHoveredRowIndex] = useState(null);

//   // Shared search box value (filters all table types)
//   const [searchTerm, setSearchTerm] = useState("");

//   // Which table to show based on selectedAges flags
//   const showMetricsTable = selectedAges.includes("metrics");
//   const showPendingTable = selectedAges.includes("pending");
//   const showArchivedTable = selectedAges.includes("archived");

//   // ------------------- TABLE COLUMN DEFINITIONS -------------------

//   // Columns for archived tickets table
//   const archivedColumns = [
//     { key: "siNo", label: "SI. NO." },
//     { key: "agentName", label: "Agent Name" },
//     { key: "departmentName", label: "Department" },
//     // { key: "totalArchivedTickets", label: "Total Archived Tickets" },
//     { key: "ticketNumber", label: "Ticket Number" },
//     { key: "subject", label: "Subject" },
//     { key: "status", label: "Status" },
//     { key: "createdTime", label: "Created" },
//     { key: "closedTime", label: "Closed" },
//     { key: "resolutionTimeHours", label: "Resolution Time (Hours)" },
//   ];

//   // Age buckets for Agent-wise ticket age table
//   const ageColumns = [
//     {
//       key: "fifteenDays",
//       label: "1 - 15 Days Tickets",
//       ageProp: "BetweenOneAndFifteenDays",
//     },
//     {
//       key: "sixteenToThirty",
//       label: "16 - 30 Days Tickets",
//       ageProp: "BetweenSixteenAndThirtyDays",
//     },
//     { key: "month", label: "30+ Days Tickets", ageProp: "OlderThanThirtyDays" },
//   ];

//   // Columns for Metrics table (per ticket)
//   const metricsColumns = [
//     { key: "agentName", label: "Agent Name" },
//     { key: "ticketNumber", label: "Ticket Number" },
//     { key: "status", label: "Ticket Status" },
//     { key: "departmentName", label: "Department" },
//     { key: "createdTime", label: "Ticket Created (IST)" },
//     { key: "firstResponseTime", label: "First Response Time" },
//     // { key: "totalResponseTime", label: "Total Response Time" }, // not shown now
//     { key: "resolutionTime", label: "Resolution Time" },
//     { key: "threadCount", label: "Threads" },
//     { key: "responseCount", label: "User Response" },
//     { key: "outgoingCount", label: "Agent Response" },
//     { key: "reopenCount", label: "Reopens" },
//     { key: "reassignCount", label: "Reassigns" },
//     { key: "stagingData", label: "Staging (Status / Time)" },
//     { key: "agentsHandled", label: "Agents (Name / Time)" },
//     { key: "avgFirstResponse", label: "Avg First Response Time & Days" },
//     // { key: "avgResolution", label: "Avg Resolution Time & Days" }
//   ];

//   // Only show age columns that user has selected
//   const visibleAgeColumns = ageColumns.filter((col) =>
//     selectedAges.includes(col.key)
//   );

//   // Common columns for Agent-wise age table
//   const columnsToShow = [
//     { key: "serial", label: "SI. NO." },
//     { key: "name", label: "Agent Name" },
//     ...(selectedDepartmentId
//       ? [{ key: "department", label: "Department" }]
//       : []),
//     { key: "total", label: "Total Ticket Count" },
//     ...visibleAgeColumns,
//   ];

//   // Order of statuses when aggregating or displaying
//   const statusOrder = ["open", "hold", "inProgress", "escalated"];

//   // Map normalized status → sort priority (for pending table)
//   const statusMapSort = {
//     open: 0,
//     hold: 1,
//     inprogress: 2,
//     inProgress: 2,
//     escalated: 3,
//   };

//   // Normalize all selectedStatuses (from dropdown) to our internal keys
//   const normalizedStatusKeys =
//     selectedStatuses && selectedStatuses.length > 0
//       ? selectedStatuses.map((st) => normalizeStatus(st.value || st))
//       : [];

//   // Columns for Pending-Status table
//   const pendingTableColumns = [
//     { key: "name", label: "Agent Name" },
//     { key: "department", label: "Department Name" },
//     { key: "totalTickets", label: "Total Pending Tickets" },
//     { key: "status", label: "Ticket Status" },
//     { key: "ticketNumber", label: "Ticket Number" },
//     { key: "ticketCreated", label: "Ticket Created Date & Time" },
//     { key: "daysNotResponded", label: "Ticket Age Days " },
//   ];

//   // For quicker lookup when filtering by status
//   const normalizedStatusKeysSet =
//     normalizedStatusKeys.length > 0 ? new Set(normalizedStatusKeys) : null;

//   /* ------------------- METRICS TABLE DATA & FILTERS ------------------- */

//   // Filter metrics rows by agent, department, and status
//   const filteredMetricsRows = useMemo(() => {
//     if (!metricsRows || !Array.isArray(metricsRows)) return [];

//     return metricsRows.filter((row) => {
//       const agentOk =
//         !selectedAgentNames?.length ||
//         selectedAgentNames.includes(row.agentName);

//       const departmentOk =
//         !selectedDepartmentId ||
//         row.departmentId === selectedDepartmentId ||
//         row.departmentName === departmentsMap[selectedDepartmentId]?.name;

//       const rowStatusNorm = normalizeStatus(row.status);
//       const statusOk =
//         !normalizedStatusKeys?.length ||
//         normalizedStatusKeys.includes(rowStatusNorm);

//       return agentOk && departmentOk && statusOk;
//     });
//   }, [
//     metricsRows,
//     selectedAgentNames,
//     selectedDepartmentId,
//     departmentsMap,
//     normalizedStatusKeys,
//   ]);

//   // Apply search term and sort by agent name
//   const sortedMetricsRows = useMemo(() => {
//     const q = searchTerm.trim().toLowerCase();
//     let rows = [...filteredMetricsRows];

//     if (q) {
//       rows = rows.filter((r) => {
//         const combined = `${r.agentName || ""} ${r.ticketNumber || ""} ${
//           r.status || ""
//         } ${r.departmentName || ""} ${r.createdTime || ""}`.toLowerCase();
//         return combined.includes(q);
//       });
//     }

//     return rows.sort((a, b) =>
//       (a.agentName || "").localeCompare(b.agentName || "", undefined, {
//         sensitivity: "base",
//       })
//     );
//   }, [filteredMetricsRows, searchTerm]);

//   /**
//    * Compute average first response & resolution time per agent (in minutes & H:MM).
//    * This is later used to show "Avg First Response" column with rowSpan.
//    */
//   const agentAverageMap = useMemo(() => {
//     const acc = {};

//     sortedMetricsRows.forEach((row) => {
//       const name = row.agentName || "Unknown";
//       if (!acc[name]) {
//         acc[name] = { frSum: 0, frCount: 0, resSum: 0, resCount: 0 };
//       }

//       const frMin = zohoHrsToMinutes(row.firstResponseTime);
//       if (frMin !== null) {
//         acc[name].frSum += frMin;
//         acc[name].frCount += 1;
//       }

//       const resMin = zohoHrsToMinutes(row.resolutionTime);
//       if (resMin !== null) {
//         acc[name].resSum += resMin;
//         acc[name].resCount += 1;
//       }
//     });

//     const out = {};
//     Object.entries(acc).forEach(([name, v]) => {
//       const frAvgMin = v.frCount ? Math.round(v.frSum / v.frCount) : null;
//       const resAvgMin = v.resCount ? Math.round(v.resSum / v.resCount) : null;
//       out[name] = {
//         avgFirstResponseHM: frAvgMin != null ? minutesToHM(frAvgMin) : "-",
//         avgFirstResponseMin: frAvgMin,
//         avgResolutionHM: resAvgMin != null ? minutesToHM(resAvgMin) : "-",
//         avgResolutionMin: resAvgMin,
//       };
//     });
//     return out;
//   }, [sortedMetricsRows]);

//   /* ------------------- PENDING TABLE DATA ------------------- */

//   /**
//    * Build pending tickets rows from membersData, filtered by department, agent, and status.
//    * Each row is a single ticket entry.
//    */
//   const pendingTableRows = useMemo(() => {
//     if (!membersData || !Array.isArray(membersData)) return [];

//     let filteredAgents = membersData;

//     // Filter agents by department if selected
//     if (selectedDepartmentId) {
//       filteredAgents = filteredAgents.filter(
//         (agent) =>
//           Array.isArray(agent.departmentIds) &&
//           agent.departmentIds.includes(selectedDepartmentId)
//       );
//     }

//     // Filter agents by selected agent names, if provided
//     if (selectedAgentNames && selectedAgentNames.length > 0) {
//       filteredAgents = filteredAgents.filter((agent) =>
//         selectedAgentNames.includes(agent.name)
//       );
//     }

//     let rows = [];

//     filteredAgents.forEach((agent) => {
//       (agent.pendingTickets || [])
//         .filter(
//           (tkt) =>
//             !selectedDepartmentId ||
//             tkt.departmentId === selectedDepartmentId ||
//             tkt.departmentName === departmentsMap[selectedDepartmentId]?.name
//         )
//         .forEach((tkt) => {
//           const tktNorm = normalizeStatus(tkt.status);

//           // Skip ticket if status not in selected status set
//           if (normalizedStatusKeysSet && !normalizedStatusKeysSet.has(tktNorm))
//             return;

//           // Map inprogress → inProgress for sort map
//           let sortKey = tktNorm === "inprogress" ? "inProgress" : tktNorm;

//           // Handle daysNotResponded (allow empty)
//           let dr =
//             tkt.daysNotResponded !== undefined &&
//             tkt.daysNotResponded !== "" &&
//             !isNaN(Number(tkt.daysNotResponded))
//               ? Number(tkt.daysNotResponded) < 1
//                 ? 0
//                 : Number(tkt.daysNotResponded)
//               : "";

//           rows.push({
//             name: agent.name || "",
//             department: tkt.departmentName || "",
//             status: tkt.status || "",
//             statusSort: statusMapSort[sortKey] ?? 99,
//             ticketNumber: tkt.ticketNumber || "",
//             ticketCreated: tkt.ticketCreated || "",
//             daysNotResponded: dr,
//           });
//         });
//     });

//     // Sort by agent name then by status priority
//     return rows.sort((a, b) => {
//       const nameCmp = a.name.localeCompare(b.name, undefined, {
//         sensitivity: "base",
//       });
//       if (nameCmp !== 0) return nameCmp;
//       return (a.statusSort ?? 99) - (b.statusSort ?? 99);
//     });
//   }, [
//     membersData,
//     selectedDepartmentId,
//     selectedAgentNames,
//     normalizedStatusKeysSet,
//     departmentsMap,
//   ]);

//   /**
//    * Group pendingTableRows by agent to be able to show rowSpan for
//    * Agent Name and Total Pending Tickets.
//    */
//   const groupedPendingRows = useMemo(() => {
//     const grouped = {};
//     pendingTableRows.forEach((row) => {
//       if (!grouped[row.name]) grouped[row.name] = [];
//       grouped[row.name].push(row);
//     });

//     const finalRows = [];
//     Object.keys(grouped).forEach((agent) => {
//       const totalTickets = grouped[agent].length;
//       grouped[agent].forEach((row, i) => {
//         finalRows.push({
//           ...row,
//           totalTickets,
//           _isFirst: i === 0,
//           _rowSpan: grouped[agent].length,
//         });
//       });
//     });
//     return finalRows;
//   }, [pendingTableRows]);

//   /**
//    * Apply search on grouped pending rows.
//    * We rebuild the grouping after the search filter.
//    */
//   const searchedGroupedPendingRows = useMemo(() => {
//     const q = searchTerm.trim().toLowerCase();
//     if (!q) return groupedPendingRows;

//     const filtered = pendingTableRows.filter((row) => {
//       const combined = `${row.name} ${row.department} ${row.status} ${
//         row.ticketNumber
//       } ${row.ticketCreated} ${row.daysNotResponded}`.toLowerCase();
//       return combined.includes(q);
//     });

//     const grouped = {};
//     filtered.forEach((row) => {
//       if (!grouped[row.name]) grouped[row.name] = [];
//       grouped[row.name].push(row);
//     });

//     const finalRows = [];
//     Object.keys(grouped).forEach((agent) => {
//       const totalTickets = grouped[agent].length;
//       grouped[agent].forEach((row, i) => {
//         finalRows.push({
//           ...row,
//           totalTickets,
//           _isFirst: i === 0,
//           _rowSpan: grouped[agent].length,
//         });
//       });
//     });
//     return finalRows;
//   }, [pendingTableRows, groupedPendingRows, searchTerm]);

//   /* ------------------- DEPARTMENT VIEW DATA ------------------- */

//   /**
//    * Build department-wise aggregated age buckets from membersData.departmentAgingCounts.
//    * Each row represents a department with counts of tickets in different age buckets & statuses.
//    */
//   const departmentRows = useMemo(() => {
//     if (!departmentViewEnabled) return null;

//     // Initialize object for each department
//     const byDept = {};
//     Object.entries(departmentsMap).forEach(([deptId, info]) => {
//       byDept[deptId] = {
//         departmentName: info.name || deptId,
//         ticketSet: new Set(), // currently unused, can track unique tickets
//         tickets_1_7_open: 0,
//         tickets_1_7_hold: 0,
//         tickets_1_7_inProgress: 0,
//         tickets_1_7_escalated: 0,
//         tickets_8_15_open: 0,
//         tickets_8_15_hold: 0,
//         tickets_8_15_inProgress: 0,
//         tickets_8_15_escalated: 0,
//         tickets_15plus_open: 0,
//         tickets_15plus_hold: 0,
//         tickets_15plus_inProgress: 0,
//         tickets_15plus_escalated: 0,

//         // To store ticket numbers in each bucket for tooltip details
//         tickets_1_7_open_numbers: [],
//         tickets_1_7_hold_numbers: [],
//         tickets_1_7_inProgress_numbers: [],
//         tickets_1_7_escalated_numbers: [],
//         tickets_8_15_open_numbers: [],
//         tickets_8_15_hold_numbers: [],
//         tickets_8_15_inProgress_numbers: [],
//         tickets_8_15_escalated_numbers: [],
//         tickets_15plus_open_numbers: [],
//         tickets_15plus_hold_numbers: [],
//         tickets_15plus_inProgress_numbers: [],
//         tickets_15plus_escalated_numbers: [],
//       };
//     });

//     // Aggregate per agent → per department → per status & age bucket
//     (membersData || []).forEach((agent) => {
//       Object.entries(agent.departmentAgingCounts || {}).forEach(
//         ([deptId, agingCounts]) => {
//           if (!byDept[deptId]) return;

//           statusOrder.forEach((key) => {
//             // 1-7 days
//             (agingCounts[`${key}BetweenOneAndSevenDaysTickets`] || []).forEach(
//               (ticketNum) => {
//                 byDept[deptId][`tickets_1_7_${key}`] += 1;
//                 byDept[deptId][`tickets_1_7_${key}_numbers`].push(ticketNum);
//               }
//             );

//             // 8-15 days
//             (
//               agingCounts[`${key}BetweenEightAndFifteenDaysTickets`] || []
//             ).forEach((ticketNum) => {
//               byDept[deptId][`tickets_8_15_${key}`] += 1;
//               byDept[deptId][`tickets_8_15_${key}_numbers`].push(ticketNum);
//             });

//             // 15+ days
//             (agingCounts[`${key}OlderThanFifteenDaysTickets`] || []).forEach(
//               (ticketNum) => {
//                 byDept[deptId][`tickets_15plus_${key}`] += 1;
//                 byDept[deptId][`tickets_15plus_${key}_numbers`].push(ticketNum);
//               }
//             );
//           });
//         }
//       );
//     });

//     // Compute total tickets and convert to array sorted by department name
//     const sortedRows = Object.entries(byDept)
//       .map(([deptId, data]) => ({
//         ...data,
//         total:
//           data.tickets_1_7_open +
//           data.tickets_1_7_hold +
//           data.tickets_1_7_inProgress +
//           data.tickets_1_7_escalated +
//           data.tickets_8_15_open +
//           data.tickets_8_15_hold +
//           data.tickets_8_15_inProgress +
//           data.tickets_8_15_escalated +
//           data.tickets_15plus_open +
//           data.tickets_15plus_hold +
//           data.tickets_15plus_inProgress +
//           data.tickets_15plus_escalated,
//       }))
//       .sort((a, b) =>
//         a.departmentName.localeCompare(b.departmentName, undefined, {
//           sensitivity: "base",
//         })
//       )
//       .map((row, idx) => ({
//         si: idx + 1,
//         ...row,
//       }));

//     return sortedRows;
//   }, [membersData, departmentsMap, departmentViewEnabled, statusOrder]);

//   /**
//    * Apply search filter on department rows.
//    * At the moment, search works on department name and total ticket count.
//    */
//   const departmentRowsForDisplay = useMemo(() => {
//     if (!departmentRows) return [];
//     const q = searchTerm.trim().toLowerCase();
//     if (!q) return departmentRows;

//     return departmentRows.filter((row) => {
//       const combined = `${row.departmentName} ${row.total}`.toLowerCase();
//       return combined.includes(q);
//     });
//   }, [departmentRows, searchTerm]);

//   /* ------------------- STYLES (PROFESSIONAL, USING EXISTING COLORS) ------------------- */

//   const baseFont = `'Montserrat', 'Poppins', sans-serif`;

//   // standard data cell (center)
//   const centerCellStyle = {
//   padding: "8px 10px",
//   fontWeight: 700,
//   fontSize: 12,
//   fontFamily: baseFont,
//   background: "transparent",
//   color: "Black",
//   borderBottom: "1px solid #1E4489",
//   borderRight: "1px solid #1E4489",
  
//   textAlign: "center",
//   verticalAlign: "middle",
//   whiteSpace: "nowrap",
// };

// const leftCellStyle = {
//   ...centerCellStyle,
//   textAlign: "left",
// };

// const centerCellStyleHovered = {
//   ...centerCellStyle,
//   background: "#2446a3",
//   color: "Black",
// };

//   // header style for serial column
//   const serialHeaderStyle = {
//     padding: "8px 10px",
//     fontWeight: 900,
//     fontSize: 12,
//     fontFamily: baseFont,
//     background: "#1E4489",
//     color: "white",
//     borderBottom: "2px solid #32406b",
//     textAlign: "center",
//     position: "sticky",
//     top: 0,
//     zIndex: 3,
//     width: 40,
//     minWidth: 40,
//     maxWidth: 50,
//     whiteSpace: "nowrap",
//   };

//   // common header style
//   const headerStyle3D = {
//     padding: "8px 10px",
//     fontWeight: 900,
//     fontSize: 12,
//     fontFamily: baseFont,
//     background: "#1E4489",
//     color: "white",
//     borderBottom: "2px solid #32406b",
//     textAlign: "center",
//     position: "sticky",
//     top: 0,
//     zIndex: 3,
//     whiteSpace: "nowrap",
//   };

//   // row base style (for stripes)
//   const rowBaseStyle = (index) => ({
//     backgroundColor: index % 2 === 0 ? "#b4c2e3ff" : "#eef1f5ff",
//     color: "Black",
//     fontSize: 12,
//     fontWeight: 900,
//   });

//   /* ------------------- GLOBAL DOUBLE-CLICK CLOSE ------------------- */

//   useEffect(() => {
//     const handleDoubleClick = () => {
//       if (onClose) onClose();
//     };
//     window.addEventListener("dblclick", handleDoubleClick);
//     return () => window.removeEventListener("dblclick", handleDoubleClick);
//   }, [onClose]);

//   /**
//    * Aggregate ticket numbers for a given agent, age bucket, and status.
//    * If no department is selected, we combine all departments.
//    */
//   function aggregateTickets(agent, ageProp, status) {
//     if (!selectedDepartmentId && agent.departmentAgingCounts) {
//       // Sum across all departments
//       return Object.values(agent.departmentAgingCounts).flatMap(
//         (age) => age?.[status + ageProp + "Tickets"] || []
//       );
//     }
//     // Use only selected department if available
//     return selectedDepartmentId &&
//       agent.departmentAgingCounts?.[selectedDepartmentId]
//       ? agent.departmentAgingCounts[selectedDepartmentId][
//           status + ageProp + "Tickets"
//         ] || []
//       : [];
//   }

//   /**
//    * Helper: count the number of tickets from aggregateTickets().
//    */
//   function countFromArray(agent, ageProp, status) {
//     return aggregateTickets(agent, ageProp, status).length;
//   }

//   /**
//    * Helper for department rows: get the array of ticket numbers for
//    * particular bucket and status key.
//    */
//   function ticketNumbersForDeptRow(row, bucket, statusKey) {
//     return row[`tickets_${bucket}_${statusKey}_numbers`] || [];
//   }

//   /**
//    * Build base rows for Agent-wise ticket age table.
//    * Each row corresponds to an agent with agingCounts and department name.
//    */
//   const tableRows = (membersData || [])
//     .filter((agent) => {
//       if (selectedDepartmentId) {
//         // Show only agents who have tickets in the selected department
//         const agentHasTickets =
//           (agent.departmentTicketCounts?.[selectedDepartmentId] || 0) > 0 ||
//           Object.values(
//             agent.departmentAgingCounts?.[selectedDepartmentId] || {}
//           ).some((v) => v > 0);

//         const nameMatch =
//           !selectedAgentNames.length ||
//           selectedAgentNames.includes(agent.name.trim());
//         return agentHasTickets && nameMatch;
//       } else {
//         // If no department filter, show agents who have any tickets at all
//         const t = agent.tickets || {};
//         return (
//           (t.open || 0) +
//             (t.hold || 0) +
//             (t.escalated || 0) +
//             (t.unassigned || 0) +
//             (t.inProgress || 0) >
//           0
//         );
//       }
//     })
//     .map((agent) => {
//       let agingCounts = {};
//       if (selectedDepartmentId) {
//         agingCounts = agent.departmentAgingCounts?.[selectedDepartmentId] || {};
//       } else if (agent.tickets) {
//         agingCounts = agent.tickets;
//       }
//       return {
//         name: agent.name,
//         agingCounts,
//         departmentAgingCounts: agent.departmentAgingCounts,
//         departmentName: selectedDepartmentId
//           ? departmentsMap?.[selectedDepartmentId]?.name ||
//             selectedDepartmentId
//           : "",
//       };
//     })
//     .sort((a, b) => a.name.localeCompare(b.name));

//   /**
//    * Apply search for Agent-age table:
//    * Search by agent name, department name, or any ticket number in visible buckets.
//    */
//   const tableRowsForDisplay = useMemo(() => {
//     const q = searchTerm.trim().toLowerCase();
//     if (!q) return tableRows;

//     return tableRows.filter((row) => {
//       const nameMatch = (row.name || "").toLowerCase().includes(q);
//       const deptMatch = (row.departmentName || "").toLowerCase().includes(q);

//       const ticketMatch = visibleAgeColumns.some((col) =>
//         statusOrder.some((status) =>
//           aggregateTickets(row, col.ageProp, status).some((num) =>
//             String(num).toLowerCase().includes(q)
//           )
//         )
//       );

//       return nameMatch || deptMatch || ticketMatch;
//     });
//   }, [tableRows, visibleAgeColumns, searchTerm, statusOrder]);

//   /* ------------------- ARCHIVED TABLE FILTER + PAGINATION ------------------- */

//   /**
//    * Filter archived rows based on searchTerm.
//    * Rules:
//    *   - If numeric input → exact match on ticketNumber
//    *   - Else → match prefix of any word in agentName
//    * Always sorted by agentName.
//    */
//   const filteredArchivedRows = useMemo(() => {
//     const raw = searchTerm.trim();
//     let rows = [...archivedRows];

//     if (!raw) {
//       return rows.sort((a, b) =>
//         String(a.agentName || "")
//           .toLowerCase()
//           .localeCompare(String(b.agentName || "").toLowerCase())
//       );
//     }

//     const q = raw.toLowerCase();
//     const isNumeric = /^\d+$/.test(q);

//     rows = rows.filter((row) => {
//       const agent = String(row.agentName || "").toLowerCase();
//       const ticketNo = String(row.ticketNumber || "").trim().toLowerCase();

//       // Numeric search only on ticket number
//       if (isNumeric) {
//         return ticketNo === q;
//       }

//       // Text search: prefix of any word in agent name
//       const words = agent.split(/\s+/).filter(Boolean);
//       return words.some((w) => w.startsWith(q));
//     });

//     return rows.sort((a, b) =>
//       String(a.agentName || "")
//         .toLowerCase()
//         .localeCompare(String(b.agentName || "").toLowerCase())
//     );
//   }, [archivedRows, searchTerm]);

//   // Pagination state (page number) for archived table
//   const [archivedPage, setArchivedPage] = useState(1);
//   const archivedPageSize = 500;

//   // Reset to page 1 when search term changes
//   useEffect(() => {
//     setArchivedPage(1);
//   }, [searchTerm]);

//   // Total pages for archived table
//   const archivedTotalPages = useMemo(
//     () => Math.max(1, Math.ceil(filteredArchivedRows.length / archivedPageSize)),
//     [filteredArchivedRows.length]
//   );

//   // Slice rows to current page
//   const pagedArchivedRows = useMemo(() => {
//     const start = (archivedPage - 1) * archivedPageSize;
//     return filteredArchivedRows.slice(start, start + archivedPageSize);
//   }, [filteredArchivedRows, archivedPage, archivedPageSize]);

//   /* ------------------- TITLE + SEARCH LABEL ------------------- */

//   // Dynamic title based on which table is active
//   const currentTableTitle = useMemo(() => {
//     if (showMetricsTable) return "Ticket Metrics Data";
//     if (showPendingTable) return "Pending Status Tickets";
//     if (showArchivedTable) return "Archived Tickets";
//     if (departmentViewEnabled) return "Department-wise Ticket Age";
//     if (selectedDepartmentId && departmentsMap[selectedDepartmentId]?.name) {
//       return `${departmentsMap[selectedDepartmentId].name} - Agent-wise Ticket Age`;
//     }
//     return "Agent-wise Ticket Age";
//   }, [
//     showMetricsTable,
//     showPendingTable,
//     showArchivedTable,
//     departmentViewEnabled,
//     selectedDepartmentId,
//     departmentsMap,
//   ]);

//   // Dynamic placeholder for search box based on table type
//   const currentSearchPlaceholder = useMemo(() => {
//     if (showMetricsTable)
//       return "Search agent / ticket / status / department...";
//     if (showPendingTable) return "Search agent / ticket / status...";
//     if (showArchivedTable) return "Search agent / ticket...";
//     if (departmentViewEnabled) return "Search by department...";
//     return "Search agent / ticket...";
//   }, [showMetricsTable, showPendingTable, showArchivedTable, departmentViewEnabled]);

//   /* ------------------- RENDER ------------------- */

//   return (
//     <div style={{ fontFamily: baseFont }}>
//       {/* Title + Search row */}
//       <div
//         style={{
//           maxWidth: "100%",
//           margin: "10px auto 4px auto",
//           padding: "0 5px",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           gap: 16,
//         }}
//       >
//         {/* Dynamic table title */}
//         <div
//           style={{
//             padding: "7px 7px",
//             borderRadius: 4,
//             background: "linear-gradient(135deg,#1E4489 70%,#1E4489 100%)",
//             color: "white",
//             fontWeight: 900,
//             fontSize: 15,
//             letterSpacing: 1,
//             textTransform: "uppercase",
//             boxShadow: "0 0 16px rgba(0,0,0,0.45)",
//             whiteSpace: "nowrap",
//           }}
//         >
//           {currentTableTitle}
//         </div>

//         {/* Global search input */}
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           placeholder={currentSearchPlaceholder}
//           style={{
//             minWidth: 240,
//             maxWidth: 360,
//             padding: "5px 5px",
//             borderRadius: 4,
//             border: "2px solid #34495e",
//             outline: "none",
//             fontSize: 12,
//             fontWeight: 900,
//             fontFamily: baseFont,
//             background: "#0e1015",
//             color: "#f5f7ff",
//             boxShadow: "0 0 10px rgba(0,0,0,0.4)",
//             textAlign: "left",
//           }}
//         />
//       </div>

//       {/* Main container which conditionally renders 1 of the 5 views */}
//       <div
//         style={{
//           margin: "8px auto 24px auto",
//           // borderRadius: 16,
//           border: "2px solid #32406b",
//           background: "#16171a",
//           width: "100%",
//           overflowX: "auto",
//           overflowY: "auto",
//           maxHeight: "100vh",
//         }}
//       >
//         {/* 1. METRICS TABLE VIEW */}
//         {showMetricsTable ? (
//           <div
//             style={{
//               maxHeight: "150vh",
//               overflowY: "auto",
//               overflowX: "auto",
//             }}
//           >
//             <table
//               style={{
//                 width: "100%",
//                 borderCollapse: "separate",
//                 // borderRadius: 16,
//                 fontSize: 12,
//                 fontFamily: baseFont,
//                 tableLayout: "auto",
//               }}
//             >
//               <thead>
//                 <tr>
//                   {metricsColumns.map((col) => (
//                     <th
//                       key={col.key}
//                       style={{
//                         ...(col.key === "agentName" ||
//                         col.key === "departmentName"
//                           ? { ...headerStyle3D, textAlign: "left" }
//                           : headerStyle3D),
//                       }}
//                     >
//                       {col.label}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {/* No metrics found */}
//                 {sortedMetricsRows.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={metricsColumns.length}
//                       style={{
//                         textAlign: "center",
//                         padding: 16,
//                         color: "bLack",
//                         fontSize: 12,
//                         background: "#181b26",
//                         // borderRadius: 14,
//                       }}
//                     >
//                       No metrics data available.
//                     </td>
//                   </tr>
//                 ) : (
//                   (() => {
//                     const rows = [];
//                     let i = 0;

//                     while (i < sortedMetricsRows.length) {
//                       const agentName = sortedMetricsRows[i].agentName || "";
//                       let groupStart = i;
//                       let groupEnd = i;

//                       // Find range of rows belonging to same agent
//                       while (
//                         groupEnd + 1 < sortedMetricsRows.length &&
//                         (sortedMetricsRows[groupEnd + 1].agentName || "") ===
//                           agentName
//                       ) {
//                         groupEnd++;
//                       }

//                       const rowSpan = groupEnd - groupStart + 1;
//                       const avg = agentAverageMap[agentName];

//                       for (let r = groupStart; r <= groupEnd; r++) {
//                         const row = sortedMetricsRows[r];
//                         rows.push(
//                           <tr key={row.ticketNumber || `${agentName}_${r}`} style={rowBaseStyle(r)}>
//                             {metricsColumns.map((col) => {
//                               // Agent name with rowSpan (shown only on first row of group)
//                               if (col.key === "agentName") {
//                                 if (r === groupStart) {
//                                   return (
//                                     <td
//                                       key={col.key}
//                                       rowSpan={rowSpan}
//                                       style={leftCellStyle}
//                                     >
//                                       {agentName}
//                                     </td>
//                                   );
//                                 }
//                                 return null;
//                               }

//                               // Staging data: show list of {status, handledTime}
//                               if (col.key === "stagingData") {
//                                 return (
//                                   <td key={col.key} style={centerCellStyle}>
//                                     {Array.isArray(row.stagingData) &&
//                                     row.stagingData.length > 0 ? (
//                                       <div
//                                         style={{
//                                           display: "flex",
//                                           flexDirection: "column",
//                                           gap: 4,
//                                         }}
//                                       >
//                                         {row.stagingData.map((s, i2) => (
//                                           <div key={i2}>
//                                             {s.status}: {s.handledTime}
//                                           </div>
//                                         ))}
//                                       </div>
//                                     ) : (
//                                       "-"
//                                     )}
//                                   </td>
//                                 );
//                               }

//                               // Agents handled: list of {agentName, handlingTime}
//                               if (col.key === "agentsHandled") {
//                                 return (
//                                   <td key={col.key} style={centerCellStyle}>
//                                     {Array.isArray(row.agentsHandled) &&
//                                     row.agentsHandled.length > 0 ? (
//                                       <div
//                                         style={{
//                                           display: "flex",
//                                           flexDirection: "column",
//                                           gap: 4,
//                                         }}
//                                       >
//                                         {row.agentsHandled.map((a, i2) => (
//                                           <div key={i2}>
//                                             {a.agentName}: {a.handlingTime}
//                                           </div>
//                                         ))}
//                                       </div>
//                                     ) : (
//                                       "-"
//                                     )}
//                                   </td>
//                                 );
//                               }

//                               // Created time (converted to IST)
//                               if (col.key === "createdTime") {
//                                 return (
//                                   <td key={col.key} style={centerCellStyle}>
//                                     {formatToIST(row.createdTime)}
//                                   </td>
//                                 );
//                               }

//                               // First Response Time: show "-" if <1 minute, else duration + IST datetime
//                               if (col.key === "firstResponseTime") {
//                                 const minutes = zohoHrsToMinutes(
//                                   row.firstResponseTime
//                                 );
//                                 const metricHM = fromZohoHrsToHM(
//                                   row.firstResponseTime
//                                 ); // "H:MM" or ""
//                                 const firstRespDateTime =
//                                   getFirstResponseDateTime(
//                                     row.createdTime,
//                                     row.firstResponseTime
//                                   );

//                                 if (minutes == null || minutes < 1) {
//                                   return (
//                                     <td key={col.key} style={centerCellStyle}>
//                                       <span>-</span>
//                                     </td>
//                                   );
//                                 }

//                                 return (
//                                   <td key={col.key} style={centerCellStyle}>
//                                     <div
//                                       style={{
//                                         display: "flex",
//                                         flexDirection: "column",
//                                         lineHeight: 1.2,
//                                       }}
//                                     >
//                                       <span>{metricHM}</span>
//                                       {firstRespDateTime && (
//                                         <span style={{ fontSize: 11 }}>
//                                           {firstRespDateTime}
//                                         </span>
//                                       )}
//                                     </div>
//                                   </td>
//                                 );
//                               }

//                               // Resolution Time: show Zoho duration + days label
//                               if (col.key === "resolutionTime") {
//                                 const metricHM = fromZohoHrsToHM(
//                                   row.resolutionTime
//                                 );
//                                 const minutes = zohoHrsToMinutes(
//                                   row.resolutionTime
//                                 );
//                                 const daysLabel =
//                                   minutes != null
//                                     ? minutesToDaysLabel(minutes)
//                                     : "";

//                                 if (!metricHM && !daysLabel) {
//                                   return (
//                                     <td key={col.key} style={centerCellStyle}>
//                                       <span>-</span>
//                                     </td>
//                                   );
//                                 }

//                                 return (
//                                   <td key={col.key} style={centerCellStyle}>
//                                     <div
//                                       style={{
//                                         display: "flex",
//                                         flexDirection: "column",
//                                         lineHeight: 1.2,
//                                       }}
//                                     >
//                                       <span>{metricHM || "-"}</span>
//                                       {daysLabel && (
//                                         <span style={{ fontSize: 11 }}>
//                                           {daysLabel}
//                                         </span>
//                                       )}
//                                     </div>
//                                   </td>
//                                 );
//                               }

//                               // Avg First Response / Avg Resolution (per agent with rowSpan)
//                               if (
//                                 col.key === "avgFirstResponse" ||
//                                 col.key === "avgResolution"
//                               ) {
//                                 if (r === groupStart) {
//                                   const hm =
//                                     col.key === "avgFirstResponse"
//                                       ? avg?.avgFirstResponseHM || "-"
//                                       : avg?.avgResolutionHM || "-";
//                                   const minutes =
//                                     col.key === "avgFirstResponse"
//                                       ? avg?.avgFirstResponseMin
//                                       : avg?.avgResolutionMin;
//                                   const daysLabel =
//                                     minutes != null
//                                       ? minutesToDaysLabel(minutes)
//                                       : "";
//                                   return (
//                                     <td
//                                       key={col.key}
//                                       rowSpan={rowSpan}
//                                       style={centerCellStyle}
//                                     >
//                                       <div
//                                         style={{
//                                           display: "flex",
//                                           flexDirection: "column",
//                                           lineHeight: 1.2,
//                                         }}
//                                       >
//                                         <span>{hm}</span>
//                                         {daysLabel && (
//                                           <span style={{ fontSize: 11 }}>
//                                             {daysLabel}
//                                           </span>
//                                         )}
//                                       </div>
//                                     </td>
//                                   );
//                                 }
//                                 return null;
//                               }

//                               // Default cell (string / number)
//                               const value = row[col.key];
//                               const isLeft =
//                                 col.key === "departmentName" ||
//                                 col.key === "status" ||
//                                 col.key === "ticketNumber";
//                               return (
//                                 <td
//                                   key={col.key}
//                                   style={isLeft ? leftCellStyle : centerCellStyle}
//                                 >
//                                   {value ?? ""}
//                                 </td>
//                               );
//                             })}
//                           </tr>
//                         );
//                       }

//                       i = groupEnd + 1;
//                     }

//                     return rows;
//                   })()
//                 )}
//               </tbody>
//             </table>
//           </div>
//         ) : // 2. PENDING STATUS TABLE VIEW
//         showPendingTable ? (
//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "separate",
//               // borderRadius: 16,
//               fontSize: 12,
//               fontFamily: baseFont,
//               tableLayout: "auto",
//             }}
//           >
//             <thead>
//               <tr>
//                 {pendingTableColumns.map((col) => (
//                   <th
//                     key={col.key}
//                     style={
//                       col.key === "name" || col.key === "department"
//                         ? { ...headerStyle3D, textAlign: "left" }
//                         : headerStyle3D
//                     }
//                   >
//                     {col.label}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {/* No pending tickets */}
//               {searchedGroupedPendingRows.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={pendingTableColumns.length}
//                     style={{
//                       textAlign: "center",
//                       padding: 16,
//                       color: "white",
//                       fontSize: 12,
//                       background: "#181b26",
//                       // borderRadius: 14,
//                     }}
//                   >
//                     No pending status tickets found.
//                   </td>
//                 </tr>
//               ) : (
//                 searchedGroupedPendingRows.map((row, idx) => (
//                   <tr
//                     key={`${row.name}_${row.ticketNumber}_${idx}`}
//                     style={rowBaseStyle(idx)}
//                   >
//                     {/* Agent name (rowSpan) */}
//                     {row._isFirst ? (
//                       <td style={leftCellStyle} rowSpan={row._rowSpan}>
//                         {row.name}
//                       </td>
//                     ) : null}

//                     {/* Department name */}
//                     <td style={leftCellStyle}>{row.department}</td>

//                     {/* Total tickets per agent (rowSpan) */}
//                     {row._isFirst ? (
//                       <td
//                         style={centerCellStyle}
//                         rowSpan={row._rowSpan}
//                       >
//                         {row.totalTickets}
//                       </td>
//                     ) : null}

//                     {/* Ticket details */}
//                     <td style={centerCellStyle}>{row.status}</td>
//                     <td style={centerCellStyle}>{row.ticketNumber}</td>

//                     {/* Created date split into [date] [time] */}
//                     <td style={centerCellStyle}>
//                       <div
//                         style={{
//                           display: "flex",
//                           justifyContent: "space-between",
//                           alignItems: "center",
//                           width: "100%",
//                         }}
//                       >
//                         <span>
//                           {
//                             formatDateWithMonthName(
//                               row.ticketCreated
//                             ).split(",")[0]
//                           }
//                         </span>
//                         <span>
//                           {
//                             formatDateWithMonthName(
//                               row.ticketCreated
//                             ).split(",")[1]
//                           }
//                         </span>
//                       </div>
//                     </td>

//                     {/* Ticket age days (0 if <1 day) */}
//                     <td style={centerCellStyle}>
//                       {row.daysNotResponded !== "" &&
//                       Number(row.daysNotResponded) < 1
//                         ? 0
//                         : row.daysNotResponded}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         ) : // 3. ARCHIVED TICKETS TABLE VIEW
//         showArchivedTable ? (
//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "separate",
//               // borderRadius: 16,
//               fontSize: 12,
//               fontFamily: baseFont,
//               tableLayout: "auto",
//             }}
//           >
//             <thead>
//               <tr>
//                 {archivedColumns.map((col) => (
//                   <th
//                     key={col.key}
//                     style={
//                       col.key === "agentName" || col.key === "subject"
//                         ? { ...headerStyle3D, textAlign: "left" }
//                         : headerStyle3D
//                     }
//                   >
//                     {col.label}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {/* No archived tickets */}
//               {filteredArchivedRows.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={archivedColumns.length}
//                     style={{
//                       textAlign: "center",
//                       padding: 16,
//                       color: "White",
//                       fontSize: 12,
//                       background: "#181b26",
//                       // borderRadius: 14,
//                     }}
//                   >
//                     No archived tickets loaded.
//                   </td>
//                 </tr>
//               ) : (
//                 pagedArchivedRows.map((row, index) => (
//                   <tr
//                     key={row.ticketNumber || row.siNo}
//                     style={rowBaseStyle(index)}
//                   >
//                     {/* Serial number across pages */}
//                     <td style={centerCellStyle}>
//                       {(archivedPage - 1) * archivedPageSize + index + 1}
//                     </td>
//                     <td style={leftCellStyle}>{row.agentName}</td>
//                     <td style={leftCellStyle}>{row.departmentName}</td>
//                     {/* <td style={centerCellStyle}>{row.totalArchivedTickets}</td> */}
//                     <td style={centerCellStyle}>{row.ticketNumber}</td>
//                     <td style={leftCellStyle}>{row.subject}</td>
//                     <td style={centerCellStyle}>{row.status}</td>
//                     <td style={centerCellStyle}>
//                       {formatToIST(row.createdTime)}
//                     </td>
//                     <td style={centerCellStyle}>
//                       {formatToIST(row.closedTime)}
//                     </td>
//                     <td style={centerCellStyle}>{row.resolutionTimeHours}</td>
//                   </tr>
//                 ))
//               )}
//             </tbody>

//             {/* Pagination footer if more than one page */}
//             {filteredArchivedRows.length > archivedPageSize && (
//               <tfoot>
//                 <tr>
//                   <td
//                     colSpan={archivedColumns.length}
//                     style={{ padding: 12, textAlign: "center" }}
//                   >
//                     <button
//                       onClick={() =>
//                         setArchivedPage((p) => Math.max(1, p - 1))
//                       }
//                       disabled={archivedPage === 1}
//                       style={{ marginRight: 8 }}
//                     >
//                       Prev
//                     </button>
//                     <span style={{ margin: "0 8px" }}>
//                       Page {archivedPage} of {archivedTotalPages}
//                     </span>
//                     <button
//                       onClick={() =>
//                         setArchivedPage((p) =>
//                           Math.min(archivedTotalPages, p + 1)
//                         )
//                       }
//                       disabled={archivedPage === archivedTotalPages}
//                       style={{ marginLeft: 8 }}
//                     >
//                       Next
//                     </button>
//                   </td>
//                 </tr>
//               </tfoot>
//             )}
//           </table>
//         ) : // 4. DEPARTMENT-WISE AGE TABLE VIEW
//         departmentViewEnabled ? (
//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "separate",
//               // borderRadius: 16,
//               fontSize: 12,
//               tableLayout: "auto",
//             }}
//           >
//             <thead>
//               <tr>
//                 <th style={serialHeaderStyle}>SI. No.</th>
//                 <th style={{ ...headerStyle3D, textAlign: "left" }}>
//                   Department Name
//                 </th>
//                 <th style={headerStyle3D}>Total Ticket Count</th>
//                 <th style={headerStyle3D}>1 - 7 Days Tickets</th>
//                 <th style={headerStyle3D}>8 - 15 Days Tickets</th>
//                 <th style={headerStyle3D}>15+ Days Tickets</th>
//               </tr>
//             </thead>
//             <tbody>
//               {/* No department data */}
//               {!departmentRowsForDisplay ||
//               departmentRowsForDisplay.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={6}
//                     style={{
//                       textAlign: "center",
//                       padding: 16,
//                       color: "Black",
//                       fontSize: 12,
//                       background: "#181b26",
//                       // borderRadius: 14,
//                     }}
//                   >
//                     No department ticket data available
//                   </td>
//                 </tr>
//               ) : (
//                 departmentRowsForDisplay.map((row, idx) => (
//                   <tr key={row.departmentName} style={rowBaseStyle(idx)}>
//                     <td style={centerCellStyle}>{row.si}</td>
//                     <td style={leftCellStyle}>{row.departmentName}</td>
//                     <td style={centerCellStyle}>{row.total}</td>

//                     {/* Three age buckets (1-7 / 8-15 / 15+) */}
//                     {["1_7", "8_15", "15plus"].map((bucket) => (
//                       <td key={bucket} style={centerCellStyle}>
//                         {/* If no status filter is selected → show single total with tooltip of all ticket numbers */}
//                         {normalizedStatusKeys.length === 0 ? (
//                           <Tippy
//                             content={
//                               statusOrder
//                                 .map(
//                                   (statusKey) =>
//                                     row[
//                                       `tickets_${bucket}_${statusKey}_numbers`
//                                     ] || []
//                                 )
//                                 .reduce((a, b) => a.concat(b), [])
//                                 .join(", ") || "No tickets"
//                             }
//                           >
//                             <span
//                               style={{
//                                 fontWeight: 900,
//                                 fontSize: "12px",
//                                 color: "White",
//                                 background: "none",
//                                 // borderRadius: "8px",
//                                 padding: "2px 0",
//                                 minWidth: "40px",
//                                 minHeight: "10px",
//                                 textAlign: "center",
//                                 display: "inline-block",
//                               }}
//                             >
//                               {statusOrder.reduce(
//                                 (sum, key) =>
//                                   sum + (row[`tickets_${bucket}_${key}`] ?? 0),
//                                 0
//                               )}
//                             </span>
//                           </Tippy>
//                         ) : (
//                           // If statuses are selected → show colored boxes per status
//                           <div
//                             style={{
//                               display: "flex",
//                               justifyContent: "center",
//                               alignItems: "center",
//                             }}
//                           >
//                             {normalizedStatusKeys.map((statusKey) => (
//                               <Tippy
//                                 key={statusKey}
//                                 content={
//                                   ticketNumbersForDeptRow(
//                                     row,
//                                     bucket,
//                                     statusKey
//                                   ).length > 0
//                                     ? ticketNumbersForDeptRow(
//                                         row,
//                                         bucket,
//                                         statusKey
//                                       ).join(", ")
//                                     : "No tickets"
//                                 }
//                               >
//                                 <span
//                                   className={`agent-status-box ${statusKey}`}
//                                   style={{
//                                     background: "#15171a",
//                                     color: "White",
//                                     // borderRadius: "12px",
//                                     fontWeight: 900,
//                                     fontSize: "12px",
//                                     minWidth: "40px",
//                                     minHeight: "36px",
//                                     margin: "2px 6px",
//                                     textAlign: "center",
//                                     boxShadow: "0 2px 8px #0a0a0a",
//                                     border: "none",
//                                     borderTop: `6px solid ${
//                                       statusColors[statusKey] || "#fff"
//                                     }`,
//                                     display: "inline-flex",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                     fontFamily: baseFont,
//                                   }}
//                                   title={
//                                     statusKey.charAt(0).toUpperCase() +
//                                     statusKey.slice(1) +
//                                     " tickets"
//                                   }
//                                 >
//                                   {row[`tickets_${bucket}_${statusKey}`] ?? 0}
//                                 </span>
//                               </Tippy>
//                             ))}
//                           </div>
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         ) : (
//           // 5. AGENT-WISE TICKET AGE TABLE VIEW (default)
//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "separate",
//               borderRadius: 16,
//               fontSize: 12,
//               tableLayout: "auto",
//             }}
//           >
//             <thead>
//               <tr>
//                 {columnsToShow.map((col) => (
//                   <th
//                     key={col.key}
//                     style={
//                       col.key === "serial"
//                         ? serialHeaderStyle
//                         : col.key === "name" || col.key === "department"
//                         ? { ...headerStyle3D, textAlign: "left" }
//                         : headerStyle3D
//                     }
//                   >
//                     {col.label}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {/* No agent data */}
//               {tableRowsForDisplay.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={columnsToShow.length}
//                     style={{
//                       textAlign: "center",
//                       padding: 16,
//                       color: "Black",
//                       fontSize: 12,
//                       background: "#181b26",
//                       borderRadius: 14,
//                     }}
//                   >
//                     {selectedDepartmentId &&
//                     departmentsMap?.[selectedDepartmentId]?.name ? (
//                       <>
//                         Looks like the{" "}
//                         <span style={{ fontWeight: 900 }}>
//                           {departmentsMap[selectedDepartmentId].name}
//                         </span>{" "}
//                         department has no tickets right now.
//                       </>
//                     ) : (
//                       "No data available"
//                     )}
//                   </td>
//                 </tr>
//               ) : (
//                 tableRowsForDisplay.map((row, rowIndex) => (
//                   <tr key={row.name} style={rowBaseStyle(rowIndex)}>
//                     {/* Serial number */}
//                     <td
//                       style={
//                         hoveredRowIndex === rowIndex
//                           ? centerCellStyleHovered
//                           : centerCellStyle
//                       }
//                     >
//                       {rowIndex + 1}
//                     </td>

//                     {/* Agent name with row hover effect */}
//                     <td
//                       style={{
//                         ...(hoveredRowIndex === rowIndex
//                           ? { ...leftCellStyle, background: "#2446a3" }
//                           : leftCellStyle),
//                       }}
//                       onMouseEnter={() => setHoveredRowIndex(rowIndex)}
//                       onMouseLeave={() => setHoveredRowIndex(null)}
//                     >
//                       {row.name}
//                     </td>

//                     {/* Department name (only when department filter is active) */}
//                     {selectedDepartmentId && (
//                       <td style={leftCellStyle}>{row.departmentName}</td>
//                     )}

//                     {/* Total tickets across all visible age columns and statuses */}
//                     <td
//                       style={
//                         hoveredRowIndex === rowIndex
//                           ? centerCellStyleHovered
//                           : centerCellStyle
//                       }
//                     >
//                       {visibleAgeColumns.reduce(
//                         (sum, col) =>
//                           sum +
//                           countFromArray(row, col.ageProp, "open") +
//                           countFromArray(row, col.ageProp, "hold") +
//                           countFromArray(row, col.ageProp, "inProgress") +
//                           countFromArray(row, col.ageProp, "escalated"),
//                         0
//                       )}
//                     </td>

//                     {/* Per-age bucket cells */}
//                     {visibleAgeColumns.map((col) => (
//                       <td
//                         key={col.key}
//                         style={
//                           hoveredRowIndex === rowIndex
//                             ? centerCellStyleHovered
//                             : centerCellStyle
//                         }
//                       >
//                         {/* If no status filter is selected, show single aggregated number with tooltip for all tickets */}
//                         {normalizedStatusKeys.length === 0 ? (
//                           <Tippy
//                             content={
//                               statusOrder
//                                 .map((key) =>
//                                   aggregateTickets(row, col.ageProp, key)
//                                 )
//                                 .reduce((a, b) => a.concat(b), [])
//                                 .join(", ") || "No tickets"
//                             }
//                           >
//                             <span
//                               style={{
//                                 fontWeight: 900,
//                                 fontSize: "12px",
//                                 color: "Black",
//                                 background: "none",
//                                 borderRadius: "8px",
//                                 padding: "5px 0",
//                                 minWidth: "40px",
//                                 minHeight: "10px",
//                                 textAlign: "center",
//                                 display: "inline-block",
//                               }}
//                               title="Total tickets in this age range"
//                             >
//                               {statusOrder.reduce(
//                                 (sum, key) =>
//                                   sum +
//                                   countFromArray(row, col.ageProp, key),
//                                 0
//                               )}
//                             </span>
//                           </Tippy>
//                         ) : (
//                           // If status filters are active: show a box per status with count and top colored border
//                           <div
//                             style={{
//                               display: "flex",
//                               justifyContent: "center",
//                               alignItems: "center",
//                             }}
//                           >
//                             {normalizedStatusKeys.map((statusKey) => (
//                               <Tippy
//                                 key={statusKey}
//                                 content={
//                                   aggregateTickets(
//                                     row,
//                                     col.ageProp,
//                                     statusKey
//                                   ).length > 0
//                                     ? aggregateTickets(
//                                         row,
//                                         col.ageProp,
//                                         statusKey
//                                       ).join(", ")
//                                     : "No tickets"
//                                 }
//                               >
//                                 <span
//                                   style={{
//                                     background: "#15171a",
//                                     color: "white",
//                                     borderRadius: "12px",
//                                     fontWeight: 900,
//                                     fontSize: "12px",
//                                     minWidth: "45px",
//                                     minHeight: "36px",
//                                     margin: "2px 6px",
//                                     textAlign: "center",
//                                     // boxShadow: "0 2px 8px #0a0a0a",
//                                     border: "none",
//                                     borderTop: `6px solid ${
//                                       statusColors[statusKey] || "#fff"
//                                     }`,
//                                     display: "inline-flex",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                     fontFamily: baseFont,
//                                   }}
//                                   title={
//                                     statusKey.charAt(0).toUpperCase() +
//                                     statusKey.slice(1) +
//                                     " tickets"
//                                   }
//                                 >
//                                   {countFromArray(
//                                     row,
//                                     col.ageProp,
//                                     statusKey
//                                   )}
//                                 </span>
//                               </Tippy>
//                             ))}
//                           </div>
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }