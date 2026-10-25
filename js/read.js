import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usernameSpan = document.getElementById("username");
const userBtn = document.getElementById("user-btn");

onAuthStateChanged(auth, async (user) => {
    if (user && usernameSpan) {
        try {
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            usernameSpan.textContent = userDocSnap.exists() ? (userDocSnap.data().username || userDocSnap.data().name || user.email) : user.email.split("@")[0];
        } catch (error) {
            usernameSpan.textContent = user.email || "Guest";
        }
    } else if (usernameSpan) {
        usernameSpan.textContent = "Guest";
    }
});

if (userBtn) {
    userBtn.addEventListener("click", () => {
        if (auth.currentUser) {
            if (confirm("Bạn có muốn vào trang tài khoản không?")) window.location.href = "./account.html";
        } else {
            window.location.href = "./login.html";
        }
    });
}

// 🌐 DANH SÁCH RSS FEED CHUẨN XÁC CHO TỪNG CHỦ ĐỀ
const MULTI_FEEDS = {
    general: [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.theguardian.com/world/rss",
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
    ],
    technology: [
        "https://feeds.bbci.co.uk/news/technology/rss.xml",
        "https://techcrunch.com/feed/",
        "https://www.theverge.com/rss/index.xml"
    ],
    business: [
        "https://feeds.bbci.co.uk/news/business/rss.xml",
        "https://www.cnbc.com/id/100003114/device/rss/rss.html",
        "https://www.forbes.com/business/feed/"
    ],
    sports: [
        "https://feeds.bbci.co.uk/sport/rss.xml",
        "https://www.espn.com/espn/rss/news"
    ],
    entertainment: [
        "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
        "https://variety.com/feed/"
    ]
};

