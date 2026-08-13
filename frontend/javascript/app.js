/* =========================================================
   EMBERWATCH - APP.JS
   =========================================================

   This is the main entry point of our application.

   Think of app.js as the manager of the application.

   It doesn't contain the actual map logic,
   API logic, dashboard logic, etc.

   Instead, it tells the different parts of EMBERWATCH:

       "Okay, start now." 😭


   OUR APPLICATION FLOW:

       HTML loads
           ↓
       DOM becomes ready
           ↓
       Theme is ready
           ↓
       Navigation is ready
           ↓
       Dashboard gets NASA data
           ↓
       Leaflet map is created
           ↓
       Wildfire markers are displayed
*/


/* =========================================================
   1. WAIT FOR HTML TO LOAD
   =========================================================

   DOMContentLoaded means:

       "Wait until the browser has finished creating
        all the HTML elements."

   We need this because our JavaScript searches for
   elements such as:

       #map
       #totalEvents
       #themeToggle
       #activityTable

   Those elements must exist before JavaScript tries
   to use them.
*/


document.addEventListener(
    "DOMContentLoaded",
    async () => {


        console.log(
            "🔥 EMBERWATCH is starting..."
        );


        /* =================================================
           2. INITIALIZE NAVIGATION
           =================================================

           navigation.js already attaches the click
           events when it loads.

           We don't need to call anything complicated here.

           This message simply helps us understand the
           startup process while developing.
        */

        console.log(
            "EMBERWATCH: Navigation ready."
        );


        /* =================================================
           3. INITIALIZE DASHBOARD
           =================================================

           dashboard.js will:

               ↓
           Ask api.js for NASA data

               ↓
           Receive wildfire events

               ↓
           Put the information into our dashboard cards

               ↓
           Fill the Recent Activity table

               ↓
           Update the Event Panel
        */


        if (
            typeof initializeDashboard ===
            "function"
        ) {

            await initializeDashboard();

        }

        else {

            console.error(
                "EMBERWATCH: initializeDashboard() was not found."
            );

        }


        /* =================================================
           4. INITIALIZE LEAFLET MAP
           =================================================

           THIS WAS THE PART WE WERE MISSING.

           Our previous app.js was still thinking about
           Google Maps.

           Now we are using Leaflet.

           Leaflet uses:

               initializeMap()

           to create the actual map.
        */


        if (
            typeof initializeMap ===
            "function"
        ) {


            /*
                Create the Leaflet map.

                This will:

                    1. Find #map
                    2. Create the world map
                    3. Add OpenStreetMap tiles
                    4. Add zoom controls
                    5. Fetch wildfire coordinates
                    6. Place 🔥 markers
            */

            initializeMap();

        }

        else {

            console.error(
                "EMBERWATCH: initializeMap() was not found."
            );

        }


        /* =================================================
           5. APPLICATION READY
           =================================================

           At this point the main parts of EMBERWATCH
           have been started.
        */

        console.log(
            "🔥 EMBERWATCH application initialized."
        );

    }
);


/* =========================================================
   6. GLOBAL ERROR HANDLER
   =========================================================

   If an unexpected JavaScript error happens, this prints
   the error in the browser console.

   This is extremely useful while developing because
   instead of the application silently failing, we can
   see what went wrong.
*/


window.addEventListener(
    "error",
    (event) => {


        console.error(
            "EMBERWATCH JavaScript Error:",
            event.error
        );

    }
);


/* =========================================================
   7. UNHANDLED PROMISE ERROR
   =========================================================

   Our API functions use async/await.

   If an API request fails and the error isn't handled,
   this event lets us see the problem.
*/


window.addEventListener(
    "unhandledrejection",
    (event) => {


        console.error(
            "EMBERWATCH Promise Error:",
            event.reason
        );

    }
);


/* =========================================================
   END OF APP.JS
   ========================================================= */