import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ==========================================
   ELEMENTS
========================================== */

const settingsForm =
    document.getElementById("coinSettingsForm");

const saveSettingsButton =
    document.getElementById("saveCoinSettings");

const configureSettingsButton =
    document.getElementById("configureCoinSettings");

const settingsModal =
    document.getElementById("coinSettingsModal");

const closeSettingsButton =
    document.getElementById("closeCoinSettings");


const coinsEnabled =
    document.getElementById("coinsEnabled");

const accountCreationCoins =
    document.getElementById("accountCreationCoins");

const firstPurchaseCoins =
    document.getElementById("firstPurchaseCoins");

const dailyLoginMin =
    document.getElementById("dailyLoginMin");

const dailyLoginMax =
    document.getElementById("dailyLoginMax");

/*
   NEW:
   Admin controlled Fast Coin conversion rate.

   Example:
   coinsPerRupee = 10

   Means:
   ₹1 = 10 Fast Coins
*/
const coinsPerRupee =
    document.getElementById("coinsPerRupee");


/* ==========================================
   PROMOTION ELEMENTS
========================================== */

const createPromotionButton =
    document.getElementById("createPromotion");

const promotionModal =
    document.getElementById("promotionModal");

const closePromotionButton =
    document.getElementById("closePromotion");

const promotionForm =
    document.getElementById("promotionForm");

const promotionModalTitle =
    document.getElementById("promotionModalTitle");

const promotionCode =
    document.getElementById("promotionCode");

const promotionCoinReward =
    document.getElementById("promotionCoinReward");

const promotionMaxRedemptions =
    document.getElementById("promotionMaxRedemptions");

const promotionStartAt =
    document.getElementById("promotionStartAt");

const promotionEndAt =
    document.getElementById("promotionEndAt");

const promotionActive =
    document.getElementById("promotionActive");

const promotionTableBody =
    document.getElementById("promotionTableBody");


/* ==========================================
   CONSTANTS
========================================== */

const SETTINGS_PATH = [
    "coinSettings",
    "config"
];


const DEFAULT_SETTINGS = {
    coinsEnabled: true,
    accountCreationCoins: 100,
    firstPurchaseCoins: 250,
    dailyLoginMin: 10,
    dailyLoginMax: 50,

    /*
       NEW:
       Default Fast Coin conversion.

       ₹1 = 10 Fast Coins
    */
    coinsPerRupee: 10
};


/* ==========================================
   STATE
========================================== */

let settingsLoaded = false;
let savingSettings = false;

let promotionsLoaded = false;
let savingPromotion = false;

let editingPromotionId = null;


/* ==========================================
   FIRESTORE REFERENCES
========================================== */

const settingsRef = doc(
    db,
    SETTINGS_PATH[0],
    SETTINGS_PATH[1]
);

const promotionsRef = collection(
    db,
    "coinPromotions"
);


/* ==========================================
   LOAD COIN SETTINGS
========================================== */

