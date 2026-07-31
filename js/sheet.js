// js/sheet.js

async function loadThuaDatFromSheet(map) {
    if (!CONFIG.SHEET_DATA_URL) return;

    try {
        const response = await fetch(CONFIG.SHEET_DATA_URL);
        const geojson = await response.json();

        if (map.getSource('sheet-thua-dat-src')) {
            map.getSource('sheet-thua-dat-src').setData(geojson);
        } else {
            map.addSource('sheet-thua-dat-src', { type: 'geojson', data: geojson });

            map.addLayer({
                'id': 'sheet-thua-dat-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': COLOR_MATCH_EXPRESSION,
                    'fill-opacity': 0.45
                },
                'filter': ['==', '$type', 'Point']
            });

            map.addLayer({
                'id': 'sheet-thua-dat-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': COLOR_MATCH_EXPRESSION,
                    'line-width': 0.8
                },
                'filter': ['==', '$type', 'Point']
            });

            map.addLayer({
                'id': 'sheet-thua-dat-highlight-fill',
                'type': 'fill',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'fill-color': '#ffff00',
                    'fill-opacity': 0.65
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], '']
            });

            map.addLayer({
                'id': 'sheet-thua-dat-highlight-line',
                'type': 'line',
                'source': 'sheet-thua-dat-src',
                'paint': {
                    'line-color': '#00ffff',
                    'line-width': 1.8
                },
                'filter': ['==', ['get', 'ID Thửa Đất'], '']
            });
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Google Sheet:", error);
    }
}

function hideThuaDat(map) {
    const emptyFilter = ['==', '$type', 'Point'];
    if (map.getLayer('thua-dat-layer')) map.setFilter('thua-dat-layer', emptyFilter);
    if (map.getLayer('thua-dat-line-layer')) map.setFilter('thua-dat-line-layer', emptyFilter);
    if (map.getLayer('sheet-thua-dat-fill')) map.setFilter('sheet-thua-dat-fill', emptyFilter);
    if (map.getLayer('sheet-thua-dat-line')) map.setFilter('sheet-thua-dat-line', emptyFilter);
}
