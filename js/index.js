import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usernameSpan = document.getElementById("username");
const userBtn = document.getElementById("user-btn");

// 1. TỰ ĐỘNG LẤY TÊN NGƯỜI DÙNG CHÍNH XÁC KHI TẢI TRANG
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Lấy thông tin user trong Firestore collection "users" theo UID
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                // Ưu tiên hiển thị: username -> name -> email
                if (usernameSpan) {
                    usernameSpan.textContent = userData.username || userData.name || user.email;
                }
            } else {
                // Nếu chưa có doc trong Firestore, lấy phần chữ trước @ của email
                if (usernameSpan) {
                    usernameSpan.textContent = user.email ? user.email.split("@")[0] : "User";
                }
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu từ Firestore:", error);
            if (usernameSpan) usernameSpan.textContent = user.email || "Guest";
        }
    } else {
        if (usernameSpan) {
            usernameSpan.textContent = "Guest";
        }
    }
});

// 2. vo acount

if (userBtn) {
    userBtn.addEventListener("click", () => {
        // Nếu đã đăng nhập
        if (auth.currentUser) {
            if (confirm("Bạn có muốn vô account không?")) {
                // Xác nhận "OK" -> Chuyển sang trang tài khoản account.html
                window.location.href = "./html/account.html"; 
               
            }
        } else {
            // Nếu chưa đăng nhập -> Chuyển sang trang Login
            window.location.href = "./login.html";
        }
    });
}