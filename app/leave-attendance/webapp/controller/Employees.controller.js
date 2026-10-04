sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
        "sap/ui/core/routing/History"
    ],
    function (
        Controller,
        JSONModel,
        Filter,
        FilterOperator,
        Sorter,
        MessageToast,
        MessageBox,
        History
    ) {
        "use strict";

        return Controller.extend(
            "com.mandeep.leaveattendance.controller.Employees",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        totalEmployees: 0,
                        activeEmployees: 0,
                        inactiveEmployees: 0,
                        departmentCount: 0
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("Employees")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function () {
                    this._loadEmployeeData();
                },

                _loadEmployeeData: function () {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    this._updateKpiCounts();
                    this._refreshEmployeeTable();
                },

                _refreshEmployeeTable: function () {
                    var oTable =
                        this.byId("employeesTable");

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

                    this._getEmployeeCount(
                        oModel,
                        [],
                        "/totalEmployees"
                    );

                    this._getEmployeeCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "ACTIVE"
                            )
                        ],
                        "/activeEmployees"
                    );

                    this._getEmployeeCount(
                        oModel,
                        [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "INACTIVE"
                            )
                        ],
                        "/inactiveEmployees"
                    );

                    this._loadDepartmentCount();
                },

                _getEmployeeCount: function (
                    oModel,
                    aFilters,
                    sProperty
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/Employees",
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
                                "Error loading employee count:",
                                oError
                            );
                        });
                },

                _loadDepartmentCount: function () {
                    var oModel =
                        this.getView().getModel();

                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/Departments",
                            undefined,
                            undefined,
                            undefined,
                            {
                                $count: true
                            }
                        );

                    oBinding.requestContexts(0, 1)
                        .then(function () {
                            oViewModel.setProperty(
                                "/departmentCount",
                                oBinding.getCount() || 0
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading departments:",
                                oError
                            );
                        });
                },

                onSearch: function (oEvent) {
                    var sValue =
                        oEvent.getParameter("newValue");

                    var oTable =
                        this.byId("employeesTable");

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
                                    "employeeId",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "firstName",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "lastName",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "email",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "designation",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "department/name",
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

                    var oEmployeeInput =
                        this.byId(
                            "employeeIdFilterInput"
                        );

                    var oStatusSelect =
                        this.byId(
                            "employeeStatusSelect"
                        );

                    var oDepartmentSelect =
                        this.byId(
                            "employeeDepartmentSelect"
                        );

                    var sEmployeeId =
                        oEmployeeInput
                            ? oEmployeeInput
                                .getValue()
                                .trim()
                            : "";

                    var sStatus =
                        oStatusSelect
                            ? oStatusSelect
                                .getSelectedKey()
                            : "";

                    var sDepartment =
                        oDepartmentSelect
                            ? oDepartmentSelect
                                .getSelectedKey()
                            : "";

                    if (sEmployeeId) {
                        aFilters.push(
                            new Filter(
                                "employeeId",
                                FilterOperator.Contains,
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

                    if (sDepartment) {
                        aFilters.push(
                            new Filter(
                                "department/departmentId",
                                FilterOperator.EQ,
                                sDepartment
                            )
                        );
                    }

                    var oTable =
                        this.byId("employeesTable");

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
                    var oEmployeeInput =
                        this.byId(
                            "employeeIdFilterInput"
                        );

                    var oStatusSelect =
                        this.byId(
                            "employeeStatusSelect"
                        );

                    var oDepartmentSelect =
                        this.byId(
                            "employeeDepartmentSelect"
                        );

                    if (oEmployeeInput) {
                        oEmployeeInput.setValue("");
                    }

                    if (oStatusSelect) {
                        oStatusSelect.setSelectedKey("");
                    }

                    if (oDepartmentSelect) {
                        oDepartmentSelect.setSelectedKey("");
                    }

                    var oTable =
                        this.byId("employeesTable");

                    if (oTable) {
                        var oBinding =
                            oTable.getBinding("items");

                        if (oBinding) {
                            oBinding.filter([]);
                        }
                    }
                },

                onEmployeePress: function (oEvent) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Unable to load employee details."
                        );
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (
                        !oData ||
                        !oData.employeeId
                    ) {
                        MessageBox.error(
                            "Employee ID is not available."
                        );
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

                onAddEmployee: function () {
                    MessageToast.show(
                        "Employee creation dialog will be connected here."
                    );
                },

                onEditEmployee: function (oEvent) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (!oData) {
                        return;
                    }

                    MessageToast.show(
                        "Edit employee " +
                        oData.employeeId +
                        " functionality will be connected here."
                    );
                },

                onDeleteEmployee: function (oEvent) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Unable to identify the employee."
                        );
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (!oData) {
                        return;
                    }

                    MessageBox.confirm(
                        "Are you sure you want to delete employee " +
                        oData.employeeId +
                        "?",
                        {
                            title: "Delete Employee",
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

                                this._deleteEmployee(
                                    oContext
                                );
                            }.bind(this)
                        }
                    );
                },

                _deleteEmployee: function (
                    oContext
                ) {
                    oContext.delete("$auto")
                        .then(function () {
                            MessageToast.show(
                                "Employee deleted successfully."
                            );

                            this._loadEmployeeData();
                        }.bind(this))
                        .catch(function (oError) {
                            console.error(
                                "Error deleting employee:",
                                oError
                            );

                            MessageBox.error(
                                oError.message ||
                                "Unable to delete employee."
                            );
                        }.bind(this));
                },

                onRefresh: function () {
                    var oModel =
                        this.getView().getModel();

                    if (oModel) {
                        oModel.refresh();
                    }

                    this._loadEmployeeData();

                    MessageToast.show(
                        "Employee data refreshed."
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