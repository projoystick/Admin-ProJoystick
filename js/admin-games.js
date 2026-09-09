/* ==========================================
   GAMEVAULT ADMIN — GAMES
   Games management only

   Authentication is handled by:
   ./admin-auth.js
========================================== */

import {
    db
} from "./firebase.js";

import {
    adminReady
} from "./admin-auth.js";

import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ==========================================
   HELPERS
========================================== */

const $ = (id) =>
    document.getElementById(id);


/* ==========================================
   ELEMENTS
========================================== */

const addGameBtn =
    $("addGameBtn");

const gamesTableBody =
    $("gamesTableBody");

const gamesLoading =
    $("gamesLoading");

const gameModal =
    $("gameModal");

const closeGameModal =
    $("closeGameModal");

const cancelGame =
    $("cancelGame");

const gameForm =
    $("gameForm");

const addDeliveryFieldBtn =
    $("addDeliveryFieldBtn");

const deliveryFieldsContainer =
    $("deliveryFieldsContainer");


/* ==========================================
   STATE
========================================== */

let gamesCache = [];


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================
   ERROR
========================================== */

function showError(message) {

    console.error(
        "GameVault Games:",
        message
    );

    alert(
        "Something went wrong.\n\n" +
        (message || "Unknown error.")
    );

}


/* ==========================================
   SUCCESS
========================================== */

function showSuccess(message) {

    const oldToast =
        document.querySelector(
            ".admin-toast"
        );

    if (oldToast) {
        oldToast.remove();
    }

    const toast =
        document.createElement("div");

    toast.className =
        "admin-toast";

    toast.setAttribute(
        "role",
        "status"
    );

    toast.textContent =
        message;

    document.body.appendChild(
        toast
    );

    setTimeout(() => {

        toast.classList.add(
            "hide"
        );

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 2500);

}


/* ==========================================
   LOAD GAMES
   UNCHANGED
========================================== */

async function loadGames() {

    if (!gamesTableBody) {
        return;
    }

    try {

        if (gamesLoading) {

            gamesLoading.style.display =
                "block";

            gamesLoading.textContent =
                "Loading games...";

        }

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "games"
                )
            );

        gamesCache =
            snapshot.docs.map(
                (gameDoc) => ({

                    id:
                        gameDoc.id,

                    ...gameDoc.data()

                })
            );

        renderGames();

        if (gamesLoading) {

            gamesLoading.style.display =
                "none";

        }

    } catch (error) {

        console.error(
            "Games loading error:",
            error
        );

        if (gamesLoading) {

            gamesLoading.textContent =
                "Unable to load games.";

            gamesLoading.style.display =
                "block";

        }

        showError(
            error.message ||
            "Unable to load games."
        );

    }

}


/* ==========================================
   RENDER GAMES
   UNCHANGED
========================================== */

