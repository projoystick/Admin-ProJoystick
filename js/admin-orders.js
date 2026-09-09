/* ==========================================
   PROJOYSTICK — ADMIN ORDERS
========================================== */

import {
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ==========================================
   ELEMENTS
========================================== */

const customerMessage =
    document.getElementById(
        "customerMessage"
    );

const saveCustomerMessageBtn =
    document.getElementById(
        "saveCustomerMessageBtn"
    );

const ordersTableBody =
    document.getElementById(
        "ordersTableBody"
    );

const ordersLoading =
    document.getElementById(
        "ordersLoading"
    );

const orderStatusFilter =
    document.getElementById(
        "orderStatusFilter"
    );

const refreshOrdersBtn =
    document.getElementById(
        "refreshOrdersBtn"
    );

const orderModal =
    document.getElementById(
        "orderModal"
    );

const closeOrderModal =
    document.getElementById(
        "closeOrderModal"
    );

const cancelOrderBtn =
    document.getElementById(
        "cancelOrderBtn"
    );

const detailOrderId =
    document.getElementById(
        "detailOrderId"
    );

const detailOrderDate =
    document.getElementById(
        "detailOrderDate"
    );

const detailPaymentStatus =
    document.getElementById(
        "detailPaymentStatus"
    );

const detailOrderStatus =
    document.getElementById(
        "detailOrderStatus"
    );

const detailOrderTotal =
    document.getElementById(
        "detailOrderTotal"
    );

const detailCustomerName =
    document.getElementById(
        "detailCustomerName"
    );

const detailCustomerEmail =
    document.getElementById(
        "detailCustomerEmail"
    );

const detailPaymentMethod =
    document.getElementById(
        "detailPaymentMethod"
    );

const detailTransactionId =
    document.getElementById(
        "detailTransactionId"
    );

const orderItemsContainer =
    document.getElementById(
        "orderItemsContainer"
    );

const deliveryInformationContainer =
    document.getElementById(
        "deliveryInformationContainer"
    );


/* ==========================================
   STATE
========================================== */

let ordersCache = [];

let selectedOrder = null;


/* ==========================================
   LOAD ORDERS
========================================== */

async function loadOrders() {

    if (!ordersTableBody) {
        return;
    }

    try {

        showLoading(true);

        const ordersRef =
            collection(
                db,
                "orders"
            );

        let ordersQuery;

        try {

            ordersQuery =
                query(
                    ordersRef,
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                );

        } catch (error) {

            console.warn(
                "Could not create ordered query:",
                error
            );

            ordersQuery =
                ordersRef;

        }

        const snapshot =
            await getDocs(
                ordersQuery
            );

        ordersCache =
            snapshot.docs.map(
                orderDoc => {

                    const data =
                        orderDoc.data();

                    return {
                        id: orderDoc.id,
                        ...data
                    };

                }
            );

        renderOrders();

    } catch (error) {

        console.error(
            "Error loading orders:",
            error
        );

        ordersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="admin-table-empty"
                >
                    Failed to load orders.
                </td>

            </tr>

        `;

    } finally {

        showLoading(false);

    }

}


/* ==========================================
   SHOW LOADING
========================================== */

function showLoading(show) {

    if (!ordersLoading) {
        return;
    }

    ordersLoading.style.display =
        show
            ? "block"
            : "none";

}


/* ==========================================
   RENDER ORDERS
========================================== */

function renderOrders() {

    if (!ordersTableBody) {
        return;
    }

    const filter =
        orderStatusFilter
            ? orderStatusFilter.value
            : "all";

    let orders =
        [...ordersCache];

    if (filter !== "all") {

        orders =
            orders.filter(
                order =>
                    getOrderStatus(order)
                        .toLowerCase() ===
                    filter.toLowerCase()
            );

    }

    if (!orders.length) {

        ordersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="admin-table-empty"
                >
                    No orders found.
                </td>

            </tr>

        `;

        return;

    }

    ordersTableBody.innerHTML =
        orders
            .map(
                order =>
                    createOrderRow(
                        order
                    )
            )
            .join("");

    attachOrderActions();

}


/* ==========================================
   CREATE ORDER ROW
========================================== */

function createOrderRow(order) {

    const customerName =
        getSafeString(
            order.customerName,
            order.userName,
            order.name,
            "Unknown"
        );

    const customerEmail =
        getSafeString(
            order.userEmail,
            order.customerEmail,
            order.email,
            "—"
        );

    const total =
        Number(
            order.total ??
            order.totalAmount ??
            0
        );

    const paymentStatus =
        getSafeString(
            order.paymentStatus,
            "pending"
        ).toLowerCase();

    const orderStatus =
        getOrderStatus(
            order
        ).toLowerCase();

    const createdAt =
        formatDate(
            order.createdAt
        );

    const itemCount =
        getItemCount(
            order
        );

    const displayOrderId =
        getOrderDisplayId(
            order
        );

    return `

        <tr>

            <td>

                <strong>
                    ${escapeHtml(
                        displayOrderId
                    )}
                </strong>

            </td>


            <td>

                <div>

                    <strong>
                        ${escapeHtml(
                            customerName
                        )}
                    </strong>

                </div>

            </td>


            <td>
                ${itemCount}
            </td>


            <td>
                ₹${formatNumber(total)}
            </td>


            <!-- PAYMENT STATUS -->

            <td>

                <span
                    class="admin-status payment-status status-${escapeHtml(
                        paymentStatus
                    )}"
                >

                    ${escapeHtml(
                        formatPaymentStatus(
                            paymentStatus
                        )
                    )}

                </span>

            </td>


            <!-- ORDER STATUS -->

            <td>

                <span
                    class="admin-status order-status status-${escapeHtml(
                        orderStatus
                    )}"
                >

                    ${escapeHtml(
                        capitalize(
                            orderStatus
                        )
                    )}

                </span>

            </td>


            <td>

                ${escapeHtml(
                    createdAt
                )}

            </td>


            <td>

                <button
                    type="button"
                    class="admin-secondary-btn view-order-btn"
                    data-order-id="${escapeHtml(
                        order.id
                    )}"
                >
                    View
                </button>

            </td>

        </tr>

    `;
}


/* ==========================================
   ATTACH ORDER ACTIONS
========================================== */

function attachOrderActions() {

    const buttons =
        document.querySelectorAll(
            ".view-order-btn"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const orderId =
                        button.dataset.orderId;

                    openOrderModal(
                        orderId
                    );

                }
            );

        }
    );

}


