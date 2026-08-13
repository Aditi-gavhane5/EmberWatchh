/* =========================================================
   EMBERWATCH - MAP.JS
   =========================================================

   This file controls the complete interactive map.

   The map supports:

       🔥 Wildfires
       〽️ Earthquakes
       🌊 Floods
       🌫️ Dust Storms
       〰️ Sand Storms
       🌋 Volcanoes
       🌩️ Severe Storms


   MAIN RESPONSIBILITIES:

       1. Create the Leaflet map
       2. Create Map and Satellite layers
       3. Display disaster markers
       4. Change marker emojis
       5. Handle zoom controls
       6. Handle marker clicks
       7. Show event popups
       8. Connect the map with api.js
       9. Show loading/error states


   DATA FLOW:

       Sidebar
          ↓
       navigation.js
          ↓
       loadDisasterMarkers()
          ↓
       api.js
          ↓
       External API
          ↓
       Disaster locations
          ↓
       Leaflet markers


   PERFORMANCE:

   APIs can sometimes return hundreds or thousands of events.

   We DO NOT render all of them.

   Rendering too many emoji DOM elements can make the browser
   slow.

   Therefore we limit the number of visible markers.

   This keeps the map fast while still showing enough events
   for a global disaster dashboard.
*/


/* =========================================================
   1. PERFORMANCE SETTINGS
   ========================================================= */


/*
   Maximum number of markers that we will actually draw
   on the map at one time.

   The API may return more than this.

   But rendering 1000+ emoji elements is unnecessary and
   can make the browser slow.

   150 gives us a good balance between:

       DATA
       VISUALS
       PERFORMANCE
*/

const MAX_VISIBLE_MARKERS = 150;


/*
   Small delay between marker batches.

   This gives the browser a chance to paint the map
   before adding the next group of markers.

   It makes the loading experience feel smoother.
*/

const MARKER_BATCH_SIZE = 30;


/* =========================================================
   2. GLOBAL MAP VARIABLES
   ========================================================= */


/*
   Main Leaflet map object.
*/

let wildfireMap = null;


/*
   All markers currently visible on the map.
*/

let disasterMarkers = [];


/*
   Currently selected marker.
*/

let selectedMarker = null;


/*
   Currently open Leaflet popup.
*/

let wildfirePopup = null;


/*
   Current disaster selected from the sidebar.

   Default:

       🔥 Wildfire
*/

let currentDisasterType = "wildfire";


/*
   Normal OpenStreetMap layer.
*/

let streetMapLayer = null;


/*
   Satellite imagery layer.
*/

let satelliteMapLayer = null;


/*
   Stores the last successful API locations.

   This is used only as a temporary visual fallback for
   disaster types whose real API is not connected yet.

   IMPORTANT:

   These coordinates should NOT be treated as actual flood,
   volcano, etc. locations.

   The popup will clearly say "Demo visualization" when
   fallback data is being used.
*/

let lastAvailableLocations = [];


/*
   Request counter.

   This solves an important problem:

       User clicks Wildfires
            ↓
       API request starts

       User immediately clicks Earthquakes
            ↓
       another API request starts

   If the wildfire request finishes AFTER the earthquake
   request, we don't want wildfire markers replacing the
   earthquake markers.

   Every request gets a number.

   Only the newest request is allowed to update the map.
*/

let mapRequestId = 0;


/* =========================================================
   3. DISASTER EMOJI CONFIGURATION
   =========================================================

   Every disaster has its own emoji.

   These names MUST match the values used by navigation.js
   and api.js.
*/


const disasterMarkerIcons = {

    wildfire:
        "🔥",

    earthquake:
        "〽️",

    flood:
        "🌊",

    "dust-storm":
        "🌫️",

    "sand-storm":
        "〰️",

    volcano:
        "🌋",

    "severe-storm":
        "🌩️"

};


/* =========================================================
   4. DISASTER DISPLAY NAMES
   ========================================================= */


const disasterNames = {

    wildfire:
        "Wildfire",

    earthquake:
        "Earthquake",

    flood:
        "Flood",

    "dust-storm":
        "Dust Storm",

    "sand-storm":
        "Sand Storm",

    volcano:
        "Volcano",

    "severe-storm":
        "Severe Storm"

};


