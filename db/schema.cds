namespace com.mandeep.leaveattendance;
using { cuid, managed } from '@sap/cds/common';

entity Departments : cuid, managed {
    departmentId : String(20) @mandatory;
    name         : String(100) @mandatory;
    description  : String(255);
    employees    : Association to many Employees
                       on employees.department = $self;
}

entity Employees : cuid, managed {
    employeeId    : String(20) @mandatory;
    firstName     : String(50) @mandatory;
    lastName      : String(50) @mandatory;
    email         : String(150) @mandatory;
    phone         : String(20);
    designation   : String(100);
    joiningDate   : Date;
    managerName   : String(100);
    status        : String(20) default 'ACTIVE';
    department    : Association to Departments;
    leaveBalances : Association to many LeaveBalances
                       on leaveBalances.employee = $self;
    leaveRequests : Association to many LeaveRequests
                       on leaveRequests.employee = $self;
    attendance    : Association to many Attendance
                       on attendance.employee = $self;
    attendanceCorrections : Association to many AttendanceCorrections
                              on attendanceCorrections.employee = $self;
}

entity LeaveTypes : cuid, managed {

    leaveTypeId   : String(20) @mandatory;
    name          : String(100) @mandatory;
    description   : String(255);
    annualLimit   : Integer default 0;
    isPaid        : Boolean default true;
    requiresProof : Boolean default false;
    status        : String(20) default 'ACTIVE';
    leaveBalances : Association to many LeaveBalances
                       on leaveBalances.leaveType = $self;
    leaveRequests : Association to many LeaveRequests
                       on leaveRequests.leaveType = $self;
}

entity LeaveBalances : cuid, managed {
    balanceId     : String(20) @mandatory;
    year          : Integer @mandatory;
    totalDays     : Decimal(5,1) default 0;
    usedDays      : Decimal(5,1) default 0;
    pendingDays   : Decimal(5,1) default 0;
    availableDays : Decimal(5,1) default 0;
    employee      : Association to Employees;
    leaveType     : Association to LeaveTypes;
}

entity LeaveRequests : cuid, managed {
    requestId     : String(20) @mandatory;
    fromDate      : Date @mandatory;
    toDate        : Date @mandatory;
    requestedDays : Decimal(5,1) default 0;
    reason        : String(1000);
    status        : String(30) default 'DRAFT';
    submittedAt   : Timestamp;
    approvedAt    : Timestamp;
    rejectedAt    : Timestamp;
    managerComments : String(1000);
    employee      : Association to Employees;
    leaveType     : Association to LeaveTypes;
}

entity Attendance : cuid, managed {
    attendanceId  : String(20) @mandatory;
    attendanceDate : Date @mandatory;
    checkIn       : Timestamp;
    checkOut      : Timestamp;
    workingHours  : Decimal(5,2) default 0;
    status        : String(30) default 'PRESENT';
    remarks       : String(500);
    employee      : Association to Employees;
}

entity AttendanceCorrections : cuid, managed {
    correctionId  : String(20) @mandatory;
    attendanceDate : Date @mandatory;
    requestedCheckIn  : Timestamp;
    requestedCheckOut : Timestamp;
    reason        : String(1000) @mandatory;
    status        : String(30) default 'PENDING';
    managerComments : String(1000);
    submittedAt   : Timestamp;
    approvedAt    : Timestamp;
    rejectedAt    : Timestamp;
    employee      : Association to Employees;
    attendance    : Association to Attendance;
}

entity Holidays : cuid, managed {
    holidayId     : String(20) @mandatory;
    name          : String(150) @mandatory;
    holidayDate   : Date @mandatory;
    location      : String(100);
    holidayType   : String(50);
    description   : String(255);
    status        : String(20) default 'ACTIVE';
}