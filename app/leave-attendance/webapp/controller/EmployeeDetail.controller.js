sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
        "sap/ui/core/routing/History"
    ],
    function (
        Controller,
        JSONModel,
        Filter,
        FilterOperator,
        MessageToast,
        MessageBox,
        History
    ) {
        "use strict";

        return Controller.extend(
            "com.mandeep.leaveattendance.controller.EmployeeDetail",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        totalLeaveBalance: 0,
                        usedLeave: 0,
                        pendingLeave: 0,
                        availableLeave: 0,
                        totalLeaveRequests: 0,
                        totalAttendanceRecords: 0
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("EmployeeDetail")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function (oEvent) {
                    var sEmployeeId =
                        oEvent.getParameter("arguments")
                            .employeeId;

                    if (!sEmployeeId) {
                        MessageBox.error(
                            "Employee ID is not available."
                        );
                        return;
                    }

                    this._loadEmployee(
                        sEmployeeId
                    );
                },

                _loadEmployee: function (
                    sEmployeeId
                ) {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    var sPath =
                        "/Employees?$filter=" +
                        "employeeId eq '" +
                        sEmployeeId.replace(
                            /'/g,
                            "''"
                        ) +
                        "'" +
                        "&$expand=department,leaveBalances($expand=leaveType),leaveRequests($expand=leaveType),attendance" +
                        "&$top=1";

                    var oListBinding =
                        oModel.bindList(
                            "/Employees",
                            undefined,
                            undefined,
                            undefined,
                            {
                                $filter:
                                    "employeeId eq '" +
                                    sEmployeeId.replace(
                                        /'/g,
                                        "''"
                                    ) +
                                    "'",
                                $expand:
                                    "department,leaveBalances($expand=leaveType),leaveRequests($expand=leaveType),attendance"
                            }
                        );

                    oListBinding.requestContexts(0, 1)
                        .then(function (aContexts) {

                            if (
                                !aContexts ||
                                aContexts.length === 0
                            ) {
                                MessageBox.error(
                                    "Employee not found."
                                );
                                return;
                            }

                            var oContext =
                                aContexts[0];

                            this.getView()
                                .setBindingContext(
                                    oContext
                                );

                            this._calculateEmployeeSummary(
                                oContext.getObject()
                            );

                        }.bind(this))
                        .catch(function (oError) {

                            console.error(
                                "Error loading employee:",
                                oError
                            );

                            MessageBox.error(
                                "Unable to load employee details."
                            );

                        });
                },

                _calculateEmployeeSummary: function (
                    oEmployee
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel(
                                "viewModel"
                            );

                    var aBalances =
                        oEmployee.leaveBalances || [];

                    var aRequests =
                        oEmployee.leaveRequests || [];

                    var aAttendance =
                        oEmployee.attendance || [];

                    var fTotal = 0;
                    var fUsed = 0;
                    var fPending = 0;
                    var fAvailable = 0;

                    aBalances.forEach(function (
                        oBalance
                    ) {
                        fTotal +=
                            Number(
                                oBalance.totalDays
                            ) || 0;

                        fUsed +=
                            Number(
                                oBalance.usedDays
                            ) || 0;

                        fPending +=
                            Number(
                                oBalance.pendingDays
                            ) || 0;

                        fAvailable +=
                            Number(
                                oBalance.availableDays
                            ) || 0;
                    });

                    oViewModel.setProperty(
                        "/totalLeaveBalance",
                        fTotal
                    );

                    oViewModel.setProperty(
                        "/usedLeave",
                        fUsed
                    );

                    oViewModel.setProperty(
                        "/pendingLeave",
                        fPending
                    );

                    oViewModel.setProperty(
                        "/availableLeave",
                        fAvailable
                    );

                    oViewModel.setProperty(
                        "/totalLeaveRequests",
                        aRequests.length
                    );

                    oViewModel.setProperty(
                        "/totalAttendanceRecords",
                        aAttendance.length
                    );
                },

                onRefresh: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        return;
                    }

                    var oEmployee =
                        oContext.getObject();

                    if (
                        !oEmployee ||
                        !oEmployee.employeeId
                    ) {
                        return;
                    }

                    this._loadEmployee(
                        oEmployee.employeeId
                    );

                    MessageToast.show(
                        "Employee details refreshed."
                    );
                },

                onEditEmployee: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Employee details are not available."
                        );
                        return;
                    }

                    MessageToast.show(
                        "Employee edit functionality will be connected to the employee dialog."
                    );
                },

                onApplyLeave: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "LeaveRequests"
                        );
                },

                onViewLeaveBalances: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "LeaveBalances"
                        );
                },

                onViewLeaveRequests: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "LeaveRequests"
                        );
                },

                onViewAttendance: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Attendance"
                        );
                },

                onLeaveRequestPress: function (
                    oEvent
                ) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (
                        !oData ||
                        !oData.requestId
                    ) {
                        return;
                    }

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "LeaveRequestDetail",
                            {
                                requestId:
                                    oData.requestId
                            }
                        );
                },

                onAttendancePress: function (
                    oEvent
                ) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (
                        !oData ||
                        !oData.attendanceId
                    ) {
                        return;
                    }

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "AttendanceDetail",
                            {
                                attendanceId:
                                    oData.attendanceId
                            }
                        );
                },

                onBack: function () {
                    var oHistory =
                        History.getInstance();

                    var sPreviousHash =
                        oHistory.getPreviousHash();

                    if (
                        sPreviousHash !== undefined
                    ) {
                        window.history.back();
                    } else {
                        this.getOwnerComponent()
                            .getRouter()
                            .navTo(
                                "Employees",
                                {},
                                true
                            );
                    }
                }

            }
        );
    }
);