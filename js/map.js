// js/map.js
function initMap() {
    const map = new maplibregl.Map({
        container: 'map',
        style: CONFIG.MAP_STYLE,
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', async () => {
        const geoData = await fetchGeoData();
        if (!geoData) return;

        map.addSource('thua-dat-src', {
            type: 'geojson',
            data: geoData
        });

        // Thêm Layer hiển thị Thửa Đất
        map.addLayer({
            'id': 'thua-dat-layer',
            'type': 'fill',
            'source': 'thua-dat-src',
            // MẶC ĐỊNH ẨN HOÀN TOÀN KHI MỚI TẢI MAP
            'filter': ['==', '$type', 'Point'], 
            'paint': {
                'fill-color': CONFIG.FILL_COLOR,
                'fill-opacity': CONFIG.FILL_OPACITY,
                'fill-outline-color': CONFIG.OUTLINE_COLOR
            }
        });

        // Khởi tạo Bộ Lọc Tỉnh/Phường
        initFilter(map, geoData);
    });

    // SỰ KIỆN CLICK VÀO THỬA ĐẤT
    map.on('click', 'thua-dat-layer', (e) => {
        const props = e.features[0].properties;
        const clickedAddress = props.dia_chi || props.Phuong || props.Quan || props.Xa;

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
