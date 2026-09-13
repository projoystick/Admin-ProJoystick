/* ==========================================
   GAMEVAULT ADMIN — PRODUCTS
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
   ELEMENTS
========================================== */

const productsTableGroups =
    document.getElementById(
        "productsTableGroups"
    );

const productsLoading =
    document.getElementById(
        "productsLoading"
    );

const addProductBtn =
    document.getElementById(
        "addProductBtn"
    );

const productModal =
    document.getElementById(
        "productModal"
    );

const productForm =
    document.getElementById(
        "productForm"
    );

const closeProductModal =
    document.getElementById(
        "closeProductModal"
    );

const cancelProduct =
    document.getElementById(
        "cancelProduct"
    );

const productId =
    document.getElementById(
        "productId"
    );

const productName =
    document.getElementById(
        "productName"
    );

const productGame =
    document.getElementById(
        "productGame"
    );

const productType =
    document.getElementById(
        "productType"
    );

const productAmount =
    document.getElementById(
        "productAmount"
    );

const productImage =
    document.getElementById(
        "productImage"
    );

const productPrice =
    document.getElementById(
        "productPrice"
    );

const productDealPrice =
    document.getElementById(
        "productDealPrice"
    );

const productStock =
    document.getElementById(
        "productStock"
    );

const productDeal =
    document.getElementById(
        "productDeal"
    );

const productPinned =
    document.getElementById(
        "productPinned"
    );

const productActive =
    document.getElementById(
        "productActive"
    );

const saveProductBtn =
    document.getElementById(
        "saveProductBtn"
    );

const productGameFilter =
    document.getElementById(
        "productGameFilter"
    );


/* ==========================================
   CACHE
========================================== */

let productsCache = [];

let gamesCache = [];

let gamesLoaded = false;


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
   LOAD GAMES
========================================== */

async function loadGames() {

    if (gamesLoaded) {

        populateGameOptions();

        return;
    }

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "games"
                )
            );

        gamesCache =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .sort(
                    (a, b) =>
                        String(
                            a.name || ""
                        ).localeCompare(
                            String(
                                b.name || ""
                            )
                        )
                );

        gamesLoaded = true;

        populateGameOptions();

    } catch (error) {

        console.error(
            "Error loading games:",
            error
        );

        alert(
            "Failed to load games."
        );
    }
}


/* ==========================================
   POPULATE GAME OPTIONS
========================================== */

function populateGameOptions(
    selectedGameId = ""
) {

    /* PRODUCT MODAL GAME DROPDOWN */

    if (productGame) {

        productGame.innerHTML =
            `
            <option value="">
                Select Game
            </option>
            `;

        gamesCache.forEach(
            game => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    game.id;

                option.textContent =
                    game.name ||
                    "Unnamed Game";

                productGame.appendChild(
                    option
                );
            }
        );


        if (selectedGameId) {

            const exists =
                [...productGame.options]
                    .some(
                        option =>
                            option.value ===
                            selectedGameId
                    );


            if (!exists) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    selectedGameId;

                option.textContent =
                    getGameName(
                        selectedGameId
                    );

                productGame.appendChild(
                    option
                );
            }


            productGame.value =
                selectedGameId;
        }
    }


    /* PRODUCT PAGE GAME FILTER */

    if (productGameFilter) {

        const currentValue =
            productGameFilter.value ||
            "all";

        productGameFilter.innerHTML =
            `
            <option value="all">
                All Games
            </option>
            `;

        gamesCache.forEach(
            game => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    game.id;

                option.textContent =
                    game.name ||
                    "Unnamed Game";

                productGameFilter.appendChild(
                    option
                );
            }
        );

        const optionExists =
            [...productGameFilter.options]
                .some(
                    option =>
                        option.value ===
                        currentValue
                );

        productGameFilter.value =
            optionExists
                ? currentValue
                : "all";
    }
}