/* =========================================================
   5. INITIALIZE MAP
   =========================================================

   This function creates Leaflet only once.

   It is normally called by app.js.
*/


function initializeMap() {


    /* -----------------------------------------------------
       Prevent duplicate map creation
       ----------------------------------------------------- */

    if (
        wildfireMap !== null
    ) {

        return;

    }


    /* -----------------------------------------------------
       Find the map container
       ----------------------------------------------------- */

    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {

        console.error(
            "EMBERWATCH: #map element was not found."
        );

        return;

    }


    /* =====================================================
       CREATE LEAFLET MAP
       ===================================================== */


    wildfireMap =
        L.map(
            "map",
            {

                /*
                   We already have our own + and - buttons,
                   so we don't need Leaflet's default buttons.
                */

                zoomControl:
                    false,

                /*
                   Allow the user to drag the map.
                */

                dragging:
                    true,

                /*
                   Mouse wheel zoom.
                */

                scrollWheelZoom:
                    true,

                /*
                   Double click zoom.
                */

                doubleClickZoom:
                    true,

                /*
                   Touch zoom for phones/tablets.
                */

                touchZoom:
                    true

            }
        );


    /* =====================================================
       INITIAL MAP POSITION
       ===================================================== */


    wildfireMap.setView(

        [
            MAP_CONFIG.center.lat,
            MAP_CONFIG.center.lng
        ],

        MAP_CONFIG.zoom

    );


    /* =====================================================
       HIDE OLD HTML PLACEHOLDER
       ===================================================== */


    const mapPlaceholder =
        document.querySelector(
            ".map-placeholder"
        );


    if (mapPlaceholder) {

        mapPlaceholder.style.display =
            "none";

    }


    /* =====================================================
       OPENSTREETMAP LAYER
       ===================================================== */


    streetMapLayer =
        L.tileLayer(

            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            {

                maxZoom:
                    19,

                attribution:
                    "&copy; OpenStreetMap contributors"

            }

        );


    /*
       Add the normal map immediately.

       This means the user doesn't have to wait for the
       disaster API before seeing the actual map.
    */

    streetMapLayer.addTo(
        wildfireMap
    );


    /* =====================================================
       SATELLITE LAYER
       ===================================================== */


    satelliteMapLayer =
        L.tileLayer(

            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",

            {

                maxZoom:
                    19,

                attribution:
                    "&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"

            }

        );


    /* =====================================================
       CONNECT MAP CONTROLS
       ===================================================== */


    setupZoomControls();

    setupMapModeButtons();


    /* =====================================================
       LOAD DEFAULT WILDFIRE DATA
       ===================================================== */


    currentDisasterType =
        "wildfire";


    loadDisasterMarkers(
        "wildfire"
    );

}


/* =========================================================
   6. CREATE DISASTER ICON
   =========================================================

   Creates the emoji marker used on the map.

   Example:

       🔥
       〽️
       🌊
       🌋
*/


function createDisasterIcon(
    emoji
) {


    return L.divIcon({

        /*
           The emoji itself.

           We use a simple div rather than a large image.
        */

        html: `

            <div class="disaster-marker">
                ${emoji}
            </div>

        `,

        /*
           Remove Leaflet's default marker styling.
        */

        className:
            "emberwatch-marker",

        /*
           Small marker size.

           Smaller markers are cheaper for the browser
           to render when there are many events.
        */

        iconSize:
            [
                28,
                28
            ],

        /*
           Center the emoji on the actual coordinates.
        */

        iconAnchor:
            [
                14,
                14
            ]

    });

}


/* =========================================================
   7. MAIN DISASTER LOADER
   =========================================================

   This is the main function used whenever the user
   selects a disaster.

   Example:

       loadDisasterMarkers("wildfire");

       loadDisasterMarkers("earthquake");

       loadDisasterMarkers("flood");


   This function:

       1. Changes current disaster
       2. Clears old markers
       3. Shows loading state
       4. Requests API data
       5. Displays markers
       6. Hides loading state
*/