async function loadCoinSettings() {

    try {

        const snapshot =
            await getDoc(settingsRef);


        /* --------------------------------------
           SETTINGS DO NOT EXIST
        -------------------------------------- */

        if (!snapshot.exists()) {

            fillSettingsForm(
                DEFAULT_SETTINGS
            );

            settingsLoaded = true;

            return;
        }


        /* --------------------------------------
           SETTINGS FOUND
        -------------------------------------- */

        const data =
            snapshot.data();


        const settings = {

            coinsEnabled:
                data.coinsEnabled ??
                DEFAULT_SETTINGS.coinsEnabled,

            accountCreationCoins:
                Number(
                    data.accountCreationCoins
                ),

            firstPurchaseCoins:
                Number(
                    data.firstPurchaseCoins
                ),

            dailyLoginMin:
                Number(
                    data.dailyLoginMin
                ),

            dailyLoginMax:
                Number(
                    data.dailyLoginMax
                ),

            /*
               NEW:
               Read Admin conversion rate.
            */
            coinsPerRupee:
                Number(
                    data.coinsPerRupee
                )

        };


        /* --------------------------------------
           VALIDATE ACCOUNT CREATION COINS
        -------------------------------------- */

        if (
            !Number.isFinite(
                settings.accountCreationCoins
            )
        ) {

            settings.accountCreationCoins =
                DEFAULT_SETTINGS.accountCreationCoins;

        }


        /* --------------------------------------
           VALIDATE FIRST PURCHASE COINS
        -------------------------------------- */

        if (
            !Number.isFinite(
                settings.firstPurchaseCoins
            )
        ) {

            settings.firstPurchaseCoins =
                DEFAULT_SETTINGS.firstPurchaseCoins;

        }


        /* --------------------------------------
           VALIDATE DAILY LOGIN MIN
        -------------------------------------- */

        if (
            !Number.isFinite(
                settings.dailyLoginMin
            )
        ) {

            settings.dailyLoginMin =
                DEFAULT_SETTINGS.dailyLoginMin;

        }


        /* --------------------------------------
           VALIDATE DAILY LOGIN MAX
        -------------------------------------- */

        if (
            !Number.isFinite(
                settings.dailyLoginMax
            )
        ) {

            settings.dailyLoginMax =
                DEFAULT_SETTINGS.dailyLoginMax;

        }


        /* --------------------------------------
           VALIDATE FAST COIN CONVERSION
        -------------------------------------- */

        if (
            !Number.isFinite(
                settings.coinsPerRupee
            ) ||
            settings.coinsPerRupee <= 0
        ) {

            settings.coinsPerRupee =
                DEFAULT_SETTINGS.coinsPerRupee;

        }


        fillSettingsForm(settings);

        settingsLoaded = true;


    } catch (error) {

        console.error(
            "Failed to load Fast Coins settings:",
            error
        );


        showNotification(
            "Unable to load Fast Coins settings.",
            "error"
        );

    }

}


/* ==========================================
   FILL SETTINGS FORM
========================================== */

function fillSettingsForm(settings) {

    if (coinsEnabled) {

        coinsEnabled.checked =
            Boolean(
                settings.coinsEnabled
            );

    }


    if (accountCreationCoins) {

        accountCreationCoins.value =
            settings.accountCreationCoins;

    }


    if (firstPurchaseCoins) {

        firstPurchaseCoins.value =
            settings.firstPurchaseCoins;

    }


    if (dailyLoginMin) {

        dailyLoginMin.value =
            settings.dailyLoginMin;

    }


    if (dailyLoginMax) {

        dailyLoginMax.value =
            settings.dailyLoginMax;

    }


    /*
       NEW:
       Fill Fast Coin conversion rate.
    */

    if (coinsPerRupee) {

        coinsPerRupee.value =
            settings.coinsPerRupee;

    }

}


/* ==========================================
   OPEN SETTINGS MODAL
========================================== */

function openSettingsModal() {

    if (!settingsModal) {
        return;
    }


    settingsModal.classList.add("active");

    settingsModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "admin-modal-open"
    );

}


/* ==========================================
   CLOSE SETTINGS MODAL
========================================== */

function closeSettingsModal() {

    if (!settingsModal) {
        return;
    }


    settingsModal.classList.remove(
        "active"
    );

    settingsModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "admin-modal-open"
    );

}


/* ==========================================
   SETTINGS BUTTON
========================================== */

configureSettingsButton?.addEventListener(
    "click",
    () => {

        if (!settingsLoaded) {

            showNotification(
                "Coin settings are still loading.",
                "error"
            );

            return;
        }


        openSettingsModal();

    }
);


/* ==========================================
   CLOSE SETTINGS
========================================== */

closeSettingsButton?.addEventListener(
    "click",
    closeSettingsModal
);


/* ==========================================
   CLOSE MODAL ON BACKDROP CLICK
========================================== */

settingsModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            settingsModal
        ) {

            closeSettingsModal();

        }

    }
);


/* ==========================================
   READ SETTINGS FORM
========================================== */

