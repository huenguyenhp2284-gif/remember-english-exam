import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById("loginForm");
const btnSubmit = document.getElementById("btn-submit");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Vui lòng nhập đầy đủ Email và Mật khẩu!");
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = "⏳ Đang xác thực...";

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            alert("🎉 Đăng nhập thành công!");
            
            // Chuyển ra trang chủ index.html nằm ở thư mục gốc
            window.location.href = "../index.html";
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            
            let message = "Đăng nhập thất bại!";
            if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                message = "Email hoặc mật khẩu không chính xác!";
            } else if (error.code === "auth/invalid-email") {
                message = "Định dạng Email không hợp lệ!";
            } else if (error.code === "auth/too-many-requests") {
                message = "Tài khoản bị tạm khóa do thử sai quá nhiều lần. Thử lại sau!";
            }
            
            alert("❌ " + message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Đăng nhập";
        }
    });
}