async function loadDisasterMarkers(
    disasterType
) {


    /* -----------------------------------------------------
       Make sure the map exists
       ----------------------------------------------------- */

    if (!wildfireMap) {

        console.error(
            "EMBERWATCH: Map has not been initialized."
        );

        return;

    }


    /* -----------------------------------------------------
       Make sure the disaster type exists
       ----------------------------------------------------- */

    const emoji =
        disasterMarkerIcons[
            disasterType
        ];


    if (!emoji) {

        console.warn(
            `EMBERWATCH: Unknown disaster type: ${disasterType}`
        );

        return;

    }


    /* -----------------------------------------------------
       Remember selected disaster
       ----------------------------------------------------- */

    currentDisasterType =
        disasterType;


    /* -----------------------------------------------------
       Create a unique ID for this API request
       ----------------------------------------------------- */

    mapRequestId++;

    const thisRequestId =
        mapRequestId;


    /* =====================================================
       CLEAR OLD DATA
       ===================================================== */


    clearDisasterMarkers();


    /* =====================================================
       SHOW LOADING STATE
       ===================================================== */


    showMapLoading(
        disasterType
    );


    /*
       Tell the console what we're doing.

       This is useful while developing and debugging.
    */

    console.log(

        `EMBERWATCH: Loading ${disasterNames[disasterType]} data...`

    );


    /* =====================================================
       REQUEST API DATA
       ===================================================== */


    let locations = [];


    try {


        /*
           api.js provides this function.

           It decides which API should be used.

               wildfire
                   → NASA

               earthquake
                   → USGS

               volcano
                   → NASA

               etc.
        */

        if (
            typeof getDisasterLocations ===
            "function"
        ) {

            locations =
                await getDisasterLocations(
                    disasterType
                );

        }

        else {

            console.error(
                "EMBERWATCH: getDisasterLocations() was not found. Check api.js."
            );

        }


    }

    catch (error) {


        /*
           If the API request fails, don't crash the
           entire application.

           Instead, show an error state.
        */

        console.error(

            `EMBERWATCH: Failed to load ${disasterNames[disasterType]} data.`,

            error

        );


        /*
           Only show this error if this is still the
           currently selected disaster.

           This prevents an old API request from changing
           the UI after the user selected another disaster.
        */

        if (
            thisRequestId ===
            mapRequestId
        ) {

            showMapError(
                "Unable to load live disaster data."
            );

        }


        /*
           Stop this function.
        */

        return;

    }


    /* =====================================================
       CHECK FOR OLD REQUEST
       =====================================================

       Imagine:

           Request 1 = Wildfires
           Request 2 = Earthquakes

       If request 1 finishes after request 2, we ignore
       request 1.
    */


    if (
        thisRequestId !==
        mapRequestId
    ) {

        console.log(
            "EMBERWATCH: Ignoring old map request."
        );

        return;

    }


    /* =====================================================
       REAL API DATA AVAILABLE
       ===================================================== */


    if (
        locations &&
        locations.length > 0
    ) {


        /*
           Save successful data.

           We keep this for temporary fallback modes.
        */

        lastAvailableLocations =
            locations;


        /*
           Display the real API locations.

           The function below automatically limits the
           number of visible markers.
        */

        await displayDisasterLocations(

            locations,

            disasterType,

            false,

            thisRequestId

        );


        /*
           Hide loading state after markers have been
           displayed.
        */

        hideMapLoading();


        console.log(

            `EMBERWATCH: ${locations.length} ${disasterNames[disasterType]} events received.`

        );


        return;

    }


    /* =====================================================
       NO REAL API DATA
       ===================================================== */


    /*
       Some disaster APIs are not connected yet.

       If we have previously received locations, use them
       only as a visual fallback.

       IMPORTANT:

       The popup will say this is a demo visualization.
    */


    if (
        lastAvailableLocations.length > 0
    ) {


        console.warn(

            `EMBERWATCH: No real ${disasterNames[disasterType]} data available.`

        );


        console.warn(
            "EMBERWATCH: Using temporary visual fallback."
        );


        await displayDisasterLocations(

            lastAvailableLocations,

            disasterType,

            true,

            thisRequestId

        );


        hideMapLoading();


        return;

    }


    /* =====================================================
       COMPLETELY EMPTY
       ===================================================== */


    hideMapLoading();


    showMapError(

        `No ${disasterNames[disasterType]} events are currently available.`

    );

}


