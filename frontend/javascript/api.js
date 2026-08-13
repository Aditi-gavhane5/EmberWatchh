/* =========================================================
   EMBERWATCH - API.JS
   =========================================================

   This file is the DATA CENTER of EMBERWATCH.

   All external API requests are kept here.

   The rest of our application does NOT need to know
   how each API works.

   Instead:

       navigation.js
             ↓
       asks for disaster data
             ↓
           api.js
             ↓
       external API
             ↓
       returns clean data
             ↓
          map.js
             ↓
       displays markers


   CURRENT DATA SOURCES
   ---------------------------------------------------------

       🔥 Wildfires
           NASA EONET

       〽️ Earthquakes
           USGS

       🌋 Volcanoes
           NASA EONET

       🌩️ Severe Storms
           NASA EONET

       🌫️ Dust Storms
           NASA EONET

       〰️ Sand Storms
           NASA EONET

       🌊 Floods
           Copernicus Global Flood Monitoring
           → requires an access token


   IMPORTANT:

   We NEVER put fake data into the API functions.

   If an API isn't available/configured, the function
   returns an empty array and reports the problem in
   the browser console.
*/


/* =========================================================
   1. NASA EONET CONFIGURATION
   =========================================================

   NASA EONET provides continuously updated natural-event
   metadata and allows us to filter events by category.

   We use the Events endpoint.
*/


const NASA_EONET_BASE_URL =
    "https://eonet.gsfc.nasa.gov/api/v3/events";


/*
   We keep the NASA category names in one place.

   This makes changing an endpoint much easier later.
*/


const NASA_CATEGORIES = {

    wildfire:
        "wildfires",

    volcano:
        "volcanoes",

    severeStorm:
        "severeStorms",

    dustHaze:
        "dustHaze"

};


/* =========================================================
   2. USGS EARTHQUAKE API
   =========================================================

   USGS provides official real-time GeoJSON earthquake
   feeds.

   We use the M2.5+ earthquakes from the last 7 days.

   The feed is updated frequently by USGS.
*/


const USGS_EARTHQUAKE_API =
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson";


/* =========================================================
   3. COPERNICUS FLOOD API CONFIGURATION
   =========================================================

   Copernicus Global Flood Monitoring provides near-real-
   time global flood monitoring based on Sentinel-1
   satellite data.

   HOWEVER:

   Its REST API requires an access token.

   Therefore we do NOT pretend that a public unauthenticated
   endpoint exists.

   We keep the configuration ready so we can connect it
   properly later.
*/


const COPERNICUS_FLOOD_API =
    "https://api.gfm.eodc.eu/v2";


/*
   Put the token here ONLY if/when you obtain one.

   IMPORTANT:

   Do NOT upload a real private token to GitHub.

   For the final project, we should move this into a
   backend/server environment.
*/


const COPERNICUS_FLOOD_TOKEN =
    "";


/* =========================================================
   4. GENERIC FETCH HELPER
   =========================================================

   Instead of repeating the same fetch + error handling
   code for every NASA request, we create one reusable
   function.

   Example:

       fetchNASAEvents("wildfires")

   returns the NASA event list.
*/


async function fetchNASAEvents(
    category
) {


    try {


        /*
            Build the API URL.

            Example:

            https://eonet.gsfc.nasa.gov/api/v3/events
            ?category=wildfires
            &status=open
        */

/* =========================================================
   LIMIT NASA RESULTS
   =========================================================

   NASA EONET can return a very large number of events.

   We don't need thousands of markers on the screen.

   300 gives us enough information for a global dashboard
   while keeping the map responsive.
*/

const MAX_NASA_EVENTS = 300;


const url =
    `${NASA_EONET_BASE_URL}` +
    `?category=${encodeURIComponent(category)}` +
    `&status=open` +
    `&limit=${MAX_NASA_EVENTS}`;

        /*
            Send request to NASA.
        */

        const response =
            await fetch(
                url
            );


        /*
            Check whether NASA responded successfully.
        */

        if (!response.ok) {

            throw new Error(
                `NASA EONET error: ${response.status}`
            );

        }


        /*
            Convert JSON response into JavaScript object.
        */

        const data =
            await response.json();


        /*
            Return the events array.

            If NASA doesn't return events,
            return an empty array.
        */

        return data.events || [];


    }

    catch (error) {


        /*
            Don't crash the entire application.

            Instead, report the problem in the console.
        */

        console.error(
            `EMBERWATCH: Failed to fetch NASA ${category} data.`,
            error
        );


        return [];

    }

}


/* =========================================================
   5. CONVERT NASA EVENTS INTO MAP LOCATIONS
   =========================================================

   NASA EONET events can contain geometry information.

   Our Leaflet map mainly needs:

       id
       title
       coordinates
       date
       source
*/


