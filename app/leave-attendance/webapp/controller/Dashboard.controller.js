sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageToast",
        "sap/m/MessageBox"
    ],
    function (
        Controller,
        JSONModel,
        Filter,
        FilterOperator,
        MessageToast,
        MessageBox
    ) {
        "use strict";

        return Controller.extend(
            "com.mandeep.leaveattendance.controller.Dashboard",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        totalEmployees: 0,
                        presentToday: 0,
                        onLeaveToday: 0,
                        absentToday: 0,
                        pendingLeaveRequests: 0,
                        attendanceCorrections: 0
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("Dashboard")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function () {
                    this._loadDashboardData();
                },

                _loadDashboardData: function () {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    this._updateEmployeeCount();
                    this._updateAttendanceCounts();
                    this._updatePendingLeaveCount();
                    this._updateCorrectionCount();
                    this._refreshDashboardLists();
                },

                _updateEmployeeCount: function () {
                    var oModel =
                        this.getView().getModel();

                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/Employees",
                            undefined,
                            undefined,
                            [],
                            {
                                $count: true
                            }
                        );

                    oBinding.requestContexts(0, 1)
                        .then(function () {
                            oViewModel.setProperty(
                                "/totalEmployees",
                                oBinding.getCount() || 0
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading employee count:",
                                oError
                            );
                        });
                },

                _updateAttendanceCounts: function () {
                    var oModel =
                        this.getView().getModel();

                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var sToday =
                        this._getTodayDate();

                    this._getAttendanceCount(
                        oModel,
                        sToday,
                        "PRESENT",
                        "/presentToday"
                    );

                    this._getAttendanceCount(
                        oModel,
                        sToday,
                        "ON_LEAVE",
                        "/onLeaveToday"
                    );

                    this._getAttendanceCount(
                        oModel,
                        sToday,
                        "ABSENT",
                        "/absentToday"
                    );
                },

                _getAttendanceCount: function (
                    oModel,
                    sDate,
                    sStatus,
                    sProperty
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var aFilters = [
                        new Filter(
                            "attendanceDate",
                            FilterOperator.EQ,
                            sDate
                        ),
                        new Filter(
                            "status",
                            FilterOperator.EQ,
                            sStatus
                        )
                    ];

                    var oBinding =
                        oModel.bindList(
                            "/Attendance",
                            undefined,
                            undefined,
                            aFilters,
                            {
                                $count: true
                            }
                        );

                    oBinding.requestContexts(0, 1)
                        .then(function () {
                            oViewModel.setProperty(
                                sProperty,
                                oBinding.getCount() || 0
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading attendance count:",
                                oError
                            );
                        });
                },

                _updatePendingLeaveCount: function () {
                    var oModel =
                        this.getView().getModel();

                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/LeaveRequests",
                            undefined,
                            undefined,
                            [
                                new Filter(
                                    "status",
                                    FilterOperator.EQ,
                                    "PENDING"
                                )
                            ],
                            {
                                $count: true
                            }
                        );

                    oBinding.requestContexts(0, 1)
                        .then(function () {
                            oViewModel.setProperty(
                                "/pendingLeaveRequests",
                                oBinding.getCount() || 0
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading pending leave requests:",
                                oError
                            );
                        });
                },

                _updateCorrectionCount: function () {
                    var oModel =
                        this.getView().getModel();

                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/AttendanceCorrections",
                            undefined,
                            undefined,
                            [
                                new Filter(
                                    "status",
                                    FilterOperator.EQ,
                                    "PENDING"
                                )
                            ],
                            {
                                $count: true
                            }
                        );

                    oBinding.requestContexts(0, 1)
                        .then(function () {
                            oViewModel.setProperty(
                                "/attendanceCorrections",
                                oBinding.getCount() || 0
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading attendance corrections:",
                                oError
                            );
                        });
                },

                _refreshDashboardLists: function () {
                    var aTableIds = [
                        "todayAttendanceTable",
                        "pendingApprovalsTable",
                        "leaveBalanceTable"
                    ];

                    aTableIds.forEach(function (sId) {
                        var oControl =
                            this.byId(sId);

                        if (!oControl) {
                            return;
                        }

                        var oBinding =
                            oControl.getBinding("items");

                        if (oBinding) {
                            oBinding.refresh();
                        }
                    }.bind(this));

                    var oHolidayList =
                        this.byId(
                            "upcomingHolidaysList"
                        );

                    if (oHolidayList) {
                        var oBinding =
                            oHolidayList.getBinding(
                                "items"
                            );

                        if (oBinding) {
                            oBinding.refresh();
                        }
                    }
                },

                _getTodayDate: function () {
                    var oDate = new Date();

                    var iYear =
                        oDate.getFullYear();

                    var iMonth =
                        oDate.getMonth() + 1;

                    var iDay =
                        oDate.getDate();

                    return (
                        iYear +
                        "-" +
                        String(iMonth).padStart(2, "0") +
                        "-" +
                        String(iDay).padStart(2, "0")
                    );
                },

                onRefresh: function () {
                    this._loadDashboardData();

                    MessageToast.show(
                        "Dashboard refreshed."
                    );
                },

                onEmployeesPress: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("Employees");
                },

                onAttendancePress: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("Attendance");
                },

                onLeaveRequestsPress: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("LeaveRequests");
                },

                onLeaveBalancesPress: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("LeaveBalances");
                },

                onApprovalPress: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("Approval");
                },

                onHolidaysPress: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("Holidays");
                },

                onTodayAttendancePress: function (
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

                onPendingLeavePress: function (
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

                onEmployeePress: function (
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
                        !oData.employeeId
                    ) {
                        return;
                    }

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "EmployeeDetail",
                            {
                                employeeId:
                                    oData.employeeId
                            }
                        );
                },

                onHolidayPress: function (
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
                        !oData.holidayId
                    ) {
                        return;
                    }

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Holidays"
                        );
                },

                onQuickApplyLeave: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "LeaveRequests"
                        );
                },

                onQuickCheckAttendance: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Attendance"
                        );
                },

                onQuickApproval: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Approval"
                        );
                },

                onQuickEmployees: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Employees"
                        );
                }

            }
        );
    }
);