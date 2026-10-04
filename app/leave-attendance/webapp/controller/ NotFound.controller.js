sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/routing/History"
    ],
    function (
        Controller,
        History
    ) {
        "use strict";

        return Controller.extend(
            "com.mandeep.leaveattendance.controller.NotFound",
            {

                /* =========================================================
                   LIFECYCLE
                ========================================================= */

                onInit: function () {
                    // Controller initialization
                },

                /* =========================================================
                   NAVIGATION
                ========================================================= */

                onGoToDashboard: function () {
                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Dashboard",
                            {},
                            true
                        );
                },

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
                }

            }
        );
    }
);