function getSettingsFormData() {

    return {

        coinsEnabled:
            Boolean(
                coinsEnabled?.checked
            ),

        accountCreationCoins:
            Number(
                accountCreationCoins?.value
            ),

        firstPurchaseCoins:
            Number(
                firstPurchaseCoins?.value
            ),

        dailyLoginMin:
            Number(
                dailyLoginMin?.value
            ),

        dailyLoginMax:
            Number(
                dailyLoginMax?.value
            ),

        /*
           NEW:
           Read Admin conversion rate.
        */
        coinsPerRupee:
            Number(
                coinsPerRupee?.value
            )

    };

}


/* ==========================================
   VALIDATE SETTINGS
========================================== */

function validateSettings(settings) {

    if (
        !Number.isInteger(
            settings.accountCreationCoins
        ) ||
        settings.accountCreationCoins < 0
    ) {

        return (
            "Account creation coins must be a whole number of 0 or more."
        );

    }


    if (
        !Number.isInteger(
            settings.firstPurchaseCoins
        ) ||
        settings.firstPurchaseCoins < 0
    ) {

        return (
            "First purchase coins must be a whole number of 0 or more."
        );

    }


    if (
        !Number.isInteger(
            settings.dailyLoginMin
        ) ||
        settings.dailyLoginMin < 0
    ) {

        return (
            "Daily login minimum must be a whole number of 0 or more."
        );

    }


    if (
        !Number.isInteger(
            settings.dailyLoginMax
        ) ||
        settings.dailyLoginMax < 0
    ) {

        return (
            "Daily login maximum must be a whole number of 0 or more."
        );

    }


    if (
        settings.dailyLoginMin >
        settings.dailyLoginMax
    ) {

        return (
            "Daily login minimum cannot be greater than maximum."
        );

    }


    /*
       NEW:
       Validate Fast Coin conversion.

       We require a positive whole number.

       Examples:
       1
       5
       10
       20
       100
    */

    if (
        !Number.isInteger(
            settings.coinsPerRupee
        ) ||
        settings.coinsPerRupee <= 0
    ) {

        return (
            "Fast Coin conversion must be a whole number greater than 0."
        );

    }


    return null;

}


/* ==========================================
   SAVE COIN SETTINGS
========================================== */

async function saveCoinSettings() {

    if (savingSettings) {
        return;
    }


    const settings =
        getSettingsFormData();


    /*
       If the new HTML field hasn't been added yet,
       use the existing/default value rather than
       accidentally saving NaN.
    */

    if (
        !coinsPerRupee &&
        !Number.isFinite(
            settings.coinsPerRupee
        )
    ) {

        settings.coinsPerRupee =
            DEFAULT_SETTINGS.coinsPerRupee;

    }


    const validationError =
        validateSettings(settings);


    if (validationError) {

        showNotification(
            validationError,
            "error"
        );

        return;
    }


    savingSettings = true;


    const originalText =
        saveSettingsButton?.innerHTML ||
        "Save Coin Settings";


    if (saveSettingsButton) {

        saveSettingsButton.disabled =
            true;

        saveSettingsButton.innerHTML =
            "Saving...";

    }


    try {

        await setDoc(
            settingsRef,
            {
                ...settings,

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        settingsLoaded = true;


        showNotification(
            "Fast Coins settings saved successfully.",
            "success"
        );


        closeSettingsModal();


    } catch (error) {

        console.error(
            "Failed to save Fast Coins settings:",
            error
        );


        if (
            error.code ===
            "permission-denied"
        ) {

            showNotification(
                "You do not have permission to change Fast Coins settings.",
                "error"
            );

        } else {

            showNotification(
                "Failed to save Fast Coins settings. Please try again.",
                "error"
            );

        }

    } finally {

        savingSettings = false;


        if (saveSettingsButton) {

            saveSettingsButton.disabled =
                false;

            saveSettingsButton.innerHTML =
                originalText;

        }

    }

}


/* ==========================================
   SETTINGS FORM SUBMIT
========================================== */

settingsForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        await saveCoinSettings();

    }
);


/* ==========================================
   LOAD PROMOTIONS
========================================== */

