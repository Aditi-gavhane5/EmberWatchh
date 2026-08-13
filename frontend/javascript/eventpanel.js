/* =========================================================
   EMBERWATCH - EVENT-PANEL.JS
   =========================================================

   This file controls the information shown in the
   Event Panel on the dashboard.

   The map.js file is responsible for:

       API → coordinates → map markers

   This file is responsible for:

       API data → Event Panel

   Example:

       User clicks an earthquake
                    ↓
              map.js gets data
                    ↓
           updateEventPanel()
                    ↓
        Event Panel shows earthquake
                    ↓
              〽️ Earthquake
              Magnitude: 5.6
              Location: Japan
              Source: USGS


   IMPORTANT:

   We are NOT creating a new panel every time.

   We simply update the existing panel in index.html.
*/


/* =========================================================
   1. DISASTER INFORMATION
   =========================================================

   These values are used when the API data doesn't provide
   everything we need.

   The actual event information will still come from the
   API whenever possible.
*/


const eventDisasterConfig = {

    wildfire: {

        emoji: "🔥",

        name: "WILDFIRE EVENT",

        status: "Active",

        defaultSource: "NASA EONET"

    },


    earthquake: {

        emoji: "〽️",

        name: "EARTHQUAKE EVENT",

        status: "Detected",

        defaultSource: "USGS"

    },


    flood: {

        emoji: "🌊",

        name: "FLOOD EVENT",

        status: "Monitoring",

        defaultSource: "EMBERWATCH"

    },


    "dust-storm": {

        emoji: "🌫️",

        name: "DUST STORM EVENT",

        status: "Monitoring",

        defaultSource: "NASA EONET"

    },


    "sand-storm": {

        emoji: "〰️",

        name: "SAND STORM EVENT",

        status: "Monitoring",

        defaultSource: "NASA EONET"

    },


    volcano: {

        emoji: "🌋",

        name: "VOLCANIC EVENT",

        status: "Active",

        defaultSource: "NASA EONET"

    },


    "severe-storm": {

        emoji: "🌩️",

        name: "SEVERE STORM EVENT",

        status: "Active",

        defaultSource: "NASA EONET"

    }

};


/* =========================================================
   2. FIND THE EVENT PANEL
   =========================================================

   Your existing HTML already contains the Event Panel.

   We try several common class names so we don't need to
   redesign your HTML.
*/


function getEventPanel() {


    /*
        Try the most likely class first.
    */

    let panel =
        document.querySelector(
            ".event-panel"
        );


    /*
        If that doesn't exist, try another common name.
    */

    if (!panel) {

        panel =
            document.querySelector(
                ".event-card"
            );

    }


    /*
        Try event-details as another possibility.
    */

    if (!panel) {

        panel =
            document.querySelector(
                ".event-details"
            );

    }


    return panel;

}


/* =========================================================
   3. FIND EVENT PANEL ELEMENT
   =========================================================

   This helper lets us search for an element inside the
   Event Panel using multiple possible selectors.
*/


function findEventElement(
    panel,
    selectors
) {


    /*
        Check every selector until we find a matching
        element.
    */

    for (
        const selector of selectors
    ) {


        const element =
            panel.querySelector(
                selector
            );


        if (element) {

            return element;

        }

    }


    /*
        Nothing was found.
    */

    return null;

}


/* =========================================================
   4. DETECT DISASTER TYPE
   =========================================================

   The API object doesn't always contain the disaster type.

   So we use:

       source
       category
       currentDisasterType

   to determine which type is currently displayed.
*/


function detectDisasterType(
    eventData
) {


    /*
        If map.js already knows the current disaster,
        use that.

        Example:

            currentDisasterType = "earthquake"
    */

    if (
        typeof currentDisasterType !==
        "undefined"
    ) {

        if (
            eventDisasterConfig[
                currentDisasterType
            ]
        ) {

            return currentDisasterType;

        }

    }


    /*
        Try the category returned by NASA.
    */

    if (
        eventData &&
        eventData.category
    ) {


        const category =
            String(
                eventData.category
            ).toLowerCase();


        if (
            category.includes(
                "wildfire"
            )
        ) {

            return "wildfire";

        }


        if (
            category.includes(
                "volcano"
            )
        ) {

            return "volcano";

        }


        if (
            category.includes(
                "storm"
            )
        ) {

            return "severe-storm";

        }

    }


    /*
        Default to wildfire because that is the initial
        dashboard mode.
    */

    return "wildfire";

}


