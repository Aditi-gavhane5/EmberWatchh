/* =========================================================
   EMBERWATCH - THEME.JS
   =========================================================

   This file controls the Dark Mode / Light Mode switch.

   Our system works like this:

       User clicks theme button
                ↓
       JavaScript detects click
                ↓
       Add/remove "light-mode"
                ↓
       CSS variables change
                ↓
       Entire website changes theme


   The actual colors are NOT stored here.

   They are stored in:

       css/variables.css

   This file only controls WHICH theme is active.
*/


/* =========================================================
   1. GET THEME BUTTON
   =========================================================

   Our HTML should contain:

       <button id="themeToggle">

   We find that button so we can listen for clicks.
*/

const themeToggle =
    document.getElementById(
        "themeToggle"
    );


/* =========================================================
   2. GET THEME ICON
   =========================================================

   Inside the button we can have an element such as:

       <span id="themeIcon">☀️</span>

   JavaScript will change this icon depending on the
   current theme.
*/

const themeIcon =
    document.getElementById(
        "themeIcon"
    );


/* =========================================================
   3. APPLY THE SAVED THEME
   =========================================================

   We use localStorage so that if the user selects Light
   Mode and then refreshes the page, their preference
   doesn't disappear.

   Example:

       User selects Light Mode
                ↓
       Save "light" in browser
                ↓
       User refreshes page
                ↓
       EMBERWATCH remembers Light Mode
*/


function applySavedTheme() {


    /*
        Ask the browser whether we previously saved a theme.
    */

    const savedTheme =
        localStorage.getItem(
            "emberwatch-theme"
        );


    /*
        If the saved theme is "light", activate light mode.
    */

    if (savedTheme === "light") {

        document.body.classList.add(
            "light-mode"
        );

        updateThemeIcon(true);

    }

    /*
        Otherwise use our default dark mode.
    */

    else {

        document.body.classList.remove(
            "light-mode"
        );

        updateThemeIcon(false);

    }

}


/* =========================================================
   4. TOGGLE THEME
   =========================================================

   This function runs whenever the user clicks the
   theme button.
*/


function toggleTheme() {


    /*
        Toggle the "light-mode" class.

        If it isn't there:
            → add it

        If it is already there:
            → remove it
    */

    const isLightMode =
        document.body.classList.toggle(
            "light-mode"
        );


    /*
        Save the user's choice.

        true  → light
        false → dark
    */

    if (isLightMode) {

        localStorage.setItem(
            "emberwatch-theme",
            "light"
        );

    }

    else {

        localStorage.setItem(
            "emberwatch-theme",
            "dark"
        );

    }


    /*
        Update the icon after switching themes.
    */

    updateThemeIcon(
        isLightMode
    );

}


/* =========================================================
   5. UPDATE THEME ICON
   =========================================================

   Dark mode:

       Show ☀️

   because clicking it will switch to Light Mode.

   Light mode:

       Show 🌙

   because clicking it will switch back to Dark Mode.
*/


function updateThemeIcon(
    isLightMode
) {


    /*
        Make sure the icon exists before trying to change it.
    */

    if (!themeIcon) {

        return;

    }


    if (isLightMode) {

        /*
            Currently in Light Mode.

            Show moon because the next action will be
            switching to Dark Mode.
        */

        themeIcon.textContent = "🌙";

    }

    else {

        /*
            Currently in Dark Mode.

            Show sun because the next action will be
            switching to Light Mode.
        */

        themeIcon.textContent = "☀️";

    }

}


/* =========================================================
   6. CONNECT BUTTON TO FUNCTION
   =========================================================

   addEventListener means:

       "When this happens, run this function."

   In our case:

       CLICK
         ↓
       toggleTheme()
*/


if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        toggleTheme
    );

}


/* =========================================================
   7. INITIALIZE THEME
   =========================================================

   Run this immediately when the JavaScript file loads.

   This checks whether the user had previously selected
   Light or Dark Mode.
*/

applySavedTheme();


/* =========================================================
   8. GLOBAL ACCESS
   =========================================================

   We expose toggleTheme so another JavaScript file can
   manually switch the theme if necessary.
*/

window.toggleTheme =
    toggleTheme;


/* =========================================================
   END OF THEME.JS
   ========================================================= */