async function loadPromotions() {

    if (!promotionTableBody) {
        return;
    }


    promotionTableBody.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="admin-table-empty"
            >
                Loading promotions...
            </td>
        </tr>
    `;


    try {

        const snapshot =
            await getDocs(
                promotionsRef
            );


        const promotions = [];


        snapshot.forEach(
            promotionSnapshot => {

                promotions.push({

                    id:
                        promotionSnapshot.id,

                    ...promotionSnapshot.data()

                });

            }
        );


        /* --------------------------------------
           SORT BY START DATE
        -------------------------------------- */

        promotions.sort(
            (a, b) => {

                const aDate =
                    getDateValue(
                        a.startAt
                    );

                const bDate =
                    getDateValue(
                        b.startAt
                    );

                return bDate - aDate;

            }
        );


        renderPromotions(
            promotions
        );


        promotionsLoaded = true;


    } catch (error) {

        console.error(
            "Failed to load promotions:",
            error
        );


        promotionTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="admin-table-empty"
                >
                    Unable to load promotions.
                </td>
            </tr>
        `;


        if (
            error.code ===
            "permission-denied"
        ) {

            showNotification(
                "You do not have permission to view promotions.",
                "error"
            );

        } else {

            showNotification(
                "Unable to load promotions.",
                "error"
            );

        }

    }

}


/* ==========================================
   RENDER PROMOTIONS
========================================== */

function renderPromotions(
    promotions
) {

    if (!promotionTableBody) {
        return;
    }


    if (!promotions.length) {

        promotionTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="admin-table-empty"
                >
                    No special promotions found.
                </td>
            </tr>
        `;

        return;
    }


    promotionTableBody.innerHTML =
        promotions
            .map(
                promotion =>
                    createPromotionRow(
                        promotion
                    )
            )
            .join("");


    attachPromotionActions();

}


/* ==========================================
   CREATE PROMOTION ROW
========================================== */

function createPromotionRow(
    promotion
) {

    const code =
        escapeHtml(
            promotion.redeemCode ||
            "—"
        );


    const validity =
        formatValidity(
            promotion.startAt,
            promotion.endAt
        );


    const maxRedemptions =
        Number(
            promotion.maxRedemptions
        ) || 0;


    const currentRedemptions =
        Number(
            promotion.currentRedemptions
        ) || 0;


    const redemptionLeft =
        Math.max(
            0,
            maxRedemptions -
            currentRedemptions
        );


    const coinReward =
        Number(
            promotion.coinReward
        ) || 0;


    const active =
        promotion.active !== false;


    return `
        <tr>

            <td>

                <strong class="promotion-code">
                    ${code}
                </strong>

                ${
                    active
                        ? `
                            <span class="promotion-status active">
                                Active
                            </span>
                        `
                        : `
                            <span class="promotion-status inactive">
                                Inactive
                            </span>
                        `
                }

            </td>


            <td>
                ${validity}
            </td>


            <td>
                ${redemptionLeft.toLocaleString()}
            </td>


            <td>
                <strong>
                    ${coinReward.toLocaleString()} 🪙
                </strong>
            </td>


            <td>

                <div class="promotion-actions">

                    <button
                        type="button"
                        class="admin-secondary-btn promotion-edit-btn"
                        data-id="${promotion.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="admin-secondary-btn promotion-delete-btn"
                        data-id="${promotion.id}"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/* ==========================================
   PROMOTION ACTIONS
========================================== */

function attachPromotionActions() {

    document
        .querySelectorAll(
            ".promotion-edit-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    editPromotion(id);

                }
            );

        });


    document
        .querySelectorAll(
            ".promotion-delete-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    deletePromotion(id);

                }
            );

        });

}


/* ==========================================
   OPEN CREATE PROMOTION
========================================== */

createPromotionButton?.addEventListener(
    "click",
    () => {

        openCreatePromotion();

    }
);


/* ==========================================
   OPEN CREATE FORM
========================================== */

