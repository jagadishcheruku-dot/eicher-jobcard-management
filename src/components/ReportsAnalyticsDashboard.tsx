import React, { useMemo } from "react";
import { BarChart3, TrendingUp, Users, Calendar, Wrench, Target, AlertCircle } from "lucide-react";

export interface ReportsAnalyticsDashboardProps {
  allCards: any[];
  allStaff: any[];
  attendanceRecords: any;
  language?: "te" | "en";
  dateFrom?: string;
  dateTo?: string;
  selectedMechanic?: string;
  selectedSupervisor?: string;
}

export const ReportsAnalyticsDashboard: React.FC<ReportsAnalyticsDashboardProps> = ({
  allCards = [],
  allStaff = [],
  attendanceRecords = {},
  language = "te",
  dateFrom = "",
  dateTo = "",
  selectedMechanic = "all",
  selectedSupervisor = "all",
}) => {
  const isTe = language === "te";

  // Filter cards based on date range and staff selection
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const cardDate = card.date || card.jobDate || card.complaintDate || "";
      if (dateFrom && cardDate < dateFrom) return false;
      if (dateTo && cardDate > dateTo) return false;
      if (selectedMechanic !== "all" && card.mechanicName !== selectedMechanic) return false;
      if (selectedSupervisor !== "all" && card.wsIncharge !== selectedSupervisor) return false;
      return true;
    });
  }, [allCards, dateFrom, dateTo, selectedMechanic, selectedSupervisor]);

  // Calculate staff performance metrics
  const staffPerformance = useMemo(() => {
    const metrics: Record<string, any> = {};

    filteredCards.forEach((card) => {
      const mechanic = card.mechanicName || "Unassigned";
      if (!metrics[mechanic]) {
        metrics[mechanic] = {
          name: mechanic,
          jobsCompleted: 0,
          jobsOpen: 0,
          totalRevenue: 0,
          totalSpares: 0,
          totalLabour: 0,
          avgHours: 0,
          totalHours: 0,
          count: 0,
        };
      }
      metrics[mechanic].count++;
      metrics[mechanic].totalRevenue += Number(card.grandTotal || card.amount || 0);
      metrics[mechanic].totalSpares += Number(card.sparesAmount || card.sparesTotal || 0);
      metrics[mechanic].totalLabour += Number(card.labourAmount || card.labourCharges || 0);
      metrics[mechanic].totalHours += Number(card.hoursRun || card.hourMeter || 0);

      if (card.status === "Closed" || card.actualClosedDate) {
        metrics[mechanic].jobsCompleted++;
      } else {
        metrics[mechanic].jobsOpen++;
      }
    });

    return Object.values(metrics)
      .map((m: any) => ({
        ...m,
        avgHours: m.count > 0 ? (m.totalHours / m.count).toFixed(1) : 0,
        completionRate: m.count > 0 ? ((m.jobsCompleted / m.count) * 100).toFixed(0) : 0,
        revenuePerJob: m.count > 0 ? (m.totalRevenue / m.count).toFixed(0) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCards]);

  // Calculate attendance metrics
  const attendanceMetrics = useMemo(() => {
    const metrics: Record<string, any> = {};

    allStaff.forEach((staff) => {
      const staffName = staff.name || staff.staffName || "";
      const staffAttendance = attendanceRecords[dateFrom] || {};

      if (!metrics[staffName]) {
        metrics[staffName] = {
          name: staffName,
          role: staff.role || "Staff",
          presentDays: 0,
          absentDays: 0,
          totalWorkingDays: 0,
        };
      }

      // Count attendance if available
      if (staffAttendance[staffName]) {
        metrics[staffName].presentDays++;
      }
      metrics[staffName].totalWorkingDays = Math.max(metrics[staffName].totalWorkingDays, 1);
    });

    return Object.values(metrics).map((m: any) => ({
      ...m,
      attendancePercentage:
        m.totalWorkingDays > 0 ? ((m.presentDays / m.totalWorkingDays) * 100).toFixed(0) : 0,
    }));
  }, [allStaff, attendanceRecords, dateFrom]);

  // Calculate daily performance trend
  const dailyTrend = useMemo(() => {
    const trend: Record<string, any> = {};

    filteredCards.forEach((card) => {
      const cardDate = card.date || card.jobDate || "";
      if (!cardDate) return;

      if (!trend[cardDate]) {
        trend[cardDate] = {
          date: cardDate,
          jobsCompleted: 0,
          jobsOpen: 0,
          revenue: 0,
          count: 0,
        };
      }

      trend[cardDate].count++;
      trend[cardDate].revenue += Number(card.grandTotal || 0);

      if (card.status === "Closed" || card.actualClosedDate) {
        trend[cardDate].jobsCompleted++;
      } else {
        trend[cardDate].jobsOpen++;
      }
    });

    return Object.values(trend).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [filteredCards]);

  // Service type distribution
  const serviceDistribution = useMemo(() => {
    // Group by a whitespace/case-insensitive key so trivial formatting
    // differences (e.g. "POST WRY" vs "POSTWRY") don't split one service
    // type into separate rows - the display label keeps whichever variant
    // was seen first.
    const dist: Record<string, { label: string; count: number }> = {};

    filteredCards.forEach((card) => {
      const label = String(card.serviceType || "General Service").trim() || "General Service";
      const key = label.replace(/\s+/g, "").toUpperCase();
      if (!dist[key]) {
        dist[key] = { label, count: 0 };
      }
      dist[key].count++;
    });

    return Object.values(dist)
      .map(({ label, count }) => ({ type: label, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCards]);

  return (
    <div className="space-y-4 text-xs">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-600 font-bold">{isTe ? "మొత్తం నమూనాలు" : "Total Jobs"}</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{filteredCards.length}</div>
          <div className="text-[11px] text-blue-700 mt-1">
            {isTe ? "ఎంచుకున్న సమయం" : "Selected Period"}
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-600 font-bold">{isTe ? "సంపూర్ణ నమూనాలు" : "Completed"}</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">
            {filteredCards.filter((c) => c.status === "Closed").length}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {filteredCards.length > 0
              ? ((filteredCards.filter((c) => c.status === "Closed").length / filteredCards.length) * 100).toFixed(0)
              : 0}
            % {isTe ? "సంపూర్ణ" : "Complete"}
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-600 font-bold">{isTe ? "మొత్తం ఆదాయం" : "Total Revenue"}</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">
            ₹{(filteredCards.reduce((sum, c) => sum + Number(c.grandTotal || 0), 0) / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-indigo-700 mt-1">
            {isTe ? "సేవ నుండి" : "From Services"}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-600 font-bold">{isTe ? "సగటు విలువ" : "Avg Job Value"}</span>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">
            ₹{filteredCards.length > 0 ? (filteredCards.reduce((sum, c) => sum + Number(c.grandTotal || 0), 0) / filteredCards.length).toFixed(0) : 0}
          </div>
          <div className="text-[11px] text-purple-700 mt-1">
            {isTe ? "సేవకు" : "Per Service"}
          </div>
        </div>
      </div>


      {/* Service Type Distribution */}
      {serviceDistribution.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-slate-100 p-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <BarChart3 className="w-4 h-4" />
              <span>{isTe ? "సేవ రకం పంపిణీ" : "Service Type Distribution"}</span>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {serviceDistribution.map((service, idx) => {
              const maxCount = Math.max(...serviceDistribution.map((s) => s.count));
              const percentage = (service.count / maxCount) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{service.type}</span>
                    <span className="font-bold text-slate-700">{service.count} ({Math.round((service.count / filteredCards.length) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-center">
          <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-amber-900">
            {isTe
              ? "ఎంచుకున్న ఫిల్టర్‌ల కోసం ఎటువంటి డేటా లేదు"
              : "No data available for selected filters"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalyticsDashboard;
