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
            const props = selectedFeature.properties;

            // Bắt chính xác từng tên cột đúng theo ảnh Google Sheet của bạn
            const soTo = props['Số Tờ'] ?? props['so_to'] ?? '-';
            const soThua = props['Số Thửa'] ?? props['so_thua'] ?? '-';
            const diaChi = props['Địa Chỉ Thửa Đất'] ?? props['dia_chi'] ?? 'Chưa cập nhật';
            const dienTich = props['Diện Tích (m²)'] ?? props['dien_tich'] ?? '-';
            const loaiDat = props['Loại Đất'] ?? props['loai_dat'] ?? '-';
            const tenChu = props['Tên Chủ'] ?? props['ten_chu'] ?? '-';
            const ngayCapNhat = props['Ngày Cập Nhật'] ?? props['ngay_cap_nhat'] ?? '-';
            const parcelId = props['ID Thửa Đất'] ?? props['id_thua_dat'];

            // 1. Kích hoạt hiệu ứng phát sáng cho thửa đất được chọn
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

            // 2. Hiển thị Popup
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

        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    });
}

document.addEventListener('DOMContentLoaded', initMap);
