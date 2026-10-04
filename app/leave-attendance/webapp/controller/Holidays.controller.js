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
            "com.mandeep.leaveattendance.controller.Holidays",
            {

                onInit: function () {
                    var oViewModel = new JSONModel({
                        totalHolidays: 0,
                        upcomingHolidays: 0,
                        nationalHolidays: 0,
                        optionalHolidays: 0
                    });

                    this.getView().setModel(
                        oViewModel,
                        "viewModel"
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("Holidays")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );
                },

                _onRouteMatched: function () {
                    this._loadHolidayData();
                },

                _loadHolidayData: function () {
                    var oModel =
                        this.getView().getModel();

                    if (!oModel) {
                        MessageBox.error(
                            "OData model is not available."
                        );
                        return;
                    }

                    this._updateKpiCounts();
                    this._refreshHolidayTable();
                    this._refreshUpcomingHolidayList();
                },

                _refreshHolidayTable: function () {
                    var oTable =
                        this.byId("holidaysTable");

                    if (!oTable) {
                        return;
                    }

                    var oBinding =
                        oTable.getBinding("items");

                    if (oBinding) {
                        oBinding.refresh();
                    }
                },

                _refreshUpcomingHolidayList: function () {
                    var oList =
                        this.byId(
                            "upcomingHolidaysList"
                        );

                    if (!oList) {
                        return;
                    }

                    var oBinding =
                        oList.getBinding("items");

                    if (oBinding) {
                        oBinding.refresh();
                    }
                },

                _updateKpiCounts: function () {
                    var oModel =
                        this.getView().getModel();

                    this._getHolidayCount(
                        oModel,
                        [],
                        "/totalHolidays"
                    );

                    this._getUpcomingHolidayCount(
                        oModel
                    );

                    this._getHolidayCount(
                        oModel,
                        [
                            new Filter(
                                "holidayType",
                                FilterOperator.EQ,
                                "NATIONAL"
                            )
                        ],
                        "/nationalHolidays"
                    );

                    this._getOptionalHolidayCount(
                        oModel
                    );
                },

                _getHolidayCount: function (
                    oModel,
                    aFilters,
                    sProperty
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/Holidays",
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
                                "Error loading holiday count:",
                                oError
                            );
                        });
                },

                _getUpcomingHolidayCount: function (
                    oModel
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var sToday =
                        this._getTodayDate();

                    var oBinding =
                        oModel.bindList(
                            "/Holidays",
                            undefined,
                            undefined,
                            [
                                new Filter(
                                    "holidayDate",
                                    FilterOperator.GE,
                                    sToday
                                ),
                                new Filter(
                                    "status",
                                    FilterOperator.EQ,
                                    "ACTIVE"
                                )
                            ],
                            {
                                $count: true
                            }
                        );

                    oBinding.requestContexts(0, 1)
                        .then(function () {
                            oViewModel.setProperty(
                                "/upcomingHolidays",
                                oBinding.getCount() || 0
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading upcoming holidays:",
                                oError
                            );
                        });
                },

                _getOptionalHolidayCount: function (
                    oModel
                ) {
                    var oViewModel =
                        this.getView()
                            .getModel("viewModel");

                    var oBinding =
                        oModel.bindList(
                            "/Holidays",
                            undefined,
                            undefined,
                            [
                                new Filter({
                                    filters: [
                                        new Filter(
                                            "holidayType",
                                            FilterOperator.EQ,
                                            "OPTIONAL"
                                        ),
                                        new Filter(
                                            "holidayType",
                                            FilterOperator.EQ,
                                            "SPECIAL"
                                        )
                                    ],
                                    and: false
                                })
                            ],
                            {
                                $count: true
                            }
                        );

                    oBinding.requestContexts(0, 1)
                        .then(function () {
                            oViewModel.setProperty(
                                "/optionalHolidays",
                                oBinding.getCount() || 0
                            );
                        })
                        .catch(function (oError) {
                            console.error(
                                "Error loading optional holidays:",
                                oError
                            );
                        });
                },

                onSearch: function (oEvent) {
                    var sValue =
                        oEvent.getParameter("newValue");

                    var oTable =
                        this.byId("holidaysTable");

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
                                    "holidayId",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "name",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "location",
                                    FilterOperator.Contains,
                                    sValue
                                ),
                                new Filter(
                                    "holidayType",
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

                    var oTypeSelect =
                        this.byId(
                            "holidayTypeSelect"
                        );

                    var oStatusSelect =
                        this.byId(
                            "holidayStatusSelect"
                        );

                    var oDatePicker =
                        this.byId(
                            "holidayDatePicker"
                        );

                    var sHolidayType =
                        oTypeSelect
                            ? oTypeSelect
                                .getSelectedKey()
                            : "";

                    var sStatus =
                        oStatusSelect
                            ? oStatusSelect
                                .getSelectedKey()
                            : "";

                    var sDate =
                        oDatePicker
                            ? oDatePicker
                                .getValue()
                            : "";

                    if (sHolidayType) {
                        aFilters.push(
                            new Filter(
                                "holidayType",
                                FilterOperator.EQ,
                                sHolidayType
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

                    if (sDate) {
                        var oDate =
                            oDatePicker.getDateValue();

                        if (oDate) {
                            var sFormattedDate =
                                this._formatDateForOData(
                                    oDate
                                );

                            aFilters.push(
                                new Filter(
                                    "holidayDate",
                                    FilterOperator.EQ,
                                    sFormattedDate
                                )
                            );
                        }
                    }

                    var oTable =
                        this.byId("holidaysTable");

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
                    var oTypeSelect =
                        this.byId(
                            "holidayTypeSelect"
                        );

                    var oStatusSelect =
                        this.byId(
                            "holidayStatusSelect"
                        );

                    var oDatePicker =
                        this.byId(
                            "holidayDatePicker"
                        );

                    if (oTypeSelect) {
                        oTypeSelect.setSelectedKey("");
                    }

                    if (oStatusSelect) {
                        oStatusSelect.setSelectedKey("");
                    }

                    if (oDatePicker) {
                        oDatePicker.setValue("");
                    }

                    var oTable =
                        this.byId("holidaysTable");

                    if (oTable) {
                        var oBinding =
                            oTable.getBinding("items");

                        if (oBinding) {
                            oBinding.filter([]);
                        }
                    }
                },

                onAddHoliday: function () {
                    MessageToast.show(
                        "Holiday creation dialog will be connected here."
                    );
                },

                onEditHoliday: function (oEvent) {
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
                        "Edit holiday " +
                        oData.holidayId +
                        " functionality will be connected here."
                    );
                },

                onDeleteHoliday: function (oEvent) {
                    var oContext =
                        oEvent.getSource()
                            .getBindingContext();

                    if (!oContext) {
                        MessageBox.error(
                            "Unable to identify the holiday."
                        );
                        return;
                    }

                    var oData =
                        oContext.getObject();

                    if (!oData) {
                        return;
                    }

                    MessageBox.confirm(
                        "Are you sure you want to delete holiday " +
                        oData.holidayId +
                        "?",
                        {
                            title: "Delete Holiday",
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

                                this._deleteHoliday(
                                    oContext
                                );
                            }.bind(this)
                        }
                    );
                },

                _deleteHoliday: function (
                    oContext
                ) {
                    oContext.delete("$auto")
                        .then(function () {
                            MessageToast.show(
                                "Holiday deleted successfully."
                            );

                            this._loadHolidayData();
                        }.bind(this))
                        .catch(function (oError) {
                            console.error(
                                "Error deleting holiday:",
                                oError
                            );

                            MessageBox.error(
                                oError.message ||
                                "Unable to delete holiday."
                            );
                        });
                },

                onHolidayPress: function (oEvent) {
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
                        oData.name +
                        " - " +
                        this._formatDisplayDate(
                            oData.holidayDate
                        )
                    );
                },

                onRefresh: function () {
                    var oModel =
                        this.getView().getModel();

                    if (oModel) {
                        oModel.refresh();
                    }

                    this._loadHolidayData();

                    MessageToast.show(
                        "Holiday data refreshed."
                    );
                },

                _getTodayDate: function () {
                    var oDate =
                        new Date();

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

                _formatDateForOData: function (
                    oDate
                ) {
                    if (!oDate) {
                        return "";
                    }

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

                _formatDisplayDate: function (
                    vDate
                ) {
                    if (!vDate) {
                        return "";
                    }

                    var oDate =
                        new Date(vDate);

                    if (isNaN(oDate.getTime())) {
                        return vDate;
                    }

                    return oDate.toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
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