// backend/Application/agentPerformanceRoutes.js

// Small helper: parse Zoho duration strings like "20 days 04:40 hrs"
// into total hours as a number.
function parseZohoDurationToHours(str) {
  if (!str || typeof str !== "string") return 0;

  const s = str.trim().toLowerCase();

  // pattern 1: "20 days 04:40 hrs"
  let m = s.match(/(\d+)\s*days?\s+(\d{1,2}):(\d{2})\s*hrs?/);
  if (m) {
    const days = parseInt(m[1], 10) || 0;
    const hours = parseInt(m[2], 10) || 0;
    const minutes = parseInt(m[3], 10) || 0;
    return days * 24 + hours + minutes / 60;
  }

  // pattern 2: "04:40 hrs"
  m = s.match(/(\d{1,2}):(\d{2})\s*hrs?/);
  if (m) {
    const hours = parseInt(m[1], 10) || 0;
    const minutes = parseInt(m[2], 10) || 0;
    return hours + minutes / 60;
  }

  // pattern 3: plain number in hours, e.g. "5" or "5 hrs"
  m = s.match(/(\d+(\.\d+)?)/);
  if (m) {
    return parseFloat(m[1]) || 0;
  }

  return 0;
}

// Helper: check if ticket is in date range
function isTicketInRange(ticket, fromDateObj, toDateObj) {
  if (!fromDateObj && !toDateObj) return true;

  const created = ticket.createdTime ? new Date(ticket.createdTime) : null;
  const closed = ticket.closedTime ? new Date(ticket.closedTime) : null;

  // Use closedTime if present, else createdTime
  const ref = closed || created;
  if (!ref || Number.isNaN(ref.getTime())) return false;

  if (fromDateObj && ref < fromDateObj) return false;
  if (toDateObj && ref > toDateObj) return false;

  return true;
}

