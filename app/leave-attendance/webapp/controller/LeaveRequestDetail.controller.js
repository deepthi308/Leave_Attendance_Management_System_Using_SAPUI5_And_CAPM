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
            "com.mandeep.leaveattendance.controller.LeaveRequestDetail",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        isEditable: false,
                        canApprove: false,
                        canReject: false,
                        canCancel: false
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("LeaveRequestDetail")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function (oEvent) {
                    var sRequestId =
                        oEvent.getParameter("arguments")
                            .requestId;

                    if (!sRequestId) {
                        MessageBox.error(
                            "Leave request ID is not available."
                        );
                        return;
                    }

                    this._loadLeaveRequest(
                        sRequestId
                    );
                },

                _loadLeaveRequest: function (
                    sRequestId
                ) {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    var sEscapedRequestId =
                        sRequestId.replace(
                            /'/g,
                            "''"
                        );

                    var oListBinding =
                        oModel.bindList(
                            "/LeaveRequests",
                            undefined,
                            undefined,
                            [
                                new Filter(
                                    "requestId",
                                    FilterOperator.EQ,
                                    sEscapedRequestId
                                )
                            ],
                            {
                                $expand:
                                    "employee,leaveType"
                            }
                        );

                    oListBinding.requestContexts(0, 1)
                        .then(function (aContexts) {

                            if (
                                !aContexts ||
                                aContexts.length === 0
                            ) {
                                MessageBox.error(
                                    "Leave request not found."
                                );
                                return;
                            }

                            var oContext =
                                aContexts[0];

                            this.getView()
                                .setBindingContext(
                                    oContext
                                );

                            this._updateViewState(
                                oContext.getObject()
                            );

                        }.bind(this))
                        .catch(function (oError) {

                            console.error(
                                "Error loading leave request:",
                                oError
                            );

                            MessageBox.error(
                                oError.message ||
                                "Unable to load leave request details."
                            );

                        });
                },

                _updateViewState: function (
                    oRequest
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    if (!oRequest) {
                        return;
                    }

                    var sStatus =
                        (
                            oRequest.status ||
                            ""
                        ).toUpperCase();

                    oViewModel.setProperty(
                        "/isEditable",
                        sStatus === "DRAFT"
                    );

                    oViewModel.setProperty(
                        "/canApprove",
                        sStatus === "PENDING"
                    );

                    oViewModel.setProperty(
                        "/canReject",
                        sStatus === "PENDING"
                    );

                    oViewModel.setProperty(
                        "/canCancel",
                        sStatus === "PENDING" ||
                        sStatus === "APPROVED"
                    );
                },

                onEditRequest: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Leave request details are not available."
                        );
                        return;
                    }

                    var oRequest =
                        oContext.getObject();

                    if (!oRequest) {
                        return;
                    }

                    if (
                        (
                            oRequest.status ||
                            ""
                        ).toUpperCase() !== "DRAFT"
                    ) {
                        MessageToast.show(
                            "Only draft leave requests can be edited."
                        );
                        return;
                    }

                    MessageToast.show(
                        "Leave request edit functionality will be connected to the leave request dialog."
                    );
                },

                onApprove: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Leave request details are not available."
                        );
                        return;
                    }

                    var oRequest =
                        oContext.getObject();

                    if (
                        !oRequest ||
                        !oRequest.requestId
                    ) {
                        return;
                    }

                    if (
                        (
                            oRequest.status ||
                            ""
                        ).toUpperCase() !== "PENDING"
                    ) {
                        MessageToast.show(
                            "Only pending leave requests can be approved."
                        );
                        return;
                    }

                    MessageBox.confirm(
                        "Approve leave request " +
                        oRequest.requestId +
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
                                    oRequest.requestId,
                                    ""
                                );
                            }.bind(this)
                        }
                    );
                },

                _executeApprove: function (
                    sRequestId,
                    sManagerComments
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
                        sManagerComments || ""
                    );

                    oOperation.execute()
                        .then(function () {
                            MessageToast.show(
                                "Leave request approved successfully."
                            );

                            this._loadLeaveRequest(
                                sRequestId
                            );
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

                onReject: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Leave request details are not available."
                        );
                        return;
                    }

                    var oRequest =
                        oContext.getObject();

                    if (
                        !oRequest ||
                        !oRequest.requestId
                    ) {
                        return;
                    }

                    if (
                        (
                            oRequest.status ||
                            ""
                        ).toUpperCase() !== "PENDING"
                    ) {
                        MessageToast.show(
                            "Only pending leave requests can be rejected."
                        );
                        return;
                    }

                    MessageBox.confirm(
                        "Reject leave request " +
                        oRequest.requestId +
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
                                    oRequest.requestId,
                                    ""
                                );
                            }.bind(this)
                        }
                    );
                },

                _executeReject: function (
                    sRequestId,
                    sManagerComments
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
                        sManagerComments || ""
                    );

                    oOperation.execute()
                        .then(function () {
                            MessageToast.show(
                                "Leave request rejected successfully."
                            );

                            this._loadLeaveRequest(
                                sRequestId
                            );
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

                onCancel: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Leave request details are not available."
                        );
                        return;
                    }

                    var oRequest =
                        oContext.getObject();

                    if (
                        !oRequest ||
                        !oRequest.requestId
                    ) {
                        return;
                    }

                    var sStatus =
                        (
                            oRequest.status ||
                            ""
                        ).toUpperCase();

                    if (
                        sStatus !== "PENDING" &&
                        sStatus !== "APPROVED"
                    ) {
                        MessageToast.show(
                            "This leave request cannot be cancelled."
                        );
                        return;
                    }

                    MessageBox.confirm(
                        "Cancel leave request " +
                        oRequest.requestId +
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
                                    oRequest.requestId
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

                            this._loadLeaveRequest(
                                sRequestId
                            );
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

                onEmployeePress: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        return;
                    }

                    var oRequest =
                        oContext.getObject();

                    if (
                        !oRequest ||
                        !oRequest.employee ||
                        !oRequest.employee.employeeId
                    ) {
                        return;
                    }

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "EmployeeDetail",
                            {
                                employeeId:
                                    oRequest.employee.employeeId
                            }
                        );
                },

                onLeaveRequests: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "LeaveRequests"
                        );
                },

                onRefresh: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        return;
                    }

                    var oRequest =
                        oContext.getObject();

                    if (
                        !oRequest ||
                        !oRequest.requestId
                    ) {
                        return;
                    }

                    this._loadLeaveRequest(
                        oRequest.requestId
                    );

                    MessageToast.show(
                        "Leave request details refreshed."
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
                                "LeaveRequests",
                                {},
                                true
                            );
                    }
                }

            }
        );
    }
);