/* ==========================================
   OPEN ORDER MODAL
========================================== */

function openOrderModal(orderId) {

    const order =
        ordersCache.find(
            item =>
                item.id === orderId
        );

    if (!order) {
        return;
    }

    selectedOrder =
        order;

    setText(
        detailOrderId,
        getOrderDisplayId(
            order
        )
    );

    setText(
        detailOrderDate,
        formatDate(
            order.createdAt
        )
    );

    setText(
        detailPaymentStatus,
        formatPaymentStatus(
            getSafeString(
                order.paymentStatus,
                "pending"
            )
        )
    );

    setText(
        detailOrderStatus,
        capitalize(
            getOrderStatus(
                order
            )
        )
    );

    setText(
        detailOrderTotal,
        `₹${formatNumber(
            Number(
                order.total ??
                order.totalAmount ??
                0
            )
        )}`
    );

    setText(
        detailCustomerName,
        getSafeString(
            order.customerName,
            order.userName,
            order.name,
            "Unknown"
        )
    );

    setText(
        detailCustomerEmail,
        getSafeString(
            order.userEmail,
            order.customerEmail,
            order.email,
            "—"
        )
    );

    setText(
        detailPaymentMethod,
        getSafeString(
            order.paymentMethod,
            "—"
        )
    );

    setText(
        detailTransactionId,
        getSafeString(
            order.transactionId,
            order.paymentId,
            "—"
        )
    );

    renderOrderItems(
        order
    );

    renderDeliveryInformation(
        order
    );

    renderCustomerMessage(
        order
    );

    updateOrderStatusControls(
        order
    );

    if (orderModal) {

        orderModal.classList.add(
            "active"
        );

        orderModal.setAttribute(
            "aria-hidden",
            "false"
        );

    }

}


