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
    const dist: Record<string, number> = {};

    filteredCards.forEach((card) => {
      const serviceType = card.serviceType || "General Service";
      dist[serviceType] = (dist[serviceType] || 0) + 1;
    });

    return Object.entries(dist)
      .map(([type, count]) => ({ type, count }))
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

      {/* Staff Performance Table */}
      {staffPerformance.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-slate-100 p-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <Users className="w-4 h-4" />
              <span>{isTe ? "సిబ్బంది పనితీరు విశ్లేషణ" : "Staff Performance Analysis"}</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-slate-200">
                  <th className="text-left p-2 font-bold text-slate-700">{isTe ? "నామం" : "Name"}</th>
                  <th className="text-center p-2 font-bold text-slate-700">{isTe ? "నమూనాలు" : "Jobs"}</th>
                  <th className="text-center p-2 font-bold text-slate-700">{isTe ? "సంపూర్ణం%" : "Completion%"}</th>
                  <th className="text-right p-2 font-bold text-slate-700">{isTe ? "ఆదాయం" : "Revenue"}</th>
                  <th className="text-center p-2 font-bold text-slate-700">{isTe ? "సగటు సమయం" : "Avg Hrs"}</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((staff, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">{staff.name}</td>
                    <td className="text-center p-2 text-slate-700">{staff.count}</td>
                    <td className="text-center p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        staff.completionRate >= 80 ? "bg-emerald-100 text-emerald-800" :
                        staff.completionRate >= 60 ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {staff.completionRate}%
                      </span>
                    </td>
                    <td className="text-right p-2 font-mono font-bold text-slate-900">
                      ₹{Number(staff.totalRevenue).toLocaleString()}
                    </td>
                    <td className="text-center p-2 text-slate-700">{staff.avgHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Performance Trend - VISUAL GRAPH */}
      {dailyTrend.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-slate-100 p-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <TrendingUp className="w-4 h-4" />
              <span>{isTe ? "దైనిక నిష్పత్తి ప్రవృత్తి" : "Daily Performance Trend"}</span>
            </div>
          </div>
          <div className="p-4">
            {/* Bar Chart - Jobs Completed vs Open */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-700 mb-2">{isTe ? "సేవ పరిస్థితి (బార్ చార్ట్)" : "Service Status (Bar Chart)"}</div>
              <div className="flex gap-1 overflow-x-auto pb-2" style={{minHeight: '120px'}}>
                {dailyTrend.slice(-14).map((day, idx) => {
                  const maxJobs = Math.max(...dailyTrend.map(d => d.count));
                  const completedHeight = (day.jobsCompleted / (maxJobs || 1)) * 100;
                  const openHeight = (day.jobsOpen / (maxJobs || 1)) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="flex gap-0.5 items-end" style={{height: '80px'}}>
                        <div
                          className="bg-emerald-500 rounded-t opacity-80 transition-all"
                          style={{width: '8px', height: `${completedHeight}%`, minHeight: day.jobsCompleted > 0 ? '4px' : '0'}}
                          title={`Completed: ${day.jobsCompleted}`}
                        />
                        <div
                          className="bg-amber-500 rounded-t opacity-80 transition-all"
                          style={{width: '8px', height: `${openHeight}%`, minHeight: day.jobsOpen > 0 ? '4px' : '0'}}
                          title={`Open: ${day.jobsOpen}`}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-600 text-center">{day.date.split('-')[2] || day.date.split('-')[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 text-[10px] mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded"></div>
                  <span>{isTe ? "సంపూర్ణం" : "Completed"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-amber-500 rounded"></div>
                  <span>{isTe ? "తెరిచి" : "Open"}</span>
                </div>
              </div>
            </div>

            {/* Revenue Trend */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">{isTe ? "రాబడి ప్రవృత్తి" : "Revenue Trend"}</div>
              <div className="flex gap-1 overflow-x-auto pb-2" style={{minHeight: '100px'}}>
                {dailyTrend.slice(-14).map((day, idx) => {
                  const maxRevenue = Math.max(...dailyTrend.map(d => d.revenue));
                  const revenueHeight = (day.revenue / (maxRevenue || 1)) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div
                        className="bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t opacity-85 transition-all"
                        style={{width: '10px', height: `${revenueHeight}%`, minHeight: day.revenue > 0 ? '4px' : '0'}}
                        title={`₹${Number(day.revenue).toLocaleString()}`}
                      />
                      <span className="text-[9px] font-mono text-slate-600 text-center">{day.date.split('-')[2] || day.date.split('-')[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 text-[10px] mt-2">
                <div className="w-2 h-2 bg-gradient-to-t from-indigo-500 to-purple-400 rounded"></div>
                <span>{isTe ? "రాబడి" : "Revenue"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
