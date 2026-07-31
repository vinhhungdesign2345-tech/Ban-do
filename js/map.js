// js/map.js
function initMap() {
    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
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

        map.addLayer({
            'id': 'thua-dat-layer',
            'type': 'fill',
            'source': 'thua-dat-src',
            'paint': {
                'fill-color': CONFIG.FILL_COLOR,
                'fill-opacity': CONFIG.FILL_OPACITY,
                'fill-outline-color': CONFIG.OUTLINE_COLOR
            }
        });

        initFilter(map, geoData);

        if (geoData.features.length > 0) {
            const bbox = turf.bbox(geoData);
            map.fitBounds(bbox, { padding: 50 });
        }
    });

    // SỰ KIỆN CLICK VÀO THỬA ĐẤT
    map.on('click', 'thua-dat-layer', (e) => {
        const props = e.features[0].properties;
        const clickedAddress = props.dia_chi;

        // 1. Chỉ nhảy tên Phường/Xã ở Dropdown (KHÔNG ZOOM)
        if (clickedAddress) {
            syncDropdownOnly(clickedAddress);
        }

        // 2. Mở Popup thông tin chi tiết
        const popupContent = `
            <div style="font-weight:bold; color:#007bff; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:5px;">
                Tờ: ${props.so_to || '-'} | Thửa: ${props.so_thua || '-'}
            </div>
            <b>Địa chỉ:</b> ${props.dia_chi || 'Chưa cập nhật'}<br>
            <b>Diện tích:</b> ${props.dien_tich || '-'} m²<br>
            <b>Loại đất:</b> ${props.loai_dat || '-'}<br>
            <b>Tên chủ:</b> ${props.ten_chu || '-'}<br>
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