function convertNASAEventsToLocations(
    events
) {


    return events

        .map(
            (event) => {


                /*
                    Some events can contain more than one
                    geometry entry.

                    We use the latest geometry.
                */

                const geometry =
                    event.geometry?.[
                        event.geometry.length - 1
                    ];


                /*
                    If there is no geometry, we cannot place
                    the event on a map.
                */

                if (
                    !geometry ||
                    !geometry.coordinates
                ) {

                    return null;

                }


                /*
                    Return a clean object.

                    EONET uses:

                        [longitude, latitude]

                    which Leaflet can later convert to:

                        [latitude, longitude]
                */

                return {

                    id:
                        event.id,

                    title:
                        event.title,

                    date:
                        geometry.date,

                    coordinates:
                        geometry.coordinates,

                    source:
                        "NASA EONET",

                    category:
                        event.categories?.[0]?.title ||
                        "Natural Event"

                };

            }
        )


        /*
            Remove events that didn't have coordinates.
        */

        .filter(
            (event) =>
                event !== null
        );

}


/* =========================================================
   6. GET WILDFIRES
   =========================================================

   NASA EONET → Wildfires
*/


async function getWildfireEvents() {


    return await fetchNASAEvents(
        NASA_CATEGORIES.wildfire
    );

}


/*
   Get wildfire locations prepared for Leaflet.
*/


async function getWildfireLocations() {


    const events =
        await getWildfireEvents();


    return convertNASAEventsToLocations(
        events
    );

}


/* =========================================================
   7. GET VOLCANOES
   =========================================================

   NASA EONET → Volcanoes
*/


async function getVolcanoEvents() {


    return await fetchNASAEvents(
        NASA_CATEGORIES.volcano
    );

}


async function getVolcanoLocations() {


    const events =
        await getVolcanoEvents();


    return convertNASAEventsToLocations(
        events
    );

}


/* =========================================================
   8. GET SEVERE STORMS
   =========================================================

   NASA EONET → Severe Storms
*/


async function getSevereStormEvents() {


    return await fetchNASAEvents(
        NASA_CATEGORIES.severeStorm
    );

}


async function getSevereStormLocations() {


    const events =
        await getSevereStormEvents();


    return convertNASAEventsToLocations(
        events
    );

}


/* =========================================================
   9. GET DUST / SAND EVENTS
   =========================================================

   NASA EONET's dust/haze category is the closest
   common NASA event source for our Dust Storm and
   Sand Storm UI modes.

   We can use the same underlying event source while
   presenting them as different views in EMBERWATCH.
*/


async function getDustStormEvents() {


    return await fetchNASAEvents(
        NASA_CATEGORIES.dustHaze
    );

}


async function getDustStormLocations() {


    const events =
        await getDustStormEvents();


    return convertNASAEventsToLocations(
        events
    );

}


/*
   Sand storms currently use the same NASA dust/haze
   event source.

   This is intentional.

   We should NOT claim that NASA provides a completely
   separate "sand storm" feed if it doesn't.
*/


async function getSandStormEvents() {


    return await fetchNASAEvents(
        NASA_CATEGORIES.dustHaze
    );

}


async function getSandStormLocations() {


    const events =
        await getSandStormEvents();


    return convertNASAEventsToLocations(
        events
    );

}


/* =========================================================
   10. GET EARTHQUAKES
   =========================================================

   USGS provides GeoJSON earthquake feeds.

   We use the M2.5+ feed covering the previous 7 days.
*/


async function getEarthquakeEvents() {


    try {


        /*
            Request USGS earthquake feed.
        */

        const response =
            await fetch(
                USGS_EARTHQUAKE_API
            );


        /*
            Check HTTP status.
        */

        if (!response.ok) {

            throw new Error(
                `USGS API error: ${response.status}`
            );

        }


        /*
            Convert response to JSON.
        */

        const data =
            await response.json();


        /*
            GeoJSON stores earthquake events in:

                data.features
        */

        const earthquakes =
            data.features || [];


        /*
            Convert USGS format into our EMBERWATCH format.
        */

        return earthquakes.map(
            (earthquake) => {


                const properties =
                    earthquake.properties;


                const coordinates =
                    earthquake.geometry?.coordinates;


                return {

                    id:
                        earthquake.id,

                    title:
                        properties?.place ||
                        "Unknown location",

                    magnitude:
                        properties?.mag,

                    date:
                        properties?.time,

                    coordinates:
                        coordinates,

                    source:
                        "USGS",

                    url:
                        properties?.url || null

                };

            }
        );


    }

    catch (error) {


        console.error(
            "EMBERWATCH: Failed to fetch earthquake data.",
            error
        );


        return [];

    }

}


/*
   Prepare earthquake locations for Leaflet.
*/