function openCreatePromotion() {

    editingPromotionId = null;


    if (promotionModalTitle) {

        promotionModalTitle.textContent =
            "Create Promotion";

    }


    promotionForm?.reset();


    if (promotionActive) {

        promotionActive.checked =
            true;

    }


    if (promotionModal) {

        promotionModal.classList.add(
            "active"
        );

        promotionModal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    document.body.classList.add(
        "admin-modal-open"
    );


    setTimeout(
        () => {

            promotionCode?.focus();

        },
        100
    );

}


/* ==========================================
   CLOSE PROMOTION
========================================== */

function closePromotionModal() {

    if (!promotionModal) {
        return;
    }


    promotionModal.classList.remove(
        "active"
    );

    promotionModal.setAttribute(
        "aria-hidden",
        "true"
    );


    editingPromotionId = null;


    document.body.classList.remove(
        "admin-modal-open"
    );

}


closePromotionButton?.addEventListener(
    "click",
    closePromotionModal
);


promotionModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            promotionModal
        ) {

            closePromotionModal();

        }

    }
);


/* ==========================================
   EDIT PROMOTION
========================================== */

async function editPromotion(
    promotionId
) {

    try {

        const promotionRef =
            doc(
                db,
                "coinPromotions",
                promotionId
            );


        const snapshot =
            await getDoc(
                promotionRef
            );


        if (!snapshot.exists()) {

            showNotification(
                "Promotion no longer exists.",
                "error"
            );

            await loadPromotions();

            return;

        }


        const data =
            snapshot.data();


        editingPromotionId =
            promotionId;


        if (promotionModalTitle) {

            promotionModalTitle.textContent =
                "Edit Promotion";

        }


        if (promotionCode) {

            promotionCode.value =
                data.redeemCode ||
                "";

        }


        if (promotionCoinReward) {

            promotionCoinReward.value =
                Number(
                    data.coinReward
                ) || 0;

        }


        if (promotionMaxRedemptions) {

            promotionMaxRedemptions.value =
                Number(
                    data.maxRedemptions
                ) || 0;

        }


        if (promotionStartAt) {

            promotionStartAt.value =
                timestampToInputValue(
                    data.startAt
                );

        }


        if (promotionEndAt) {

            promotionEndAt.value =
                timestampToInputValue(
                    data.endAt
                );

        }


        if (promotionActive) {

            promotionActive.checked =
                data.active !== false;

        }


        if (promotionModal) {

            promotionModal.classList.add(
                "active"
            );

            promotionModal.setAttribute(
                "aria-hidden",
                "false"
            );

        }


        document.body.classList.add(
            "admin-modal-open"
        );


    } catch (error) {

        console.error(
            "Failed to load promotion:",
            error
        );


        showNotification(
            "Unable to open this promotion.",
            "error"
        );

    }

}


/* ==========================================
   READ PROMOTION FORM
========================================== */

function getPromotionFormData() {

    return {

        redeemCode:
            promotionCode?.value
                .trim()
                .toUpperCase() || "",

        coinReward:
            Number(
                promotionCoinReward?.value
            ),

        maxRedemptions:
            Number(
                promotionMaxRedemptions?.value
            ),

        startAt:
            promotionStartAt?.value || "",

        endAt:
            promotionEndAt?.value || "",

        active:
            Boolean(
                promotionActive?.checked
            )

    };

}


/* ==========================================
   VALIDATE PROMOTION
========================================== */

function validatePromotion(
    promotion
) {

    if (
        !promotion.redeemCode
    ) {

        return (
            "Please enter a promotion code."
        );

    }


    if (
        promotion.redeemCode.length <
        3
    ) {

        return (
            "Promotion code must contain at least 3 characters."
        );

    }


    if (
        !Number.isInteger(
            promotion.coinReward
        ) ||
        promotion.coinReward <= 0
    ) {

        return (
            "Coin reward must be a whole number greater than 0."
        );

    }


    if (
        !Number.isInteger(
            promotion.maxRedemptions
        ) ||
        promotion.maxRedemptions <= 0
    ) {

        return (
            "Maximum redemptions must be a whole number greater than 0."
        );

    }


    if (
        !promotion.startAt
    ) {

        return (
            "Please select a start date."
        );

    }


    if (
        !promotion.endAt
    ) {

        return (
            "Please select an end date."
        );

    }


    const startDate =
        new Date(
            promotion.startAt
        );

    const endDate =
        new Date(
            promotion.endAt
        );


    if (
        Number.isNaN(
            startDate.getTime()
        ) ||
        Number.isNaN(
            endDate.getTime()
        )
    ) {

        return (
            "Please enter valid promotion dates."
        );

    }


    if (
        endDate <= startDate
    ) {

        return (
            "End date must be later than start date."
        );

    }


    return null;

}


