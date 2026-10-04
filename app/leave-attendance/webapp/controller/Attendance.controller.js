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
            "com.mandeep.leaveattendance.controller.Attendance",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        totalRecords: 0,
                        presentRecords: 0,
                        absentRecords: 0,
                        onLeaveRecords: 0,
                        inProgressRecords: 0
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("Attendance")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function () {
                    this._loadAttendanceData();
                },

                _loadAttendanceData: function () {
                    var oModel = this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    this._updateKpiCounts();
                    this._refreshTable();
                },

                _refreshTable: function () {
                    var oTable = this.byId(
                        "attendanceTable"
                    );

                    if (!oTable) {
                        return;
                    }

                    var oBinding = oTable.getBinding("items");

                    if (oBinding) {
                        oBinding.refresh();
                    }
                },

                _updateKpiCounts: function () {
                    var oModel = this.getView().getModel();

                    this._getCount(
                        oModel,
                        [],
                        "/totalRecords"
                    );

                    this._getCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "PRESENT"
                            )
                        ],
                        "/presentRecords"
                    );

                    this._getCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "ABSENT"
                            )
                        ],
                        "/absentRecords"
                    );

                    this._getCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "ON_LEAVE"
                            )
                        ],
                        "/onLeaveRecords"
                    );

                    this._getCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "IN_PROGRESS"
                            )
                        ],
                        "/inProgressRecords"
                    );
                },

                _getCount: function (
                    oModel,
                    aFilters,
                    sProperty
                ) {
                    var oViewModel =
                        this.getView().getModel("viewModel");

                    var oBinding = oModel.bindList(
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
                            var iCount =
                                oBinding.getCount();

                            oViewModel.setProperty(
                                sProperty,
                                iCount || 0
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading attendance count:",
                                oError
                            );
                        });
                },

                onSearch: function (oEvent) {
                    var sValue =
                        oEvent.getParameter("newValue");

                    var oTable =
                        this.byId("attendanceTable");

                    if (!oTable) {
                        return;
                    }

                    var oBinding =
                        oTable.getBinding("items");

                    if (!oBinding) {
                        return;
                    }

                    if (!sValue) {
                        oBinding.filter([]);
                        return;
                    }

                    var oFilter = new Filter({
                        filters: [
                            new Filter(
                                "attendanceId",
                                FilterOperator.Contains,
                                sValue
                            ),
                            new Filter(
                                "employee/employeeId",
                                FilterOperator.Contains,
                                sValue
                            )
                        ],
                        and: false
                    });

                    oBinding.filter([oFilter]);
                },

                onApplyFilter: function () {
                    var aFilters = [];

                    var oEmployeeInput = this.byId(
                        "attendanceEmployeeIdInput"
                    );

                    var oStatusSelect = this.byId(
                        "attendanceStatusSelect"
                    );

                    var oDatePicker = this.byId(
                        "attendanceDatePicker"
                    );

                    var sEmployeeId = oEmployeeInput
                        ? oEmployeeInput.getValue().trim()
                        : "";

                    var sStatus = oStatusSelect
                        ? oStatusSelect.getSelectedKey()
                        : "";

                    var oDate = oDatePicker
                        ? oDatePicker.getDateValue()
                        : null;

                    if (sEmployeeId) {
                        aFilters.push(
                            new Filter(
                                "employee/employeeId",
                                FilterOperator.EQ,
                                sEmployeeId
                            )
                        );
                    }

                    if (sStatus) {
                        aFilters.push(
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                sStatus
                            )
                        );
                    }

                    if (oDate) {
                        aFilters.push(
                            new Filter(
                                "attendanceDate",
                                FilterOperator.EQ,
                                this._formatDateForOData(oDate)
                            )
                        );
                    }

                    var oTable =
                        this.byId("attendanceTable");

                    if (!oTable) {
                        return;
                    }

                    var oBinding =
                        oTable.getBinding("items");

                    if (oBinding) {
                        oBinding.filter(aFilters);
                    }
                },

                onClearFilter: function () {
                    var oEmployeeInput = this.byId(
                        "attendanceEmployeeIdInput"
                    );

                    var oStatusSelect = this.byId(
                        "attendanceStatusSelect"
                    );

                    var oDatePicker = this.byId(
                        "attendanceDatePicker"
                    );

                    if (oEmployeeInput) {
                        oEmployeeInput.setValue("");
                    }

                    if (oStatusSelect) {
                        oStatusSelect.setSelectedKey("");
                    }

                    if (oDatePicker) {
                        oDatePicker.setDateValue(null);
                    }

                    var oTable =
                        this.byId("attendanceTable");

                    if (oTable) {
                        var oBinding =
                            oTable.getBinding("items");

                        if (oBinding) {
                            oBinding.filter([]);
                        }
                    }
                },

                onCheckIn: function () {
                    var oInput = this.byId(
                        "attendanceEmployeeIdInput"
                    );

                    if (!oInput) {
                        MessageBox.error(
                            "Employee ID field is not available."
                        );
                        return;
                    }

                    var sEmployeeId =
                        oInput.getValue().trim();

                    if (!sEmployeeId) {
                        MessageBox.warning(
                            "Please enter an Employee ID before checking in."
                        );
                        oInput.focus();
                        return;
                    }

                    MessageBox.confirm(
                        "Check in employee " +
                        sEmployeeId +
                        "?",
                        {
                            title: "Confirm Check In",
                            actions: [
                                MessageBox.Action.YES,
                                MessageBox.Action.NO
                            ],
                            emphasizedAction:
                                MessageBox.Action.YES,

                            onClose: function (sAction) {
                                if (
                                    sAction ===
                                    MessageBox.Action.YES
                                ) {
                                    this._executeCheckIn(
                                        sEmployeeId
                                    );
                                }
                            }.bind(this)
                        }
                    );
                },

                _executeCheckIn: function (
                    sEmployeeId
                ) {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        return;
                    }

                    var oAction =
                        oModel.bindContext(
                            "/checkIn(...)"
                        );

                    oAction.setParameter(
                        "employeeId",
                        sEmployeeId
                    );

                    oAction.execute()
                        .then(function () {
                            MessageToast.show(
                                "Employee checked in successfully."
                            );

                            this._loadAttendanceData();
                        }.bind(this))
                        .catch(function (oError) {
                            this._showActionError(
                                oError,
                                "check in the employee"
                            );
                        }.bind(this));
                },

                onCheckOut: function (oEvent) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.warning(
                            "Unable to identify the attendance record."
                        );
                        return;
                    }

                    var oAttendance =
                        oContext.getObject();

                    var sAttendanceId =
                        oAttendance.attendanceId;

                    if (!sAttendanceId) {
                        MessageBox.error(
                            "Attendance ID is not available."
                        );
                        return;
                    }

                    MessageBox.confirm(
                        "Check out attendance record " +
                        sAttendanceId +
                        "?",
                        {
                            title: "Confirm Check Out",
                            actions: [
                                MessageBox.Action.YES,
                                MessageBox.Action.NO
                            ],
                            emphasizedAction:
                                MessageBox.Action.YES,

                            onClose: function (sAction) {
                                if (
                                    sAction ===
                                    MessageBox.Action.YES
                                ) {
                                    this._executeCheckOut(
                                        sAttendanceId
                                    );
                                }
                            }.bind(this)
                        }
                    );
                },

                _executeCheckOut: function (
                    sAttendanceId
                ) {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        return;
                    }

                    var oAction =
                        oModel.bindContext(
                            "/checkOut(...)"
                        );

                    oAction.setParameter(
                        "attendanceId",
                        sAttendanceId
                    );

                    oAction.execute()
                        .then(function () {
                            MessageToast.show(
                                "Employee checked out successfully."
                            );

                            this._loadAttendanceData();
                        }.bind(this))
                        .catch(function (oError) {
                            this._showActionError(
                                oError,
                                "check out the employee"
                            );
                        }.bind(this));
                },

                onAttendancePress: function (oEvent) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Unable to load attendance details."
                        );
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (
                        !oData ||
                        !oData.attendanceId
                    ) {
                        MessageBox.error(
                            "Attendance ID is not available."
                        );
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

                onTotalRecordsPress: function () {
                    this._filterByStatus("");
                },

                onPresentPress: function () {
                    this._filterByStatus("PRESENT");
                },

                onAbsentPress: function () {
                    this._filterByStatus("ABSENT");
                },

                onOnLeavePress: function () {
                    this._filterByStatus("ON_LEAVE");
                },

                onInProgressPress: function () {
                    this._filterByStatus("IN_PROGRESS");
                },

                _filterByStatus: function (
                    sStatus
                ) {
                    var oSelect =
                        this.byId(
                            "attendanceStatusSelect"
                        );

                    if (oSelect) {
                        oSelect.setSelectedKey(
                            sStatus
                        );
                    }

                    this.onApplyFilter();
                },

                onRefresh: function () {
                    var oModel =
                        this.getView().getModel();

                    if (oModel) {
                        oModel.refresh();
                    }

                    this._loadAttendanceData();

                    MessageToast.show(
                        "Attendance data refreshed."
                    );
                },

                _formatDateForOData: function (
                    oDate
                ) {
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

                _showActionError: function (
                    oError,
                    sAction
                ) {
                    console.error(
                        "Attendance action error:",
                        oError
                    );

                    var sMessage =
                        "Unable to " +
                        sAction +
                        ".";

                    if (
                        oError &&
                        oError.message
                    ) {
                        sMessage =
                            oError.message;
                    }

                    MessageBox.error(
                        sMessage
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
                                "Dashboard",
                                {},
                                true
                            );
                    }
                }
            }
        );
    }
);