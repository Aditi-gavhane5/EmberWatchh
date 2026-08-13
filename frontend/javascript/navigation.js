/* =========================================================
   EMBERWATCH - NAVIGATION.JS
   =========================================================

   This file controls the EMBERWATCH sidebar.

   When the user clicks a disaster:

       🔥 Wildfires
       🌊 Floods
       〽 Earthquakes
       🌫️ Dust Storms
       〰 Sand Storms
       🌋 Volcanoes
       🌩️ Severe Storms

   we DON'T open a completely different HTML page.

   Instead, we keep the same dashboard and map and
   change the information displayed on it.

   This makes our application much simpler and keeps the
   UI consistent.
*/


/* =========================================================
   1. FIND HTML ELEMENTS
   ========================================================= */

const sidebar =
    document.querySelector(".sidebar");

const mobileMenu =
    document.querySelector(".mobile-menu");

const navItems =
    document.querySelectorAll(".nav-item");

const mainContent =
    document.querySelector(".main-content");

const dashboardTitle =
    document.querySelector(".dashboard-heading h2");

const dashboardDescription =
    document.querySelector(".dashboard-heading p");


/* =========================================================
   2. DISASTER CONFIGURATION
   =========================================================

   Each disaster has:

       title
       description
       emoji
       label

   Later we can also add:

       API endpoint
       marker colour
       severity rules
       data source
*/


const disasterConfig = {

    dashboard: {

        title:
            "Global Disaster Monitor",

        description:
            "Real-time monitoring of natural disasters around the world.",

        emoji:
            "🌎",

        label:
            "GLOBAL OVERVIEW"

    },


    wildfire: {

        title:
            "Wildfire Monitor",

        description:
            "Real-time monitoring of wildfire activity around the world.",

        emoji:
            "🔥",

        label:
            "WILDFIRE EVENT"

    },


    flood: {

        title:
            "Flood Monitor",

        description:
            "Monitoring flood activity and affected regions around the world.",

        emoji:
            "🌊",

        label:
            "FLOOD EVENT"

    },


    earthquake: {

        title:
            "Earthquake Monitor",

        description:
            "Monitoring earthquake activity and affected regions around the world.",

        emoji:
            "〽️",

        label:
            "EARTHQUAKE EVENT"

    },


    "dust-storm": {

        title:
            "Dust Storm Monitor",

        description:
            "Monitoring dust storm activity and affected regions.",

        emoji:
            "🌫️",

        label:
            "DUST STORM EVENT"

    },


    "sand-storm": {

        title:
            "Sand Storm Monitor",

        description:
            "Monitoring sand storm activity around the world.",

        emoji:
            "〰️",

        label:
            "SAND STORM EVENT"

    },


    volcano: {

        title:
            "Volcano Monitor",

        description:
            "Monitoring volcanic activity and related alerts.",

        emoji:
            "🌋",

        label:
            "VOLCANIC EVENT"

    },


    "severe-storm": {

        title:
            "Severe Storm Monitor",

        description:
            "Monitoring severe weather and storm activity.",

        emoji:
            "🌩️",

        label:
            "SEVERE STORM EVENT"

    },


    alerts: {

        title:
            "Disaster Alerts",

        description:
            "View important disaster alerts and high-priority events.",

        emoji:
            "🔔",

        label:
            "DISASTER ALERT"

    },


    saved: {

        title:
            "Saved Locations",

        description:
            "View your saved disaster monitoring locations.",

        emoji:
            "🔖",

        label:
            "SAVED LOCATION"

    },


    reports: {

        title:
            "Disaster Reports",

        description:
            "View disaster activity reports and information.",

        emoji:
            "📄",

        label:
            "DISASTER REPORT"

    },


    settings: {

        title:
            "Settings",

        description:
            "Manage your EMBERWATCH preferences.",

        emoji:
            "⚙️",

        label:
            "SETTINGS"

    },


    about: {

        title:
            "About EMBERWATCH",

        description:
            "Learn more about the EMBERWATCH global disaster monitoring system.",

        emoji:
            "ⓘ",

        label:
            "ABOUT EMBERWATCH"

    }

};


/* =========================================================
   3. UPDATE THE DASHBOARD
   =========================================================

   This changes:

       Page heading
       Description
       Event panel emoji
       Event panel label
       Map marker emoji
*/


