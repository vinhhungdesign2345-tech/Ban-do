// js/api.js
async function fetchGeoData() {
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("❌ Lỗi khi tải dữ liệu từ Google Apps Script:", error);
        return null;
    }
}
