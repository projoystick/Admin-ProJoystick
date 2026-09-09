/* ==========================================
   PROJOYSTICK ADMIN — DASHBOARD
   Dashboard statistics only
========================================== */

import {
    db
} from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ==========================================
   ELEMENT HELPER
========================================== */

function getElement(id) {

    return document.getElementById(id);

}


/* ==========================================
   LOAD DASHBOARD
========================================== */

async function loadDashboard() {

    try {

        /* ==================================
           LOAD ALL STATISTICS
        ================================== */

        const [
            games,
            products,
            orders,
            users
        ] = await Promise.all([


            /* ==============================
               GAMES
            ============================== */

            getDocs(
                collection(
                    db,
                    "games"
                )
            ),


            /* ==============================
               PRODUCTS
            ============================== */

            getDocs(
                collection(
                    db,
                    "products"
                )
            ),


            /* ==============================
               ORDERS
            ============================== */

            getDocs(
                collection(
                    db,
                    "orders"
                )
            ).catch(
                () => null
            ),


            /* ==============================
               USERS
            ============================== */

            getDocs(
                collection(
                    db,
                    "users"
                )
            )

        ]);


        /* ==================================
           TOTAL GAMES
        ================================== */

        const totalGames =
            getElement(
                "totalGames"
            );

        if (totalGames) {

            totalGames.textContent =
                games.size;

        }


        /* ==================================
           TOTAL PRODUCTS
        ================================== */

        const totalProducts =
            getElement(
                "totalProducts"
            );

        if (totalProducts) {

            totalProducts.textContent =
                products.size;

        }


        /* ==================================
           TOTAL ORDERS
        ================================== */

        const totalOrders =
            getElement(
                "totalOrders"
            );

        if (totalOrders) {

            totalOrders.textContent =
                orders?.size ||
                0;

        }


        /* ==================================
           TOTAL USERS
        ================================== */

        const totalUsers =
            getElement(
                "totalUsers"
            );

        if (totalUsers) {

            totalUsers.textContent =
                users.size;

        }


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


/* ==========================================
   START DASHBOARD
========================================== */

loadDashboard();


/* ==========================================
   EXPORT
========================================== */

export {
    loadDashboard
};