function updateDisasterView(
    disasterType
) {


    /*
        Find the configuration for the selected disaster.
    */

    const disaster =
        disasterConfig[
            disasterType
        ];


    /*
        If the disaster doesn't exist in our configuration,
        stop here.
    */

    if (!disaster) {

        return;

    }


    /* =====================================================
       CHANGE DASHBOARD HEADING
       ===================================================== */

    if (dashboardTitle) {

        dashboardTitle.textContent =
            disaster.title;

    }


    /* =====================================================
       CHANGE DASHBOARD DESCRIPTION
       ===================================================== */

    if (dashboardDescription) {

        dashboardDescription.textContent =
            disaster.description;

    }


    /* =====================================================
       CHANGE EVENT PANEL LABEL
       ===================================================== */

    const eventLabel =
        document.querySelector(
            ".event-label"
        );


    if (eventLabel) {

        eventLabel.textContent =
            disaster.label;

    }


    /* =====================================================
       CHANGE EVENT PANEL ICON
       ===================================================== */

    const eventIcon =
        document.querySelector(
            ".event-icon"
        );


    if (eventIcon) {

        eventIcon.textContent =
            disaster.emoji;

    }


    /* =====================================================
       CHANGE MAP MARKERS
       =====================================================

       map.js contains the actual marker objects.

       We tell map.js:

           "Hey, the user selected a new disaster."

       map.js will then replace the 🔥 markers with the
       appropriate emoji.
    */


    /* =====================================================
   LOAD THE CORRECT DATA FOR THE SELECTED DISASTER
   ===================================================== */


/*
    WILDFIRES

    Use NASA EONET data.
*/

if (
    disasterType === "wildfire"
) {


    if (
        typeof loadWildfireMarkers ===
        "function"
    ) {

        loadWildfireMarkers();

    }

}


/*
    EARTHQUAKES

    Use USGS earthquake data.
*/

else if (
    disasterType === "earthquake"
) {


    if (
        typeof loadEarthquakeMarkers ===
        "function"
    ) {

        loadEarthquakeMarkers();

    }

}


/*
    OTHER DISASTERS

    For now we keep the existing markers and only
    change their emoji.

    Later we will replace these with real APIs.
*/

else {


    if (
        typeof updateMapMarkerIcons ===
        "function"
    ) {

        updateMapMarkerIcons(
            disaster.emoji
        );

    }

}


    /* =====================================================
       CHANGE BROWSER TAB TITLE
       ===================================================== */

    document.title =
        `EMBERWATCH | ${disaster.title}`;


    /* =====================================================
       DEVELOPMENT MESSAGE
       ===================================================== */

    console.log(
        `EMBERWATCH: ${disaster.emoji} ${disaster.title} selected.`
    );

}


/* =========================================================
   4. SIDEBAR CLICK EVENTS
   ========================================================= */

navItems.forEach(
    (item) => {


        item.addEventListener(
            "click",
            (event) => {


                /*
                    Stop href="#" from jumping to the
                    top of the page.
                */

                event.preventDefault();


                /*
                    Get the disaster name from:

                    data-disaster="flood"

                    or:

                    data-disaster="earthquake"
                */

                const disasterType =
                    item.dataset.disaster;


                /*
                    Remove active state from all items.
                */

                navItems.forEach(
                    (navItem) => {

                        navItem.classList.remove(
                            "active"
                        );

                    }
                );


                /*
                    Make the clicked item active.
                */

                item.classList.add(
                    "active"
                );


                /*
                    Change the dashboard to the selected
                    disaster.
                */

                updateDisasterView(
                    disasterType
                );


                /*
                    Close mobile sidebar after selecting
                    an item.
                */

                closeMobileSidebar();


                /*
                    Scroll main content to the top.
                */

                if (mainContent) {

                    mainContent.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });

                }

            }
        );

    }
);


/* =========================================================
   5. OPEN MOBILE SIDEBAR
   ========================================================= */

function openMobileSidebar() {

    if (!sidebar) {

        return;

    }


    sidebar.classList.add(
        "sidebar-open"
    );


    document.body.classList.add(
        "sidebar-menu-open"
    );

}


/* =========================================================
   6. CLOSE MOBILE SIDEBAR
   ========================================================= */

function closeMobileSidebar() {

    if (!sidebar) {

        return;

    }


    sidebar.classList.remove(
        "sidebar-open"
    );


    document.body.classList.remove(
        "sidebar-menu-open"
    );

}


/* =========================================================
   7. HAMBURGER BUTTON
   ========================================================= */

if (mobileMenu) {

    mobileMenu.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            openMobileSidebar();

        }
    );

}


/* =========================================================
   8. CLICK OUTSIDE SIDEBAR
   ========================================================= */

document.addEventListener(
    "click",
    (event) => {


        /*
            Only apply this behaviour on mobile/tablet.
        */

        if (
            window.innerWidth > 768
        ) {

            return;

        }


        if (
            !sidebar ||
            !sidebar.classList.contains(
                "sidebar-open"
            )
        ) {

            return;

        }


        const clickedInsideSidebar =
            sidebar.contains(
                event.target
            );


        const clickedMenuButton =
            mobileMenu &&
            mobileMenu.contains(
                event.target
            );


        if (
            !clickedInsideSidebar &&
            !clickedMenuButton
        ) {

            closeMobileSidebar();

        }

    }
);


/* =========================================================
   9. ESC KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            closeMobileSidebar();

        }

    }
);


/* =========================================================
   10. RESET MOBILE SIDEBAR ON RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth > 768
        ) {

            closeMobileSidebar();

        }

    }
);


/* =========================================================
   11. MAKE FUNCTIONS AVAILABLE
   ========================================================= */

window.openMobileSidebar =
    openMobileSidebar;

window.closeMobileSidebar =
    closeMobileSidebar;

window.updateDisasterView =
    updateDisasterView;


/* =========================================================
   END OF NAVIGATION.JS
   ========================================================= */