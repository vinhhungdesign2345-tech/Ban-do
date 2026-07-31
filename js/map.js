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

    // Lắng nghe click ở cả 2 layer Lót nền & Đường viền của Google Sheet
    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];

    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return;

            const selectedFeature = e.features[0];
            const props = selectedFeature.properties;

            // 1. KÍCH HOẠT HIỆU ỨNG PHÁT SÁNG CHO THỬA ĐẤT ĐƯỢC CHỌN
            const parcelId = props['ID Thửa Đất'] || props.id_thua_dat;
            const soTo = props['Số Tờ'] || '-';
            const soThua = props['Số Thửa'] || '-';

            // Tạo bộ lọc theo ID Thửa Đất hoặc theo Tờ + Thửa
            let selectFilter;
            if (parcelId) {
                selectFilter = ['==', ['get', 'ID Thửa Đất'], parcelId];
            } else {
                selectFilter = [
                    'all',
                    ['==', ['get', 'Số Tờ'], props['Số Tờ']],
                    ['==', ['get', 'Số Thửa'], props['Số Thửa']]
                ];
            }

            // Áp bộ lọc highlight lên layer phát sáng
            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            }
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
            }

            // 2. LẤY THÔNG TIN ĐƯA VÀO POPUP
            const diaChi = props['Địa Chỉ Thửa Đất'] || 'Chưa cập nhật';
            const dienTich = props['Diện Tích (m²)'] || '-';
            const loaiDat = props['Loại Đất'] || '-';
            const tenChu = props['Tên Chủ'] || '-';
            const ngayCapNhat = props['Ngày Cập Nhật'] || '-';

            const popupContent = `
                <div style="font-weight:bold; color:#d90429; font-size:14px; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:5px;">
                    Tờ: ${soTo} | Thửa: ${soThua}
                </div>
                <b>Địa chỉ:</b> ${diaChi}<br>
                <b>Diện tích:</b> ${dienTich} m²<br>
                <b>Loại đất:</b> ${loaiDat}<br>
                <b>Tên chủ:</b> ${tenChu}<br>
                <b>Cập nhật:</b> ${ngayCapNhat}
            `;

            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
        });

        // Đổi con trỏ chuột khi rê qua thửa đất
        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    });
}

document.addEventListener('DOMContentLoaded', initMap);
