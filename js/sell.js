import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    serverTimestamp,
    doc,
    getDoc,
    deleteDoc, 
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


import { firebaseConfig } from "./firebase-config.js";


let setupNavbarAuth;
try {
    const authModule = await import("./auth-check.js");
    setupNavbarAuth = authModule.setupNavbarAuth;
} catch (e) {
    console.warn("Chưa dùng setupNavbarAuth:", e.message);
}

if (typeof setupNavbarAuth === "function") {
    setupNavbarAuth(true);
}

// 1. KHỞI TẠO FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const usernameSpan = document.getElementById("username");
const userBtn = document.getElementById("user-btn");
const sellForm = document.getElementById("sell-form");
const productList = document.getElementById("product-list");
const loadingEl = document.getElementById("loading");
const imageFileInput = document.getElementById("p-file");
const imagePreview = document.getElementById("image-preview");
const formTitle = document.getElementById("form-title");
const btnSubmit = document.getElementById("btn-submit");
const btnCancelEdit = document.getElementById("btn-cancel-edit");
const toastEl = document.getElementById("toast");

// Trạng thái Form
let currentUser = null;
let editingId = null;
let existingImageUrl = "";
let unsubscribeSnapshot = null;

// 2. THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
        try {
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (usernameSpan) usernameSpan.textContent = userData.username || userData.name || user.email;
            } else if (usernameSpan) {
                usernameSpan.textContent = user.email ? user.email.split("@")[0] : "User";
            }
        } catch (error) {
            console.error("Lỗi thông tin user:", error);
            if (usernameSpan) usernameSpan.textContent = user.email || "User";
        }

        // Tải danh sách sản phẩm của user đang đăng nhập
        listenToProducts(user.uid);
    } else {
        if (usernameSpan) usernameSpan.textContent = "Guest";
        window.location.href = "./login.html";
    }
});

// vô acount

if (userBtn) {
    userBtn.addEventListener("click", () => {
        // Nếu đã đăng nhập
        if (auth.currentUser) {
            if (confirm("Bạn có muốn vô account không?")) {
                // Xác nhận "OK" -> Chuyển sang trang tài khoản account.html
                window.location.href = "./account.html"; 
                
            }
        } else {
            // Nếu chưa đăng nhập -> Chuyển sang trang Login
            window.location.href = "./login.html";
        }
    });
}

// 4. PREVIEW ẢNH KHI CHỌN FILE
imageFileInput.addEventListener("change", () => {
    const file = imageFileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
    } else if (!existingImageUrl) {
        imagePreview.src = "";
        imagePreview.classList.add("hidden");
    }
});

