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
            "com.mandeep.leaveattendance.controller.LeaveRequests",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        totalRequests: 0,
                        draftRequests: 0,
                        pendingRequests: 0,
                        approvedRequests: 0,
                        rejectedRequests: 0
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("LeaveRequests")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function () {
                    this._loadLeaveRequestData();
                },

                _loadLeaveRequestData: function () {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    this._updateKpiCounts();
                    this._refreshTables();
                },

                _refreshTables: function () {
                    var oTable =
                        this.byId("leaveRequestsTable");

                    if (oTable) {
                        var oBinding =
                            oTable.getBinding("items");

                        if (oBinding) {
                            oBinding.refresh();
                        }
                    }

                    var oPendingTable =
                        this.byId("pendingApprovalsTable");

                    if (oPendingTable) {
                        var oPendingBinding =
                            oPendingTable.getBinding("items");

                        if (oPendingBinding) {
                            oPendingBinding.refresh();
                        }
                    }
                },

                _updateKpiCounts: function () {
                    var oModel =
                        this.getView().getModel();

                    this._getRequestCount(
                        oModel,
                        [],
                        "/totalRequests"
                    );

                    this._getRequestCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "DRAFT"
                            )
                        ],
                        "/draftRequests"
                    );

                    this._getRequestCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "PENDING"
                            )
                        ],
                        "/pendingRequests"
                    );

                    this._getRequestCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "APPROVED"
                            )
                        ],
                        "/approvedRequests"
                    );

                    this._getRequestCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "REJECTED"
                            )
                        ],
                        "/rejectedRequests"
                    );
                },

                _getRequestCount: function (
                    oModel,
                    aFilters,
                    sProperty
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/LeaveRequests",
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
                                "Error loading leave request count:",
                                oError
                            );
                        });
                },

                onSearch: function (oEvent) {
                    var sValue =
                        oEvent.getParameter("newValue");

                    var oTable =
                        this.byId("leaveRequestsTable");

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

                    var oSearchFilter =
                        new Filter({
                            filters: [
                                new Filter(
                                    "requestId",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "employee/employeeId",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "employee/firstName",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "employee/lastName",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "leaveType/leaveTypeId",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "leaveType/name",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "reason",
                                    FilterOperator.Contains,
                                    sValue
                                )
                            ],
                            and: false
                        });

                    oBinding.filter([
                        oSearchFilter
                    ]);
                },

                onApplyFilter: function () {
                    var aFilters = [];

                    var oEmployeeIdInput =
                        this.byId(
                            "leaveRequestEmployeeIdInput"
                        );

                    var oLeaveTypeSelect =
                        this.byId(
                            "leaveRequestLeaveTypeSelect"
                        );

                    var oStatusSelect =
                        this.byId(
                            "leaveRequestStatusSelect"
                        );

                    var oYearInput =
                        this.byId(
                            "leaveRequestYearInput"
                        );

                    var sEmployeeId =
                        oEmployeeIdInput
                            ? oEmployeeIdInput
                                .getValue()
                                .trim()
                            : "";

                    var sLeaveType =
                        oLeaveTypeSelect
                            ? oLeaveTypeSelect
                                .getSelectedKey()
                            : "";

                    var sStatus =
                        oStatusSelect
                            ? oStatusSelect
                                .getSelectedKey()
                            : "";

                    var sYear =
                        oYearInput
                            ? oYearInput
                                .getValue()
                                .trim()
                            : "";

                    if (sEmployeeId) {
                        aFilters.push(
                            new Filter(
                                "employee/employeeId",
                                FilterOperator.Contains,
                                sEmployeeId
                            )
                        );
                    }

                    if (sLeaveType) {
                        aFilters.push(
                            new Filter(
                                "leaveType/leaveTypeId",
                                FilterOperator.EQ,
                                sLeaveType
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

                    if (sYear) {
                        var iYear =
                            parseInt(
                                sYear,
                                10
                            );

                        if (!isNaN(iYear)) {
                            var sStartDate =
                                iYear + "-01-01";

                            var sEndDate =
                                iYear + "-12-31";

                            aFilters.push(
                                new Filter({
                                    filters: [
                                        new Filter(
                                            "fromDate",
                                            FilterOperator.LE,
                                            sEndDate
                                        ),
                                        new Filter(
                                            "toDate",
                                            FilterOperator.GE,
                                            sStartDate
                                        )
                                    ],
                                    and: true
                                })
                            );
                        }
                    }

                    var oTable =
                        this.byId(
                            "leaveRequestsTable"
                        );

                    if (!oTable) {
                        return;
                    }

                    var oBinding =
                        oTable.getBinding("items");

                    if (oBinding) {
                        oBinding.filter(
                            aFilters
                        );
                    }
                },

                onClearFilter: function () {
                    var oEmployeeIdInput =
                        this.byId(
                            "leaveRequestEmployeeIdInput"
                        );

                    var oLeaveTypeSelect =
                        this.byId(
                            "leaveRequestLeaveTypeSelect"
                        );

                    var oStatusSelect =
                        this.byId(
                            "leaveRequestStatusSelect"
                        );

                    var oYearInput =
                        this.byId(
                            "leaveRequestYearInput"
                        );

                    if (oEmployeeIdInput) {
                        oEmployeeIdInput.setValue("");
                    }

                    if (oLeaveTypeSelect) {
                        oLeaveTypeSelect.setSelectedKey(
                            ""
                        );
                    }

                    if (oStatusSelect) {
                        oStatusSelect.setSelectedKey(
                            ""
                        );
                    }

                    if (oYearInput) {
                        oYearInput.setValue("");
                    }

                    var oTable =
                        this.byId(
                            "leaveRequestsTable"
                        );

                    if (oTable) {
                        var oBinding =
                            oTable.getBinding("items");

                        if (oBinding) {
                            oBinding.filter([]);
                        }
                    }
                },

                onApplyLeave: function () {
                    MessageToast.show(
                        "Leave request dialog will be connected here."
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
                        MessageBox.error(
                            "Leave request ID is not available."
                        );
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
                        !oData.employee ||
                        !oData.employee.employeeId
                    ) {
                        return;
                    }

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "EmployeeDetail",
                            {
                                employeeId:
                                    oData.employee.employeeId
                            }
                        );
                },

                onApproveRequest: function (
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

                    if (
                        (
                            oData.status ||
                            ""
                        ).toUpperCase() !== "PENDING"
                    ) {
                        MessageToast.show(
                            "Only pending requests can be approved."
                        );
                        return;
                    }

                    MessageBox.confirm(
                        "Approve leave request " +
                        oData.requestId +
                        "?",
                        {
                            title: "Approve Leave Request",
                            actions: [
                                MessageBox.Action.YES,
                                MessageBox.Action.NO
                            ],
                            emphasizedAction:
                                MessageBox.Action.YES,

                            onClose: function (sAction) {
                                if (
                                    sAction !==
                                    MessageBox.Action.YES
                                ) {
                                    return;
                                }

                                this._executeApprove(
                                    oData.requestId
                                );
                            }.bind(this)
                        }
                    );
                },

                _executeApprove: function (
                    sRequestId
                ) {
                    var oModel =
                        this.getView().getModel();

                    var oOperation =
                        oModel.bindContext(
                            "/approveLeaveRequest(...)"
                        );

                    oOperation.setParameter(
                        "requestId",
                        sRequestId
                    );

                    oOperation.setParameter(
                        "managerComments",
                        ""
                    );

                    oOperation.execute()
                        .then(function () {
                            MessageToast.show(
                                "Leave request approved successfully."
                            );

                            this._loadLeaveRequestData();
                        }.bind(this))
                        .catch(function (oError) {
                            console.error(
                                "Error approving leave request:",
                                oError
                            );

                            MessageBox.error(
                                oError.message ||
                                "Unable to approve leave request."
                            );
                        }.bind(this));
                },

                onRejectRequest: function (
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

                    if (
                        (
                            oData.status ||
                            ""
                        ).toUpperCase() !== "PENDING"
                    ) {
                        MessageToast.show(
                            "Only pending requests can be rejected."
                        );
                        return;
                    }

                    MessageBox.confirm(
                        "Reject leave request " +
                        oData.requestId +
                        "?",
                        {
                            title: "Reject Leave Request",
                            actions: [
                                MessageBox.Action.YES,
                                MessageBox.Action.NO
                            ],
                            emphasizedAction:
                                MessageBox.Action.YES,

                            onClose: function (sAction) {
                                if (
                                    sAction !==
                                    MessageBox.Action.YES
                                ) {
                                    return;
                                }

                                this._executeReject(
                                    oData.requestId
                                );
                            }.bind(this)
                        }
                    );
                },

                _executeReject: function (
                    sRequestId
                ) {
                    var oModel =
                        this.getView().getModel();

                    var oOperation =
                        oModel.bindContext(
                            "/rejectLeaveRequest(...)"
                        );

                    oOperation.setParameter(
                        "requestId",
                        sRequestId
                    );

                    oOperation.setParameter(
                        "managerComments",
                        ""
                    );

                    oOperation.execute()
                        .then(function () {
                            MessageToast.show(
                                "Leave request rejected successfully."
                            );

                            this._loadLeaveRequestData();
                        }.bind(this))
                        .catch(function (oError) {
                            console.error(
                                "Error rejecting leave request:",
                                oError
                            );

                            MessageBox.error(
                                oError.message ||
                                "Unable to reject leave request."
                            );
                        }.bind(this));
                },

                onCancelRequest: function (
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

                    var sStatus =
                        (
                            oData.status ||
                            ""
                        ).toUpperCase();

                    if (
                        sStatus !== "PENDING" &&
                        sStatus !== "APPROVED"
                    ) {
                        MessageToast.show(
                            "This request cannot be cancelled."
                        );
                        return;
                    }

                    MessageBox.confirm(
                        "Cancel leave request " +
                        oData.requestId +
                        "?",
                        {
                            title: "Cancel Leave Request",
                            actions: [
                                MessageBox.Action.YES,
                                MessageBox.Action.NO
                            ],
                            emphasizedAction:
                                MessageBox.Action.YES,

                            onClose: function (sAction) {
                                if (
                                    sAction !==
                                    MessageBox.Action.YES
                                ) {
                                    return;
                                }

                                this._executeCancel(
                                    oData.requestId
                                );
                            }.bind(this)
                        }
                    );
                },

                _executeCancel: function (
                    sRequestId
                ) {
                    var oModel =
                        this.getView().getModel();

                    var oOperation =
                        oModel.bindContext(
                            "/cancelLeaveRequest(...)"
                        );

                    oOperation.setParameter(
                        "requestId",
                        sRequestId
                    );

                    oOperation.execute()
                        .then(function () {
                            MessageToast.show(
                                "Leave request cancelled successfully."
                            );

                            this._loadLeaveRequestData();
                        }.bind(this))
                        .catch(function (oError) {
                            console.error(
                                "Error cancelling leave request:",
                                oError
                            );

                            MessageBox.error(
                                oError.message ||
                                "Unable to cancel leave request."
                            );
                        }.bind(this));
                },

                onRefresh: function () {
                    var oModel =
                        this.getView().getModel();

                    if (oModel) {
                        oModel.refresh();
                    }

                    this._loadLeaveRequestData();

                    MessageToast.show(
                        "Leave request data refreshed."
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