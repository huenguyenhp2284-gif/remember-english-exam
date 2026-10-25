import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    addDoc, 
    collection, 
    serverTimestamp, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// 1. Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. Lấy các phần tử DOM
const usernameSpan = document.getElementById("username");
const userBtn = document.getElementById("user-btn");
const productSummary = document.getElementById("product-summary");
const totalPriceEl = document.getElementById("total-price");
const qrcodeDiv = document.getElementById("qrcode");
const checkoutForm = document.getElementById("checkout-form");
const btnSubmit = document.getElementById("btn-submit-order");

let currentUserState = null;

// 3. Hiển thị ảnh QR Chuyển Khoản
if (qrcodeDiv) {
    qrcodeDiv.innerHTML = `
        <img src="../imgandvd/chuyenkhoang.png" 
             alt="Mã QR Chuyển Khoản" 
             style="width: 100%; max-width: 220px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: block; margin: 0 auto;">
    `;
}

// 4. Xử lý Trạng thái Đăng nhập, Tên người dùng & Nút Đăng xuất
onAuthStateChanged(auth, async (user) => {
    currentUserState = user;
    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (usernameSpan) {
                    usernameSpan.textContent = userData.username || userData.name || user.email.split("@")[0];
                }
                
                // Tự động điền thông tin nếu đã lưu trong Firestore
                const fullnameInput = document.getElementById("fullname");
                const phoneInput = document.getElementById("phone");
                const addressInput = document.getElementById("address");

                if (fullnameInput && !fullnameInput.value) fullnameInput.value = userData.name || "";
                if (phoneInput && !phoneInput.value) phoneInput.value = userData.phone || "";
                if (addressInput && !addressInput.value) addressInput.value = userData.address || "";
            } else {
                if (usernameSpan) usernameSpan.textContent = user.email ? user.email.split("@")[0] : "User";
            }
        } catch (error) {
            console.error("Lỗi lấy thông tin user:", error);
            if (usernameSpan) usernameSpan.textContent = user.email ? user.email.split("@")[0] : "User";
        }
    } else {
        if (usernameSpan) usernameSpan.textContent = "Guest";
    }
});

// Sự kiện click nút User (Đăng xuất)
if (userBtn) {
    userBtn.addEventListener("click", () => {
        if (currentUserState) {
            if (confirm("Bạn có muốn đăng xuất tài khoản không?")) {
                signOut(auth)
                    .then(() => {
                        alert("👋 Đã đăng xuất!");
                        window.location.href = "./login.html";
                    })
                    .catch((error) => {
                        alert("Đăng xuất thất bại: " + error.message);
                    });
            }
        } else {
            window.location.href = "./login.html";
        }
    });
}

// 5. Đọc dữ liệu sách được chọn từ localStorage
const selectedProductRaw = localStorage.getItem("selectedProduct");
let selectedProduct = null;

if (selectedProductRaw) {
    try {
        selectedProduct = JSON.parse(selectedProductRaw);
        
        if (productSummary) {
            productSummary.innerHTML = `
                <div style="display: flex; gap: 15px; align-items: center; text-align: left; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <img src="${selectedProduct.image}" alt="${selectedProduct.title}" style="width: 80px; height: 105px; object-fit: cover; border-radius: 6px;">
                    <div>
                        <h3 style="margin: 0 0 6px 0; color: #fff; font-size: 16px;">${selectedProduct.title}</h3>
                        <p style="margin: 0; color: #aaa; font-size: 13px;">Thể loại: ${selectedProduct.category || "Sách"}</p>
                        <p style="margin: 6px 0 0 0; font-weight: bold; color: #e74c3c; font-size: 18px;">Giá: $${selectedProduct.price}</p>
                    </div>
                </div>
            `;
        }

        if (totalPriceEl) {
            totalPriceEl.textContent = `$${selectedProduct.price}`;
        }
    } catch (e) {
        console.error("Lỗi dữ liệu sản phẩm:", e);
    }
} else {
    if (productSummary) {
        productSummary.innerHTML = `<p style="color: #ff6b6b; text-align: center; font-weight: bold;">Chưa chọn sản phẩm nào. <a href="./write.html" style="color:#4ecdc4;">Quay lại cửa hàng</a></p>`;
    }
    if (btnSubmit) btnSubmit.disabled = true;
}

// 6. Lưu đơn hàng lên Firestore khi gửi form
if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentUserState) {
            alert("Vui lòng đăng nhập trước khi đặt hàng!");
            window.location.href = "./login.html";
            return;
        }

        if (!selectedProduct) {
            alert("Vui lòng chọn sản phẩm trước khi thanh toán!");
            return;
        }

        const fullName = document.getElementById("fullname").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const address = document.getElementById("address").value.trim();

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang xử lý...`;

        try {
            await addDoc(collection(db, "orders"), {
                userId: currentUserState.uid,
                userEmail: currentUserState.email,
                customerName: fullName,
                phone: phone,
                shippingAddress: address,
                book: {
                    id: selectedProduct.id,
                    title: selectedProduct.title,
                    price: selectedProduct.price,
                    image: selectedProduct.image
                },
                status: "Chờ xác nhận",
                createdAt: serverTimestamp()
            });

            const userDocRef = doc(db, "users", currentUserState.uid);
            await updateDoc(userDocRef, {
                name: fullName,
                phone: phone,
                address: address
            }).catch(() => {});

            localStorage.removeItem("selectedProduct");

            const successOverlay = document.getElementById("success-overlay");
            if (successOverlay) {
                successOverlay.classList.add("active");
            }

        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            alert("Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fas fa-check-circle"></i> Xác Nhận Đặt Hàng & Giao Hàng`;
        }
    });
}