// 5. UPLOAD CLOUDINARY (An toàn)
async function uploadToCloudinary(file) {
    const cName = "hfa2eaqw";
    const uPreset = "coffee";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cName}/image/upload`, {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        throw new Error("Tải ảnh thất bại. Kiểm tra lại Cloudinary!");
    }

    const data = await res.json();
    return data.secure_url;
}

// 6. XỬ LÝ LƯU SẢN PHẨM (THÊM MỚI HOẶC SỬA)
sellForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
        showToast("Bạn cần đăng nhập trước.");
        return;
    }

    const title = document.getElementById("p-title").value.trim();
    const price = Number(document.getElementById("p-price").value);
    const desc = document.getElementById("p-desc").value.trim();
    const file = imageFileInput.files[0];

    if (!file && !existingImageUrl) {
        showToast("Vui lòng chọn hình ảnh sản phẩm!");
        return;
    }

    toggleFormDisabled(true);

    try {
        let imageUrl = existingImageUrl;
        if (file) {
            btnSubmit.textContent = "⏳ Đang tải ảnh lên Cloudinary...";
            imageUrl = await uploadToCloudinary(file);
        }

        btnSubmit.textContent = "⏳ Đang lưu dữ liệu...";

        const payload = {
            title: title,
            price: price,
            description: desc,
            imageUrl: imageUrl,
            userId: currentUser.uid,
            userEmail: currentUser.email || "",
            updatedAt: serverTimestamp()
        };

        if (editingId) {
            await updateDoc(doc(db, "products", editingId), payload);
            showToast("🎉 Cập nhật sản phẩm thành công!");
        } else {
            await addDoc(collection(db, "products"), {
                ...payload,
                createdAt: serverTimestamp()
            });
            showToast("🎉 Đăng bán sản phẩm thành công!");
        }

        resetForm();
    } catch (error) {
        console.error(error);
        showToast("❌ Có lỗi xảy ra: " + error.message);
    } finally {
        toggleFormDisabled(false);
    }
});

// 7. LẮNG NGHE SẢN PHẨM REALTIME
function listenToProducts(uid) {
    if (unsubscribeSnapshot) unsubscribeSnapshot();

    if (loadingEl) loadingEl.classList.remove("hidden");

    const q = query(
        collection(db, "products"),
        where("userId", "==", uid)
    );

    unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        if (loadingEl) loadingEl.classList.add("hidden");
        productList.innerHTML = "";

        if (snapshot.empty) {
            productList.innerHTML = "<p class='state' style='grid-column: 1/-1;'>Chưa có sản phẩm nào được đăng.</p>";
            return;
        }

        const items = [];
        snapshot.forEach((docItem) => {
            items.push({ id: docItem.id, ...docItem.data() });
        });

        // Sắp xếp sản phẩm mới nhất lên đầu
        items.sort((a, b) => {
            const timeA = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : Date.now();
            const timeB = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : Date.now();
            return timeB - timeA;
        });

        items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "product-card";

            card.innerHTML = `
                <div>
                    <img src="${item.imageUrl || ''}" alt="${escapeHtml(item.title)}">
                    <h3>${escapeHtml(item.title || 'Chưa có tên')}</h3>
                    <p class="price">$${item.price || 0}</p>
                    <p class="desc">${escapeHtml(item.description || '')}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-edit" data-id="${item.id}">✏️ Sửa</button>
                    <button class="btn-delete" data-id="${item.id}">🗑️ Xóa</button>
                </div>
            `;

            // Nút Sửa
            card.querySelector(".btn-edit").addEventListener("click", () => startEdit(item));

            // Nút Xóa
            card.querySelector(".btn-delete").addEventListener("click", () => removeProduct(item.id, item.title));

            productList.appendChild(card);
        });
    }, (error) => {
        if (loadingEl) loadingEl.classList.add("hidden");
        console.error("Lỗi Firestore realtime:", error);
        showToast("Lỗi tải danh sách: " + error.message);
    });
}

// 8. CHUYỂN CHẾ ĐỘ SỬA SẢN PHẨM
function startEdit(item) {
    editingId = item.id;
    existingImageUrl = item.imageUrl || "";

    document.getElementById("p-title").value = item.title || "";
    document.getElementById("p-price").value = item.price ?? "";
    document.getElementById("p-desc").value = item.description || "";

    formTitle.textContent = "✏️ Cập Nhật Sản Phẩm";
    btnSubmit.textContent = "💾 Lưu Thay Đổi";
    btnCancelEdit.classList.remove("hidden");

    if (existingImageUrl) {
        imagePreview.src = existingImageUrl;
        imagePreview.classList.remove("hidden");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// 9. XÓA SẢN PHẨM
async function removeProduct(id, title) {
    if (confirm(`🗑️ Bạn có chắc chắn muốn xóa "${title}" không?`)) {
        try {
            await deleteDoc(doc(db, "products", id));
            showToast("✅ Đã xóa sản phẩm thành công!");
            if (editingId === id) resetForm();
        } catch (err) {
            showToast("❌ Lỗi khi xóa: " + err.message);
        }
    }
}

// 10. HỦY SỬA VÀ RESET FORM
btnCancelEdit.addEventListener("click", resetForm);

function resetForm() {
    editingId = null;
    existingImageUrl = "";
    sellForm.reset();
    formTitle.textContent = "🚀 Đăng Bán Sản Phẩm";
    btnSubmit.textContent = "🚀 Đăng Bán Ngay";
    btnCancelEdit.classList.add("hidden");
    imagePreview.src = "";
    imagePreview.classList.add("hidden");
}

function toggleFormDisabled(disabled) {
    const controls = sellForm.querySelectorAll("input, textarea, button");
    controls.forEach((control) => {
        control.disabled = disabled;
    });
}

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toastEl.classList.add("hidden");
    }, 2500);
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}