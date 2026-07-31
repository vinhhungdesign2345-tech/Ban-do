// js/map.js
function initMap() {
    const map = new maplibregl.Map({
        container: 'map',
        style: CONFIG.MAP_STYLE,
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
        initFilter(map);
    });

    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];

    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return;

            const selectedFeature = e.features[0];
            const props = selectedFeature.properties || {};

            // 🔍 LẤY CHÍNH XÁC THEO TÊN CỘT TRÊN GOOGLE SHEET CỦA BẠN:
            // Cột B: Số Tờ
            const soTo = props['Số Tờ'] ?? props['so_to'] ?? '-';
            // Cột C: Số Thửa
            const soThua = props['Số Thửa'] ?? props['so_thua'] ?? '-';
            // Cột D: Diện Tích (m²)
            const dienTich = props['Diện Tích (m²)'] ?? props['dien_tich'] ?? '-';
            // Cột E: Loại Đất
            const loaiDat = props['Loại Đất'] ?? props['loai_dat'] ?? '-';
            // Cột F: Tên Chủ
            const tenChu = props['Tên Chủ'] ?? props['ten_chu'] ?? '-';
            // Cột G: Số Định Danh chủ đất
            const soDinhDanh = props['Số Định Danh chủ đất'] ?? props['so_dinh_danh'] ?? 'Không có';
            // Cột N: Ghi Chú
            const ghiChu = props['Ghi Chú'] ?? props['ghi_chu'] ?? 'Không có';

            const parcelId = props['ID Thửa Đất'] ?? props['id_thua_dat'];

            // 1. KÍCH HOẠT HIỆU ỨNG PHÁT SÁNG THỬA ĐẤT ĐƯỢC CHỌN
            let selectFilter;
            if (parcelId) {
                selectFilter = ['==', ['get', 'ID Thửa Đất'], parcelId];
            } else {
                selectFilter = [
                    'all',
                    ['==', ['get', 'Số Tờ'], soTo],
                    ['==', ['get', 'Số Thửa'], soThua]
                ];
            }

            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            }
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
            }

            // 2. TẠO POPUP THEO ĐÚNG CÁC TRƯỜNG BẠN YÊU CẦU
            const popupContent = `
                <div style="font-weight:bold; color:#d90429; font-size:14px; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:5px;">
                    Tờ: ${soTo} | Thửa: ${soThua}
                </div>
                <b>Diện tích:</b> ${dienTich} m²<br>
                <b>Loại đất:</b> ${loaiDat}<br>
                <b>Tên chủ:</b> ${tenChu}<br>
                <b>Số định danh:</b> ${soDinhDanh}<br>
                <b>Ghi chú:</b> ${ghiChu}
            `;

            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
        });

        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    });
}

document.addEventListener('DOMContentLoaded', initMap);