function renderGames() {

    if (!gamesTableBody) {
        return;
    }

    gamesTableBody.innerHTML =
        "";

    if (!gamesCache.length) {

        gamesTableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="admin-table-empty"
                >
                    No games found.
                </td>

            </tr>

        `;

        return;
    }

    gamesCache.forEach(
        (game) => {

            const row =
                document.createElement(
                    "tr"
                );

            const hasDeliveryFields =
                Array.isArray(
                    game.deliveryFields
                ) &&
                game.deliveryFields.length > 0;

            row.innerHTML = `

                <td>

                    <strong>
                        ${escapeHTML(
                            game.name ||
                            "Unnamed Game"
                        )}
                    </strong>

                    ${
                        hasDeliveryFields
                            ? `

                                <small
                                    style="
                                        display:block;
                                        margin-top:4px;
                                        color:#777;
                                    "
                                >

                                    ${
                                        game
                                            .deliveryFields
                                            .length
                                    }

                                    delivery field${
                                        game
                                            .deliveryFields
                                            .length !== 1
                                            ? "s"
                                            : ""
                                    }

                                </small>

                            `
                            : ""
                    }

                </td>


                <td>

                    ${escapeHTML(
                        game.category ||
                        "-"
                    )}

                </td>


                <td>

                    <span
                        class="admin-status ${
                            game.active === false
                                ? "inactive"
                                : "active"
                        }"
                    >

                        ${
                            game.active === false
                                ? "Inactive"
                                : "Active"
                        }

                    </span>


                    ${
                        game.popular === true
                            ? `

                                <span
                                    class="admin-status active"
                                >
                                    Popular
                                </span>

                            `
                            : ""
                    }

                </td>


                <td>

                    <button
                        type="button"
                        class="admin-action-btn"
                        data-edit-game="${escapeHTML(
                            game.id
                        )}"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="admin-action-btn danger"
                        data-delete-game="${escapeHTML(
                            game.id
                        )}"
                    >
                        Delete
                    </button>

                </td>

            `;

            gamesTableBody.appendChild(
                row
            );

        }
    );

}


/* ==========================================
   GAME ACTIONS
   UNCHANGED
========================================== */

gamesTableBody?.addEventListener(
    "click",
    (event) => {

        const editButton =
            event.target.closest(
                "[data-edit-game]"
            );

        if (editButton) {

            const game =
                gamesCache.find(
                    (item) =>
                        item.id ===
                        editButton.dataset
                            .editGame
                );

            if (game) {

                openGameModal(
                    game
                );

            }

            return;

        }

        const deleteButton =
            event.target.closest(
                "[data-delete-game]"
            );

        if (deleteButton) {

            deleteGame(
                deleteButton.dataset
                    .deleteGame
            );

        }

    }
);


/* ==========================================
   OPEN GAME MODAL
   UNCHANGED
========================================== */

function openGameModal(
    game = null
) {

    if (!gameModal) {
        return;
    }

    const editing =
        Boolean(game);

    const title =
        $("gameModalTitle");

    if (title) {

        title.textContent =
            editing
                ? "Edit Game"
                : "Add Game";

    }

    if ($("gameId")) {

        $("gameId").value =
            editing
                ? game.id
                : "";

    }

    if ($("gameName")) {

        $("gameName").value =
            editing
                ? game.name || ""
                : "";

    }

    if ($("gameCategory")) {

        $("gameCategory").value =
            editing
                ? game.category || ""
                : "";

    }

    if ($("gameDescription")) {

        $("gameDescription").value =
            editing
                ? game.description || ""
                : "";

    }

    if ($("gameImage")) {

        $("gameImage").value =
            editing
                ? game.image || ""
                : "";

    }

    if ($("gameActive")) {

        $("gameActive").checked =
            !editing ||
            game.active !== false;

    }

    if ($("gamePopular")) {

        $("gamePopular").checked =
            editing &&
            game.popular === true;

    }

    loadDeliveryFields(
        editing
            ? game.deliveryFields || []
            : []
    );

    gameModal.classList.add(
        "show"
    );

    gameModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    setTimeout(() => {

        $("gameName")?.focus();

    }, 50);

}


/* ==========================================
   CLOSE GAME MODAL
   UNCHANGED
========================================== */

function closeGameModalWindow() {

    gameModal?.classList.remove(
        "show"
    );

    gameModal?.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    gameForm?.reset();

    if ($("gameId")) {

        $("gameId").value =
            "";

    }

    if ($("gameActive")) {

        $("gameActive").checked =
            true;

    }

    if ($("gamePopular")) {

        $("gamePopular").checked =
            false;

    }

    if (deliveryFieldsContainer) {

        deliveryFieldsContainer.innerHTML =
            "";

    }

    renderDeliveryFieldEmpty();

}


/* ==========================================
   MODAL EVENTS
   UNCHANGED
========================================== */

closeGameModal?.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        closeGameModalWindow();

    }
);


cancelGame?.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        closeGameModalWindow();

    }
);


gameModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            gameModal
        ) {

            closeGameModalWindow();

        }

    }
);


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }

        if (
            gameModal?.classList.contains(
                "show"
            )
        ) {

            closeGameModalWindow();

        }

    }
);


/* ==========================================
   DELIVERY EMPTY STATE
========================================== */

function renderDeliveryFieldEmpty() {

    if (!deliveryFieldsContainer) {
        return;
    }

    const rows =
        deliveryFieldsContainer
            .querySelectorAll(
                ".delivery-field-row"
            );

    if (rows.length > 0) {
        return;
    }

    deliveryFieldsContainer.innerHTML = `

        <div class="delivery-field-empty">

            No delivery fields added yet.
            Click "+ Add Field" to create one.

        </div>

    `;

}


/* ==========================================
   DELIVERY EDITOR MODE
========================================== */

function setFieldEditorMode(
    row,
    editing
) {

    if (!row) {
        return;
    }

    const preview =
        row.querySelector(
            ".delivery-field-preview"
        );

    const editor =
        row.querySelector(
            ".delivery-field-editor"
        );

    if (!preview || !editor) {
        return;
    }

    row.dataset.editing =
        editing
            ? "true"
            : "false";

    preview.style.display =
        editing
            ? "none"
            : "flex";

    editor.style.display =
        editing
            ? "grid"
            : "none";

}


/* ==========================================
   DELIVERY PREVIEW
========================================== */

function updateDeliveryPreview(
    row
) {

    if (!row) {
        return;
    }

    const label =
        row.querySelector(
            ".delivery-field-label"
        )?.value.trim() ||
        "Unnamed Field";

    const key =
        row.querySelector(
            ".delivery-field-key"
        )?.value.trim() ||
        "-";

    const type =
        row.querySelector(
            ".delivery-field-type"
        )?.value ||
        "text";

    const required =
        row.querySelector(
            ".delivery-field-required"
        )?.checked === true;

    const labelElement =
        row.querySelector(
            ".delivery-preview-label"
        );

    const keyElement =
        row.querySelector(
            ".delivery-preview-key"
        );

    const typeElement =
        row.querySelector(
            ".delivery-preview-type"
        );

    const statusElement =
        row.querySelector(
            ".delivery-preview-status"
        );

    if (labelElement) {

        labelElement.textContent =
            label;

    }

    if (keyElement) {

        keyElement.textContent =
            `Key: ${key}`;

    }

    if (typeElement) {

        typeElement.textContent =
            `Type: ${type}`;

    }

    if (statusElement) {

        statusElement.textContent =
            required
                ? "Required"
                : "Optional";

        statusElement.className =
            required
                ? "delivery-preview-status delivery-preview-required"
                : "delivery-preview-status delivery-preview-optional";

    }

}


/* ==========================================
   CREATE OPTION VALUE
========================================== */

function createOptionValue(
    label
) {

    return String(label || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

}


/* ==========================================
   NORMALIZE CONDITIONAL FIELD
========================================== */

function normalizeConditionalField(
    field = {}
) {

    const normalized = {

        label:
            String(
                field.label ?? ""
            ).trim(),

        key:
            String(
                field.key ?? ""
            ).trim(),

        type:
            field.type === "number"
                ? "number"
                : field.type === "select"
                    ? "select"
                    : "text",

        required:
            field.required === true

    };

    if (
        normalized.type ===
        "select"
    ) {

        normalized.options =
            Array.isArray(
                field.options
            )
                ? field.options
                    .map(
                        (option) => {

                            if (
                                typeof option ===
                                "string"
                            ) {

                                return {
                                    label:
                                        option.trim(),
                                    value:
                                        createOptionValue(
                                            option
                                        ),
                                    conditionalFields:
                                        []
                                };

                            }

                            return {
                                label:
                                    String(
                                        option?.label ??
                                        ""
                                    ).trim(),

                                value:
                                    String(
                                        option?.value ??
                                        createOptionValue(
                                            option?.label
                                        )
                                    ).trim(),

                                conditionalFields:
                                    Array.isArray(
                                        option?.conditionalFields
                                    )
                                        ? option.conditionalFields.map(
                                            normalizeConditionalField
                                        )
                                        : []
                            };

                        }
                    )
                    .filter(
                        (option) =>
                            option.label
                    )
                : [];

    }

    return normalized;

}


/* ==========================================
   NORMALIZE DROPDOWN OPTION
========================================== */

function normalizeDropdownOption(
    option
) {

    if (
        typeof option ===
        "string"
    ) {

        return {

            label:
                option.trim(),

            value:
                createOptionValue(
                    option
                ),

            conditionalFields:
                []

        };

    }

    return {

        label:
            String(
                option?.label ?? ""
            ).trim(),

        value:
            String(
                option?.value ??
                createOptionValue(
                    option?.label
                )
            ).trim(),

        conditionalFields:
            Array.isArray(
                option?.conditionalFields
            )
                ? option.conditionalFields.map(
                    normalizeConditionalField
                )
                : []

    };

}


/* ==========================================
   NORMALIZE DROPDOWN OPTIONS
========================================== */

function normalizeDropdownOptions(
    options
) {

    if (
        !Array.isArray(options)
    ) {

        return [];

    }

    return options
        .map(
            normalizeDropdownOption
        )
        .filter(
            (option) =>
                option.label
        );

}


/* ==========================================
   CONDITIONAL FIELD ELEMENT
========================================== */

function createConditionalFieldElement(
    field = {},
    startEditing = true
) {

    const normalized =
        normalizeConditionalField(
            field
        );

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "conditional-field-row";

    row.innerHTML = `

        <div
            class="conditional-field-header"
        >

            <strong>
                Conditional Field
            </strong>

            <button
                type="button"
                class="admin-action-btn danger conditional-delete-btn"
            >
                Delete
            </button>

        </div>


        <div
            class="conditional-field-grid"
        >

            <div
                class="delivery-field-group"
            >

                <label>
                    Label
                </label>

                <input
                    type="text"
                    class="conditional-field-label"
                    value="${escapeHTML(
                        normalized.label
                    )}"
                    placeholder="e.g. Steam ID"
                >

            </div>


            <div
                class="delivery-field-group"
            >

                <label>
                    Key
                </label>

                <input
                    type="text"
                    class="conditional-field-key"
                    value="${escapeHTML(
                        normalized.key
                    )}"
                    placeholder="e.g. steamId"
                >

            </div>


            <div
                class="delivery-field-group"
            >

                <label>
                    Type
                </label>

                <select
                    class="conditional-field-type"
                >

                    <option value="text">
                        Text
                    </option>

                    <option value="number">
                        Number
                    </option>

                    <option value="select">
                        Dropdown
                    </option>

                </select>

            </div>


            <label
                class="delivery-required"
            >

                <input
                    type="checkbox"
                    class="conditional-field-required"
                    ${normalized.required
                        ? "checked"
                        : ""}
                >

                Required

            </label>

        </div>


        <div
            class="conditional-field-options-wrap"
        >

            <div
                class="delivery-field-group"
            >

                <label>
                    Dropdown Options
                </label>

                <div
                    class="conditional-options-container"
                ></div>

                <button
                    type="button"
                    class="admin-secondary-btn add-conditional-option-btn"
                >
                    + Add Option
                </button>

            </div>

        </div>

    `;

    const typeSelect =
        row.querySelector(
            ".conditional-field-type"
        );

    const optionsWrap =
        row.querySelector(
            ".conditional-field-options-wrap"
        );

    const optionsContainer =
        row.querySelector(
            ".conditional-options-container"
        );

    if (typeSelect) {

        typeSelect.value =
            normalized.type;

        typeSelect.addEventListener(
            "change",
            () => {

                if (optionsWrap) {

                    optionsWrap.classList.toggle(
                        "hidden",
                        typeSelect.value !==
                            "select"
                    );

                }

            }
        );

    }

    if (
        normalized.type ===
        "select" &&
        optionsContainer
    ) {

        normalized.options.forEach(
            (option) => {

                createConditionalOptionRow(
                    optionsContainer,
                    option
                );

            }
        );

    }

    row.querySelector(
        ".add-conditional-option-btn"
    )?.addEventListener(
        "click",
        () => {

            createConditionalOptionRow(
                optionsContainer,
                {}
            );

        }
    );

    row.querySelector(
        ".conditional-delete-btn"
    )?.addEventListener(
        "click",
        () => {

            row.remove();

        }
    );

    if (optionsWrap) {

        optionsWrap.classList.toggle(
            "hidden",
            normalized.type !==
                "select"
        );

    }

    return row;

}


/* ==========================================
   CONDITIONAL OPTION ROW
========================================== */

function createConditionalOptionRow(
    container,
    option = {}
) {

    if (!container) {
        return;
    }

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "conditional-option-row";

    const label =
        typeof option === "string"
            ? option
            : option?.label || "";

    /*
     * Option value is generated automatically
     * from the option label.
     *
     * Example:
     * Steam → steam
     * Xbox → xbox
     * PlayStation 5 → playstation_5
     */

    const value =
        createOptionValue(
            label
        );

    row.innerHTML = `

        <div
            class="conditional-option-label-wrap"
        >

            <label>
                Option Label
            </label>

            <input
                type="text"
                class="conditional-option-label"
                value="${escapeHTML(
                    label
                )}"
                placeholder="e.g. Steam"
            >

        </div>


        <button
            type="button"
            class="admin-action-btn danger conditional-option-delete-btn"
            aria-label="Delete option"
        >
            ×
        </button>

    `;

    /*
     * Automatically keep the generated value
     * updated whenever the admin changes
     * the option label.
     */

    const labelInput =
        row.querySelector(
            ".conditional-option-label"
        );

    if (labelInput) {

        labelInput.addEventListener(
            "input",
            () => {

                /*
                 * The value is not displayed or
                 * manually edited.
                 *
                 * It is generated when the option
                 * is collected for saving.
                 */

            }
        );

    }


    /*
     * Delete option.
     */

    row.querySelector(
        ".conditional-option-delete-btn"
    )?.addEventListener(
        "click",
        () => {

            row.remove();

        }
    );


    container.appendChild(
        row
    );

}


/* ==========================================
   ADD CONDITIONAL FIELD
========================================== */

function addConditionalField(
    container,
    field = {}
) {

    if (!container) {
        return;
    }

    const row =
        createConditionalFieldElement(
            field,
            true
        );

    container.appendChild(
        row
    );

}


/* ==========================================
   COLLECT CONDITIONAL FIELDS
========================================== */

function collectConditionalFields(
    container
) {

    if (!container) {
        return [];
    }

    const rows =
        container.querySelectorAll(
            ".conditional-field-row"
        );

    const fields = [];

    rows.forEach(
        (row, index) => {

            const label =
                row.querySelector(
                    ".conditional-field-label"
                )?.value.trim() ||
                "";

            const key =
                row.querySelector(
                    ".conditional-field-key"
                )?.value.trim() ||
                "";

            const type =
                row.querySelector(
                    ".conditional-field-type"
                )?.value ||
                "text";

            const required =
                row.querySelector(
                    ".conditional-field-required"
                )?.checked === true;

            if (!label) {

                throw new Error(
                    `Conditional field ${
                        index + 1
                    }: Label is required.`
                );

            }

            if (!key) {

                throw new Error(
                    `Conditional field ${
                        index + 1
                    }: Key is required.`
                );

            }

            const field = {

                label,

                key,

                type,

                required

            };

            if (
                type ===
                "select"
            ) {

                const optionRows =
                    row.querySelectorAll(
                        ".conditional-option-row"
                    );

                const options = [];

                optionRows.forEach(
                    (optionRow) => {

                        const optionLabel =
                            optionRow
                                .querySelector(
                                    ".conditional-option-label"
                                )
                                ?.value
                                .trim() ||
                            "";

                        if (!optionLabel) {
                        return;
                        }

                        const optionValue =
                            createOptionValue(
                                optionLabel
                            );

                        options.push(
                            {
                                label:
                                    optionLabel,

                                value:
                                    optionValue,

                                conditionalFields:
                                    []
                            }
                        );
                    }
                );

                if (!options.length) {

                    throw new Error(
                        `Please add dropdown options for conditional field "${label}".`
                    );

                }

                field.options =
                    options;

            }

            fields.push(
                field
            );

        }
    );

    const keys =
        fields.map(
            (field) =>
                field.key
        );

    if (
        new Set(keys).size !==
        keys.length
    ) {

        throw new Error(
            "Conditional field keys must be unique."
        );

    }

    return fields;

}


/* ==========================================
   CREATE DROPDOWN OPTION
========================================== */

function createDropdownOptionElement(
    option = {}
) {

    const normalized =
        normalizeDropdownOption(
            option
        );


    const optionRow =
        document.createElement(
            "div"
        );

    optionRow.className =
        "delivery-option-row";


    optionRow.innerHTML = `

        <div
            class="delivery-option-header"
        >

            <div
                class="delivery-option-label-wrap"
            >

                <label>
                    Option Label
                </label>

                <input
                    type="text"
                    class="delivery-option-label"
                    value="${escapeHTML(
                        normalized.label
                    )}"
                    placeholder="e.g. Steam"
                >

            </div>


            <button
                type="button"
                class="admin-action-btn danger delete-option-btn"
            >
                ×
            </button>

        </div>


        <input
            type="hidden"
            class="delivery-option-value"
            value="${escapeHTML(
                normalized.value
            )}"
        >


        <div
            class="conditional-fields-section"
        >

            <div
                class="conditional-fields-title"
            >
                Conditional Fields
            </div>


            <div
                class="conditional-fields-container"
            ></div>


            <button
                type="button"
                class="admin-secondary-btn add-conditional-field-btn"
            >
                + Add Conditional Field
            </button>

        </div>

    `;


    const conditionalContainer =
        optionRow.querySelector(
            ".conditional-fields-container"
        );


    normalized.conditionalFields.forEach(
        (field) => {

            addConditionalField(
                conditionalContainer,
                field
            );

        }
    );


    optionRow.querySelector(
        ".add-conditional-field-btn"
    )?.addEventListener(
        "click",
        () => {

            addConditionalField(
                conditionalContainer,
                {
                    label: "",
                    key: "",
                    type: "text",
                    required: true
                }
            );

        }
    );


    optionRow.querySelector(
        ".delete-option-btn"
    )?.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Delete this dropdown option?"
                )
            ) {

                return;

            }

            optionRow.remove();

        }
    );


    return optionRow;

}


/* ==========================================
   RENDER DROPDOWN OPTIONS
========================================== */

function renderDropdownOptions(
    row,
    options = []
) {

    const container =
        row.querySelector(
            ".delivery-options-editor"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        "";

    normalizeDropdownOptions(
        options
    ).forEach(
        (option) => {

            container.appendChild(
                createDropdownOptionElement(
                    option
                )
            );

        }
    );

}


/* ==========================================
   COLLECT DROPDOWN OPTIONS
========================================== */

function collectDropdownOptions(
    row
) {

    const container =
        row.querySelector(
            ".delivery-options-editor"
        );

    if (!container) {

        throw new Error(
            "Dropdown options container is missing."
        );

    }

    const optionRows =
        container.querySelectorAll(
            ".delivery-option-row"
        );

    const options = [];

    optionRows.forEach(
        (optionRow, index) => {

            const label =
                optionRow.querySelector(
                    ".delivery-option-label"
                )?.value.trim() ||
                "";

            let value =
                optionRow.querySelector(
                    ".delivery-option-value"
                )?.value.trim() ||
                "";

            if (!label) {

                throw new Error(
                    `Dropdown option ${
                        index + 1
                    }: Option label is required.`
                );

            }

            if (!value) {

                value =
                    createOptionValue(
                        label
                    );

            }

            const conditionalContainer =
                optionRow.querySelector(
                    ".conditional-fields-container"
                );

            const conditionalFields =
                collectConditionalFields(
                    conditionalContainer
                );

            options.push({

                label,

                value,

                conditionalFields

            });

        }
    );

    if (!options.length) {

        throw new Error(
            "Please add at least one dropdown option."
        );

    }

    const values =
        options.map(
            (option) =>
                option.value
        );

    if (
        new Set(values).size !==
        values.length
    ) {

        throw new Error(
            "Dropdown option values must be unique."
        );

    }

    return options;

}


/* ==========================================
   UPDATE DELIVERY OPTIONS VISIBILITY
========================================== */

function updateDeliveryOptionsVisibility(
    row
) {

    if (!row) {
        return;
    }

    const type =
        row.querySelector(
            ".delivery-field-type"
        )?.value ||
        "text";

    const optionsWrap =
        row.querySelector(
            ".delivery-options-wrap"
        );

    if (!optionsWrap) {
        return;
    }

    optionsWrap.classList.toggle(
        "hidden",
        type !== "select"
    );

}


/* ==========================================
   CREATE DELIVERY FIELD
========================================== */

function createDeliveryFieldRow(
    field = {},
    startEditing = false
) {

    if (!deliveryFieldsContainer) {
        return null;
    }

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "delivery-field-row";

    const fieldLabel =
        field.label || "";

    const fieldKey =
        field.key || "";

    const fieldType =
        field.type || "text";

    const required =
        field.required === true;

    /*
     * IMPORTANT:
     * Supports both old:
     *
     * options: ["Steam", "Xbox"]
     *
     * and new:
     *
     * options: [
     *   {
     *     label: "Steam",
     *     value: "steam",
     *     conditionalFields: []
     *   }
     * ]
     */

    const normalizedOptions =
        normalizeDropdownOptions(
            field.options || []
        );

    row.innerHTML = `

        <div
            class="delivery-field-preview"
        >

            <div
                class="delivery-field-preview-main"
            >

                <strong
                    class="delivery-preview-label"
                >
                    ${escapeHTML(
                        fieldLabel ||
                        "Unnamed Field"
                    )}
                </strong>


                <span
                    class="delivery-preview-key"
                >
                    Key:
                    ${escapeHTML(
                        fieldKey ||
                        "-"
                    )}
                </span>


                <span
                    class="delivery-preview-type"
                >
                    Type:
                    ${escapeHTML(
                        fieldType
                    )}
                </span>


                <span
                    class="delivery-preview-status ${
                        required
                            ? "delivery-preview-required"
                            : "delivery-preview-optional"
                    }"
                >
                    ${
                        required
                            ? "Required"
                            : "Optional"
                    }
                </span>

            </div>


            <div
                class="delivery-field-actions"
            >

                <button
                    type="button"
                    class="admin-action-btn delivery-edit-btn"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="admin-action-btn danger delivery-delete-btn"
                >
                    Delete
                </button>

            </div>

        </div>


        <div
            class="delivery-field-editor"
        >

            <div
                class="delivery-field-group"
            >

                <label>
                    Field Label
                </label>

                <input
                    type="text"
                    class="delivery-field-label"
                    value="${escapeHTML(
                        fieldLabel
                    )}"
                    placeholder="e.g. Player UID"
                >

            </div>


            <div
                class="delivery-field-group"
            >

                <label>
                    Field Key
                </label>

                <input
                    type="text"
                    class="delivery-field-key"
                    value="${escapeHTML(
                        fieldKey
                    )}"
                    placeholder="e.g. playerUid"
                >

            </div>


            <div
                class="delivery-field-group"
            >

                <label>
                    Type
                </label>

                <select
                    class="delivery-field-type"
                >

                    <option value="text">
                        Text
                    </option>

                    <option value="number">
                        Number
                    </option>

                    <option value="select">
                        Dropdown
                    </option>

                </select>

            </div>


            <div
                class="delivery-field-group delivery-options-wrap"
            >

                <label>
                    Dropdown Options
                </label>


                <div
                    class="delivery-options-editor"
                ></div>


                <button
                    type="button"
                    class="admin-secondary-btn add-option-btn"
                >
                    + Add Option
                </button>

            </div>


            <label
                class="delivery-required"
            >

                <input
                    type="checkbox"
                    class="delivery-field-required"
                    ${required ? "checked" : ""}
                >

                Required

            </label>


            <div
                class="delivery-edit-actions"
            >

                <button
                    type="button"
                    class="admin-secondary-btn delivery-cancel-edit-btn"
                >
                    Cancel
                </button>


                <button
                    type="button"
                    class="admin-primary-btn delivery-save-edit-btn"
                >
                    Save Field
                </button>

            </div>

        </div>

    `;


    deliveryFieldsContainer.appendChild(
        row
    );


    const typeSelect =
        row.querySelector(
            ".delivery-field-type"
        );


    if (typeSelect) {

        typeSelect.value =
            fieldType;

        typeSelect.addEventListener(
            "change",
            () => {

                updateDeliveryOptionsVisibility(
                    row
                );

            }
        );

    }


    /*
     * Render existing dropdown
     * options.
     */

    renderDropdownOptions(
        row,
        normalizedOptions
    );


    /*
     * Add new dropdown option.
     */

    row.querySelector(
        ".add-option-btn"
    )?.addEventListener(
        "click",
        () => {

            const container =
                row.querySelector(
                    ".delivery-options-editor"
                );

            if (!container) {
                return;
            }

            container.appendChild(
                createDropdownOptionElement(
                    {
                        label: "",
                        value: "",
                        conditionalFields: []
                    }
                )
            );

        }
    );


    /*
     * Edit field.
     */

    row.querySelector(
        ".delivery-edit-btn"
    )?.addEventListener(
        "click",
        () => {

            setFieldEditorMode(
                row,
                true
            );

        }
    );


    /*
     * Cancel editing.
     */

    row.querySelector(
        ".delivery-cancel-edit-btn"
    )?.addEventListener(
        "click",
        () => {

            updateDeliveryPreview(
                row
            );

            updateDeliveryOptionsVisibility(
                row
            );

            setFieldEditorMode(
                row,
                false
            );

        }
    );


    /*
     * Save field editor.
     */

    row.querySelector(
        ".delivery-save-edit-btn"
    )?.addEventListener(
        "click",
        () => {

            try {

                const label =
                    row.querySelector(
                        ".delivery-field-label"
                    )?.value.trim() ||
                    "";

                const key =
                    row.querySelector(
                        ".delivery-field-key"
                    )?.value.trim() ||
                    "";

                const type =
                    row.querySelector(
                        ".delivery-field-type"
                    )?.value ||
                    "text";


                if (!label) {

                    throw new Error(
                        "Field label is required."
                    );

                }


                if (!key) {

                    throw new Error(
                        "Field key is required."
                    );

                }


                if (
                    type ===
                    "select"
                ) {

                    collectDropdownOptions(
                        row
                    );

                }


                updateDeliveryPreview(
                    row
                );

                updateDeliveryOptionsVisibility(
                    row
                );

                setFieldEditorMode(
                    row,
                    false
                );


            } catch (error) {

                showError(
                    error.message
                );

            }

        }
    );


    /*
     * Delete field.
     */

    row.querySelector(
        ".delivery-delete-btn"
    )?.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Delete this delivery field?"
                )
            ) {

                return;

            }

            row.remove();

            renderDeliveryFieldEmpty();

        }
    );


    updateDeliveryPreview(
        row
    );

    updateDeliveryOptionsVisibility(
        row
    );

    setFieldEditorMode(
        row,
        startEditing
    );


    return row;

}


/* ==========================================
   LOAD DELIVERY FIELDS
========================================== */

function loadDeliveryFields(
    fields = []
) {

    if (!deliveryFieldsContainer) {
        return;
    }

    deliveryFieldsContainer.innerHTML =
        "";

    if (
        !Array.isArray(fields) ||
        fields.length === 0
    ) {

        renderDeliveryFieldEmpty();

        return;

    }

    fields.forEach(
        (field) => {

            createDeliveryFieldRow(
                field,
                false
            );

        }
    );

}


/* ==========================================
   GET DELIVERY FIELDS
========================================== */

function getDeliveryFields() {

    if (!deliveryFieldsContainer) {
        return [];
    }

    const rows =
        deliveryFieldsContainer
            .querySelectorAll(
                ".delivery-field-row"
            );

    const fields = [];


    rows.forEach(
        (row, index) => {

            const label =
                row.querySelector(
                    ".delivery-field-label"
                )?.value.trim() ||
                "";

            const key =
                row.querySelector(
                    ".delivery-field-key"
                )?.value.trim() ||
                "";

            const type =
                row.querySelector(
                    ".delivery-field-type"
                )?.value ||
                "text";

            const required =
                row.querySelector(
                    ".delivery-field-required"
                )?.checked === true;


            if (!label) {

                throw new Error(
                    `Delivery field ${
                        index + 1
                    }: Field label is required.`
                );

            }


            if (!key) {

                throw new Error(
                    `Delivery field ${
                        index + 1
                    }: Field key is required.`
                );

            }


            const field = {

                label,

                key,

                type,

                required

            };


            if (
                type ===
                "select"
            ) {

                field.options =
                    collectDropdownOptions(
                        row
                    );

            }


            fields.push(
                field
            );

        }
    );


    const keys =
        fields.map(
            (field) =>
                field.key
        );


    if (
        new Set(keys).size !==
        keys.length
    ) {

        throw new Error(
            "Delivery field keys must be unique."
        );

    }


    /*
     * Also check keys used by
     * conditional fields against
     * other conditional fields
     * within their option.
     */

    fields.forEach(
        (field) => {

            if (
                field.type !==
                "select"
            ) {

                return;

            }


            field.options.forEach(
                (option) => {

                    const conditionalKeys =
                        option
                            .conditionalFields
                            .map(
                                (conditionalField) =>
                                    conditionalField.key
                            );


                    if (
                        new Set(
                            conditionalKeys
                        ).size !==
                        conditionalKeys.length
                    ) {

                        throw new Error(
                            `Conditional field keys in option "${option.label}" must be unique.`
                        );

                    }


                    /*
                     * Prevent a conditional
                     * field from using the
                     * parent field's key.
                     */

                    if (
                        conditionalKeys.includes(
                            field.key
                        )
                    ) {

                        throw new Error(
                            `Conditional field in option "${option.label}" cannot use the parent field key "${field.key}".`
                        );

                    }

                }
            );

        }
    );


    return fields;

}


/* ==========================================
   ADD DELIVERY FIELD
========================================== */

addDeliveryFieldBtn?.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        const empty =
            deliveryFieldsContainer
                ?.querySelector(
                    ".delivery-field-empty"
                );

        if (empty) {

            empty.remove();

        }

        createDeliveryFieldRow(
            {
                label: "",
                key: "",
                type: "text",
                required: true
            },
            true
        );

    }
);


/* ==========================================
   SAVE GAME
   UNCHANGED EXCEPT DELIVERY DATA
========================================== */

gameForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const button =
            event.submitter;

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Saving...";

        }

        try {

            await adminReady;

            const gameId =
                $("gameId")
                    ?.value
                    .trim() ||
                "";

            const deliveryFields =
                getDeliveryFields();

            const data = {

                name:
                    $("gameName")
                        ?.value
                        .trim() ||
                    "",

                category:
                    $("gameCategory")
                        ?.value
                        .trim() ||
                    "",

                description:
                    $("gameDescription")
                        ?.value
                        .trim() ||
                    "",

                image:
                    $("gameImage")
                        ?.value
                        .trim() ||
                    "",

                active:
                    $("gameActive")
                        ?.checked ??
                    true,

                popular:
                    $("gamePopular")
                        ?.checked ??
                    false,

                deliveryFields

            };


            if (!data.name) {

                throw new Error(
                    "Game name is required."
                );

            }


            if (!data.category) {

                throw new Error(
                    "Game category is required."
                );

            }


            if (gameId) {

                await updateDoc(
                    doc(
                        db,
                        "games",
                        gameId
                    ),
                    {

                        ...data,

                        updatedAt:
                            serverTimestamp()

                    }
                );


            } else {

                await addDoc(
                    collection(
                        db,
                        "games"
                    ),
                    {

                        ...data,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }


            closeGameModalWindow();

            await loadGames();

            showSuccess(
                gameId
                    ? "Game updated successfully."
                    : "Game added successfully."
            );


        } catch (error) {

            console.error(
                "Game save error:",
                error
            );

            showError(
                error.message ||
                "Unable to save game."
            );


        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "Save Game";

            }

        }

    }
);


/* ==========================================
   DELETE GAME
   UNCHANGED
========================================== */

async function deleteGame(
    gameId
) {

    if (!gameId) {
        return;
    }

    const confirmed =
        confirm(
            "Are you sure you want to delete this game?\n\n" +
            "This will permanently remove the game."
        );

    if (!confirmed) {
        return;
    }

    try {

        await adminReady;

        await deleteDoc(
            doc(
                db,
                "games",
                gameId
            )
        );

        await loadGames();

        showSuccess(
            "Game deleted successfully."
        );

    } catch (error) {

        console.error(
            "Delete game error:",
            error
        );

        showError(
            error.message ||
            "Unable to delete game."
        );

    }

}


/* ==========================================
   ADD GAME
   UNCHANGED
========================================== */

addGameBtn?.addEventListener(
    "click",
    async (event) => {

        event.preventDefault();

        try {

            await adminReady;

            openGameModal();

        } catch (error) {

            showError(
                "You do not have admin access."
            );

        }

    }
);


/* ==========================================
   INITIAL UI
========================================== */

renderDeliveryFieldEmpty();


/* ==========================================
   START GAMES SECTION
========================================== */

(async function initializeGames() {

    try {

        await adminReady;

        console.log(
            "GameVault Games: Admin verified."
        );

        await loadGames();

    } catch (error) {

        console.log(
            "GameVault Games: Admin verification failed."
        );

    }

})();