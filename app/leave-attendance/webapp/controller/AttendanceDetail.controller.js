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
            "com.mandeep.leaveattendance.controller.AttendanceDetail",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        hasCorrection: false,
                        correction: null
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("AttendanceDetail")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function (oEvent) {
                    var sAttendanceId =
                        oEvent.getParameter("arguments")
                            .attendanceId;

                    if (!sAttendanceId) {
                        MessageBox.error(
                            "Attendance ID is not available."
                        );
                        return;
                    }

                    this._loadAttendance(
                        sAttendanceId
                    );
                },

                _loadAttendance: function (sAttendanceId) {
                    var oModel = this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error("OData model is not available.");
                        return;
                    }

                    // Escape single quotes for the OData string literal
                    var sEscapedAttendanceId = sAttendanceId.replace(/'/g, "''");

                    // Find the record by its business ID, not its CUID key
                    var oBinding = oModel.bindList(
                        "/Attendance",
                        undefined,
                        undefined,
                        [],
                        {
                            $filter: "attendanceId eq '" + sEscapedAttendanceId + "'",
                            $expand: "employee"
                        }
                    );

                    oBinding.requestContexts(0, 1)
                        .then(function (aContexts) {
                            if (!aContexts || aContexts.length === 0) {
                                MessageBox.error("Attendance record not found.");
                                return;
                            }

                            var oContext = aContexts[0];

                            var oViewModel = this.getView().getModel("viewModel");
                            oViewModel.setProperty("/hasCorrection", false);
                            oViewModel.setProperty("/correction", null);

                            // Bind the view to the actual entity context returned by OData
                            this.getView().setBindingContext(oContext);

                            this._loadCorrection(sAttendanceId);
                        }.bind(this))
                        .catch(function (oError) {
                            console.error("Error loading attendance:", oError);

                            MessageBox.error(
                                "Unable to load attendance details."
                            );
                        });
                },

                _loadCorrection: function (
                    sAttendanceId
                ) {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        return;
                    }

                    var oBinding =
                        oModel.bindList(
                            "/AttendanceCorrections",
                            undefined,
                            undefined,
                            [],
                            {
                                $filter:
                                    "attendance/attendanceId eq '" +
                                    sAttendanceId.replace(
                                        /'/g,
                                        "''"
                                    ) +
                                    "'",
                                $expand:
                                    "employee,attendance"
                            }
                        );

                    oBinding.requestContexts(0, 1)
                        .then(function (aContexts) {

                            var oViewModel =
                                this.getView()
                                    .getModel(
                                        "viewModel"
                                    );

                            if (
                                aContexts &&
                                aContexts.length > 0
                            ) {
                                var oCorrection =
                                    aContexts[0]
                                        .getObject();

                                oViewModel.setProperty(
                                    "/hasCorrection",
                                    true
                                );

                                oViewModel.setProperty(
                                    "/correction",
                                    oCorrection
                                );
                            } else {
                                oViewModel.setProperty(
                                    "/hasCorrection",
                                    false
                                );

                                oViewModel.setProperty(
                                    "/correction",
                                    null
                                );
                            }

                        }.bind(this))
                        .catch(function (oError) {

                            console.error(
                                "Error loading attendance correction:",
                                oError
                            );

                        });
                },

                onRequestCorrection: function () {
                    var oContext =
                        this.getView()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Attendance record is not available."
                        );
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (!oData) {
                        return;
                    }

                    MessageToast.show(
                        "Attendance correction request can be submitted for " +
                        oData.attendanceId +
                        "."
                    );

                    /*
                     * The correction dialog can be connected here
                     * when AttendanceDialog.fragment.xml is implemented.
                     */
                },

                onRefresh: function () {
                    var oContext =
                        this.getView()
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

                    this._loadAttendance(
                        oData.attendanceId
                    );

                    MessageToast.show(
                        "Attendance details refreshed."
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
                                "Attendance",
                                {},
                                true
                            );
                    }
                },

                onGoToAttendance: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Attendance",
                            {},
                            true
                        );
                }

            }
        );
    }
);