/* ==========================================
   CLOSE ORDER MODAL
========================================== */

function closeModal() {

    selectedOrder =
        null;

    if (!orderModal) {
        return;
    }

    orderModal.classList.remove(
        "active"
    );

    orderModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* ==========================================
   RENDER ORDER ITEMS
========================================== */

function renderOrderItems(order) {

    if (!orderItemsContainer) {
        return;
    }

    const items =
        Array.isArray(
            order.items
        )
            ? order.items
            : [];

    if (!items.length) {

        orderItemsContainer.innerHTML = `

            <p>
                No order items available.
            </p>

        `;

        return;

    }

    orderItemsContainer.innerHTML =
        items
            .map(
                item => {

                    const productName =
                        getSafeString(
                            item.name,
                            item.productName,
                            "Product"
                        );

                    const gameName =
                        getSafeString(
                            item.game,
                            "Unknown Game"
                        );

                    const amount =
                        getSafeString(
                            item.amount,
                            ""
                        );

                    const quantity =
                        Number(
                            item.quantity ??
                            1
                        );

                    const price =
                        Number(
                            item.price ??
                            0
                        );

                    let amountHTML =
                        "";

                    if (amount) {

                        amountHTML = `

                            <span>
                                ${escapeHtml(
                                    amount
                                )}
                            </span>

                        `;

                    }

                    return `

                        <div
                            class="admin-order-item"
                        >

                            <strong>
                                ${escapeHtml(
                                    productName
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    gameName
                                )}
                            </span>

                            ${amountHTML}

                            <span>
                                Qty:
                                ${quantity}
                            </span>

                            <span>
                                ₹${formatNumber(
                                    price
                                )}
                            </span>

                        </div>

                    `;

                }
            )
            .join("");

}


/* ==========================================
   RENDER DELIVERY INFORMATION
========================================== */

function renderDeliveryInformation(order) {

    if (!deliveryInformationContainer) {
        return;
    }

    const delivery =
        order.deliveryInfo ??
        order.deliveryFields ??
        order.delivery ??
        null;

    if (
        !delivery ||
        typeof delivery !== "object" ||
        Array.isArray(delivery) ||
        Object.keys(delivery).length === 0
    ) {

        deliveryInformationContainer.innerHTML = `

            <p>
                No delivery information provided.
            </p>

        `;

        return;

    }

    const rows = [];

    function collectFields(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            return;
        }

        Object.entries(data).forEach(
            ([key, value]) => {

                /*
                    Hide the game Firestore ID.
                */

                if (
                    /^[A-Za-z0-9]{15,25}$/.test(
                        key
                    ) &&
                    value &&
                    typeof value === "object"
                ) {

                    collectFields(
                        value
                    );

                    return;

                }

                /*
                    Remove the "Fields"
                    wrapper.
                */

                if (
                    key.toLowerCase() ===
                    "fields" &&
                    value &&
                    typeof value === "object"
                ) {

                    collectFields(
                        value
                    );

                    return;

                }

                /*
                    Handle nested objects.
                */

                if (
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value) &&
                    typeof value.toDate !==
                        "function"
                ) {

                    collectFields(
                        value
                    );

                    return;

                }

                rows.push({

                    label:
                        formatLabel(
                            key
                        ),

                    value:
                        formatDeliveryValue(
                            value
                        )

                });

            }
        );

    }

    collectFields(
        delivery
    );

    if (!rows.length) {

        deliveryInformationContainer.innerHTML = `

            <p>
                No delivery information provided.
            </p>

        `;

        return;

    }

    deliveryInformationContainer.innerHTML =
        rows
            .map(
                row => `

                    <div
                        class="admin-order-item"
                    >

                        <strong>
                            ${escapeHtml(
                                row.label
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                row.value
                            )}
                        </span>

                    </div>

                `
            )
            .join("");

}


