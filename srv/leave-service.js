import cds from '@sap/cds';

const {
    Employees,
    LeaveTypes,
    LeaveBalances,
    LeaveRequests,
    Attendance,
    AttendanceCorrections
} = cds.entities("com.mandeep.leaveattendance");

export default cds.service.impl(async function () {

    const {
        SELECT,
        INSERT,
        UPDATE
    } = cds.ql;

    function calculateDays(fromDate, toDate) {

        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 0;
        }

        const difference =
            Math.floor(
                (end.getTime() - start.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1;

        return difference;
    }


    function calculateWorkingHours(checkIn, checkOut) {

        if (!checkIn || !checkOut) {
            return 0;
        }

        const start = new Date(checkIn);
        const end = new Date(checkOut);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 0;
        }

        const hours =
            (end.getTime() - start.getTime()) /
            (1000 * 60 * 60);

        return Number(hours.toFixed(2));
    }


    async function getEmployee(employeeId) {

        return await SELECT.one
            .from(Employees)
            .where({ employeeId });
    }


    async function getLeaveType(leaveTypeId) {

        return await SELECT.one
            .from(LeaveTypes)
            .where({ leaveTypeId });
    }


    async function getLeaveBalance(employeeId, leaveTypeId, year) {

        const employee = await getEmployee(employeeId);
        const leaveType = await getLeaveType(leaveTypeId);

        if (!employee) {
            return null;
        }

        if (!leaveType) {
            return null;
        }

        return await SELECT.one
            .from(LeaveBalances)
            .where({
                employee_ID: employee.ID,
                leaveType_ID: leaveType.ID,
                year
            });
    }


    /* =====================================================
       LEAVE REQUEST - BEFORE CREATE
       ===================================================== */

    this.before("CREATE", "LeaveRequests", async (req) => {

        const {
            fromDate,
            toDate,
            employee_ID,
            leaveType_ID
        } = req.data;

        if (!fromDate || !toDate) {
            req.error(
                400,
                "From date and To date are required."
            );
        }

        if (new Date(toDate) < new Date(fromDate)) {
            req.error(
                400,
                "To date cannot be earlier than From date."
            );
        }

        if (!employee_ID) {
            req.error(
                400,
                "Employee is required."
            );
        }

        if (!leaveType_ID) {
            req.error(
                400,
                "Leave type is required."
            );
        }

        const employee = await SELECT.one
            .from(Employees)
            .where({ ID: employee_ID });

        if (!employee) {
            req.error(
                404,
                "Employee not found."
            );
        }

        const leaveType = await SELECT.one
            .from(LeaveTypes)
            .where({ ID: leaveType_ID });

        if (!leaveType) {
            req.error(
                404,
                "Leave type not found."
            );
        }

        if (leaveType.status !== "ACTIVE") {
            req.error(
                400,
                "Selected leave type is not active."
            );
        }

        const requestedDays =
            calculateDays(fromDate, toDate);

        req.data.requestedDays = requestedDays;

        if (!req.data.status) {
            req.data.status = "DRAFT";
        }
    });


    /* =====================================================
       LEAVE REQUEST - BEFORE UPDATE
       ===================================================== */

    this.before("UPDATE", "LeaveRequests", async (req) => {

        const request = await SELECT.one
            .from(LeaveRequests)
            .where({ ID: req.params[0].ID });

        if (!request) {
            req.error(
                404,
                "Leave request not found."
            );
        }

        if (
            request.status === "APPROVED" ||
            request.status === "REJECTED"
        ) {
            req.error(
                400,
                "Approved or rejected leave requests cannot be modified."
            );
        }

        const fromDate =
            req.data.fromDate || request.fromDate;

        const toDate =
            req.data.toDate || request.toDate;

        if (new Date(toDate) < new Date(fromDate)) {
            req.error(
                400,
                "To date cannot be earlier than From date."
            );
        }

        req.data.requestedDays =
            calculateDays(fromDate, toDate);
    });


    /* =====================================================
       SUBMIT LEAVE REQUEST
       ===================================================== */

    this.on("submitLeaveRequest", async (req) => {

        const { requestId } = req.data;

        const request = await SELECT.one
            .from(LeaveRequests)
            .where({ requestId });

        if (!request) {
            return req.reject(
                404,
                `Leave request ${requestId} not found.`
            );
        }

        if (
            request.status !== "DRAFT"
        ) {
            return req.reject(
                400,
                "Only draft leave requests can be submitted."
            );
        }

        if (
            new Date(request.toDate) <
            new Date(request.fromDate)
        ) {
            return req.reject(
                400,
                "To date cannot be earlier than From date."
            );
        }

        const requestedDays =
            calculateDays(
                request.fromDate,
                request.toDate
            );

        const balance = await SELECT.one
            .from(LeaveBalances)
            .where({
                employee_ID: request.employee_ID,
                leaveType_ID: request.leaveType_ID,
                year: new Date(request.fromDate).getFullYear()
            });

        if (!balance) {
            return req.reject(
                400,
                "Leave balance was not found for the employee and leave type."
            );
        }

        const available =
            Number(balance.availableDays || 0);

        const pending =
            Number(balance.pendingDays || 0);

        const remaining =
            available - pending;

        if (
            requestedDays > remaining
        ) {
            return req.reject(
                400,
                `Insufficient leave balance. Available balance: ${remaining} days.`
            );
        }

        await UPDATE(LeaveBalances)
            .set({
                pendingDays:
                    pending + requestedDays
            })
            .where({
                ID: balance.ID
            });

        const submittedAt =
            new Date().toISOString();

        await UPDATE(LeaveRequests)
            .set({
                requestedDays,
                status: "PENDING",
                submittedAt
            })
            .where({
                ID: request.ID
            });

        return await SELECT.one
            .from(LeaveRequests)
            .where({ ID: request.ID });
    });


    /* =====================================================
       APPROVE LEAVE REQUEST
       ===================================================== */

    this.on("approveLeaveRequest", async (req) => {

        const {
            requestId,
            managerComments
        } = req.data;

        const request = await SELECT.one
            .from(LeaveRequests)
            .where({ requestId });

        if (!request) {
            return req.reject(
                404,
                `Leave request ${requestId} not found.`
            );
        }

        if (request.status !== "PENDING") {
            return req.reject(
                400,
                "Only pending leave requests can be approved."
            );
        }

        const balance = await SELECT.one
            .from(LeaveBalances)
            .where({
                employee_ID: request.employee_ID,
                leaveType_ID: request.leaveType_ID,
                year: new Date(request.fromDate).getFullYear()
            });

        if (!balance) {
            return req.reject(
                400,
                "Leave balance was not found."
            );
        }

        const usedDays =
            Number(balance.usedDays || 0);

        const pendingDays =
            Number(balance.pendingDays || 0);

        const availableDays =
            Number(balance.availableDays || 0);

        const requestedDays =
            Number(request.requestedDays || 0);

        if (requestedDays > availableDays) {
            return req.reject(
                400,
                "Insufficient available leave balance."
            );
        }

        await UPDATE(LeaveBalances)
            .set({
                usedDays:
                    usedDays + requestedDays,

                pendingDays:
                    Math.max(
                        0,
                        pendingDays - requestedDays
                    ),

                availableDays:
                    Math.max(
                        0,
                        availableDays - requestedDays
                    )
            })
            .where({
                ID: balance.ID
            });

        await UPDATE(LeaveRequests)
            .set({
                status: "APPROVED",
                approvedAt:
                    new Date().toISOString(),

                managerComments:
                    managerComments || ""
            })
            .where({
                ID: request.ID
            });

        return await SELECT.one
            .from(LeaveRequests)
            .where({ ID: request.ID });
    });


    /* =====================================================
       REJECT LEAVE REQUEST
       ===================================================== */

    this.on("rejectLeaveRequest", async (req) => {

        const {
            requestId,
            managerComments
        } = req.data;

        const request = await SELECT.one
            .from(LeaveRequests)
            .where({ requestId });

        if (!request) {
            return req.reject(
                404,
                `Leave request ${requestId} not found.`
            );
        }

        if (request.status !== "PENDING") {
            return req.reject(
                400,
                "Only pending leave requests can be rejected."
            );
        }

        if (!managerComments) {
            return req.reject(
                400,
                "Manager comments are required when rejecting a leave request."
            );
        }

        const balance = await SELECT.one
            .from(LeaveBalances)
            .where({
                employee_ID: request.employee_ID,
                leaveType_ID: request.leaveType_ID,
                year: new Date(request.fromDate).getFullYear()
            });

        if (balance) {

            const pendingDays =
                Number(balance.pendingDays || 0);

            const requestedDays =
                Number(request.requestedDays || 0);

            await UPDATE(LeaveBalances)
                .set({
                    pendingDays:
                        Math.max(
                            0,
                            pendingDays - requestedDays
                        )
                })
                .where({
                    ID: balance.ID
                });
        }

        await UPDATE(LeaveRequests)
            .set({
                status: "REJECTED",

                rejectedAt:
                    new Date().toISOString(),

                managerComments
            })
            .where({
                ID: request.ID
            });

        return await SELECT.one
            .from(LeaveRequests)
            .where({ ID: request.ID });
    });


    /* =====================================================
       CANCEL LEAVE REQUEST
       ===================================================== */

    this.on("cancelLeaveRequest", async (req) => {

        const { requestId } = req.data;

        const request = await SELECT.one
            .from(LeaveRequests)
            .where({ requestId });

        if (!request) {
            return req.reject(
                404,
                `Leave request ${requestId} not found.`
            );
        }

        if (
            request.status !== "PENDING" &&
            request.status !== "APPROVED"
        ) {
            return req.reject(
                400,
                "Only pending or approved leave requests can be cancelled."
            );
        }

        const balance = await SELECT.one
            .from(LeaveBalances)
            .where({
                employee_ID: request.employee_ID,
                leaveType_ID: request.leaveType_ID,
                year: new Date(request.fromDate).getFullYear()
            });

        if (balance) {

            const requestedDays =
                Number(request.requestedDays || 0);

            const usedDays =
                Number(balance.usedDays || 0);

            const pendingDays =
                Number(balance.pendingDays || 0);

            const availableDays =
                Number(balance.availableDays || 0);

            if (request.status === "APPROVED") {

                await UPDATE(LeaveBalances)
                    .set({
                        usedDays:
                            Math.max(
                                0,
                                usedDays - requestedDays
                            ),

                        availableDays:
                            availableDays + requestedDays
                    })
                    .where({
                        ID: balance.ID
                    });

            } else {

                await UPDATE(LeaveBalances)
                    .set({
                        pendingDays:
                            Math.max(
                                0,
                                pendingDays - requestedDays
                            )
                    })
                    .where({
                        ID: balance.ID
                    });
            }
        }

        await UPDATE(LeaveRequests)
            .set({
                status: "CANCELLED"
            })
            .where({
                ID: request.ID
            });

        return await SELECT.one
            .from(LeaveRequests)
            .where({ ID: request.ID });
    });


    /* =====================================================
       CHECK IN
       ===================================================== */

    this.on("checkIn", async (req) => {

        const { employeeId } = req.data;

        const employee = await getEmployee(employeeId);

        if (!employee) {
            return req.reject(
                404,
                `Employee ${employeeId} not found.`
            );
        }

        if (employee.status !== "ACTIVE") {
            return req.reject(
                400,
                "Only active employees can check in."
            );
        }

        const now = new Date();

        const today =
            now.toISOString().substring(0, 10);

        const existingAttendance =
            await SELECT.one
                .from(Attendance)
                .where({
                    employee_ID: employee.ID,
                    attendanceDate: today
                });

        if (existingAttendance) {

            if (existingAttendance.checkIn) {
                return req.reject(
                    400,
                    "Employee has already checked in today."
                );
            }

            await UPDATE(Attendance)
                .set({
                    checkIn: now.toISOString(),
                    status: "IN_PROGRESS"
                })
                .where({
                    ID: existingAttendance.ID
                });

            return await SELECT.one
                .from(Attendance)
                .where({
                    ID: existingAttendance.ID
                });
        }

        const attendanceId =
            `ATT-${employeeId}-${today.replace(/-/g, "")}`;

        const attendance = {
            attendanceId,
            attendanceDate: today,
            checkIn: now.toISOString(),
            workingHours: 0,
            status: "IN_PROGRESS",
            employee_ID: employee.ID
        };

        const result =
            await INSERT.into(Attendance)
                .entries(attendance);

        return await SELECT.one
            .from(Attendance)
            .where({
                ID: result.ID
            });
    });


    /* =====================================================
       CHECK OUT
       ===================================================== */

    this.on("checkOut", async (req) => {

        const { attendanceId } = req.data;

        const attendance =
            await SELECT.one
                .from(Attendance)
                .where({ attendanceId });

        if (!attendance) {
            return req.reject(
                404,
                `Attendance ${attendanceId} not found.`
            );
        }

        if (!attendance.checkIn) {
            return req.reject(
                400,
                "Employee has not checked in."
            );
        }

        if (attendance.checkOut) {
            return req.reject(
                400,
                "Employee has already checked out."
            );
        }

        const checkOut =
            new Date();

        const workingHours =
            calculateWorkingHours(
                attendance.checkIn,
                checkOut
            );

        await UPDATE(Attendance)
            .set({
                checkOut:
                    checkOut.toISOString(),

                workingHours,

                status:
                    "PRESENT"
            })
            .where({
                ID: attendance.ID
            });

        return await SELECT.one
            .from(Attendance)
            .where({
                ID: attendance.ID
            });
    });


    /* =====================================================
       ATTENDANCE CORRECTION - BEFORE CREATE
       ===================================================== */

    this.before(
        "CREATE",
        "AttendanceCorrections",
        async (req) => {

            const {
                employee_ID,
                attendance_ID,
                attendanceDate,
                requestedCheckIn,
                requestedCheckOut,
                reason
            } = req.data;

            if (!employee_ID) {
                req.error(
                    400,
                    "Employee is required."
                );
            }

            if (!attendance_ID) {
                req.error(
                    400,
                    "Attendance record is required."
                );
            }

            if (!attendanceDate) {
                req.error(
                    400,
                    "Attendance date is required."
                );
            }

            if (!reason) {
                req.error(
                    400,
                    "Reason is required."
                );
            }

            const employee =
                await SELECT.one
                    .from(Employees)
                    .where({
                        ID: employee_ID
                    });

            if (!employee) {
                req.error(
                    404,
                    "Employee not found."
                );
            }

            const attendance =
                await SELECT.one
                    .from(Attendance)
                    .where({
                        ID: attendance_ID
                    });

            if (!attendance) {
                req.error(
                    404,
                    "Attendance record not found."
                );
            }

            if (
                requestedCheckIn &&
                requestedCheckOut &&
                new Date(requestedCheckOut) <=
                new Date(requestedCheckIn)
            ) {
                req.error(
                    400,
                    "Requested check-out must be later than requested check-in."
                );
            }

            if (!req.data.status) {
                req.data.status = "PENDING";
            }

            req.data.submittedAt =
                new Date().toISOString();
        }
    );


    /* =====================================================
       SUBMIT ATTENDANCE CORRECTION
       ===================================================== */

    this.on(
        "submitAttendanceCorrection",
        async (req) => {

            const { correctionId } = req.data;

            const correction =
                await SELECT.one
                    .from(AttendanceCorrections)
                    .where({
                        correctionId
                    });

            if (!correction) {
                return req.reject(
                    404,
                    `Correction ${correctionId} not found.`
                );
            }

            if (
                correction.status !== "PENDING"
            ) {
                return req.reject(
                    400,
                    "Only pending corrections can be submitted."
                );
            }

            await UPDATE(AttendanceCorrections)
                .set({
                    submittedAt:
                        new Date().toISOString(),

                    status: "PENDING"
                })
                .where({
                    ID: correction.ID
                });

            return await SELECT.one
                .from(AttendanceCorrections)
                .where({
                    ID: correction.ID
                });
        }
    );


    /* =====================================================
       APPROVE ATTENDANCE CORRECTION
       ===================================================== */

    this.on(
        "approveAttendanceCorrection",
        async (req) => {

            const {
                correctionId,
                managerComments
            } = req.data;

            const correction =
                await SELECT.one
                    .from(AttendanceCorrections)
                    .where({
                        correctionId
                    });

            if (!correction) {
                return req.reject(
                    404,
                    `Correction ${correctionId} not found.`
                );
            }

            if (
                correction.status !== "PENDING"
            ) {
                return req.reject(
                    400,
                    "Only pending corrections can be approved."
                );
            }

            const attendance =
                await SELECT.one
                    .from(Attendance)
                    .where({
                        ID: correction.attendance_ID
                    });

            if (!attendance) {
                return req.reject(
                    404,
                    "Associated attendance record not found."
                );
            }

            const workingHours =
                calculateWorkingHours(
                    correction.requestedCheckIn,
                    correction.requestedCheckOut
                );

            await UPDATE(Attendance)
                .set({

                    checkIn:
                        correction.requestedCheckIn,

                    checkOut:
                        correction.requestedCheckOut,

                    workingHours,

                    status:
                        correction.requestedCheckOut
                            ? "PRESENT"
                            : "IN_PROGRESS"
                })
                .where({
                    ID: attendance.ID
                });

            await UPDATE(AttendanceCorrections)
                .set({

                    status: "APPROVED",

                    managerComments:
                        managerComments || "",

                    approvedAt:
                        new Date().toISOString()
                })
                .where({
                    ID: correction.ID
                });

            return await SELECT.one
                .from(AttendanceCorrections)
                .where({
                    ID: correction.ID
                });
        }
    );


    /* =====================================================
       REJECT ATTENDANCE CORRECTION
       ===================================================== */

    this.on(
        "rejectAttendanceCorrection",
        async (req) => {

            const {
                correctionId,
                managerComments
            } = req.data;

            if (!managerComments) {
                return req.reject(
                    400,
                    "Manager comments are required when rejecting a correction."
                );
            }

            const correction =
                await SELECT.one
                    .from(AttendanceCorrections)
                    .where({
                        correctionId
                    });

            if (!correction) {
                return req.reject(
                    404,
                    `Correction ${correctionId} not found.`
                );
            }

            if (
                correction.status !== "PENDING"
            ) {
                return req.reject(
                    400,
                    "Only pending corrections can be rejected."
                );
            }

            await UPDATE(AttendanceCorrections)
                .set({

                    status: "REJECTED",

                    managerComments,

                    rejectedAt:
                        new Date().toISOString()
                })
                .where({
                    ID: correction.ID
                });

            return await SELECT.one
                .from(AttendanceCorrections)
                .where({
                    ID: correction.ID
                });
        }
    );


    /* =====================================================
       RECALCULATE LEAVE BALANCE
       ===================================================== */

    this.on(
        "recalculateLeaveBalance",
        async (req) => {

            const {
                employeeId,
                leaveTypeId,
                year
            } = req.data;

            const employee =
                await getEmployee(employeeId);

            if (!employee) {
                return req.reject(
                    404,
                    `Employee ${employeeId} not found.`
                );
            }

            const leaveType =
                await getLeaveType(leaveTypeId);

            if (!leaveType) {
                return req.reject(
                    404,
                    `Leave type ${leaveTypeId} not found.`
                );
            }

            const balance =
                await SELECT.one
                    .from(LeaveBalances)
                    .where({
                        employee_ID: employee.ID,
                        leaveType_ID: leaveType.ID,
                        year
                    });

            if (!balance) {
                return req.reject(
                    404,
                    "Leave balance not found."
                );
            }

            const requests =
                await SELECT.from(LeaveRequests)
                    .where({
                        employee_ID: employee.ID,
                        leaveType_ID: leaveType.ID
                    });

            let usedDays = 0;
            let pendingDays = 0;

            for (const request of requests) {

                if (
                    new Date(request.fromDate)
                        .getFullYear() !== Number(year)
                ) {
                    continue;
                }

                const days =
                    Number(request.requestedDays || 0);

                if (request.status === "APPROVED") {
                    usedDays += days;
                }

                if (request.status === "PENDING") {
                    pendingDays += days;
                }
            }

            const totalDays =
                Number(balance.totalDays || leaveType.annualLimit || 0);

            const availableDays =
                Math.max(
                    0,
                    totalDays -
                    usedDays -
                    pendingDays
                );

            await UPDATE(LeaveBalances)
                .set({

                    usedDays,

                    pendingDays,

                    availableDays
                })
                .where({
                    ID: balance.ID
                });

            return await SELECT.one
                .from(LeaveBalances)
                .where({
                    ID: balance.ID
                });
        }
    );


    /* =====================================================
       LEAVE REQUEST - AFTER READ
       ===================================================== */

    this.after(
        "READ",
        "LeaveRequests",
        (requests) => {

            if (!requests) {
                return;
            }

            const data =
                Array.isArray(requests)
                    ? requests
                    : [requests];

            for (const request of data) {

                if (
                    request.fromDate &&
                    request.toDate
                ) {
                    request.requestedDays =
                        calculateDays(
                            request.fromDate,
                            request.toDate
                        );
                }
            }
        }
    );

});