/* ==========================================
   APPLY GAME FILTER
========================================== */

function applyGameFilter() {

    if (!productGameFilter) {
        return;
    }

    const selectedGameId =
        productGameFilter.value ||
        "all";


    const gameSections =
        document.querySelectorAll(
            ".admin-product-game"
        );


    gameSections.forEach(
        section => {

            const sectionGameId =
                section.dataset.gameId;


            if (
                selectedGameId ===
                "all"
            ) {

                section.style.display =
                    "";

                return;
            }


            if (
                sectionGameId ===
                "unassigned"
            ) {

                section.style.display =
                    "none";

                return;
            }


            section.style.display =
                sectionGameId ===
                selectedGameId
                    ? ""
                    : "none";
        }
    );
}


/* ==========================================
   GAME TABLE FILTER
========================================== */

productGameFilter?.addEventListener(
    "change",
    applyGameFilter
);


/* ==========================================
   GET GAME NAME
========================================== */

function getGameName(
    gameId
) {

    const game =
        gamesCache.find(
            item =>
                item.id ===
                gameId
        );

    return (
        game?.name ||
        "Unknown Game"
    );
}


/* ==========================================
   LOAD PRODUCTS
========================================== */

async function loadProducts() {

    if (!productsTableGroups) {
        return;
    }

    try {

        productsLoading.style.display =
            "block";

        productsLoading.textContent =
            "Loading products...";


        await loadGames();


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        productsCache =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        renderProducts();

    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );

        productsTableGroups.innerHTML = `
            <div class="admin-table-card">
                <div class="admin-table-empty">
                    Failed to load products.
                </div>
            </div>
        `;

    } finally {

        productsLoading.style.display =
            "none";
    }
}


/* ==========================================
   PRODUCT TYPE
========================================== */

function getProductType(
    product
) {

    const type =
        String(
            product.type || ""
        )
            .trim()
            .toLowerCase();


    if (
        type === "currency" ||
        type === "coin" ||
        type === "coins"
    ) {

        return "currency";
    }


    return "product";
}


/* ==========================================
   RENDER PRODUCTS
========================================== */

function renderProducts() {

    productsTableGroups.innerHTML =
        "";


    const usedGameIds =
        new Set();


    gamesCache.forEach(
        game => {

            usedGameIds.add(
                game.id
            );


            const gameProducts =
                productsCache.filter(
                    product =>
                        product.gameId ===
                        game.id
                );


            const currencyProducts =
                gameProducts.filter(
                    product =>
                        getProductType(
                            product
                        ) === "currency"
                );


            const normalProducts =
                gameProducts.filter(
                    product =>
                        getProductType(
                            product
                        ) === "product"
                );


            const gameBlock =
                document.createElement(
                    "div"
                );

            gameBlock.className =
                "admin-product-game";

            gameBlock.dataset.gameId =
                game.id;


            gameBlock.innerHTML = `
                <div class="admin-product-game-header">
                    ${escapeHTML(
                        game.name ||
                        "Unnamed Game"
                    )}

                    <span>
                        ${gameProducts.length}
                        ${
                            gameProducts.length === 1
                                ? "product"
                                : "products"
                        }
                    </span>
                </div>
            `;


            gameBlock.appendChild(
                createCategory(
                    "Currency Items",
                    currencyProducts
                )
            );


            gameBlock.appendChild(
                createCategory(
                    "Products",
                    normalProducts
                )
            );


            productsTableGroups.appendChild(
                gameBlock
            );
        }
    );


    /* ======================================
       UNASSIGNED PRODUCTS
    ====================================== */

    const unassigned =
        productsCache.filter(
            product =>
                !usedGameIds.has(
                    product.gameId
                )
        );


    if (unassigned.length > 0) {

        const currencyProducts =
            unassigned.filter(
                product =>
                    getProductType(
                        product
                    ) === "currency"
            );


        const normalProducts =
            unassigned.filter(
                product =>
                    getProductType(
                        product
                    ) === "product"
            );


        const gameBlock =
            document.createElement(
                "div"
            );

        gameBlock.className =
            "admin-product-game";

        gameBlock.dataset.gameId =
            "unassigned";


        gameBlock.innerHTML = `
            <div class="admin-product-game-header">
                Other / Unassigned

                <span>
                    ${unassigned.length}
                    ${
                        unassigned.length === 1
                            ? "product"
                            : "products"
                    }
                </span>
            </div>
        `;


        gameBlock.appendChild(
            createCategory(
                "Currency Items",
                currencyProducts
            )
        );


        gameBlock.appendChild(
            createCategory(
                "Products",
                normalProducts
            )
        );


        productsTableGroups.appendChild(
            gameBlock
        );
    }


    if (
        gamesCache.length === 0 &&
        productsCache.length === 0
    ) {

        productsTableGroups.innerHTML = `
            <div class="admin-table-card">
                <div class="admin-table-empty">
                    No products found.
                </div>
            </div>
        `;
    }


    /* Re-apply selected game after rendering */

    applyGameFilter();
}