/* ==========================================
   FORMAT DELIVERY VALUE
========================================== */

function formatDeliveryValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {

        return String(
            value
        );

    }

    if (
        typeof value?.toDate ===
        "function"
    ) {

        return formatDate(
            value
        );

    }

    if (
        typeof value === "object"
    ) {

        try {

            return Object.entries(
                value
            )
                .map(
                    ([key, nestedValue]) =>
                        `${formatLabel(
                            key
                        )}: ${formatDeliveryValue(
                            nestedValue
                        )}`
                )
                .join(" • ");

        } catch {

            return "—";

        }

    }

    return String(
        value
    );

}


/* ==========================================
   RENDER CUSTOMER MESSAGE
========================================== */

function renderCustomerMessage(order) {

    if (!customerMessage) {
        return;
    }

    customerMessage.value =
        getSafeString(
            order.adminMessage,
            ""
        );

}

/* ==========================================
   SAVE CUSTOMER MESSAGE
========================================== */

async function saveCustomerMessage() {

    if (
        !selectedOrder ||
        !customerMessage
    ) {
        return;
    }

    const orderId =
        selectedOrder.id;

    const message =
        customerMessage.value.trim();

    try {

        if (saveCustomerMessageBtn) {

            saveCustomerMessageBtn.disabled =
                true;

            saveCustomerMessageBtn.textContent =
                "Saving...";

        }

        await updateDoc(
            doc(
                db,
                "orders",
                orderId
            ),
            {
                adminMessage:
                    message
            }
        );

        const index =
            ordersCache.findIndex(
                order =>
                    order.id ===
                    orderId
            );

        if (index !== -1) {

            ordersCache[index] = {

                ...ordersCache[index],

                adminMessage:
                    message

            };

            selectedOrder =
                ordersCache[index];

        }

        if (saveCustomerMessageBtn) {

            saveCustomerMessageBtn.textContent =
                "Saved";

            setTimeout(() => {

                if (
                    saveCustomerMessageBtn
                ) {

                    saveCustomerMessageBtn.textContent =
                        "Save Message";

                }

            }, 1500);

        }

    } catch (error) {

        console.error(
            "Error saving customer message:",
            error
        );

        alert(
            "Failed to save customer message."
        );

        if (saveCustomerMessageBtn) {

            saveCustomerMessageBtn.textContent =
                "Save Message";

        }

    } finally {

        if (saveCustomerMessageBtn) {

            saveCustomerMessageBtn.disabled =
                false;

        }

    }

}


/* ==========================================
   UPDATE STATUS CONTROLS
========================================== */