/* ==========================================
   SAVE PROMOTION
========================================== */

async function savePromotion() {

    if (savingPromotion) {
        return;
    }


    const promotion =
        getPromotionFormData();


    const validationError =
        validatePromotion(
            promotion
        );


    if (validationError) {

        showNotification(
            validationError,
            "error"
        );

        return;

    }


    savingPromotion = true;


    const saveButton =
        document.getElementById(
            "savePromotion"
        );


    const originalText =
        saveButton?.innerHTML ||
        "Save Promotion";


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.innerHTML =
            "Saving...";

    }


    try {

        /* --------------------------------------
           CHECK DUPLICATE CODE
        -------------------------------------- */

        const promotionsSnapshot =
            await getDocs(
                promotionsRef
            );


        const duplicate =
            promotionsSnapshot.docs.find(
                promotionSnapshot => {

                    if (
                        promotionSnapshot.id ===
                        editingPromotionId
                    ) {
                        return false;
                    }


                    const data =
                        promotionSnapshot.data();


                    return (
                        String(
                            data.redeemCode || ""
                        )
                            .trim()
                            .toUpperCase() ===
                        promotion.redeemCode
                    );

                }
            );


        if (duplicate) {

            showNotification(
                "A promotion with this code already exists.",
                "error"
            );

            return;

        }


        const startDate =
            new Date(
                promotion.startAt
            );

        const endDate =
            new Date(
                promotion.endAt
            );


        const promotionData = {

            redeemCode:
                promotion.redeemCode,

            coinReward:
                promotion.coinReward,

            maxRedemptions:
                promotion.maxRedemptions,

            startAt:
                startDate,

            endAt:
                endDate,

            active:
                promotion.active,

            updatedAt:
                serverTimestamp()

        };


        /* --------------------------------------
           CREATE
        -------------------------------------- */

        if (!editingPromotionId) {

            await addDoc(
                promotionsRef,
                {

                    ...promotionData,

                    currentRedemptions:
                        0,

                    createdAt:
                        serverTimestamp()

                }
            );


            showNotification(
                "Promotion created successfully.",
                "success"
            );

        }


        /* --------------------------------------
           UPDATE
        -------------------------------------- */

        else {

            const promotionRef =
                doc(
                    db,
                    "coinPromotions",
                    editingPromotionId
                );


            await updateDoc(
                promotionRef,
                promotionData
            );


            showNotification(
                "Promotion updated successfully.",
                "success"
            );

        }


        closePromotionModal();

        await loadPromotions();


    } catch (error) {

        console.error(
            "Failed to save promotion:",
            error
        );


        if (
            error.code ===
            "permission-denied"
        ) {

            showNotification(
                "You do not have permission to save promotions.",
                "error"
            );

        } else {

            showNotification(
                "Failed to save promotion. Please try again.",
                "error"
            );

        }

    } finally {

        savingPromotion = false;


        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                originalText;

        }

    }

}


/* ==========================================
   PROMOTION FORM SUBMIT
========================================== */

promotionForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        await savePromotion();

    }
);


/* ==========================================
   DELETE PROMOTION
========================================== */

