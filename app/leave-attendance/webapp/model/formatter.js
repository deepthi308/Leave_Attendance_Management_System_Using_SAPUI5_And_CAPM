sap.ui.define([], function () {
    "use strict";

    return {

        statusState: function (sStatus) {
            switch (sStatus) {
                case "ACTIVE":
                case "PRESENT":
                case "APPROVED":
                case "RESOLVED":
                    return "Success";

                case "INACTIVE":
                case "ABSENT":
                case "REJECTED":
                    return "Error";

                case "PENDING":
                case "IN_PROGRESS":
                case "ON_LEAVE":
                    return "Warning";

                case "DRAFT":
                case "NEW":
                    return "Information";

                default:
                    return "None";
            }
        },

        priorityState: function (sPriority) {
            switch (sPriority) {
                case "HIGH":
                    return "Error";

                case "MEDIUM":
                    return "Warning";

                case "LOW":
                    return "Success";

                default:
                    return "None";
            }
        },

        leaveBalanceState: function (vAvailableDays) {
            var fAvailableDays = parseFloat(vAvailableDays);

            if (isNaN(fAvailableDays)) {
                return "None";
            }

            if (fAvailableDays <= 2) {
                return "Error";
            }

            if (fAvailableDays <= 5) {
                return "Warning";
            }

            return "Success";
        },

        leaveBalanceText: function (vAvailableDays) {
            var fAvailableDays = parseFloat(vAvailableDays);

            if (isNaN(fAvailableDays)) {
                return "";
            }

            return fAvailableDays.toFixed(1) + " days";
        },

        number: function (vValue) {
            var fValue = parseFloat(vValue);

            if (isNaN(fValue)) {
                return "0";
            }

            return fValue.toString();
        },

        decimal: function (vValue) {
            var fValue = parseFloat(vValue);

            if (isNaN(fValue)) {
                return "0.00";
            }

            return fValue.toFixed(2);
        },

        date: function (vDate) {
            if (!vDate) {
                return "";
            }

            var oDate = vDate instanceof Date
                ? vDate
                : new Date(vDate);

            if (isNaN(oDate.getTime())) {
                return "";
            }

            return String(oDate.getDate()).padStart(2, "0") +
                " " +
                oDate.toLocaleString("en-US", {
                    month: "short"
                }) +
                " " +
                oDate.getFullYear();
        },

        dateTime: function (vDateTime) {
            if (!vDateTime) {
                return "";
            }

            var oDate = vDateTime instanceof Date
                ? vDateTime
                : new Date(vDateTime);

            if (isNaN(oDate.getTime())) {
                return "";
            }

            return String(oDate.getDate()).padStart(2, "0") +
                " " +
                oDate.toLocaleString("en-US", {
                    month: "short"
                }) +
                " " +
                oDate.getFullYear() +
                ", " +
                String(oDate.getHours()).padStart(2, "0") +
                ":" +
                String(oDate.getMinutes()).padStart(2, "0");
        },

        employeeFullName: function (sFirstName, sLastName) {
            return [sFirstName, sLastName]
                .filter(Boolean)
                .join(" ");
        },

        employeeDisplayName: function (
            sEmployeeId,
            sFirstName,
            sLastName
        ) {
            var sName = this.employeeFullName(
                sFirstName,
                sLastName
            );

            if (sEmployeeId && sName) {
                return sEmployeeId + " - " + sName;
            }

            return sEmployeeId || sName || "";
        },

        leaveTypeText: function (
            sLeaveTypeId,
            sLeaveTypeName
        ) {
            if (sLeaveTypeName) {
                return sLeaveTypeName;
            }

            return sLeaveTypeId || "";
        },

        requestStatusText: function (sStatus) {
            switch (sStatus) {
                case "DRAFT":
                    return "Draft";

                case "PENDING":
                    return "Pending";

                case "APPROVED":
                    return "Approved";

                case "REJECTED":
                    return "Rejected";

                case "CANCELLED":
                    return "Cancelled";

                default:
                    return sStatus || "";
            }
        },

        attendanceStatusText: function (sStatus) {
            switch (sStatus) {
                case "PRESENT":
                    return "Present";

                case "ABSENT":
                    return "Absent";

                case "ON_LEAVE":
                    return "On Leave";

                case "IN_PROGRESS":
                    return "In Progress";

                default:
                    return sStatus || "";
            }
        },

        holidayTypeText: function (sType) {
            switch (sType) {
                case "NATIONAL":
                    return "National";

                case "OPTIONAL":
                    return "Optional";

                case "SPECIAL":
                    return "Special";

                default:
                    return sType || "";
            }
        },

        yesNo: function (bValue) {
            return bValue ? "Yes" : "No";
        },

        workingHours: function (vHours) {
            var fHours = parseFloat(vHours);

            if (isNaN(fHours)) {
                return "0.00 hrs";
            }

            return fHours.toFixed(2) + " hrs";
        },

        days: function (vDays) {
            var fDays = parseFloat(vDays);

            if (isNaN(fDays)) {
                return "0 days";
            }

            return fDays === 1
                ? "1 day"
                : fDays.toFixed(1) + " days";
        }
    };
});