function updateOrderStatusControls(order) {

    if (!orderModal) {
        return;
    }

    let controls =
        document.getElementById(
            "orderStatusControls"
        );

    if (!controls) {

        controls =
            document.createElement(
                "div"
            );

        controls.id =
            "orderStatusControls";

        controls.className =
            "admin-order-status-controls";

        const modalContent =
            orderModal.querySelector(
                ".admin-modal-content"
            );

        if (modalContent) {

            modalContent.insertBefore(
                controls,
                modalContent.firstElementChild
            );

        } else {

            orderModal.appendChild(
                controls
            );

        }

    }

    const paymentStatus =
        getSafeString(
            order.paymentStatus,
            "pending"
        ).toLowerCase();

    const orderStatus =
        getOrderStatus(
            order
        ).toLowerCase();

    controls.innerHTML = `

        <div class="admin-order-action-group">

            <strong>
                Payment
            </strong>

            <div class="admin-order-status-buttons">

                <button
                    type="button"
                    class="admin-order-status-btn ${
                        paymentStatus === "pending"
                            ? "active"
                            : ""
                    }"
                    data-order-payment="pending"
                >
                    Pending
                </button>

                <button
                    type="button"
                    class="admin-order-status-btn ${
                        paymentStatus === "failed"
                            ? "active"
                            : ""
                    }"
                    data-order-payment="failed"
                >
                    Failed
                </button>

                <button
                    type="button"
                    class="admin-order-status-btn ${
                        paymentStatus === "paid"
                            ? "active"
                            : ""
                    }"
                    data-order-payment="paid"
                >
                    Paid
                </button>

                <button
                    type="button"
                    class="admin-order-status-btn ${
                        paymentStatus === "refund"
                            ? "active"
                            : ""
                    }"
                    data-order-payment="refund"
                >
                    Refunded
                </button>

            </div>

        </div>

        <div class="admin-order-action-group">

            <strong>
                Order
            </strong>

            <div class="admin-order-status-buttons">

                <button
                    type="button"
                    class="admin-order-status-btn ${
                        orderStatus === "pending"
                            ? "active"
                            : ""
                    }"
                    data-order-status="pending"
                >
                    Pending
                </button>

                <button
                    type="button"
                    class="admin-order-status-btn ${
                        orderStatus === "processing"
                            ? "active"
                            : ""
                    }"
                    data-order-status="processing"
                >
                    Processing
                </button>

                <button
                    type="button"
                    class="admin-order-status-btn ${
                        orderStatus === "completed"
                            ? "active"
                            : ""
                    }"
                    data-order-status="completed"
                >
                    Completed
                </button>

                <button
                    type="button"
                    class="admin-order-status-btn ${
                        orderStatus === "cancelled"
                            ? "active"
                            : ""
                    }"
                    data-order-status="cancelled"
                >
                    Cancelled
                </button>

            </div>

        </div>

    `;

    attachStatusButtonEvents(
        controls
    );

}


/* ==========================================
   ATTACH STATUS BUTTON EVENTS
========================================== */

function attachStatusButtonEvents(
    controls
) {

    const paymentButtons =
        controls.querySelectorAll(
            "[data-order-payment]"
        );

    paymentButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const status =
                        button.dataset.orderPayment;

                    updatePaymentStatus(
                        status
                    );

                }
            );

        }
    );

    const orderButtons =
        controls.querySelectorAll(
            "[data-order-status]"
        );

    orderButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const status =
                        button.dataset.orderStatus;

                    updateOrderStatus(
                        status
                    );

                }
            );

        }
    );

}


/* ==========================================
   UPDATE PAYMENT STATUS
========================================== */

async function updatePaymentStatus(
    status
) {

    if (!selectedOrder) {
        return;
    }

    const orderId =
        selectedOrder.id;

    const updateData = {
        paymentStatus:
            status
    };

    /*
        paymentVerified is true only
        when payment is marked paid.
    */

    if (status === "paid") {

        updateData.paymentVerified =
            true;

    } else {

        updateData.paymentVerified =
            false;

    }

    try {

        await updateDoc(
            doc(
                db,
                "orders",
                orderId
            ),
            updateData
        );

        const index =
            ordersCache.findIndex(
                order =>
                    order.id ===
                    orderId
            );

        if (index !== -1) {

            ordersCache[index] = {

                ...ordersCache[index],

                ...updateData

            };

            selectedOrder =
                ordersCache[index];

        }

        renderOrders();

        openOrderModal(
            orderId
        );

    } catch (error) {

        console.error(
            "Error updating payment status:",
            error
        );

        alert(
            "Failed to update payment status."
        );

    }

}


/* ==========================================
   UPDATE ORDER STATUS
========================================== */

async function updateOrderStatus(
    status
) {

    if (!selectedOrder) {
        return;
    }

    const orderId =
        selectedOrder.id;

    const updateData = {

        orderStatus:
            status

    };

    try {

        await updateDoc(
            doc(
                db,
                "orders",
                orderId
            ),
            updateData
        );

        const index =
            ordersCache.findIndex(
                order =>
                    order.id ===
                    orderId
            );

        if (index !== -1) {

            ordersCache[index] = {

                ...ordersCache[index],

                ...updateData

            };

            selectedOrder =
                ordersCache[index];

        }

        renderOrders();

        openOrderModal(
            orderId
        );

    } catch (error) {

        console.error(
            "Error updating order status:",
            error
        );

        alert(
            "Failed to update order status."
        );

    }

}


