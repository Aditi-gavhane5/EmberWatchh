/* =========================================================
   EMBERWATCH - DASHBOARD.JS
   =========================================================

   This file connects the API data to the visible dashboard.

   Think of the flow like this:

        NASA EONET
             ↓
          api.js
             ↓
       wildfire events
             ↓
       dashboard.js
             ↓
      ┌──────┼────────┐
      ↓      ↓        ↓
   Statistics Table  Event Panel


   api.js asks:
       "Give me the data."

   dashboard.js asks:
       "Where should I display that data?"
*/


/* =========================================================
   1. DASHBOARD DATA
   =========================================================

   These variables store the wildfire data currently being
   displayed on the dashboard.
*/


let dashboardWildfires = [];


/*
   Remember which wildfire is currently selected.

   This will be used by the event panel.
*/

let currentSelectedWildfire = null;


/* =========================================================
   2. INITIALIZE DASHBOARD
   =========================================================

   This function runs when our application starts.

   It gets the wildfire data and updates all dashboard
   sections.
*/


async function initializeDashboard() {


    console.log(
        "EMBERWATCH: Loading wildfire dashboard..."
    );


    /*
        Ask api.js for wildfire events.

        Remember:

            api.js
                ↓
        getWildfireEvents()
                ↓
        returns array of events
    */

    dashboardWildfires =
        await getWildfireEvents();


    /*
        Update the statistics at the top.
    */

    updateStatistics();


    /*
        Update the Recent Activity table.
    */

    updateActivityTable();


    /*
        Select an initial wildfire.

        If there is at least one event, showing its details
        makes the dashboard feel populated immediately.
    */

    if (dashboardWildfires.length > 0) {

        updateEventPanel(
            dashboardWildfires[0]
        );

    }


    /*
        Tell the console that the dashboard finished loading.
    */

    console.log(
        `EMBERWATCH: ${dashboardWildfires.length} wildfire events loaded.`
    );

}


/* =========================================================
   3. UPDATE STATISTICS
   =========================================================

   These are the four cards near the top:

       Total Events
       Affected Regions
       High Alerts
       Last Updated
*/


function updateStatistics() {


    /*
        -----------------------------------------------------
        TOTAL EVENTS
        -----------------------------------------------------

        The number of wildfire events returned by the API.
    */

    const totalEvents =
        document.getElementById(
            "totalEvents"
        );


    if (totalEvents) {

        totalEvents.textContent =
            dashboardWildfires.length;

    }


    /*
        -----------------------------------------------------
        AFFECTED REGIONS
        -----------------------------------------------------

        We don't simply count events because multiple
        events can belong to the same location.

        We create a Set to keep only unique locations.
    */

    const affectedRegions =
        document.getElementById(
            "affectedRegions"
        );


    if (affectedRegions) {

        const regions =
            new Set();


        dashboardWildfires.forEach(
            (event) => {

                /*
                    EONET events can contain geometries, but
                    location names aren't always available.

                    For now we use the event title as a
                    fallback identifier.

                    Later we can improve this using reverse
                    geocoding or a more detailed data source.
                */

                if (event.title) {

                    regions.add(
                        event.title
                    );

                }

            }
        );


        affectedRegions.textContent =
            regions.size;

    }


    /*
        -----------------------------------------------------
        HIGH ALERTS
        -----------------------------------------------------

        EONET doesn't directly provide a universal
        "High / Medium / Low" severity value for every
        wildfire.

        Therefore, for our first version, we estimate
        high-alert events using the presence of wildfire
        data.

        Later we can replace this with a proper severity
        calculation based on fire intensity / area /
        satellite information.
    */

    const highAlerts =
        document.getElementById(
            "highAlerts"
        );


    if (highAlerts) {

        /*
            For now we use a simple percentage of events
            as a placeholder.

            This is NOT pretending to be an official NASA
            severity rating.
        */

        const estimatedHighAlerts =
            Math.round(
                dashboardWildfires.length * 0.15
            );


        highAlerts.textContent =
            estimatedHighAlerts;

    }


    /*
        -----------------------------------------------------
        LAST UPDATED
        -----------------------------------------------------

        Show the time when our dashboard received the API
        response.
    */

    const lastUpdated =
        document.getElementById(
            "lastUpdated"
        );


    if (lastUpdated) {

        lastUpdated.textContent =
            "Just now";

    }

}


