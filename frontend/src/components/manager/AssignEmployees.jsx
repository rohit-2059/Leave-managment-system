import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUserPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getUnassignedEmployees, assignEmployee, getAllEmployees } from '../../services/userService';

const AssignEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = showAll 
        ? await getAllEmployees() 
        : await getUnassignedEmployees();
      
      setEmployees(showAll ? response.employees : response.employees);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch employees';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAssign = async (employeeId, employeeName) => {
    if (!window.confirm(`Add ${employeeName} to your team?`)) {
      return;
    }

    try {
      const response = await assignEmployee(employeeId);
      toast.success(response.message || `${employeeName} added to your team!`);
      fetchEmployees(); // Refresh list
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to assign employee';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faUserPlus} className="text-lg sm:text-xl text-gray-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Assign Employees</h2>
          <p className="text-xs sm:text-sm text-gray-600">Add employees to your team</p>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => setShowAll(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !showAll
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FontAwesomeIcon icon={faUser} className="mr-2" />
          Unassigned Only
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            showAll
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FontAwesomeIcon icon={faUsers} className="mr-2" />
          All Employees
        </button>
      </div>

      {/* Employee Count */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-900">
          <strong>{employees.length}</strong> {showAll ? 'total' : 'unassigned'} employee{employees.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Employees List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-500 mb-3" />
          <p className="text-gray-600">
            {showAll ? 'No employees found in the system' : 'No unassigned employees available'}
          </p>
          {!showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 text-sm text-gray-700 hover:text-gray-900 underline"
            >
              View all employees
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((employee) => (
            <div
              key={employee._id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 w-full">
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faUser} className="text-gray-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {employee.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{employee.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] sm:text-xs text-gray-600">
                      {employee.authProvider === 'google' ? 'Google' : 'Local'}
                    </span>
                    {employee.managerId && (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-gray-900 text-white">
                        Already Assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAssign(employee._id, employee.name)}
                disabled={employee.managerId && !showAll}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium
                           hover:bg-gray-800 active:bg-gray-700
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                {employee.managerId ? 'Reassign' : 'Add to Team'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignEmployees;