/* =========================================================
   8. DISPLAY DISASTER LOCATIONS
   =========================================================

   This function converts API locations into Leaflet
   markers.

   PERFORMANCE IMPROVEMENT:

   Instead of creating thousands of markers at once:

       1. Limit to MAX_VISIBLE_MARKERS
       2. Add markers in small batches
       3. Give the browser a tiny break between batches

   This makes the UI much smoother.
*/


async function displayDisasterLocations(

    locations,

    disasterType,

    isFallback = false,

    requestId = mapRequestId

) {


    /*
       Make sure locations are actually an array.
    */

    if (
        !Array.isArray(locations)
    ) {

        return;

    }


    /*
       Get the correct emoji.
    */

    const emoji =
        disasterMarkerIcons[
            disasterType
        ];


    /*
       Only use a reasonable number of locations.

       We sort nothing here because the API already gives
       us its event ordering.
    */

    const visibleLocations =
        locations.slice(
            0,
            MAX_VISIBLE_MARKERS
        );


    /*
       Remove invalid locations before creating markers.

       This prevents wasted work.
    */

    const validLocations =
        visibleLocations.filter(

            (disaster) => {

                if (
                    !disaster ||
                    !Array.isArray(
                        disaster.coordinates
                    )
                ) {

                    return false;

                }


                if (
                    disaster.coordinates.length <
                    2
                ) {

                    return false;

                }


                const longitude =
                    Number(
                        disaster.coordinates[0]
                    );


                const latitude =
                    Number(
                        disaster.coordinates[1]
                    );


                return (

                    Number.isFinite(
                        latitude
                    )

                    &&

                    Number.isFinite(
                        longitude
                    )

                );

            }

        );


    /*
       Add markers in small groups.

       Example:

           150 markers

           ↓

           30
           30
           30
           30
           30
    */

    for (

        let start = 0;

        start < validLocations.length;

        start += MARKER_BATCH_SIZE

    ) {


        /*
           If the user switched to another disaster while
           we were rendering this batch, stop immediately.
        */

        if (
            requestId !==
            mapRequestId
        ) {

            return;

        }


        /*
           Get the next group of locations.
        */

        const batch =
            validLocations.slice(

                start,

                start +
                MARKER_BATCH_SIZE

            );


        /*
           Create each marker in this batch.
        */

        batch.forEach(

            (disaster) => {


                /*
                   API coordinates are:

                       [longitude, latitude]

                   Leaflet expects:

                       [latitude, longitude]
                */

                const longitude =
                    Number(
                        disaster.coordinates[0]
                    );


                const latitude =
                    Number(
                        disaster.coordinates[1]
                    );


                /*
                   Create emoji icon.
                */

                const icon =
                    createDisasterIcon(
                        emoji
                    );


                /*
                   Create Leaflet marker.
                */

                const marker =
                    L.marker(

                        [
                            latitude,
                            longitude
                        ],

                        {
                            icon:
                                icon
                        }

                    );


                /*
                   Add marker to map.
                */

                marker.addTo(
                    wildfireMap
                );


                /*
                   Save marker in our array.

                   This allows clearDisasterMarkers()
                   to remove it later.
                */

                disasterMarkers.push(
                    marker
                );


                /*
                   Add click interaction.
                */

                marker.on(

                    "click",

                    () => {

                        /*
                           Remember selected marker.
                        */

                        selectedMarker =
                            marker;


                        /*
                           Move map to marker.
                        */

                        wildfireMap.panTo(

                            marker.getLatLng()

                        );


                        /*
                           Zoom in.

                           We use 6 so the user can still
                           understand the surrounding area.
                        */

                        wildfireMap.setZoom(
                            6
                        );


                        /*
                           Show popup.
                        */

                        showDisasterPopup(

                            disaster,

                            disasterType,

                            marker,

                            isFallback

                        );

                    }

                );

            }

        );


        /*
           Let the browser render the current batch before
           adding more markers.

           This is one of the important performance fixes.
        */

        await new Promise(

            (resolve) => {

                requestAnimationFrame(
                    resolve
                );

            }

        );

    }


    /*
       Show how many markers were actually rendered.

       This helps us during development.
    */

    console.log(

        `EMBERWATCH: Rendered ${validLocations.length} ${disasterNames[disasterType]} markers.`

    );


}