async function deletePromotion(
    promotionId
) {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this promotion?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const promotionRef =
            doc(
                db,
                "coinPromotions",
                promotionId
            );


        await deleteDoc(
            promotionRef
        );


        showNotification(
            "Promotion deleted successfully.",
            "success"
        );


        await loadPromotions();


    } catch (error) {

        console.error(
            "Failed to delete promotion:",
            error
        );


        if (
            error.code ===
            "permission-denied"
        ) {

            showNotification(
                "You do not have permission to delete promotions.",
                "error"
            );

        } else {

            showNotification(
                "Failed to delete promotion.",
                "error"
            );

        }

    }

}


/* ==========================================
   FORMAT VALIDITY
========================================== */

function formatValidity(
    startAt,
    endAt
) {

    const start =
        getDateValue(
            startAt
        );

    const end =
        getDateValue(
            endAt
        );


    if (
        !start &&
        !end
    ) {

        return "—";

    }


    const formatter =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    if (
        start &&
        end
    ) {

        return `
            ${formatter.format(start)}
            –
            ${formatter.format(end)}
        `;

    }


    if (start) {

        return `
            ${formatter.format(start)}
            –
            No expiry
        `;

    }


    return `
        Until
        ${formatter.format(end)}
    `;

}


/* ==========================================
   DATE VALUE
========================================== */

function getDateValue(
    value
) {

    if (!value) {
        return 0;
    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        value instanceof Date
    ) {

        return value;

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return 0;

    }


    return date;

}


/* ==========================================
   TIMESTAMP TO INPUT
========================================== */

function timestampToInputValue(
    value
) {

    const date =
        getDateValue(value);


    if (!date) {
        return "";
    }


    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );

    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );

    const hours =
        String(
            date.getHours()
        )
            .padStart(
                2,
                "0"
            );

    const minutes =
        String(
            date.getMinutes()
        )
            .padStart(
                2,
                "0"
            );


    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}`
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ==========================================
   WEBSITE / ADMIN NOTIFICATION
========================================== */

function showNotification(
    message,
    type = "success"
) {

    let notification =
        document.getElementById(
            "adminNotification"
        );


    /* --------------------------------------
       CREATE
    -------------------------------------- */

    if (!notification) {

        notification =
            document.createElement(
                "div"
            );

        notification.id =
            "adminNotification";

        document.body.appendChild(
            notification
        );

    }


    /* --------------------------------------
       CONTENT
    -------------------------------------- */

    notification.className =
        `admin-notification ${type}`;

    notification.textContent =
        message;


    /* --------------------------------------
       SHOW
    -------------------------------------- */

    requestAnimationFrame(
        () => {

            notification.classList.add(
                "show"
            );

        }
    );


    /* --------------------------------------
       AUTO HIDE
    -------------------------------------- */

    clearTimeout(
        notification._hideTimer
    );


    notification._hideTimer =
        setTimeout(
            () => {

                notification.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* ==========================================
   AUTH STATE
========================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            console.error(
                "Fast Coins Admin: No authenticated user."
            );

            return;

        }


        try {

            await loadCoinSettings();

            await loadPromotions();


        } catch (error) {

            console.error(
                "Fast Coins Admin initialization error:",
                error
            );

        }

    }
);


/* ==========================================
   INITIAL STATE
========================================== */

if (saveSettingsButton) {

    saveSettingsButton.disabled =
        true;

}


if (settingsLoaded) {

    saveSettingsButton.disabled =
        false;

}


/* ==========================================
   SETTINGS READY
========================================== */

const settingsReadyInterval =
    setInterval(
        () => {

            if (
                settingsLoaded
            ) {

                if (
                    saveSettingsButton
                ) {

                    saveSettingsButton.disabled =
                        false;

                }


                clearInterval(
                    settingsReadyInterval
                );

            }

        },
        100
    );


/* ==========================================
   ESC KEY
========================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }


        if (
            settingsModal?.classList.contains(
                "active"
            )
        ) {

            closeSettingsModal();

        }


        if (
            promotionModal?.classList.contains(
                "active"
            )
        ) {

            closePromotionModal();

        }

    }
);


/* ==========================================
   CLEANUP
========================================== */

window.addEventListener(
    "beforeunload",
    () => {

        clearInterval(
            settingsReadyInterval
        );

    }
);