/* ==========================================
   GET ORDER STATUS
========================================== */

function getOrderStatus(order) {

    return getSafeString(
        order.orderStatus,
        order.status,
        "pending"
    ).toLowerCase();

}


/* ==========================================
   GET ORDER DISPLAY ID
========================================== */

function getOrderDisplayId(order) {

    return getSafeString(
        order.orderId,
        order.id,
        "—"
    );

}


/* ==========================================
   GET ITEM COUNT
========================================== */

function getItemCount(order) {

    if (
        Array.isArray(
            order.items
        )
    ) {

        return order.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item?.quantity ??
                    1
                ),
            0
        );

    }

    return Number(
        order.itemCount ??
        order.quantity ??
        0
    );

}


/* ==========================================
   FORMAT DATE
========================================== */

function formatDate(value) {

    if (!value) {
        return "—";
    }

    try {

        if (
            typeof value.toDate ===
            "function"
        ) {

            return value
                .toDate()
                .toLocaleString(
                    "en-IN"
                );

        }

        const date =
            new Date(
                value
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }

        return date.toLocaleString(
            "en-IN"
        );

    } catch {

        return "—";

    }

}


/* ==========================================
   STATUS CLASS
========================================== */

function getStatusClass(status) {

    const value =
        String(
            status ||
            ""
        ).toLowerCase();

    if (
        value === "paid" ||
        value === "completed"
    ) {

        return "status-success";

    }

    if (
        value === "cancelled" ||
        value === "failed" ||
        value === "refund"
    ) {

        return "status-danger";

    }

    if (
        value === "processing"
    ) {

        return "status-warning";

    }

    return "status-pending";

}


/* ==========================================
   FORMAT PAYMENT STATUS
========================================== */

function formatPaymentStatus(
    status
) {

    const value =
        String(
            status ||
            "pending"
        ).toLowerCase();

    if (
        value === "refund"
    ) {

        return "Refunded";

    }

    if (
        value === "paid"
    ) {

        return "Paid";

    }

    if (
        value === "failed"
    ) {

        return "Failed";

    }

    return "Pending";

}


/* ==========================================
   FORMAT NUMBER
========================================== */

function formatNumber(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );

}


/* ==========================================
   CAPITALIZE
========================================== */

function capitalize(value) {

    return String(
        value || ""
    )
        .replace(
            /[\\_-]/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


/* ==========================================
   FORMAT LABEL
========================================== */

function formatLabel(value) {

    return String(
        value || ""
    )
        .replace(
            /([A-Z])/g,
            " $1"
        )
        .replace(
            /[\\_-]/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        )
        .trim();

}


/* ==========================================
   SAFE STRING
========================================== */

function getSafeString(
    ...values
) {

    for (
        const value of values
    ) {

        if (
            value === null ||
            value === undefined
        ) {
            continue;
        }

        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {

            const result =
                String(
                    value
                ).trim();

            if (result) {
                return result;
            }

        }

    }

    return "—";

}


/* ==========================================
   SET TEXT
========================================== */

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }

    element.textContent =
        value ?? "—";

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
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
   EVENTS
========================================== */

if (orderStatusFilter) {

    orderStatusFilter.addEventListener(
        "change",
        renderOrders
    );

}


if (refreshOrdersBtn) {

    refreshOrdersBtn.addEventListener(
        "click",
        loadOrders
    );

}


if (closeOrderModal) {

    closeOrderModal.addEventListener(
        "click",
        closeModal
    );

}


if (cancelOrderBtn) {

    cancelOrderBtn.addEventListener(
        "click",
        closeModal
    );

}


if (orderModal) {

    orderModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                orderModal
            ) {

                closeModal();

            }

        }
    );

}


/* ==========================================
   INITIAL LOAD
========================================== */

loadOrders();