/* =========================================================
   9. SHOW DISASTER POPUP
   =========================================================

   Clicking a marker opens a small information popup.

   The popup changes according to the disaster type.
*/


function showDisasterPopup(

    disaster,

    disasterType,

    marker,

    isFallback

) {


    /*
       Get emoji.
    */

    const emoji =
        disasterMarkerIcons[
            disasterType
        ];


    /*
       Get readable disaster name.
    */

    const disasterName =
        disasterNames[
            disasterType
        ];


    /*
       Close an existing popup.
    */

    if (wildfirePopup) {

        wildfireMap.closePopup(
            wildfirePopup
        );

    }


    /* =====================================================
       SPECIAL EARTHQUAKE INFORMATION
       ===================================================== */


    let extraInformation =
        "";


    if (
        disasterType ===
        "earthquake"
    ) {


        extraInformation = `

            <p>

                <strong>
                    Magnitude:
                </strong>

                ${escapeHtml(
                    disaster.magnitude ??
                    "Unknown"
                )}

            </p>

        `;

    }


    /* =====================================================
       FALLBACK WARNING
       ===================================================== */


    if (
        isFallback
    ) {


        extraInformation += `

            <p
                style="
                    color: #ff8a00;
                    font-size: 11px;
                "
            >

                Demo visualization —
                live ${escapeHtml(
                    disasterName.toLowerCase()
                )} data unavailable.

            </p>

        `;

    }


    /* =====================================================
       CREATE POPUP HTML
       ===================================================== */


    const popupContent = `

        <div class="map-info-window">

            <div class="popup-icon">
                ${emoji}
            </div>


            <div class="popup-content">

                <h4>
                    ${escapeHtml(

                        disaster.title ||

                        `${disasterName} Event`

                    )}
                </h4>


                <p>
                    ${escapeHtml(
                        disasterName
                    )}
                </p>


                ${extraInformation}


                <p>

                    <strong>
                        Detected:
                    </strong>

                    ${formatDate(
                        disaster.date
                    )}

                </p>


                <p>

                    <strong>
                        Coordinates:
                    </strong>

                    ${getEventCoordinates(
                        disaster
                    )}

                </p>


                <p>

                    <strong>
                        Source:
                    </strong>

                    ${escapeHtml(

                        disaster.source ||

                        "EMBERWATCH"

                    )}

                </p>

            </div>

        </div>

    `;


    /* =====================================================
       CREATE LEAFLET POPUP
       ===================================================== */


    wildfirePopup =
        L.popup({

            offset:
                [
                    0,
                    -10
                ]

        })

        .setLatLng(
            marker.getLatLng()
        )

        .setContent(
            popupContent
        )

        .openOn(
            wildfireMap
        );


    /* =====================================================
       UPDATE RIGHT EVENT PANEL
       ===================================================== */


    if (
        typeof updateEventPanel ===
        "function"
    ) {

        updateEventPanel(
            disaster
        );

    }

}


/* =========================================================
   10. WILDFIRE FUNCTION
   =========================================================

   Kept for compatibility with older navigation code.
*/


async function loadWildfireMarkers() {

    return await loadDisasterMarkers(
        "wildfire"
    );

}


/* =========================================================
   11. EARTHQUAKE FUNCTION
   ========================================================= */


async function loadEarthquakeMarkers() {

    return await loadDisasterMarkers(
        "earthquake"
    );

}


/* =========================================================
   12. FLOOD FUNCTION
   ========================================================= */


async function loadFloodMarkers() {

    return await loadDisasterMarkers(
        "flood"
    );

}


/* =========================================================
   13. DUST STORM FUNCTION
   ========================================================= */


async function loadDustStormMarkers() {

    return await loadDisasterMarkers(
        "dust-storm"
    );

}