async function getEarthquakeLocations() {


    const earthquakes =
        await getEarthquakeEvents();


    return earthquakes.filter(
        (earthquake) => {


            return (
                earthquake.coordinates &&
                earthquake.coordinates.length >= 2
            );

        }
    );

}


/* =========================================================
   11. GET FLOODS
   =========================================================

   Flood data is different from our other APIs.

   Copernicus Global Flood Monitoring provides global,
   near-real-time flood monitoring based on Sentinel-1
   satellite observations.

   Its REST API requires authentication.

   Therefore this function checks whether a token exists
   before trying to call it.
*/


async function getFloodEvents() {


    /*
        We don't have a token yet.
    */

    if (
        !COPERNICUS_FLOOD_TOKEN
    ) {


        console.warn(
            "EMBERWATCH: Copernicus Flood API requires an access token. Flood API is prepared but not connected yet."
        );


        return [];

    }


    try {


        /*
            NOTE:

            The exact product endpoint depends on which
            Copernicus GFM product we decide to display.

            We deliberately don't invent an endpoint here.

            Once we obtain the token and choose the exact
            GFM product, we will connect that endpoint.
        */


        console.log(
            "EMBERWATCH: Copernicus Flood API is configured."
        );


        return [];


    }

    catch (error) {


        console.error(
            "EMBERWATCH: Failed to fetch flood data.",
            error
        );


        return [];

    }

}


/*
   Flood locations.

   Currently returns an empty array until the authenticated
   Copernicus product endpoint is configured.
*/


async function getFloodLocations() {


    const floods =
        await getFloodEvents();


    return floods.filter(
        (flood) => {


            return (
                flood.coordinates &&
                flood.coordinates.length >= 2
            );

        }
    );

}


/* =========================================================
   12. GENERIC DISASTER FETCHER
   =========================================================

   This is useful because our navigation system can simply
   say:

       getDisasterLocations("volcano")

   instead of manually knowing which API to call.

   This is a very useful architecture pattern.
*/


async function getDisasterLocations(
    disasterType
) {


    switch (
        disasterType
    ) {


        /* -----------------------------------------------
           WILDFIRES
        ----------------------------------------------- */

        case "wildfire":

            return await getWildfireLocations();


        /* -----------------------------------------------
           EARTHQUAKES
        ----------------------------------------------- */

        case "earthquake":

            return await getEarthquakeLocations();


        /* -----------------------------------------------
           FLOODS
        ----------------------------------------------- */

        case "flood":

            return await getFloodLocations();


        /* -----------------------------------------------
           VOLCANOES
        ----------------------------------------------- */

        case "volcano":

            return await getVolcanoLocations();


        /* -----------------------------------------------
           DUST STORMS
        ----------------------------------------------- */

        case "dust-storm":

            return await getDustStormLocations();


        /* -----------------------------------------------
           SAND STORMS
        ----------------------------------------------- */

        case "sand-storm":

            return await getSandStormLocations();


        /* -----------------------------------------------
           SEVERE STORMS
        ----------------------------------------------- */

        case "severe-storm":

            return await getSevereStormLocations();


        /* -----------------------------------------------
           UNKNOWN DISASTER
        ----------------------------------------------- */

        default:

            console.warn(
                `EMBERWATCH: No API configured for ${disasterType}.`
            );


            return [];

    }

}


/* =========================================================
   13. MAKE FUNCTIONS AVAILABLE
   =========================================================

   Other JavaScript files can now use these functions.
*/


/*
   NASA wildfire functions.
*/

window.getWildfireEvents =
    getWildfireEvents;

window.getWildfireLocations =
    getWildfireLocations;


/*
   USGS earthquake functions.
*/

window.getEarthquakeEvents =
    getEarthquakeEvents;

window.getEarthquakeLocations =
    getEarthquakeLocations;


/*
   Flood functions.
*/

window.getFloodEvents =
    getFloodEvents;

window.getFloodLocations =
    getFloodLocations;


/*
   Volcano functions.
*/

window.getVolcanoEvents =
    getVolcanoEvents;

window.getVolcanoLocations =
    getVolcanoLocations;


/*
   Dust storm functions.
*/

window.getDustStormEvents =
    getDustStormEvents;

window.getDustStormLocations =
    getDustStormLocations;


/*
   Sand storm functions.
*/

window.getSandStormEvents =
    getSandStormEvents;

window.getSandStormLocations =
    getSandStormLocations;


/*
   Severe storm functions.
*/

window.getSevereStormEvents =
    getSevereStormEvents;

window.getSevereStormLocations =
    getSevereStormLocations;


/*
   Generic disaster function.

   This is the main function we can use later in
   navigation.js.
*/

window.getDisasterLocations =
    getDisasterLocations;


/* =========================================================
   END OF API.JS
   ========================================================= */