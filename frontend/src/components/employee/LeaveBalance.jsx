import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faCalendarCheck,
  faCalendarMinus,
  faClock,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getMyLeaveBalance, getMyLeaves } from '../../services/leaveService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ── Month Calendar ──────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const LeaveCalendar = ({ leaves }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoveredDay, setHoveredDay] = useState(null);

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  // Build map of date → { status, leaveType, startDate, endDate }
  const leaveDays = useMemo(() => {
    const map = {};
    (leaves || []).forEach((l) => {
      if (l.status === 'rejected' || l.status === 'withdrawn') return;
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key] || l.status === 'approved') {
          map[key] = {
            status: l.status,
            leaveType: l.leaveType,
            startDate: l.startDate,
            endDate: l.endDate,
          };
        }
      }
    });
    return map;
  }, [leaves]);

  // Count leaves this month
  const monthLeaveCount = useMemo(() => {
    let approved = 0;
    let pending = 0;
    for (let d = 1; d <= new Date(viewYear, viewMonth + 1, 0).getDate(); d++) {
      const info = leaveDays[`${viewYear}-${viewMonth}-${d}`];
      if (info?.status === 'approved') approved++;
      else if (info?.status === 'pending') pending++;
    }
    return { approved, pending };
  }, [leaveDays, viewYear, viewMonth]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalSlots = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalSlots; i++) {
    const dayNum = i - firstDay + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(dayNum);
    }
  }

  const isToday = (d) =>
    d && viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate();

  const getInfo = (d) => {
    if (!d) return null;
    return leaveDays[`${viewYear}-${viewMonth}-${d}`] || null;
  };

  const isSun = (i) => i % 7 === 0;

  const leaveTypeLabel = {
    sick: 'Sick', casual: 'Casual', earned: 'Earned', unpaid: 'Unpaid', other: 'Other',
  };

  const formatTip = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {MONTHS[viewMonth]} {viewYear}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {monthLeaveCount.approved > 0 && `${monthLeaveCount.approved} day${monthLeaveCount.approved > 1 ? 's' : ''} on leave`}
            {monthLeaveCount.approved > 0 && monthLeaveCount.pending > 0 && ' · '}
            {monthLeaveCount.pending > 0 && `${monthLeaveCount.pending} pending`}
            {monthLeaveCount.approved === 0 && monthLeaveCount.pending === 0 && 'No leaves this month'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToday}
            className="text-[11px] font-medium text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button onClick={prev} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <FontAwesomeIcon icon={faChevronLeft} className="text-[10px] text-gray-500" />
          </button>
          <button onClick={next} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-gray-500" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mt-4 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-1"></div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          const info = getInfo(day);
          const todayCell = isToday(day);
          const sunday = isSun(i);
          const hovered = hoveredDay === day && day !== null;

          return (
            <div
              key={i}
              className="relative flex items-center justify-center py-0.5"
              onMouseEnter={() => day && info && setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={`
                  w-9 h-9 flex flex-col items-center justify-center rounded-full text-[13px] font-medium transition-all
                  ${!day ? '' : ''}
                  ${day && !info && !todayCell ? (sunday ? 'text-gray-400' : 'text-gray-700') : ''}
                  ${day && info?.status === 'approved' ? 'bg-gray-900 text-white' : ''}
                  ${day && info?.status === 'pending' ? 'bg-gray-200 text-gray-700' : ''}
                  ${todayCell && !info ? 'ring-2 ring-gray-900 text-gray-900 font-bold' : ''}
                  ${todayCell && info?.status === 'approved' ? 'ring-2 ring-gray-400 ring-offset-1' : ''}
                  ${todayCell && info?.status === 'pending' ? 'ring-2 ring-gray-900 ring-offset-1' : ''}
                `}
              >
                {day || ''}
                {/* Small dot for pending */}
                {day && info?.status === 'pending' && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-gray-500"></span>
                )}
              </div>

              {/* Tooltip on hover */}
              {hovered && info && (
                <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg pointer-events-none">
                  <p className="font-semibold">{leaveTypeLabel[info.leaveType] || info.leaveType} Leave</p>
                  <p className="text-gray-300 mt-0.5">
                    {formatTip(info.startDate)} — {formatTip(info.endDate)}
                  </p>
                  <p className="text-gray-400 mt-0.5 capitalize">{info.status}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-gray-900"></span>
          <span className="text-[11px] text-gray-500">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-gray-200"></span>
          <span className="text-[11px] text-gray-500">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-900"></span>
          <span className="text-[11px] text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────
const LeaveBalance = ({ refreshTrigger }) => {
  const [balance, setBalance] = useState(null);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, leavesRes] = await Promise.all([
          getMyLeaveBalance(),
          getMyLeaves(),
        ]);
        setBalance(balanceRes.balance);
        setAllLeaves(leavesRes.leaves || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch leave data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  const recentLeaves = allLeaves.slice(0, 4);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-32 mb-6"></div>
            <div className="w-40 h-40 rounded-full bg-gray-100 mx-auto mb-6"></div>
            <div className="h-4 bg-gray-100 rounded w-24 mx-auto"></div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-20 mb-4"></div>
                <div className="h-8 bg-gray-100 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const total = balance?.totalLeaves ?? 0;
  const taken = balance?.leavesTaken ?? 0;
  const remaining = balance?.leavesRemaining ?? 0;
  const pending = balance?.pendingRequests ?? 0;
  const usagePercent = total > 0 ? Math.round((taken / total) * 100) : 0;

  const donutData = [
    { name: 'Taken', value: taken || 0 },
    { name: 'Remaining', value: remaining || 0 },
  ];

  const hasAllocation = total > 0 || taken > 0;

  const statusLabel = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Donut + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Chart Card */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500 mb-4">Leave Usage</p>

          {hasAllocation ? (
            <>
              <div className="relative w-44 h-44 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      <Cell fill="#111827" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{usagePercent}%</span>
                  <span className="text-xs text-gray-500">used</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mt-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-900"></span>
                  <span className="text-xs text-gray-600">Taken ({taken})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span>
                  <span className="text-xs text-gray-600">Remaining ({remaining})</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-sm text-gray-500">No allocation yet</p>
              <p className="text-xs text-gray-400 mt-1">Contact your admin</p>
            </div>
          )}
        </div>

        {/* Stat Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: 'Total Assigned', value: total, icon: faCalendarDays, sub: 'Annual quota' },
            { label: 'Leaves Taken', value: taken, icon: faCalendarCheck, sub: `${usagePercent}% of total` },
            { label: 'Remaining', value: remaining, icon: faCalendarMinus, sub: 'Available to use' },
            { label: 'Pending', value: pending, icon: faClock, sub: 'Awaiting review' },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <FontAwesomeIcon icon={card.icon} className="text-sm text-gray-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Calendar + Recent Activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Month Calendar */}
        <LeaveCalendar leaves={allLeaves} />

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-4">Recent Requests</p>

          {recentLeaves.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1)} Leave
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)} · {leave.numberOfDays}d
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                    {statusLabel[leave.status] || leave.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-sm text-gray-500">No requests yet</p>
              <p className="text-xs text-gray-400 mt-1">Apply for a leave to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveBalance;