/* =========================================================
   14. SAND STORM FUNCTION
   ========================================================= */


async function loadSandStormMarkers() {

    return await loadDisasterMarkers(
        "sand-storm"
    );

}


/* =========================================================
   15. VOLCANO FUNCTION
   ========================================================= */


async function loadVolcanoMarkers() {

    return await loadDisasterMarkers(
        "volcano"
    );

}


/* =========================================================
   16. SEVERE STORM FUNCTION
   ========================================================= */


async function loadSevereStormMarkers() {

    return await loadDisasterMarkers(
        "severe-storm"
    );

}


/* =========================================================
   17. CHANGE ONLY EMOJIS
   =========================================================

   This function is kept because your previous version
   supported it.

   It changes existing marker emojis without making
   another API request.
*/


function updateMapMarkerIcons(
    disasterEmoji
) {


    /*
       Change every existing marker icon.
    */

    disasterMarkers.forEach(

        (marker) => {

            const newIcon =
                createDisasterIcon(
                    disasterEmoji
                );


            marker.setIcon(
                newIcon
            );

        }

    );


    console.log(

        `EMBERWATCH: Markers changed to ${disasterEmoji}`

    );

}


/* =========================================================
   18. CLEAR ALL MARKERS
   ========================================================= */


function clearDisasterMarkers() {


    /*
       Remove every marker from Leaflet.
    */

    disasterMarkers.forEach(

        (marker) => {

            if (
                wildfireMap &&
                wildfireMap.hasLayer(
                    marker
                )
            ) {

                wildfireMap.removeLayer(
                    marker
                );

            }

        }

    );


    /*
       Empty marker list.
    */

    disasterMarkers = [];


    /*
       Reset selected marker.
    */

    selectedMarker =
        null;


    /*
       Close popup.
    */

    if (
        wildfirePopup &&
        wildfireMap
    ) {

        wildfireMap.closePopup(
            wildfirePopup
        );

        wildfirePopup =
            null;

    }

}


/* =========================================================
   19. OLD FUNCTION NAME
   =========================================================

   Kept for compatibility with older code.
*/


function clearWildfireMarkers() {

    clearDisasterMarkers();

}


/* =========================================================
   20. MAP / SATELLITE BUTTONS
   ========================================================= */


function setupMapModeButtons() {


    /*
       Find buttons using:

           class="map-mode"
    */

    const mapModeButtons =
        document.querySelectorAll(
            ".map-mode"
        );


    /*
       If buttons don't exist, don't crash the application.
    */

    if (
        mapModeButtons.length ===
        0
    ) {

        console.warn(
            "EMBERWATCH: Map/Satellite buttons were not found."
        );

        return;

    }


    mapModeButtons.forEach(

        (button) => {


            button.addEventListener(

                "click",

                () => {


                    /*
                       Remove active class from all buttons.
                    */

                    mapModeButtons.forEach(

                        (mapButton) => {

                            mapButton.classList.remove(
                                "active"
                            );

                        }

                    );


                    /*
                       Make clicked button active.
                    */

                    button.classList.add(
                        "active"
                    );


                    /*
                       Read button text.
                    */

                    const selectedMode =
                        button.textContent
                            .trim()
                            .toLowerCase();


                    /* =====================================
                       SATELLITE MODE
                       ===================================== */


                    if (
                        selectedMode ===
                        "satellite"
                    ) {


                        /*
                           Remove street map.
                        */

                        if (
                            wildfireMap.hasLayer(
                                streetMapLayer
                            )
                        ) {

                            wildfireMap.removeLayer(
                                streetMapLayer
                            );

                        }


                        /*
                           Add satellite layer.
                        */

                        if (
                            !wildfireMap.hasLayer(
                                satelliteMapLayer
                            )
                        ) {

                            satelliteMapLayer.addTo(
                                wildfireMap
                            );

                        }


                        console.log(
                            "EMBERWATCH: Satellite mode enabled."
                        );

                    }


                    /* =====================================
                       NORMAL MAP MODE
                       ===================================== */


                    else {


                        /*
                           Remove satellite layer.
                        */

                        if (
                            wildfireMap.hasLayer(
                                satelliteMapLayer
                            )
                        ) {

                            wildfireMap.removeLayer(
                                satelliteMapLayer
                            );

                        }


                        /*
                           Add OpenStreetMap layer.
                        */

                        if (
                            !wildfireMap.hasLayer(
                                streetMapLayer
                            )
                        ) {

                            streetMapLayer.addTo(
                                wildfireMap
                            );

                        }


                        console.log(
                            "EMBERWATCH: Normal map mode enabled."
                        );

                    }


                    /*
                       Leaflet sometimes needs to recalculate
                       its dimensions after changing layers.
                    */

                    setTimeout(

                        () => {

                            refreshMapSize();

                        },

                        100

                    );

                }

            );

        }

    );

}