// Main registration function
function registerAgentPerformanceRoutes(app, helpers) {
  const {
    getAccessToken,
    fetchAllTickets,
    fetchAllArchivedTickets,
    fetchTicketMetricsForTickets,
    departmentList,
  } = helpers;

  // NEW: Agent Performance (custom) endpoint
  app.get("/api/agent-performance", async (req, res) => {
    try {
      const { fromDate, toDate, departmentId, agentId } = req.query;

      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;

      const accessToken = await getAccessToken();

      // 1) Active tickets (open/hold/inProgress/escalated/closed)
      const deptIds =
        departmentId && departmentId !== "all" ? [departmentId] : [];
      const activeTickets = await fetchAllTickets(
        accessToken,
        deptIds,
        agentId || null
      );

      // 2) Archived tickets (per department)
      let archivedTickets = [];
      const departmentsToUse =
        departmentId && departmentId !== "all"
          ? departmentList.filter((d) => d.id === departmentId)
          : departmentList;

      for (const dep of departmentsToUse) {
        const batch = await fetchAllArchivedTickets(accessToken, dep.id);
        archivedTickets = archivedTickets.concat(batch || []);
      }

      // 3) Normalize + filter by agent/date
      let allTickets = activeTickets.concat(archivedTickets);

      if (agentId && agentId !== "all") {
        allTickets = allTickets.filter(
          (t) => String(t.assigneeId || "") === String(agentId)
        );
      }

      if (fromDateObj || toDateObj) {
        allTickets = allTickets.filter((t) =>
          isTicketInRange(t, fromDateObj, toDateObj)
        );
      }

      if (!allTickets.length) {
        return res.json({ summary: {}, agents: [] });
      }

      // 4) Fetch metrics for these tickets
      const metricRows = await fetchTicketMetricsForTickets(
        accessToken,
        allTickets
      );

      // Build quick lookup: ticketId -> status/assignee for aggregation
      const ticketMetaMap = {};
      allTickets.forEach((t) => {
        const key = String(t.id || t.ticketNumber || "");
        if (!key) return;
        ticketMetaMap[key] = {
          status: (t.status || "").toLowerCase(),
          assigneeId: t.assigneeId || "",
          assigneeName:
            (t.assignee && t.assignee.displayName) ||
            t.assigneeName ||
            "",
        };
      });

      // sets of "resolved" and "pending" statuses
      const resolvedStatusSet = new Set(["closed", "resolved", "archived"]);
      const pendingStatusSet = new Set([
        "open",
        "hold",
        "inprogress",
        "in progress",
        "escalated",
      ]);

      // 5) Group metrics by agent
      const agentsMap = {};
      metricRows.forEach((row) => {
        const ticketKey = String(row.ticketNumber || row.id || "");
        const meta = ticketMetaMap[ticketKey] || {};

        const rawStatus = meta.status || (row.status || "").toLowerCase();
        const status = rawStatus.trim();
        const agentName =
          row.agentName ||
          meta.assigneeName ||
          "Unassigned";

        if (!agentsMap[agentName]) {
          agentsMap[agentName] = {
            agentName,
            // track unique ticket assignment
            ticketIds: new Set(),
            resolvedTicketIds: new Set(),
            pendingTicketIds: new Set(),

            totalResolutionHours: 0,
            totalFirstResponseHours: 0,
            totalThreads: 0,

            escalatedCount: 0,
            singleTouchCount: 0,

            // optional satisfaction
            satisfactionSum: 0,
            satisfactionCount: 0,
          };
        }

        const bucket = agentsMap[agentName];

        if (ticketKey) {
          bucket.ticketIds.add(ticketKey);

          if (resolvedStatusSet.has(status)) {
            bucket.resolvedTicketIds.add(ticketKey);
          } else if (pendingStatusSet.has(status)) {
            bucket.pendingTicketIds.add(ticketKey);
          }
        }

        // Convert Zoho durations to hours
        const resHrs = parseZohoDurationToHours(row.resolutionTime);
        bucket.totalResolutionHours += resHrs;

        const firstResHrs = parseZohoDurationToHours(row.firstResponseTime);
        bucket.totalFirstResponseHours += firstResHrs;

        // Threads / responses
        const threadCount = Number(row.threadCount || row.responseCount || 0);
        bucket.totalThreads += threadCount;

        // Escalated
        if (status === "escalated") {
          bucket.escalatedCount += 1;
        }

        // Single touch: 1 agent response / 1 thread
        if (threadCount === 1) {
          bucket.singleTouchCount += 1;
        }

        // Satisfaction (if you later add a rating field to metrics)
        // const rating = Number(row.satisfactionRating || 0);
        // if (!Number.isNaN(rating) && rating > 0) {
        //   bucket.satisfactionSum += rating;
        //   bucket.satisfactionCount += 1;
        // }
      });

      // 6) Finalize per-agent stats
  const agents = Object.values(agentsMap).map((a) => {
  const ticketsCreated = a.ticketIds.size;
  const ticketsResolved = a.resolvedTicketIds.size;
  const pendingTickets = a.pendingTicketIds.size;

  const avgResolutionHours =
    ticketsResolved > 0 ? a.totalResolutionHours / ticketsResolved : 0;

  // Count how many tickets actually have a first response
  // Here we approximate it as all tickets that contributed to totalFirstResponseHours:
  const ticketsWithFirstResponse =
    a.totalFirstResponseHours > 0 ? ticketsCreated : 0;

  const avgFirstResponseHours =
    ticketsWithFirstResponse > 0
      ? a.totalFirstResponseHours / ticketsWithFirstResponse
      : 0;

  const avgThreads =
    ticketsCreated > 0 ? a.totalThreads / ticketsCreated : 0;

  const avgSatisfaction =
    a.satisfactionCount > 0
      ? a.satisfactionSum / a.satisfactionCount
      : null;

  return {
    agentName: a.agentName,
    ticketsCreated,
    ticketsResolved,
    pendingTickets,
    avgResolutionHours,
    avgFirstResponseHours, // updated logic
    avgThreads,
    escalatedCount: a.escalatedCount,
    singleTouchCount: a.singleTouchCount,
    avgSatisfaction,
  };
});



      // 7) Overall summary for top KPIs (optional)
      const summary = agents.reduce(
        (acc, a) => {
          acc.ticketsCreated += a.ticketsCreated;
          acc.ticketsResolved += a.ticketsResolved;
          acc.pendingTickets += a.pendingTickets;
          acc.escalatedTickets += a.escalatedCount;
          acc.singleTouchTickets += a.singleTouchCount;
          acc.totalThreads += a.avgThreads * a.ticketsCreated;
          acc.totalResolutionHours += a.avgResolutionHours * a.ticketsResolved;
          acc.totalFirstResponseHours +=
            a.avgFirstResponseHours * a.ticketsCreated;
          return acc;
        },
        {
          ticketsCreated: 0,
          ticketsResolved: 0,
          pendingTickets: 0,
          escalatedTickets: 0,
          singleTouchTickets: 0,
          totalThreads: 0,
          totalResolutionHours: 0,
          totalFirstResponseHours: 0,
        }
      );

      summary.avgThreads =
        summary.ticketsCreated > 0
          ? summary.totalThreads / summary.ticketsCreated
          : 0;
      summary.avgResolutionHours =
        summary.ticketsResolved > 0
          ? summary.totalResolutionHours / summary.ticketsResolved
          : 0;
      summary.avgFirstResponseHours =
        summary.ticketsCreated > 0
          ? summary.totalFirstResponseHours / summary.ticketsCreated
          : 0;

      return res.json({ summary, agents });
    } catch (err) {
      console.error("Error in /api/agent-performance", err.message);
      res
        .status(500)
        .json({ error: "Failed to compute agent performance" });
    }
  });
}

module.exports = registerAgentPerformanceRoutes;
