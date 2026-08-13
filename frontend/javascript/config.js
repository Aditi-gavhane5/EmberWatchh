/* =========================================================
   EMBERWATCH - CONFIGURATION
   =========================================================

   This file stores configuration values that are used
   throughout our application.

   WHY HAVE A SEPARATE FILE?

   Imagine we put our API URLs directly inside 5 different
   JavaScript files.

   Later, if the URL changes, we'd have to find and change
   it everywhere.

   Instead:

       config.js
           ↓
       stores important settings
           ↓
       other JS files use them


   This makes the project easier to maintain.
*/


/* =========================================================
   1. NASA EONET API
   =========================================================

   EONET = Earth Observatory Natural Event Tracker.

   NASA provides information about natural events happening
   around the world.

   Our first version will focus specifically on WILDFIRES.

   The API returns data in JSON format.

   We will learn how to work with that data in api.js.
*/


const API_CONFIG = {

    /*
        Base URL of the NASA EONET API.

        We keep the base URL separate from the rest of
        the URL because later we may want to request
        different categories.
    */

    eonetBaseUrl:
        "https://eonet.gsfc.nasa.gov/api/v3/events",


    /*
        The wildfire category used by EONET.

        IMPORTANT:

        We are keeping wildfire as our first category.

        Later, when we expand EMBERWATCH, we can add
        other categories here.
    */

    wildfireCategory:
        "wildfires",


    /*
        Number of events we want to request.

        This keeps our first API request reasonably small.

        Later we can make this configurable.
    */

    limit: 100

};


/* =========================================================
   2. MAP CONFIGURATION
   =========================================================

   These values will eventually be used by map.js.

   We are keeping map settings separate from the map code
   itself.

   This is useful because changing the starting location
   should NOT require us to rewrite the entire map logic.
*/


const MAP_CONFIG = {

    /*
        Initial map center.

        Latitude:
            20

        Longitude:
            0

        This gives us a general world view.
    */

    center: {

        lat: 20,

        lng: 0

    },


    /*
        Initial zoom level.

        Smaller number → zoomed farther out.

        Larger number → zoomed farther in.
    */

    zoom: 2,


    /*
        Minimum zoom.

        Prevents the user from zooming too far out.
    */

    minZoom: 2,


    /*
        Maximum zoom.

        Prevents the user from zooming ridiculously far in.
    */

    maxZoom: 15

};


/* =========================================================
   3. APPLICATION SETTINGS
   =========================================================

   These are general settings for EMBERWATCH.
*/


const APP_CONFIG = {

    /*
        Name displayed by the application.
    */

    appName: "EMBERWATCH",


    /*
        Default disaster category.

        We're starting with wildfire.
    */

    defaultCategory: "wildfire",


    /*
        How many recent events should appear in the
        Recent Activity table.
    */

    recentEventsLimit: 8

};