/* =========================================================
   21. ZOOM CONTROLS
   ========================================================= */


function setupZoomControls() {


    /* =====================================================
       ZOOM IN
       ===================================================== */


    const zoomInButton =
        document.getElementById(
            "zoomIn"
        );


    if (zoomInButton) {


        zoomInButton.addEventListener(

            "click",

            () => {


                const currentZoom =
                    wildfireMap.getZoom();


                const newZoom =
                    Math.min(

                        currentZoom + 1,

                        MAP_CONFIG.maxZoom

                    );


                wildfireMap.setZoom(
                    newZoom
                );

            }

        );

    }


    /* =====================================================
       ZOOM OUT
       ===================================================== */


    const zoomOutButton =
        document.getElementById(
            "zoomOut"
        );


    if (zoomOutButton) {


        zoomOutButton.addEventListener(

            "click",

            () => {


                const currentZoom =
                    wildfireMap.getZoom();


                const newZoom =
                    Math.max(

                        currentZoom - 1,

                        MAP_CONFIG.minZoom

                    );


                wildfireMap.setZoom(
                    newZoom
                );

            }

        );

    }

}


/* =========================================================
   22. MAP LOADING STATE
   =========================================================

   The map itself appears immediately.

   While API data is being downloaded, we display:

          🌍
      Loading live events...

   This is much better than making the user think the map
   is frozen.
*/


function showMapLoading(
    disasterType
) {


    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {

        return;

    }


    /*
       Remove previous loading message.
    */

    hideMapLoading();


    /*
       Create loading element.
    */

    const loadingElement =
        document.createElement(
            "div"
        );


    loadingElement.id =
        "map-loading";


    /*
       Use the correct emoji for the selected disaster.

       Example:

           wildfire → 🔥
           earthquake → 〽️
           flood → 🌊
    */

    const emoji =
        disasterMarkerIcons[
            disasterType
        ] ||
        "🌍";


    loadingElement.innerHTML = `

        <div class="map-loading-content">

            <div class="map-loading-icon">
                ${emoji}
            </div>

            <div class="map-loading-title">
                Loading live events...
            </div>

            <div class="map-loading-subtitle">
                ${escapeHtml(
                    disasterNames[
                        disasterType
                    ] ||
                    "Disaster"
                )}
            </div>

        </div>

    `;


    /*
       Make sure the map container can hold an absolutely
       positioned loading element.

       We only set this if necessary.
    */

    if (
        getComputedStyle(
            mapElement
        ).position ===
        "static"
    ) {

        mapElement.style.position =
            "relative";

    }


    /*
       Add loading message over the map.
    */

    mapElement.appendChild(
        loadingElement
    );

}


/* =========================================================
   23. HIDE MAP LOADING STATE
   ========================================================= */


function hideMapLoading() {


    const loadingElement =
        document.getElementById(
            "map-loading"
        );


    if (loadingElement) {

        loadingElement.remove();

    }

}


/* =========================================================
   24. MAP ERROR STATE
   ========================================================= */


