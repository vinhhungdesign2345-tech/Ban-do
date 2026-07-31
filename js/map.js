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

    // Chỉ bắt Click vào layer LÓT NỀN THỬA ĐẤT từ Sheet để lấy chuẩn thông tin nhất
    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];

    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return;

            const props = e.features[0].properties;

            // Lấy chính xác các thuộc tính Tiếng Việt từ Google Sheet
            const soTo = props['Số Tờ'] || '-';
            const soThua = props['Số Thửa'] || '-';
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

        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    });
}

document.addEventListener('DOMContentLoaded', initMap);
