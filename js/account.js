import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Các thẻ DOM
const emailInput = document.getElementById("acc-email");
const usernameInput = document.getElementById("acc-username");
const phoneInput = document.getElementById("acc-phone");
const addressInput = document.getElementById("acc-address");
const profileForm = document.getElementById("profile-form");
const btnLogout = document.getElementById("btn-logout");
const usernameSpan = document.getElementById("username");
const userBtn = document.getElementById("user-btn");
const sellingList = document.getElementById("selling-products-list");
const boughtList = document.getElementById("bought-orders-list");

let currentUser = null;

// 1. Kiểm tra trạng thái đăng nhập

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // ĐÃ ĐĂNG NHẬP
        currentUser = user;
        if (emailInput) emailInput.value = user.email;

        try {
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                const displayName = data.username || data.name || user.email.split("@")[0];
                
                if (usernameInput) usernameInput.value = data.username || data.name || "";
                if (phoneInput) phoneInput.value = data.phone || "";
                if (addressInput) addressInput.value = data.address || "";
                if (usernameSpan) usernameSpan.textContent = displayName;
            } else {
                if (usernameSpan) usernameSpan.textContent = user.email.split("@")[0];
            }
        } catch (err) {
            console.error("Lỗi lấy thông tin user:", err);
            if (usernameSpan) usernameSpan.textContent = user.email.split("@")[0];
        }

        // Tải dữ liệu bán và mua
        loadSellingProducts(user.uid);
        loadBoughtOrders(user.uid);
    } 
});

// 2. Hàm xử lý Đăng xuất (Trở về trạng thái Guest & Đăng nhập)
function handleLogout() {
    if (confirm("bạn có muốn đăng xuất không")) {
        signOut(auth).then(() => {
            if (usernameSpan) usernameSpan.textContent = "Guest";
            alert("👋 Đã đăng xuất thành công!");
            window.location.href = "./login.html";
        }).catch((err) => {
            alert("Lỗi đăng xuất: " + err.message);
        });
    }
}

// Gán sự kiện đăng xuất cho nút Đăng xuất & nút User
if (btnLogout) btnLogout.addEventListener("click", handleLogout);

if (userBtn) {
    userBtn.addEventListener("click", () => {
        if (auth.currentUser) {
            handleLogout();
        } else {
            window.location.href = "./login.html";
        }
    });
}

// 3. Chỉnh sửa thông tin tài khoản
if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                username: usernameInput.value.trim(),
                name: usernameInput.value.trim(),
                phone: phoneInput.value.trim(),
                address: addressInput.value.trim()
            });
            if (usernameSpan) usernameSpan.textContent = usernameInput.value.trim();
            alert("🎉 Cập nhật thông tin thành công!");
        } catch (err) {
            alert("❌ Lỗi khi lưu: " + err.message);
        }
    });
}

// 4. Lấy danh sách mặt hàng BẠN ĐANG BÁN
async function loadSellingProducts(uid) {
    try {
        const q = query(collection(db, "products"), where("userId", "==", uid));
        const querySnapshot = await getDocs(q);

        if (!sellingList) return;
        sellingList.innerHTML = "";
        if (querySnapshot.empty) {
            sellingList.innerHTML = "<p style='color:#aaa;'>Bạn chưa đăng bán sản phẩm nào.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const item = docSnap.data();
            sellingList.innerHTML += `
                <div class="item-card">
                    <img src="${item.imageUrl || ''}" alt="${item.title}">
                    <h4 style="margin: 8px 0 4px; font-size:14px;">${item.title}</h4>
                    <p style="color:#27ae60; font-weight:bold; margin:0;">$${item.price}</p>
                </div>
            `;
        });
    } catch (err) {
        if (sellingList) sellingList.innerHTML = "<p style='color:#e74c3c;'>Lỗi tải sản phẩm bán.</p>";
    }
}

// 5. Lấy danh sách mặt hàng BẠN ĐÃ MUA
async function loadBoughtOrders(uid) {
    try {
        const q = query(collection(db, "orders"), where("userId", "==", uid));
        const querySnapshot = await getDocs(q);

        if (!boughtList) return;
        boughtList.innerHTML = "";
        if (querySnapshot.empty) {
            boughtList.innerHTML = "<p style='color:#aaa;'>Bạn chưa mua đơn hàng nào.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            boughtList.innerHTML += `
                <div class="order-card">
                    <div>
                        <h4 style="margin:0; color:#fff;">${order.book?.title || 'Sách'}</h4>
                        <p style="margin:4px 0 0; color:#aaa; font-size:13px;">Trạng thái: <b>${order.status || 'Chờ xác nhận'}</b></p>
                    </div>
                    <div style="text-align:right;">
                        <span style="color:#ffcc00; font-weight:bold; font-size:16px;">$${order.book?.price || 0}</span>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        if (boughtList) boughtList.innerHTML = "<p style='color:#e74c3c;'>Lỗi tải đơn hàng.</p>";
    }
}