function showMapError(
    message
) {


    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {

        return;

    }


    /*
       Remove previous error message.
    */

    hideMapError();


    /*
       Create error element.
    */

    const errorElement =
        document.createElement(
            "div"
        );


    errorElement.id =
        "map-error";


    errorElement.innerHTML = `

        <div class="map-error-content">

            <div class="map-error-icon">
                ⚠️
            </div>

            <div class="map-error-message">
                ${escapeHtml(
                    message
                )}
            </div>

        </div>

    `;


    /*
       Make sure absolute positioning works.
    */

    if (
        getComputedStyle(
            mapElement
        ).position ===
        "static"
    ) {

        mapElement.style.position =
            "relative";

    }


    mapElement.appendChild(
        errorElement
    );


    /*
       Automatically remove the error after a few
       seconds.

       We don't want it permanently covering the map.
    */

    setTimeout(

        () => {

            hideMapError();

        },

        5000

    );

}


/* =========================================================
   25. HIDE MAP ERROR
   ========================================================= */


function hideMapError() {


    const errorElement =
        document.getElementById(
            "map-error"
        );


    if (errorElement) {

        errorElement.remove();

    }

}


/* =========================================================
   26. DATE FORMATTER
   ========================================================= */


function formatDate(
    dateString
) {


    /*
       No date.
    */

    if (!dateString) {

        return "Unknown";

    }


    /*
       Convert API date into JavaScript Date object.
    */

    const date =
        new Date(
            dateString
        );


    /*
       Invalid date.
    */

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown";

    }


    /*
       Convert into readable format.

       Example:

           Aug 12, 2026, 10:25 PM
    */

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
        date
    );

}


/* =========================================================
   27. GET EVENT COORDINATES
   ========================================================= */


function getEventCoordinates(
    disaster
) {


    /*
       Check that coordinates exist.
    */

    if (
        !disaster ||
        !Array.isArray(
            disaster.coordinates
        ) ||
        disaster.coordinates.length <
        2
    ) {

        return "Unavailable";

    }


    /*
       API format:

           [longitude, latitude]
    */

    const longitude =
        Number(
            disaster.coordinates[0]
        );


    const latitude =
        Number(
            disaster.coordinates[1]
        );


    /*
       Validate numbers.
    */

    if (
        !Number.isFinite(
            latitude
        ) ||
        !Number.isFinite(
            longitude
        )
    ) {

        return "Unavailable";

    }


    return (

        `${latitude.toFixed(2)}°, ` +
        `${longitude.toFixed(2)}°`

    );

}


/* =========================================================
   28. ESCAPE HTML
   =========================================================

   API data comes from outside our application.

   Before putting API text into HTML, we escape special
   characters.

   This is safer than directly inserting raw API text.
*/


function escapeHtml(
    value
) {


    const text =
        String(
            value ??
            ""
        );


    return text

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   29. REFRESH MAP SIZE
   =========================================================

   Leaflet sometimes needs to recalculate the map size
   after:

       window resizing
       sidebar changes
       layout changes
       satellite/map switching
*/


function refreshMapSize() {


    if (
        wildfireMap
    ) {

        wildfireMap.invalidateSize();

    }

}


/* =========================================================
   30. WINDOW RESIZE
   ========================================================= */


window.addEventListener(

    "resize",

    refreshMapSize

);


/* =========================================================
   31. MAKE FUNCTIONS AVAILABLE
   =========================================================

   Other JavaScript files can access these functions
   through the window object.
*/


window.initializeMap =
    initializeMap;


window.loadDisasterMarkers =
    loadDisasterMarkers;


window.loadWildfireMarkers =
    loadWildfireMarkers;


window.loadEarthquakeMarkers =
    loadEarthquakeMarkers;


window.loadFloodMarkers =
    loadFloodMarkers;


window.loadDustStormMarkers =
    loadDustStormMarkers;


window.loadSandStormMarkers =
    loadSandStormMarkers;


window.loadVolcanoMarkers =
    loadVolcanoMarkers;


window.loadSevereStormMarkers =
    loadSevereStormMarkers;


window.updateMapMarkerIcons =
    updateMapMarkerIcons;


window.clearDisasterMarkers =
    clearDisasterMarkers;


window.clearWildfireMarkers =
    clearWildfireMarkers;


window.createDisasterIcon =
    createDisasterIcon;


window.showMapLoading =
    showMapLoading;


window.hideMapLoading =
    hideMapLoading;


window.showMapError =
    showMapError;


window.hideMapError =
    hideMapError;


/* =========================================================
   END OF MAP.JS
   ========================================================= */