// 📦 DỮ LIỆU DỰ PHÒNG RIÊNG BIỆT CHO TỪNG TAB ĐỂ KHÔNG BỊ TRÙNG LẶP
const CATEGORY_BACKUPS = {
    general: [
        { title: "Global Climate Summit Reaches Historic Agreement on Renewable Energy", description: "World leaders unite to pledge significant funding for green transition and carbon emission reductions over the next decade.", image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=600", url: "https://www.bbc.com/news", source: "BBC World", pubDate: "Mới cập nhật" },
        { title: "International Space Station Welcomes New Crew of Astronauts", description: "A successful launch from Cape Canaveral brings four new researchers to conduct microgravity experiments in orbit.", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600", url: "https://www.reuters.com", source: "Reuters", pubDate: "Mới cập nhật" },
        { title: "Major Archaeological Discovery Uncovered in Ancient City", description: "Researchers unearth well-preserved artifacts shedding light on trade routes from thousands of years ago.", image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600", url: "https://www.theguardian.com", source: "The Guardian", pubDate: "Mới cập nhật" }
    ],
    technology: [
        { title: "Next-Generation Quantum Processors Achieve Record Stability", description: "Scientists unveil a breakthrough in error-correction methods, bringing practical quantum computing closer to reality.", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600", url: "https://techcrunch.com", source: "TechCrunch", pubDate: "Mới cập nhật" },
        { title: "Open-Source AI Models Empower Small Businesses Worldwide", description: "Affordable and flexible machine learning frameworks allow local shops to automate customer service efficiently.", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600", url: "https://www.theverge.com", source: "The Verge", pubDate: "Mới cập nhật" },
        { title: "Cybersecurity Experts Warn of Sophisticated Phishing Attacks", description: "New guidelines released to help enterprises protect their cloud infrastructure against emerging threat vectors.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600", url: "https://www.wired.com", source: "Wired", pubDate: "Mới cập nhật" }
    ],
    business: [
        { title: "Global Supply Chains Adapt to Modern Logistics Technologies", description: "Automation and blockchain tracking help shipping companies reduce delays and optimize delivery routes.", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600", url: "https://www.cnbc.com", source: "CNBC", pubDate: "Mới cập nhật" },
        { title: "Renewable Energy Investments Outpace Fossil Fuels in Q3", description: "Financial reports indicate a massive shift in venture capital toward solar, wind, and battery storage startups.", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600", url: "https://www.forbes.com", source: "Forbes", pubDate: "Mới cập nhật" },
        { title: "Central Banks Evaluate Digital Currencies for Retail Markets", description: "Economists discuss the implications of sovereign digital assets on traditional banking systems and consumer privacy.", image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600", url: "https://www.bloomberg.com", source: "Bloomberg", pubDate: "Mới cập nhật" }
    ],
    sports: [
        { title: "Underdog Team Secures Stunning Victory in Championship Final", description: "A dramatic last-minute goal seals an unforgettable triumph for the visiting squad in front of a packed stadium.", image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600", url: "https://www.espn.com", source: "ESPN", pubDate: "Mới cập nhật" },
        { title: "Record-Breaking Attendance Set at International Athletics Meet", description: "Fans flock from around the globe to witness historic performances and new world records on the track.", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600", url: "https://www.bbc.com/sport", source: "BBC Sport", pubDate: "Mới cập nhật" },
        { title: "Training Innovations Help Athletes Peak During Major Tournaments", description: "Sports scientists reveal how data analytics and biometric monitoring improve recovery times for professional players.", image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600", url: "https://www.skysports.com", source: "Sky Sports", pubDate: "Mới cập nhật" }
    ],
    entertainment: [
        { title: "Independent Cinema Shines at Annual Film Festival Awards", description: "Creative storytelling and visionary direction take center stage as breakout directors win top honors.", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600", url: "https://variety.com", source: "Variety", pubDate: "Mới cập nhật" },
        { title: "Global Music Festival Announces Star-Studded Lineup for Summer", description: "Music enthusiasts celebrate as legendary performers and rising global sensations prepare for a massive weekend.", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600", url: "https://www.billboard.com", source: "Billboard", pubDate: "Mới cập nhật" },
        { title: "Immersive Technologies Transform Modern Stage Productions", description: "Theater directors blend augmented reality with live performances to create breathtaking visual experiences for audiences.", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600", url: "https://www.hollywoodreporter.com", source: "Hollywood Reporter", pubDate: "Mới cập nhật" }
    ]
};

// 📦 LƯU TRỮ KHO DỮ LIỆU ĐÃ LOAD
const newsStore = {
    general: [],
    technology: [],
    business: [],
    sports: [],
    entertainment: []
};

document.addEventListener("DOMContentLoaded", () => {
    fetchNews("general");
    setupCategoryButtons();
});

async function fetchNews(category) {
    const newsGrid = document.getElementById("news-grid");
    if (!newsGrid) return;

    // Nếu đã có dữ liệu trong store thì render luôn cho mượt
    if (newsStore[category] && newsStore[category].length > 0) {
        renderNews(newsStore[category]);
        return;
    }

    newsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: #aaa;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color: #7a16df; margin-bottom: 15px;"></i>
            <p style="font-weight: 500; font-size: 16px;">Đang cập nhật tin tức phong phú...</p>
        </div>
    `;

    const feedUrls = MULTI_FEEDS[category] || MULTI_FEEDS.general;

    const fetchPromises = feedUrls.map(url =>
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok" && data.items) {
                    return data.items.map(item => ({
                        title: item.title,
                        description: item.description?.replace(/<[^>]*>?/gm, '').trim().substring(0, 130) + "..." || "Đọc bài báo chi tiết tại trang gốc.",
                        image: item.thumbnail || item.enclosure?.link || extractImageFromContent(item.content) || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600",
                        url: item.link,
                        source: data.feed?.title || "World News",
                        pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString('vi-VN') : "Mới cập nhật",
                        timestamp: item.pubDate ? new Date(item.pubDate).getTime() : 0
                    }));
                }
                return [];
            })
            .catch(() => [])
    );

    try {
        const results = await Promise.all(fetchPromises);
        let combinedArticles = results.flat();

        // Lọc trùng lặp bài báo theo Tiêu đề
        const uniqueArticles = [];
        const seenTitles = new Set();
        
        combinedArticles.forEach(art => {
            if (art.title && !seenTitles.has(art.title)) {
                seenTitles.add(art.title);
                uniqueArticles.push(art);
            }
        });

        uniqueArticles.sort((a, b) => b.timestamp - a.timestamp);

        // Nếu lấy được nhiều bài từ RSS thì dùng, nếu ít quá hoặc lỗi thì kết hợp thêm bộ dự phòng riêng của danh mục đó
        if (uniqueArticles.length >= 3) {
            newsStore[category] = uniqueArticles;
        } else {
            // Trộn bài từ RSS thật và bài dự phòng riêng của danh mục để giao diện luôn đầy đặn, phong phú
            newsStore[category] = [...uniqueArticles, ...(CATEGORY_BACKUPS[category] || CATEGORY_BACKUPS.general)];
        }

        renderNews(newsStore[category]);
    } catch (err) {
        newsStore[category] = CATEGORY_BACKUPS[category] || CATEGORY_BACKUPS.general;
        renderNews(newsStore[category]);
    }
}

function extractImageFromContent(content) {
    if (!content) return null;
    const match = content.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
}

function renderNews(articlesArray) {
    const newsGrid = document.getElementById("news-grid");
    if (!newsGrid) return;
    newsGrid.innerHTML = "";

    articlesArray.forEach(art => {
        newsGrid.innerHTML += `
            <div class="news-card">
                <img src="${art.image}" alt="News Image" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600'">
                <div class="news-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span class="news-source">📌 ${art.source}</span>
                        <span style="font-size: 11px; color: #888;">⏱️ ${art.pubDate}</span>
                    </div>
                    <h3 class="news-title">${art.title}</h3>
                    <p class="news-desc">${art.description}</p>
                    <a href="${art.url}" target="_blank" rel="noopener noreferrer" class="read-btn">
                        Đọc bài gốc <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        `;
    });
}

function setupCategoryButtons() {
    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            
            const selectedCategory = e.currentTarget.getAttribute("data-category");
            fetchNews(selectedCategory);
        });
    });
}