/* =========================================================
   4. UPDATE ACTIVITY TABLE
   =========================================================

   This creates the Recent Activity rows dynamically.

   Instead of manually writing:

       <tr>
           <td>...</td>
       </tr>

   for every event, JavaScript creates the rows for us.
*/


function updateActivityTable() {


    /*
        Find the table body.

        Our HTML should contain something similar to:

            <tbody id="activityTable">
            </tbody>
    */

    const tableBody =
        document.getElementById(
            "activityTable"
        );


    /*
        If the element doesn't exist, stop.

        This prevents errors if we accidentally rename it.
    */

    if (!tableBody) {

        console.warn(
            "EMBERWATCH: Activity table not found."
        );

        return;

    }


    /*
        Clear existing rows.

        This is important because the HTML may contain
        placeholder rows.
    */

    tableBody.innerHTML = "";


    /*
        If there are no events, show an empty state.
    */

    if (dashboardWildfires.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="table-empty">

                        <span class="table-empty-icon">
                            🔥
                        </span>

                        No wildfire events found.

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    /*
        Only show the number of events specified in our
        application configuration.
    */

    const recentEvents =
        dashboardWildfires.slice(
            0,
            APP_CONFIG.recentEventsLimit
        );


    /*
        Create one row for each event.
    */

    recentEvents.forEach(
        (event) => {


            /*
                Create a new table row.
            */

            const row =
                document.createElement(
                    "tr"
                );


            /*
                Create a simplified location.

                EONET doesn't always provide a human-readable
                location, so we display the coordinates when
                necessary.
            */

            const location =
                getEventLocation(event);


            /*
                Create the HTML inside the row.

                We use escapeHtml() from map.js so that API
                text isn't inserted into the page blindly.
            */

            row.innerHTML = `

                <td>
                    🔥 ${escapeHtml(event.title)}
                </td>

                <td>
                    ${escapeHtml(location)}
                </td>

                <td>
                    <span class="event-type-fire">
                        Wildfire
                    </span>
                </td>

                <td>
                    <span class="status-badge high">
                        High
                    </span>
                </td>

                <td>
                    ${escapeHtml(
                        formatRelativeTime(
                            event.geometry &&
                            event.geometry.length > 0
                                ? event.geometry[
                                    event.geometry.length - 1
                                  ].date
                                : null
                        )
                    )}
                </td>

            `;


            /*
                Add the completed row to the table.
            */

            tableBody.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   5. GET EVENT LOCATION
   =========================================================

   EONET data doesn't always provide a simple:

       "California, USA"

   location.

   Therefore this function creates a readable fallback.
*/


function getEventLocation(event) {


    /*
        If the API gives us a location property, use it.
    */

    if (event.location) {

        return event.location;

    }


    /*
        Otherwise use the latest geometry coordinates.
    */

    if (
        event.geometry &&
        event.geometry.length > 0
    ) {

        const latestGeometry =
            event.geometry[
                event.geometry.length - 1
            ];


        if (
            latestGeometry.coordinates &&
            latestGeometry.coordinates.length >= 2
        ) {

            const longitude =
                latestGeometry.coordinates[0];

            const latitude =
                latestGeometry.coordinates[1];


            return `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;

        }

    }


    /*
        Final fallback.
    */

    return "Location unavailable";

}


/* =========================================================
   6. UPDATE EVENT PANEL
   =========================================================

   This function fills the large panel on the right side
   when a wildfire is selected.

   Example:

       🔥
       Wildfire Event

       Dixie Fire
       California

       Detected
       Aug 11, 2026

       Coordinates
       40.12°, -121.45°
*/


function updateEventPanel(
    wildfire
) {


    /*
        Remember the selected event.
    */

    currentSelectedWildfire =
        wildfire;


    /*
        -----------------------------------------------------
        EVENT TITLE
        -----------------------------------------------------
    */

    const eventTitle =
        document.getElementById(
            "eventTitle"
        );


    if (eventTitle) {

        eventTitle.textContent =
            wildfire.title ||
            "Wildfire Event";

    }


    /*
        -----------------------------------------------------
        EVENT LOCATION
        -----------------------------------------------------
    */

    const eventLocation =
        document.getElementById(
            "eventLocation"
        );


    if (eventLocation) {

        eventLocation.textContent =
            getEventLocation(wildfire);

    }


    /*
        -----------------------------------------------------
        DETECTED DATE
        -----------------------------------------------------
    */

    const eventDetected =
        document.getElementById(
            "eventDetected"
        );


    if (eventDetected) {

        let detectedDate = null;


        if (
            wildfire.geometry &&
            wildfire.geometry.length > 0
        ) {

            detectedDate =
                wildfire.geometry[
                    wildfire.geometry.length - 1
                ].date;

        }


        eventDetected.textContent =
            formatDate(
                detectedDate
            );

    }


    /*
        -----------------------------------------------------
        COORDINATES
        -----------------------------------------------------
    */

    const eventCoordinates =
        document.getElementById(
            "eventCoordinates"
        );


    if (eventCoordinates) {

        if (
            wildfire.geometry &&
            wildfire.geometry.length > 0
        ) {

            const coordinates =
                wildfire.geometry[
                    wildfire.geometry.length - 1
                ].coordinates;


            if (
                coordinates &&
                coordinates.length >= 2
            ) {

                /*
                    Remember:

                    EONET:
                        [longitude, latitude]

                    We display:
                        latitude, longitude
                */

                const longitude =
                    coordinates[0];

                const latitude =
                    coordinates[1];


                eventCoordinates.textContent =
                    `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;

            }

        }

    }


    /*
        -----------------------------------------------------
        SOURCE
        -----------------------------------------------------

        If the API provides a source URL, make the button
        point to it.
    */

    const sourceLink =
        document.getElementById(
            "eventSource"
        );


    if (sourceLink) {

        if (
            wildfire.sources &&
            wildfire.sources.length > 0 &&
            wildfire.sources[0].url
        ) {

            sourceLink.href =
                wildfire.sources[0].url;

            sourceLink.style.display =
                "inline-flex";

        }
        else {

            sourceLink.style.display =
                "none";

        }

    }

}


/* =========================================================
   7. RELATIVE TIME
   =========================================================

   Converts an API date into something easier to understand.

   Example:

       2 minutes ago
       3 hours ago
       1 day ago
*/


function formatRelativeTime(
    dateString
) {


    if (!dateString) {

        return "Unknown";

    }


    const eventTime =
        new Date(dateString);


    const currentTime =
        new Date();


    /*
        Difference in milliseconds.
    */

    const difference =
        currentTime - eventTime;


    /*
        Convert milliseconds to minutes.
    */

    const minutes =
        Math.floor(
            difference / (1000 * 60)
        );


    /*
        Less than one minute.
    */

    if (minutes < 1) {

        return "Just now";

    }


    /*
        Less than one hour.
    */

    if (minutes < 60) {

        return `${minutes} min ago`;

    }


    /*
        Less than one day.
    */

    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours} hr ago`;

    }


    /*
        More than one day.
    */

    const days =
        Math.floor(
            hours / 24
        );


    return `${days} day${days === 1 ? "" : "s"} ago`;

}


/* =========================================================
   8. REFRESH DASHBOARD
   =========================================================

   Later we can connect this to a Refresh button.

   The function simply gets fresh data and redraws the
   dashboard.
*/


async function refreshDashboard() {


    console.log(
        "EMBERWATCH: Refreshing wildfire data..."
    );


    /*
        Get fresh data.
    */

    dashboardWildfires =
        await getWildfireEvents();


    /*
        Update everything that depends on the data.
    */

    updateStatistics();

    updateActivityTable();


    /*
        Update the event panel if there is still an event.
    */

    if (
        dashboardWildfires.length > 0
    ) {

        updateEventPanel(
            dashboardWildfires[0]
        );

    }


    /*
        Refresh map markers too.

        We check whether the map-related function exists
        before calling it.
    */

    if (
        typeof loadWildfireMarkers ===
        "function"
    ) {

        await loadWildfireMarkers();

    }


    console.log(
        "EMBERWATCH: Dashboard refreshed."
    );

}


/* =========================================================
   9. EXPORT FOR OTHER FILES
   =========================================================

   Since we're using regular JavaScript files, we make the
   main functions available globally.

   Other scripts can then call:

       initializeDashboard()

       updateEventPanel()

       refreshDashboard()
*/


window.initializeDashboard =
    initializeDashboard;

window.updateEventPanel =
    updateEventPanel;

window.refreshDashboard =
    refreshDashboard;


/* =========================================================
   END OF DASHBOARD.JS
   ========================================================= */