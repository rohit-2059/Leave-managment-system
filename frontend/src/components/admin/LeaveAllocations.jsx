import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faEdit,
  faSave,
  faXmark,
  faUser,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import {
  getAllLeaveAllocations,
  setLeaveAllocation,
  updateLeaveAllocation,
} from '../../services/leaveAllocationService';

const LeaveAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [unallocated, setUnallocated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [assignValue, setAssignValue] = useState('20');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const response = await getAllLeaveAllocations();
      setAllocations(response.allocations || []);
      setUnallocated(response.unallocatedEmployees || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch allocations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  const handleUpdate = async (allocationId) => {
    const value = parseInt(editValue);
    if (isNaN(value) || value < 0 || value > 365) {
      toast.error('Enter a valid number between 0 and 365');
      return;
    }
    setActionLoading(true);
    try {
      await updateLeaveAllocation(allocationId, value);
      toast.success('Leave allocation updated');
      setEditingId(null);
      setEditValue('');
      fetchAllocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (employeeId) => {
    const value = parseInt(assignValue);
    if (isNaN(value) || value < 0 || value > 365) {
      toast.error('Enter a valid number between 0 and 365');
      return;
    }
    setActionLoading(true);
    try {
      await setLeaveAllocation(employeeId, value);
      toast.success('Leave allocation assigned');
      setAssigningId(null);
      setAssignValue('20');
      fetchAllocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Allocated Employees */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-4">{allocations.length} employees with allocations</p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : allocations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <FontAwesomeIcon icon={faCalendarCheck} className="text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600">No leave allocations yet</p>
            <p className="text-sm text-gray-500 mt-1">Assign leaves to employees below</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taken</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                          <FontAwesomeIcon icon={faUser} className="text-gray-600 text-xs" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{alloc.employeeId?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{alloc.employeeId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-3">
                      {editingId === alloc._id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          min={0}
                          max={365}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded">{alloc.totalLeaves}</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded">{alloc.leavesTaken}</span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded">{alloc.leavesRemaining}</span>
                    </td>
                    <td className="text-right py-3 px-3">
                      {editingId === alloc._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(alloc._id)}
                            disabled={actionLoading}
                            className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faSave} className="text-xs" />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditValue(''); }}
                            className="p-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <FontAwesomeIcon icon={faXmark} className="text-xs" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(alloc._id); setEditValue(String(alloc.totalLeaves)); }}
                          className="p-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Edit allocation"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unallocated Employees */}
      {unallocated.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-4">
            {unallocated.length} employee{unallocated.length !== 1 ? 's' : ''} without leave allocation
          </p>

          <div className="space-y-3">
            {unallocated.map((emp) => (
              <div
                key={emp._id}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-gray-600 text-xs" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
                </div>

                {assigningId === emp._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={assignValue}
                      onChange={(e) => setAssignValue(e.target.value)}
                      min={0}
                      max={365}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="20"
                    />
                    <button
                      onClick={() => handleAssign(emp._id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => { setAssigningId(null); setAssignValue('20'); }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAssigningId(emp._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    Allocate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAllocations;
