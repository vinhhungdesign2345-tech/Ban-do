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
        // Khởi tạo bộ lọc động Tỉnh -> Phường/Xã & Tải dữ liệu Google Sheet
        initFilter(map);
    });

    // Các layer sẽ bắt sự kiện Click & Hover
    const activeLayers = ['thua-dat-layer', 'sheet-thua-dat-line'];

    activeLayers.forEach(layerId => {
        // 1. SỰ KIỆN CLICK HIỂN THỊ POPUP
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return;

            const props = e.features[0].properties;

            // Đọc các cột Tiếng Việt từ Google Sheet (hoặc thuộc tính tương đương từ GeoJSON)
            const soTo = props['Số Tờ'] || props.so_to || props.SoTo || '-';
            const soThua = props['Số Thửa'] || props.so_thua || props.SoThua || '-';
            const diaChi = props['Địa Chỉ Thửa Đất'] || props.dia_chi || props.Phuong || props.Xa || props.name || 'Chưa cập nhật';
            const dienTich = props['Diện Tích (m²)'] || props.dien_tich || props.DienTich || '-';
            const loaiDat = props['Loại Đất'] || props.loai_dat || props.LoaiDat || '-';
            const tenChu = props['Tên Chủ'] || props.ten_chu || props.TenChu || '-';
            const ngayCapNhat = props['Ngày Cập Nhật'] || props.ngay_cap_nhat || '-';

            // Đồng bộ lại ô chọn Phường/Xã nếu bấm vào thửa đất có địa chỉ
            if (diaChi !== 'Chưa cập nhật') {
                syncDropdownOnly(diaChi);
            }

            // Tạo nội dung Popup
            const popupContent = `
                <div style="font-weight:bold; color:#007bff; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:5px;">
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

        // 2. HIỆU ỨNG CON TRỎ CHUỘT
        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    });
}

document.addEventListener('DOMContentLoaded', initMap);