/* =========================================================
   5. GET LOCATION
   =========================================================

   Different APIs give location information in different
   formats.

   This function creates one readable location string.
*/


function getEventLocation(
    eventData
) {


    /*
        Earthquake data from USGS usually has:

            properties.place

        Our api.js converts that into:

            title
    */

    if (
        eventData &&
        eventData.title
    ) {

        return eventData.title;

    }


    /*
        Try a location property if another API provides it.
    */

    if (
        eventData &&
        eventData.location
    ) {

        return eventData.location;

    }


    /*
        If nothing exists, display a safe message.
    */

    return "Location unavailable";

}


/* =========================================================
   6. FORMAT COORDINATES
   =========================================================

   Converts:

       [longitude, latitude]

   into:

       45.20°, -106.63°
*/


function getEventCoordinates(
    eventData
) {


    if (
        !eventData ||
        !eventData.coordinates ||
        eventData.coordinates.length < 2
    ) {

        return "Coordinates unavailable";

    }


    /*
        API format:

            [longitude, latitude]
    */

    const longitude =
        Number(
            eventData.coordinates[0]
        );


    const latitude =
        Number(
            eventData.coordinates[1]
        );


    /*
        Make sure the values are valid.
    */

    if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
    ) {

        return "Coordinates unavailable";

    }


    return `
        ${latitude.toFixed(2)}°,
        ${longitude.toFixed(2)}°
    `;

}


/* =========================================================
   7. FORMAT EVENT DATE
   =========================================================

   Converts API timestamps into a readable date.
*/


function formatEventDate(
    date
) {


    if (!date) {

        return "Unknown";

    }


    const eventDate =
        new Date(
            date
        );


    if (
        Number.isNaN(
            eventDate.getTime()
        )
    ) {

        return "Unknown";

    }


    return new Intl.DateTimeFormat(

        "en-US",

        {

            month:
                "short",

            day:
                "numeric",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }

    ).format(
        eventDate
    );

}


/* =========================================================
   8. UPDATE EVENT PANEL
   =========================================================

   THIS IS THE MAIN FUNCTION.

   map.js calls:

       updateEventPanel(eventData)

   and this function updates the dashboard.
*/


