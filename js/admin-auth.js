/* ==========================================
   GAMEVAULT ADMIN — AUTHENTICATION
   Role-based admin access

   Firebase Auth user
          ↓
   users/{user.uid}
          ↓
   role === "admin"
========================================== */

import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ==========================================
   ELEMENTS
========================================== */

const accessDenied =
    document.getElementById("accessDenied");

const adminUsername =
    document.getElementById("adminUsername");

const adminLogout =
    document.getElementById("adminLogout");


/* ==========================================
   STATE
========================================== */

let currentAdminUser = null;
let currentAdminData = null;


/* ==========================================
   AUTH READY
========================================== */

let resolveAdminReady;

let rejectAdminReady;

export const adminReady =
    new Promise((resolve, reject) => {

        resolveAdminReady = resolve;
        rejectAdminReady = reject;

    });


/* ==========================================
   SHOW ACCESS DENIED
========================================== */

function denyAccess() {

    currentAdminUser = null;
    currentAdminData = null;


    console.error(
        "GameVault Admin: ACCESS DENIED"
    );


    /* --------------------------------------
       SHOW DENIED SCREEN
    -------------------------------------- */

    if (accessDenied) {

        accessDenied.classList.add("show");

        /*
         * Force visibility.
         * This prevents CSS/HTML display rules
         * from hiding the denied screen.
         */

        accessDenied.style.display = "flex";

        accessDenied.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    /* --------------------------------------
       ADMIN USERNAME
    -------------------------------------- */

    if (adminUsername) {

        adminUsername.textContent =
            "Access Denied";

    }


    /* --------------------------------------
       DISABLE ADMIN LOGOUT
    -------------------------------------- */

    if (adminLogout) {

        adminLogout.disabled = true;

    }


    rejectAdminReady(
        new Error(
            "GameVault Admin: Access denied."
        )
    );

}


/* ==========================================
   SHOW ADMIN PAGE
========================================== */

function allowAccess(
    user,
    userData
) {

    currentAdminUser = user;
    currentAdminData = userData;


    console.log(
        "GameVault Admin: ADMIN ACCESS GRANTED"
    );


    /* --------------------------------------
       HIDE ACCESS DENIED
    -------------------------------------- */

    if (accessDenied) {

        accessDenied.classList.remove("show");

        /*
         * IMPORTANT:
         * Explicitly hide the element.
         *
         * This fixes the situation where the
         * HTML/CSS keeps the Access Denied
         * element visible even after the
         * "show" class is removed.
         */

        accessDenied.style.display = "none";

        accessDenied.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    /* --------------------------------------
       ADMIN USERNAME
    -------------------------------------- */

    if (adminUsername) {

        adminUsername.textContent =
            userData.username ||
            user.displayName ||
            user.email ||
            "Admin";

    }


    /* --------------------------------------
       ENABLE LOGOUT
    -------------------------------------- */

    if (adminLogout) {

        adminLogout.disabled = false;

    }


    /* --------------------------------------
       RESOLVE ADMIN READY
    -------------------------------------- */

    resolveAdminReady({
        user: user,
        data: userData
    });

}


/* ==========================================
   FIREBASE AUTH STATE
========================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        try {

            /* ----------------------------------
               NOT LOGGED IN
            ---------------------------------- */

            if (!user) {

                console.log(
                    "GameVault Admin: No Firebase user logged in."
                );

                denyAccess();

                return;
            }


            /* ----------------------------------
               FIREBASE USER FOUND
            ---------------------------------- */

            console.log(
                "GameVault Admin: Firebase user detected."
            );

            console.log(
                "UID:",
                user.uid
            );

            console.log(
                "Email:",
                user.email
            );


            currentAdminUser = user;


            /* ----------------------------------
               GET USERS/{UID}
            ---------------------------------- */

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            console.log(
                "GameVault Admin: Checking Firestore document:",
                `users/${user.uid}`
            );


            const userSnapshot =
                await getDoc(userRef);


            /* ----------------------------------
               DOCUMENT DOES NOT EXIST
            ---------------------------------- */

            if (!userSnapshot.exists()) {

                console.error(
                    "GameVault Admin: Firestore user document not found."
                );

                console.error(
                    "Expected document:",
                    `users/${user.uid}`
                );

                denyAccess();

                return;
            }


            /* ----------------------------------
               GET USER DATA
            ---------------------------------- */

            const userData =
                userSnapshot.data();


            console.log(
                "GameVault Admin: Firestore user data:",
                userData
            );


            /* ----------------------------------
               ROLE CHECK
            ---------------------------------- */

            if (
                userData.role !== "admin"
            ) {

                console.error(
                    "GameVault Admin: User is not an admin."
                );

                console.error(
                    "Current role:",
                    userData.role
                );

                denyAccess();

                return;
            }


            /* ----------------------------------
               ADMIN APPROVED
            ---------------------------------- */

            allowAccess(
                user,
                userData
            );


        } catch (error) {

            console.error(
                "GameVault Admin authentication error:",
                error
            );


            denyAccess();

        }

    }
);


/* ==========================================
   LOGOUT
========================================== */

adminLogout?.addEventListener(
    "click",
    async (event) => {

        event.preventDefault();


        try {

            await signOut(auth);


            window.location.href =
                "./index.html";


        } catch (error) {

            console.error(
                "Admin logout error:",
                error
            );


            alert(
                "Unable to logout.\n\n" +
                (
                    error.message ||
                    "Unknown error."
                )
            );

        }

    }
);


/* ==========================================
   EXPORTS
========================================== */

export {
    currentAdminUser,
    currentAdminData
};