// js/api.js
async function fetchGeoData() {
    try {
        const response = await fetch(CONFIG.GEOJSON_URL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("❌ Lỗi khi tải file Ca-Mau.geojson:", error);
        return null;
    }
}
