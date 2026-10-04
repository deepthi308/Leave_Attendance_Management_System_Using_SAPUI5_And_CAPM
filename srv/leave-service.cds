using com.mandeep.leaveattendance as db from '../db/schema';

service LeaveService @(path: '/odata/v4/leave', description: 'Leave and Attendance Management Service') {

    @readonly
    entity Departments as projection on db.Departments;

    entity Employees as projection on db.Employees;

    @readonly
    entity LeaveTypes as projection on db.LeaveTypes;

    entity LeaveBalances as projection on db.LeaveBalances;

    entity LeaveRequests as projection on db.LeaveRequests;

    entity Attendance as projection on db.Attendance;

    entity AttendanceCorrections as projection on db.AttendanceCorrections;

    @readonly
    entity Holidays as projection on db.Holidays;

    action submitLeaveRequest(
        requestId : String(20)
    ) returns LeaveRequests;

    action approveLeaveRequest(
        requestId : String(20),
        managerComments : String(1000)
    ) returns LeaveRequests;

    action rejectLeaveRequest(
        requestId : String(20),
        managerComments : String(1000)
    ) returns LeaveRequests;

    action cancelLeaveRequest(
        requestId : String(20)
    ) returns LeaveRequests;

    action checkIn(
        employeeId : String(20)
    ) returns Attendance;

    action checkOut(
        attendanceId : String(20)
    ) returns Attendance;

    action submitAttendanceCorrection(
        correctionId : String(20)
    ) returns AttendanceCorrections;

    action approveAttendanceCorrection(
        correctionId : String(20),
        managerComments : String(1000)
    ) returns AttendanceCorrections;

    action rejectAttendanceCorrection(
        correctionId : String(20),
        managerComments : String(1000)
    ) returns AttendanceCorrections;

    action recalculateLeaveBalance(
        employeeId : String(20),
        leaveTypeId : String(20),
        year : Integer
    ) returns LeaveBalances;
}