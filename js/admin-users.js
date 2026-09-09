/* ==========================================
   PROJOYSTICK ADMIN — USERS
========================================== */

import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ==========================================
   DOM ELEMENTS
========================================== */

const usersTableBody =
    document.getElementById("usersTableBody");

const usersLoading =
    document.getElementById("usersLoading");

const totalUsersElement =
    document.getElementById("totalUsers");

const activeUsersElement =
    document.getElementById("activeUsers");

const disabledUsersElement =
    document.getElementById("disabledUsers");


const userModal =
    document.getElementById("userModal");

const closeUserModal =
    document.getElementById("closeUserModal");

const cancelUser =
    document.getElementById("cancelUser");


const viewUserId =
    document.getElementById("viewUserId");

const viewUserName =
    document.getElementById("viewUserName");

const viewUserEmail =
    document.getElementById("viewUserEmail");

const viewUserRole =
    document.getElementById("viewUserRole");

const viewUserStatus =
    document.getElementById("viewUserStatus");


/* ==========================================
   CACHE
========================================== */

let usersCache = [];


/* ==========================================
   HELPERS
========================================== */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================
   FORMAT DATE
========================================== */

function formatDate(timestamp) {

    if (!timestamp) {
        return "—";
    }

    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch {

        return "—";
    }
}


/* ==========================================
   USER STATUS
========================================== */

function isUserActive(user) {

    if (user.active === false) {
        return false;
    }

    if (user.disabled === true) {
        return false;
    }

    if (user.status === "disabled") {
        return false;
    }

    if (user.status === "inactive") {
        return false;
    }

    return true;
}


/* ==========================================
   LOAD USERS
========================================== */

async function loadUsers() {

    if (!usersTableBody) {
        return;
    }

    usersLoading.style.display = "block";

    usersTableBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="admin-table-empty"
            >
                Loading users...
            </td>
        </tr>
    `;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        usersCache =
            snapshot.docs.map(
                doc => ({
                    id: doc.id,
                    ...doc.data()
                })
            );


        renderUsers();


    } catch (error) {

        console.error(
            "Failed to load users:",
            error
        );

        usersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="admin-table-empty"
                >
                    Failed to load users.
                </td>
            </tr>
        `;

    } finally {

        usersLoading.style.display = "none";

    }
}


/* ==========================================
   RENDER USERS
========================================== */

function renderUsers() {

    if (!usersTableBody) {
        return;
    }


    const total =
        usersCache.length;


    const active =
        usersCache.filter(
            isUserActive
        ).length;


    const disabled =
        total - active;


    totalUsersElement.textContent =
        total;

    activeUsersElement.textContent =
        active;

    disabledUsersElement.textContent =
        disabled;


    if (usersCache.length === 0) {

        usersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="admin-table-empty"
                >
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    usersTableBody.innerHTML =
        usersCache.map(
            user => {

                const active =
                    isUserActive(user);


                const name =
                    user.displayName ||
                    user.name ||
                    user.username ||
                    "Unknown User";


                const email =
                    user.email ||
                    "—";


                const role =
                    user.role ||
                    "customer";


                const joined =
                    formatDate(
                        user.createdAt ||
                        user.created_at ||
                        user.joinedAt
                    );


                return `
                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                        </td>


                        <td>
                            ${escapeHTML(email)}
                        </td>


                        <td>
                            ${escapeHTML(role)}
                        </td>


                        <td>
                            ${joined}
                        </td>


                        <td>

                            <span
                                class="admin-status ${
                                    active
                                        ? "active"
                                        : "inactive"
                                }"
                            >
                                ${
                                    active
                                        ? "Active"
                                        : "Disabled"
                                }
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="admin-secondary-btn"
                                data-view-user="${escapeHTML(user.id)}"
                            >
                                View
                            </button>

                        </td>

                    </tr>
                `;

            }
        ).join("");
}


/* ==========================================
   OPEN USER MODAL
========================================== */

function openUserModal(user) {

    if (!userModal) {
        return;
    }


    const name =
        user.displayName ||
        user.name ||
        user.username ||
        "Unknown User";


    const email =
        user.email ||
        "—";


    const role =
        user.role ||
        "customer";


    const active =
        isUserActive(user);


    viewUserId.value =
        user.id || "—";

    viewUserName.value =
        name;

    viewUserEmail.value =
        email;

    viewUserRole.value =
        role;

    viewUserStatus.value =
        active
            ? "Active"
            : "Disabled";


    userModal.classList.add("active");

    userModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );
}


/* ==========================================
   CLOSE USER MODAL
========================================== */

function closeModal() {

    if (!userModal) {
        return;
    }

    userModal.classList.remove(
        "active"
    );

    userModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );
}


/* ==========================================
   USER TABLE ACTIONS
========================================== */

usersTableBody?.addEventListener(
    "click",
    event => {

        const viewButton =
            event.target.closest(
                "[data-view-user]"
            );


        if (!viewButton) {
            return;
        }


        const user =
            usersCache.find(
                item =>
                    item.id ===
                    viewButton.dataset.viewUser
            );


        if (user) {
            openUserModal(user);
        }

    }
);


/* ==========================================
   MODAL EVENTS
========================================== */

closeUserModal?.addEventListener(
    "click",
    closeModal
);


cancelUser?.addEventListener(
    "click",
    closeModal
);


userModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            userModal
        ) {
            closeModal();
        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            userModal?.classList.contains("active")
        ) {
            closeModal();
        }

    }
);


/* ==========================================
   AUTH
========================================== */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {
            return;
        }

        loadUsers();

    }
);