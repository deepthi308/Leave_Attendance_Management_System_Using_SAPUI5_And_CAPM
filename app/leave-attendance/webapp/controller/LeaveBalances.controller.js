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
            "com.mandeep.leaveattendance.controller.LeaveBalances",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        totalRecords: 0,
                        totalEntitlement: 0,
                        usedDays: 0,
                        pendingDays: 0,
                        availableDays: 0
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("LeaveBalances")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function () {
                    this._loadLeaveBalanceData();
                },

                _loadLeaveBalanceData: function () {
                    var oModel =
                        this.getView().getModel();

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
                    var oTable =
                        this.byId("leaveBalanceTable");

                    if (!oTable) {
                        return;
                    }

                    var oBinding =
                        oTable.getBinding("items");

                    if (oBinding) {
                        oBinding.refresh();
                    }
                },

                _updateKpiCounts: function () {
                    var oModel =
                        this.getView().getModel();

                    this._loadSummaryData(
                        oModel
                    );
                },

                _loadSummaryData: function (
                    oModel
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/LeaveBalances",
                            undefined,
                            undefined,
                            undefined,
                            {
                                $select:
                                    "totalDays,usedDays,pendingDays,availableDays"
                            }
                        );

                    oBinding.requestContexts()
                        .then(function (aContexts) {
                            var fTotalEntitlement = 0;
                            var fUsedDays = 0;
                            var fPendingDays = 0;
                            var fAvailableDays = 0;

                            aContexts.forEach(
                                function (oContext) {
                                    var oData =
                                        oContext.getObject();

                                    fTotalEntitlement +=
                                        Number(
                                            oData.totalDays
                                        ) || 0;

                                    fUsedDays +=
                                        Number(
                                            oData.usedDays
                                        ) || 0;

                                    fPendingDays +=
                                        Number(
                                            oData.pendingDays
                                        ) || 0;

                                    fAvailableDays +=
                                        Number(
                                            oData.availableDays
                                        ) || 0;
                                }
                            );

                            oViewModel.setProperty(
                                "/totalRecords",
                                aContexts.length
                            );

                            oViewModel.setProperty(
                                "/totalEntitlement",
                                fTotalEntitlement
                            );

                            oViewModel.setProperty(
                                "/usedDays",
                                fUsedDays
                            );

                            oViewModel.setProperty(
                                "/pendingDays",
                                fPendingDays
                            );

                            oViewModel.setProperty(
                                "/availableDays",
                                fAvailableDays
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading leave balance summary:",
                                oError
                            );
                        });
                },

                onSearch: function (oEvent) {
                    var sValue =
                        oEvent.getParameter("newValue");

                    var oTable =
                        this.byId("leaveBalanceTable");

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
                                    "balanceId",
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
                            "leaveBalanceEmployeeIdInput"
                        );

                    var oLeaveTypeSelect =
                        this.byId(
                            "leaveBalanceLeaveTypeSelect"
                        );

                    var oYearInput =
                        this.byId(
                            "leaveBalanceYearInput"
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

                    if (sYear) {
                        var iYear =
                            parseInt(
                                sYear,
                                10
                            );

                        if (!isNaN(iYear)) {
                            aFilters.push(
                                new Filter(
                                    "year",
                                    FilterOperator.EQ,
                                    iYear
                                )
                            );
                        }
                    }

                    var oTable =
                        this.byId(
                            "leaveBalanceTable"
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
                            "leaveBalanceEmployeeIdInput"
                        );

                    var oLeaveTypeSelect =
                        this.byId(
                            "leaveBalanceLeaveTypeSelect"
                        );

                    var oYearInput =
                        this.byId(
                            "leaveBalanceYearInput"
                        );

                    if (oEmployeeIdInput) {
                        oEmployeeIdInput.setValue("");
                    }

                    if (oLeaveTypeSelect) {
                        oLeaveTypeSelect.setSelectedKey(
                            ""
                        );
                    }

                    if (oYearInput) {
                        oYearInput.setValue("");
                    }

                    var oTable =
                        this.byId(
                            "leaveBalanceTable"
                        );

                    if (oTable) {
                        var oBinding =
                            oTable.getBinding("items");

                        if (oBinding) {
                            oBinding.filter([]);
                        }
                    }
                },

                onRecalculateBalance: function (
                    oEvent
                ) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Leave balance information is not available."
                        );
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (
                        !oData ||
                        !oData.employee ||
                        !oData.leaveType
                    ) {
                        MessageBox.error(
                            "Employee or leave type information is not available."
                        );
                        return;
                    }

                    var sEmployeeId =
                        oData.employee.employeeId;

                    var sLeaveTypeId =
                        oData.leaveType.leaveTypeId;

                    var iYear =
                        parseInt(
                            oData.year,
                            10
                        );

                    if (
                        !sEmployeeId ||
                        !sLeaveTypeId ||
                        isNaN(iYear)
                    ) {
                        MessageBox.error(
                            "Required leave balance information is missing."
                        );
                        return;
                    }

                    MessageBox.confirm(
                        "Recalculate the leave balance for " +
                        sEmployeeId +
                        " - " +
                        sLeaveTypeId +
                        " for " +
                        iYear +
                        "?",
                        {
                            title: "Recalculate Leave Balance",
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

                                this._executeRecalculate(
                                    sEmployeeId,
                                    sLeaveTypeId,
                                    iYear
                                );
                            }.bind(this)
                        }
                    );
                },

                _executeRecalculate: function (
                    sEmployeeId,
                    sLeaveTypeId,
                    iYear
                ) {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    var oOperation =
                        oModel.bindContext(
                            "/recalculateLeaveBalance(...)"
                        );

                    oOperation.setParameter(
                        "employeeId",
                        sEmployeeId
                    );

                    oOperation.setParameter(
                        "leaveTypeId",
                        sLeaveTypeId
                    );

                    oOperation.setParameter(
                        "year",
                        iYear
                    );

                    oOperation.execute()
                        .then(function () {
                            MessageToast.show(
                                "Leave balance recalculated successfully."
                            );

                            this._loadLeaveBalanceData();
                        }.bind(this))
                        .catch(function (oError) {
                            console.error(
                                "Error recalculating leave balance:",
                                oError
                            );

                            MessageBox.error(
                                oError.message ||
                                "Unable to recalculate leave balance."
                            );
                        }.bind(this));
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

                onRefresh: function () {
                    var oModel =
                        this.getView().getModel();

                    if (oModel) {
                        oModel.refresh();
                    }

                    this._loadLeaveBalanceData();

                    MessageToast.show(
                        "Leave balance data refreshed."
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