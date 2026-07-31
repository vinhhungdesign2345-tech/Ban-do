// js/api.js
async function fetchGeoDataByUrl(fileUrl) {
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Lỗi tải file: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("❌ Lỗi khi tải file GeoJSON:", fileUrl, error);
        return null;
    }
}
