sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
        "sap/ui/core/routing/History"
    ],
    function (
        Controller,
        JSONModel,
        MessageToast,
        MessageBox,
        History
    ) {
        "use strict";

        return Controller.extend(
            "com.mandeep.leaveattendance.controller.Approval",
            {

                /* =========================================================
                   LIFECYCLE
                ========================================================= */

                onInit: function () {
                    var oViewModel = new JSONModel({
                        pendingLeaveRequests: 0,
                        pendingAttendanceCorrections: 0,
                        totalPendingApprovals: 0,

                        selectedTab: "leaveRequests",

                        selectedRequest: null,
                        selectedCorrection: null
                    });

                    this.getView().setModel(oViewModel, "viewModel");

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("Approval")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function () {
                    this._refreshApprovalData();
                },

                /* =========================================================
                   DATA LOADING
                ========================================================= */

                _refreshApprovalData: function () {
                    var oModel = this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    this._updateApprovalCounts();
                    this._refreshTables();
                },

                _refreshTables: function () {
                    var oLeaveTable =
                        this.byId("leaveApprovalTable");

                    var oCorrectionTable =
                        this.byId("attendanceCorrectionTable");

                    if (oLeaveTable) {
                        var oLeaveBinding =
                            oLeaveTable.getBinding("items");

                        if (oLeaveBinding) {
                            oLeaveBinding.refresh();
                        }
                    }

                    if (oCorrectionTable) {
                        var oCorrectionBinding =
                            oCorrectionTable.getBinding("items");

                        if (oCorrectionBinding) {
                            oCorrectionBinding.refresh();
                        }
                    }
                },

                _updateApprovalCounts: function () {
                    var oModel = this.getView().getModel();
                    var oViewModel =
                        this.getView().getModel("viewModel");

                    if (!oModel) {
                        return;
                    }

                    var oLeaveListBinding =
                        oModel.bindList(
                            "/LeaveRequests",
                            undefined,
                            undefined,
                            [
                                new sap.ui.model.Filter(
                                    "status",
                                    sap.ui.model.FilterOperator.EQ,
                                    "PENDING"
                                )
                            ],
                            {
                                $count: true
                            }
                        );

                    oLeaveListBinding
                        .requestContexts(0, 1)
                        .then(function () {

                            var iCount =
                                oLeaveListBinding
                                    .getCount();

                            if (iCount === undefined) {
                                iCount = 0;
                            }

                            oViewModel.setProperty(
                                "/pendingLeaveRequests",
                                iCount
                            );

                            this._updateTotalPending();

                        }.bind(this))
                        .catch(function (oError) {
                            console.error(
                                "Error loading pending leave requests:",
                                oError
                            );
                        }.bind(this));

                    var oCorrectionListBinding =
                        oModel.bindList(
                            "/AttendanceCorrections",
                            undefined,
                            undefined,
                            [
                                new sap.ui.model.Filter(
                                    "status",
                                    sap.ui.model.FilterOperator.EQ,
                                    "PENDING"
                                )
                            ],
                            {
                                $count: true
                            }
                        );

                    oCorrectionListBinding
                        .requestContexts(0, 1)
                        .then(function () {

                            var iCount =
                                oCorrectionListBinding
                                    .getCount();

                            if (iCount === undefined) {
                                iCount = 0;
                            }

                            oViewModel.setProperty(
                                "/pendingAttendanceCorrections",
                                iCount
                            );

                            this._updateTotalPending();

                        }.bind(this))
                        .catch(function (oError) {
                            console.error(
                                "Error loading attendance corrections:",
                                oError
                            );
                        }.bind(this));
                },

                _updateTotalPending: function () {
                    var oViewModel =
                        this.getView().getModel("viewModel");

                    var iLeave =
                        Number(
                            oViewModel.getProperty(
                                "/pendingLeaveRequests"
                            )
                        ) || 0;

                    var iCorrection =
                        Number(
                            oViewModel.getProperty(
                                "/pendingAttendanceCorrections"
                            )
                        ) || 0;

                    oViewModel.setProperty(
                        "/totalPendingApprovals",
                        iLeave + iCorrection
                    );
                },

                /* =========================================================
                   REFRESH
                ========================================================= */

                onRefresh: function () {
                    var oModel = this.getView().getModel();

                    if (oModel) {
                        oModel.refresh();
                    }

                    this._refreshApprovalData();

                    MessageToast.show(
                        "Approval data refreshed."
                    );
                },

                /* =========================================================
                   TAB / SECTION HANDLING
                ========================================================= */

                onTabSelect: function (oEvent) {
                    var sKey =
                        oEvent.getParameter("key");

                    this.getView()
                        .getModel("viewModel")
                        .setProperty(
                            "/selectedTab",
                            sKey
                        );
                },

                onLeaveRequestsTab: function () {
                    this.getView()
                        .getModel("viewModel")
                        .setProperty(
                            "/selectedTab",
                            "leaveRequests"
                        );
                },

                onAttendanceCorrectionsTab: function () {
                    this.getView()
                        .getModel("viewModel")
                        .setProperty(
                            "/selectedTab",
                            "attendanceCorrections"
                        );
                },

                /* =========================================================
                   LEAVE REQUEST NAVIGATION
                ========================================================= */

                onLeaveRequestPress: function (oEvent) {
                    var oItem =
                        oEvent.getSource();

                    var oContext =
                        oItem.getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Unable to load the leave request."
                        );
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (!oData) {
                        return;
                    }

                    this.getView()
                        .getModel("viewModel")
                        .setProperty(
                            "/selectedRequest",
                            oData
                        );

                    var sRequestId =
                        oData.requestId;

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "LeaveRequestDetail",
                            {
                                requestId: sRequestId
                            }
                        );
                },

                /* =========================================================
                   ATTENDANCE CORRECTION NAVIGATION
                ========================================================= */

                onAttendanceCorrectionPress: function (oEvent) {
                    var oItem =
                        oEvent.getSource();

                    var oContext =
                        oItem.getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Unable to load the attendance correction."
                        );
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (!oData) {
                        return;
                    }

                    this.getView()
                        .getModel("viewModel")
                        .setProperty(
                            "/selectedCorrection",
                            oData
                        );

                    var sCorrectionId =
                        oData.correctionId;

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "AttendanceDetail",
                            {
                                correctionId: sCorrectionId
                            }
                        );
                },

                /* =========================================================
                   APPROVE LEAVE REQUEST
                ========================================================= */

                onApproveLeaveRequest: function (oEvent) {
                    var oContext =
                        oEvent
                            .getSource()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Unable to identify the leave request."
                        );
                        return;
                    }

                    var oRequest =
                        oContext.getObject();

                    var sRequestId =
                        oRequest.requestId;

                    MessageBox.confirm(
                        "Are you sure you want to approve leave request " +
                        sRequestId +
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

                                this._approveLeaveRequest(
                                    sRequestId
                                );

                            }.bind(this)
                        }
                    );
                },

                _approveLeaveRequest: function (sRequestId) {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        return;
                    }

                    var oAction =
                        oModel.bindContext(
                            "/approveLeaveRequest(...)"
                        );

                    oAction.setParameter(
                        "requestId",
                        sRequestId
                    );

                    oAction.setParameter(
                        "managerComments",
                        "Leave request approved."
                    );

                    oAction.execute()
                        .then(function () {

                            MessageToast.show(
                                "Leave request approved successfully."
                            );

                            this._refreshApprovalData();

                        }.bind(this))
                        .catch(function (oError) {

                            this._showActionError(
                                oError,
                                "approve the leave request"
                            );

                        }.bind(this));
                },

                /* =========================================================
                   REJECT LEAVE REQUEST
                ========================================================= */

                onRejectLeaveRequest: function (oEvent) {
                    var oContext =
                        oEvent
                            .getSource()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Unable to identify the leave request."
                        );
                        return;
                    }

                    var oRequest =
                        oContext.getObject();

                    var sRequestId =
                        oRequest.requestId;

                    this._openRejectDialog(
                        "leaveRequest",
                        sRequestId
                    );
                },

                /* =========================================================
                   APPROVE ATTENDANCE CORRECTION
                ========================================================= */

                onApproveAttendanceCorrection:
                    function (oEvent) {

                        var oContext =
                            oEvent
                                .getSource()
                                .getBindingContext();

                        if (!oContext) {
                            MessageBox.error(
                                "Unable to identify the attendance correction."
                            );
                            return;
                        }

                        var oCorrection =
                            oContext.getObject();

                        var sCorrectionId =
                            oCorrection.correctionId;

                        MessageBox.confirm(
                            "Are you sure you want to approve attendance correction " +
                            sCorrectionId +
                            "?",
                            {
                                title:
                                    "Approve Attendance Correction",

                                actions: [
                                    MessageBox.Action.YES,
                                    MessageBox.Action.NO
                                ],

                                emphasizedAction:
                                    MessageBox.Action.YES,

                                onClose:
                                    function (sAction) {

                                        if (
                                            sAction !==
                                            MessageBox.Action.YES
                                        ) {
                                            return;
                                        }

                                        this
                                            ._approveAttendanceCorrection(
                                                sCorrectionId
                                            );

                                    }.bind(this)
                            }
                        );
                    },

                _approveAttendanceCorrection:
                    function (sCorrectionId) {

                        var oModel =
                            this.getView().getModel();

                        var oAction =
                            oModel.bindContext(
                                "/approveAttendanceCorrection(...)"
                            );

                        oAction.setParameter(
                            "correctionId",
                            sCorrectionId
                        );

                        oAction.setParameter(
                            "managerComments",
                            "Attendance correction approved."
                        );

                        oAction.execute()
                            .then(function () {

                                MessageToast.show(
                                    "Attendance correction approved successfully."
                                );

                                this._refreshApprovalData();

                            }.bind(this))
                            .catch(function (oError) {

                                this._showActionError(
                                    oError,
                                    "approve the attendance correction"
                                );

                            }.bind(this));
                    },

                /* =========================================================
                   REJECT ATTENDANCE CORRECTION
                ========================================================= */

                onRejectAttendanceCorrection:
                    function (oEvent) {

                        var oContext =
                            oEvent
                                .getSource()
                                .getBindingContext();

                        if (!oContext) {
                            MessageBox.error(
                                "Unable to identify the attendance correction."
                            );
                            return;
                        }

                        var oCorrection =
                            oContext.getObject();

                        this._openRejectDialog(
                            "attendanceCorrection",
                            oCorrection.correctionId
                        );
                    },

                /* =========================================================
                   REJECT DIALOG
                ========================================================= */

                _openRejectDialog:
                    function (sType, sId) {

                        this._rejectType = sType;
                        this._rejectId = sId;

                        if (!this._oRejectDialog) {
                            this._oRejectDialog =
                                sap.ui.xmlfragment(
                                    this.getView().getId(),
                                    "com.mandeep.leaveattendance.fragment.RejectDialog",
                                    this
                                );

                            this.getView()
                                .addDependent(
                                    this._oRejectDialog
                                );
                        }

                        var oInput =
                            sap.ui.core.Fragment.byId(
                                this.getView().getId(),
                                "rejectReasonInput"
                            );

                        if (oInput) {
                            oInput.setValue("");
                        }

                        this._oRejectDialog.open();
                    },

                onConfirmReject: function () {
                    var sReason =
                        sap.ui.core.Fragment.byId(
                            this.getView().getId(),
                            "rejectReasonInput"
                        );

                    var sComment =
                        sReason
                            ? sReason.getValue().trim()
                            : "";

                    if (!sComment) {
                        MessageBox.warning(
                            "Please enter a reason for rejection."
                        );
                        return;
                    }

                    this._oRejectDialog.close();

                    if (
                        this._rejectType ===
                        "leaveRequest"
                    ) {
                        this._rejectLeaveRequest(
                            this._rejectId,
                            sComment
                        );
                    } else if (
                        this._rejectType ===
                        "attendanceCorrection"
                    ) {
                        this._rejectAttendanceCorrection(
                            this._rejectId,
                            sComment
                        );
                    }
                },

                onCancelReject: function () {
                    if (this._oRejectDialog) {
                        this._oRejectDialog.close();
                    }
                },

                /* =========================================================
                   REJECT LEAVE REQUEST ACTION
                ========================================================= */

                _rejectLeaveRequest:
                    function (
                        sRequestId,
                        sComment
                    ) {

                        var oModel =
                            this.getView().getModel();

                        var oAction =
                            oModel.bindContext(
                                "/rejectLeaveRequest(...)"
                            );

                        oAction.setParameter(
                            "requestId",
                            sRequestId
                        );

                        oAction.setParameter(
                            "managerComments",
                            sComment
                        );

                        oAction.execute()
                            .then(function () {

                                MessageToast.show(
                                    "Leave request rejected."
                                );

                                this._refreshApprovalData();

                            }.bind(this))
                            .catch(function (oError) {

                                this._showActionError(
                                    oError,
                                    "reject the leave request"
                                );

                            }.bind(this));
                    },

                /* =========================================================
                   REJECT ATTENDANCE CORRECTION ACTION
                ========================================================= */

                _rejectAttendanceCorrection:
                    function (
                        sCorrectionId,
                        sComment
                    ) {

                        var oModel =
                            this.getView().getModel();

                        var oAction =
                            oModel.bindContext(
                                "/rejectAttendanceCorrection(...)"
                            );

                        oAction.setParameter(
                            "correctionId",
                            sCorrectionId
                        );

                        oAction.setParameter(
                            "managerComments",
                            sComment
                        );

                        oAction.execute()
                            .then(function () {

                                MessageToast.show(
                                    "Attendance correction rejected."
                                );

                                this._refreshApprovalData();

                            }.bind(this))
                            .catch(function (oError) {

                                this._showActionError(
                                    oError,
                                    "reject the attendance correction"
                                );

                            }.bind(this));
                    },

                /* =========================================================
                   ERROR HANDLING
                ========================================================= */

                _showActionError:
                    function (
                        oError,
                        sAction
                    ) {

                        console.error(
                            "Unable to " +
                            sAction +
                            ":",
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

                /* =========================================================
                   BACK NAVIGATION
                ========================================================= */

                onBack: function () {
                    var oHistory =
                        History.getInstance();

                    var sPreviousHash =
                        oHistory.getPreviousHash();

                    if (sPreviousHash !== undefined) {
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
                },

                /* =========================================================
                   CLEANUP
                ========================================================= */

                onExit: function () {
                    if (this._oRejectDialog) {
                        this._oRejectDialog.destroy();
                        this._oRejectDialog = null;
                    }
                }

            }
        );
    }
);