/* ==========================================
   CREATE CATEGORY
========================================== */

function createCategory(
    title,
    products
) {

    const category =
        document.createElement(
            "div"
        );

    category.className =
        "admin-product-category";


    const titleElement =
        document.createElement(
            "div"
        );

    titleElement.className =
        "admin-product-category-title";


    titleElement.innerHTML = `
        <span>
            ${escapeHTML(title)}
        </span>

        <span>
            ${products.length}
            ${
                products.length === 1
                    ? "item"
                    : "items"
            }
        </span>
    `;


    category.appendChild(
        titleElement
    );


    const card =
        document.createElement(
            "div"
        );

    card.className =
        "admin-table-card";


    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "admin-table-wrapper";


    const table =
        document.createElement(
            "table"
        );

    table.className =
        "admin-table";


    table.innerHTML = `
        <thead>
            <tr>
                <th>Product</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
    `;


    const tbody =
        document.createElement(
            "tbody"
        );


    if (products.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="admin-product-empty"
                >
                    No ${
                        title === "Currency Items"
                            ? "currency items"
                            : "products"
                    } found.
                </td>
            </tr>
        `;

    } else {

        products.forEach(
            product => {

                tbody.appendChild(
                    createProductRow(
                        product
                    )
                );
            }
        );
    }


    table.appendChild(
        tbody
    );

    wrapper.appendChild(
        table
    );

    card.appendChild(
        wrapper
    );

    category.appendChild(
        card
    );


    return category;
}


/* ==========================================
   CREATE PRODUCT ROW
========================================== */

function createProductRow(
    product
) {

    const row =
        document.createElement(
            "tr"
        );


    const active =
        product.active !== false;

    const deal =
        product.deal === true;

    const pinned =
        product.pinned === true;


    let statusHTML = `
        <div class="admin-product-status">

            <span class="${
                active
                    ? "active"
                    : "inactive"
            }">
                ${active ? "Active" : "Inactive"}
            </span>
    `;


    if (deal) {

        statusHTML += `
            <span class="badge">
                Deal
            </span>
        `;
    }


    if (pinned) {

        statusHTML += `
            <span class="badge">
                Pinned
            </span>
        `;
    }


    statusHTML += `
        </div>
    `;


    const price =
        Number(
            product.price || 0
        );


    const dealPrice =
        Number(
            product.dealPrice || 0
        );


    let priceHTML = `
        <div class="admin-product-price">
            ₹${price}
        </div>
    `;


    if (
        deal &&
        dealPrice > 0
    ) {

        priceHTML += `
            <div class="admin-product-deal-price">
                Deal ₹${dealPrice}
            </div>
        `;
    }


    row.innerHTML = `
        <td>
            <div class="admin-product-name">
                ${escapeHTML(
                    product.name ||
                    "Unnamed Product"
                )}
            </div>
        </td>

        <td>
            ${escapeHTML(
                product.amount ??
                "-"
            )}
        </td>

        <td>
            ${priceHTML}
        </td>

        <td>
            ${escapeHTML(
                product.stock ??
                0
            )}
        </td>

        <td>
            ${statusHTML}
        </td>

        <td>
            <div class="admin-product-actions">

                <button
                    type="button"
                    class="admin-action-btn"
                    data-edit-product="${escapeHTML(
                        product.id
                    )}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="admin-action-btn admin-action-danger"
                    data-delete-product="${escapeHTML(
                        product.id
                    )}"
                >
                    Delete
                </button>

            </div>
        </td>
    `;


    return row;
}


/* ==========================================
   TABLE ACTIONS
========================================== */

productsTableGroups?.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(
                "[data-edit-product]"
            );


        if (editButton) {

            const id =
                editButton.dataset.editProduct;


            const product =
                productsCache.find(
                    item =>
                        item.id === id
                );


            if (product) {

                openProductModal(
                    product
                );
            }


            return;
        }


        const deleteButton =
            event.target.closest(
                "[data-delete-product]"
            );


        if (deleteButton) {

            const id =
                deleteButton.dataset.deleteProduct;


            const product =
                productsCache.find(
                    item =>
                        item.id === id
                );


            if (product) {

                deleteProduct(
                    product
                );
            }
        }
    }
);


/* ==========================================
   PRODUCT TYPE UI
========================================== */

function updateProductTypeVisibility() {

    if (!productAmount) {
        return;
    }


    if (
        productType.value ===
        "currency"
    ) {

        productAmount.placeholder =
            "e.g. 2060";

    } else {

        productAmount.placeholder =
            "e.g. 1";
    }
}


/* ==========================================
   DEAL PRICE UI
========================================== */

function updateDealPriceState() {

    if (!productDealPrice) {
        return;
    }


    const enabled =
        productDeal.checked;


    productDealPrice.disabled =
        !enabled;


    if (!enabled) {

        productDealPrice.value =
            "";
    }
}


/* ==========================================
   OPEN MODAL
========================================== */

async function openProductModal(
    product = null
) {

    await loadGames();


    if (!product) {

        productId.value =
            "";

        productName.value =
            "";

        productGame.value =
            "";

        productType.value =
            "";

        productAmount.value =
            "";

        productImage.value =
            "";

        productPrice.value =
            "";

        productDealPrice.value =
            "";

        productStock.value =
            "0";

        productDeal.checked =
            false;

        productPinned.checked =
            false;

        productActive.checked =
            true;


        populateGameOptions();


        updateProductTypeVisibility();

        updateDealPriceState();


        productModal.classList.add(
            "active"
        );

        productModal.setAttribute(
            "aria-hidden",
            "false"
        );


        return;
    }


    /* ======================================
       EDIT EXISTING PRODUCT
    ====================================== */

    productId.value =
        product.id || "";


    productName.value =
        product.name || "";


    populateGameOptions(
        product.gameId || ""
    );


    productType.value =
        getProductType(
            product
        );


    productAmount.value =
        product.amount ??
        "";


    productImage.value =
        product.image ||
        "";


    productPrice.value =
        product.price ??
        "";


    productDealPrice.value =
        product.dealPrice ??
        "";


    productStock.value =
        product.stock ??
        0;


    productDeal.checked =
        product.deal === true;


    productPinned.checked =
        product.pinned === true;


    productActive.checked =
        product.active !== false;


    updateProductTypeVisibility();

    updateDealPriceState();


    productModal.classList.add(
        "active"
    );

    productModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* ==========================================
   CLOSE MODAL
========================================== */

function closeModal() {

    if (!productModal) {
        return;
    }


    productModal.classList.remove(
        "active"
    );

    productModal.setAttribute(
        "aria-hidden",
        "true"
    );
}


closeProductModal?.addEventListener(
    "click",
    closeModal
);


cancelProduct?.addEventListener(
    "click",
    closeModal
);


productModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            productModal
        ) {

            closeModal();
        }
    }
);


/* ==========================================
   TYPE / DEAL EVENTS
========================================== */

productType?.addEventListener(
    "change",
    updateProductTypeVisibility
);


productDeal?.addEventListener(
    "change",
    updateDealPriceState
);


/* ==========================================
   ADD PRODUCT
========================================== */

addProductBtn?.addEventListener(
    "click",
    async () => {

        await loadGames();

        openProductModal();
    }
);


/* ==========================================
   SAVE PRODUCT
========================================== */

productForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            productId.value.trim();

        const name =
            productName.value.trim();

        const gameId =
            productGame.value;

        const type =
            productType.value;

        const amount =
            productAmount.value.trim();

        const image =
            productImage.value.trim();

        const price =
            Number(
                productPrice.value
            );

        const dealPrice =
            Number(
                productDealPrice.value ||
                0
            );

        const stock =
            Number(
                productStock.value
            );


        if (!gameId) {

            alert(
                "Please select a game."
            );

            return;
        }


        if (!name) {

            alert(
                "Please enter a product name."
            );

            return;
        }


        if (!type) {

            alert(
                "Please select a product type."
            );

            return;
        }


        if ( 
            type === "currency" && !amount 
        ) { 
            alert( 
                    "Please enter the amount for currency." 
                ); 
                
                return; 
            
        }


        if (
            Number.isNaN(price) ||
            price < 0
        ) {

            alert(
                "Please enter a valid price."
            );

            return;
        }


        if (
            Number.isNaN(stock) ||
            stock < 0
        ) {

            alert(
                "Please enter a valid stock amount."
            );

            return;
        }


        if (
            productDeal.checked &&
            (
                Number.isNaN(
                    dealPrice
                ) ||
                dealPrice < 0
            )
        ) {

            alert(
                "Please enter a valid deal price."
            );

            return;
        }


        const gameName =
            getGameName(
                gameId
            );


        const productData = {

            name,

            gameId,

            gameName,

            type,

            amount,

            price,

            dealPrice,

            stock,

            image,

            deal:
                productDeal.checked,

            pinned:
                productPinned.checked,

            active:
                productActive.checked,

            updatedAt:
                serverTimestamp()
        };


        try {

            if (saveProductBtn) {

                saveProductBtn.disabled =
                    true;

                saveProductBtn.textContent =
                    id
                        ? "Updating..."
                        : "Saving...";
            }


            if (id) {

                await updateDoc(
                    doc(
                        db,
                        "products",
                        id
                    ),
                    productData
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "products"
                    ),
                    {
                        ...productData,

                        createdAt:
                            serverTimestamp()
                    }
                );
            }


            closeModal();

            await loadProducts();


        } catch (error) {

            console.error(
                "Error saving product:",
                error
            );

            alert(
                "Failed to save product."
            );

        } finally {

            if (saveProductBtn) {

                saveProductBtn.disabled =
                    false;

                saveProductBtn.textContent =
                    "Save Product";
            }
        }
    }
);


/* ==========================================
   DELETE PRODUCT
========================================== */

async function deleteProduct(
    product
) {

    const confirmed =
        confirm(
            `Delete "${product.name || "this product"}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "products",
                product.id
            )
        );


        await loadProducts();


    } catch (error) {

        console.error(
            "Error deleting product:",
            error
        );

        alert(
            "Failed to delete product."
        );
    }
}


/* ==========================================
   INITIALIZE
========================================== */

adminReady
    .then(
        () => {

            loadProducts();

        }
    )
    .catch(
        error => {

            console.error(
                "Admin initialization error:",
                error
            );
        }
    );