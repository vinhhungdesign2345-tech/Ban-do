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
        // Khởi tạo bộ lọc động Tỉnh -> Phường/Xã
        initFilter(map);
    });

    // SỰ KIỆN CLICK VÀO THỬA ĐẤT
    map.on('click', 'thua-dat-layer', (e) => {
        const props = e.features[0].properties;
        const clickedAddress = props.dia_chi || props.Phuong || props.Quan || props.Xa || props.NAME_2 || props.NAME_3;

        if (clickedAddress) {
            syncDropdownOnly(clickedAddress);
        }

        const popupContent = `
            <div style="font-weight:bold; color:#007bff; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:5px;">
                Tờ: ${props.so_to || props.SoTo || '-'} | Thửa: ${props.so_thua || props.SoThua || '-'}
            </div>
            <b>Địa chỉ:</b> ${clickedAddress || 'Chưa cập nhật'}<br>
            <b>Diện tích:</b> ${props.dien_tich || props.DienTich || '-'} m²<br>
            <b>Loại đất:</b> ${props.loai_dat || props.LoaiDat || '-'}<br>
            <b>Tên chủ:</b> ${props.ten_chu || props.TenChu || '-'}<br>
            <b>Cập nhật:</b> ${props.ngay_cap_nhat || '-'}
        `;

        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);
    });

    map.on('mouseenter', 'thua-dat-layer', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'thua-dat-layer', () => map.getCanvas().style.cursor = '');
}

document.addEventListener('DOMContentLoaded', initMap);