function updateEventPanel(
    eventData
) {


    /*
        Make sure we actually received data.
    */

    if (!eventData) {

        console.warn(
            "EMBERWATCH: No event data received."
        );

        return;

    }


    /*
        Find the Event Panel.
    */

    const panel =
        getEventPanel();


    /*
        If the panel cannot be found, don't crash the app.

        This is useful while we are still connecting
        everything together.
    */

    if (!panel) {

        console.warn(
            "EMBERWATCH: Event Panel element was not found."
        );

        return;

    }


    /*
        Determine which disaster we're displaying.
    */

    const disasterType =
        detectDisasterType(
            eventData
        );


    /*
        Get configuration for that disaster.
    */

    const config =
        eventDisasterConfig[
            disasterType
        ];


    /*
        Safety fallback.
    */

    if (!config) {

        return;

    }


    /* =====================================================
       FIND PANEL ELEMENTS
       ===================================================== */


    /*
        Event icon.
    */

    const iconElement =
        findEventElement(

            panel,

            [

                ".event-icon",

                ".event-card-icon",

                ".event-symbol",

                ".event-emoji"

            ]

        );


    /*
        Event label.
    */

    const labelElement =
        findEventElement(

            panel,

            [

                ".event-label",

                ".event-type",

                ".event-category"

            ]

        );


    /*
        Event title.
    */

    const titleElement =
        findEventElement(

            panel,

            [

                ".event-title",

                ".event-name",

                "h3",

                "h4"

            ]

        );


    /*
        Location.
    */

    const locationElement =
        findEventElement(

            panel,

            [

                ".event-location",

                ".location",

                ".event-place"

            ]

        );


    /*
        Date.
    */

    const dateElement =
        findEventElement(

            panel,

            [

                ".event-date",

                ".date",

                ".event-time"

            ]

        );


    /*
        Source.
    */

    const sourceElement =
        findEventElement(

            panel,

            [

                ".event-source",

                ".source",

                ".data-source"

            ]

        );


    /*
        Coordinates.
    */

    const coordinatesElement =
        findEventElement(

            panel,

            [

                ".event-coordinates",

                ".coordinates",

                ".event-position"

            ]

        );


    /*
        Magnitude.

        This is mainly useful for earthquakes.
    */

    const magnitudeElement =
        findEventElement(

            panel,

            [

                ".event-magnitude",

                ".magnitude",

                ".event-severity"

            ]

        );


    /* =====================================================
       UPDATE ICON
       ===================================================== */


    if (iconElement) {

        iconElement.textContent =
            config.emoji;

    }


    /* =====================================================
       UPDATE EVENT LABEL
       ===================================================== */


    if (labelElement) {

        labelElement.textContent =
            config.name;

    }


    /* =====================================================
       UPDATE TITLE
       ===================================================== */


    if (titleElement) {

        titleElement.textContent =

            eventData.title ||

            `${config.name}`;

    }


    /* =====================================================
       UPDATE LOCATION
       ===================================================== */


    if (locationElement) {

        locationElement.textContent =
            getEventLocation(
                eventData
            );

    }


    /* =====================================================
       UPDATE DATE
       ===================================================== */


    if (dateElement) {

        dateElement.textContent =
            formatEventDate(
                eventData.date
            );

    }


    /* =====================================================
       UPDATE SOURCE
       ===================================================== */


    if (sourceElement) {

        sourceElement.textContent =

            eventData.source ||

            config.defaultSource;

    }


    /* =====================================================
       UPDATE COORDINATES
       ===================================================== */


    if (coordinatesElement) {

        coordinatesElement.textContent =
            getEventCoordinates(
                eventData
            );

    }


    /* =====================================================
       UPDATE MAGNITUDE
       =====================================================

       Only earthquakes normally have magnitude.

       If there isn't a magnitude, we hide the field.
    */


    if (magnitudeElement) {


        if (
            disasterType ===
            "earthquake" &&
            eventData.magnitude !==
            undefined &&
            eventData.magnitude !==
            null
        ) {


            magnitudeElement.textContent =
                eventData.magnitude;


            /*
                Make sure it is visible.
            */

            magnitudeElement.style.display =
                "";

        }

        else {


            /*
                Hide magnitude for disasters that don't
                use it.
            */

            magnitudeElement.style.display =
                "none";

        }

    }


    /* =====================================================
       UPDATE STATUS
       ===================================================== */


    const statusElement =
        findEventElement(

            panel,

            [

                ".event-status",

                ".status",

                ".event-state"

            ]

        );


    if (statusElement) {

        statusElement.textContent =
            config.status;

    }


    /* =====================================================
       UPDATE PANEL DATA ATTRIBUTE
       =====================================================

       This can be useful for CSS.

       Example:

           data-disaster="earthquake"

       Then CSS can style earthquake mode differently.
    */


    panel.dataset.disaster =
        disasterType;


    /* =====================================================
       CONSOLE MESSAGE
       ===================================================== */


    console.log(

        `EMBERWATCH: Event Panel updated → ${config.emoji} ${config.name}`

    );

}


/* =========================================================
   9. CLEAR EVENT PANEL
   =========================================================

   This is useful when an API fails or no event is selected.
*/


function clearEventPanel() {


    const panel =
        getEventPanel();


    if (!panel) {

        return;

    }


    /*
        Find title.
    */

    const titleElement =
        findEventElement(

            panel,

            [

                ".event-title",

                ".event-name",

                "h3",

                "h4"

            ]

        );


    /*
        Reset title.
    */

    if (titleElement) {

        titleElement.textContent =
            "No event selected";

    }


    /*
        Reset location.
    */

    const locationElement =
        findEventElement(

            panel,

            [

                ".event-location",

                ".location",

                ".event-place"

            ]

        );


    if (locationElement) {

        locationElement.textContent =
            "Select an event on the map";

    }

}


/* =========================================================
   10. MAKE FUNCTIONS AVAILABLE
   =========================================================

   map.js needs updateEventPanel().

   Therefore we attach it to window.
*/


window.updateEventPanel =
    updateEventPanel;


window.clearEventPanel =
    clearEventPanel;


/* =========================================================
   END OF EVENT-PANEL.JS
   ========================================================= */