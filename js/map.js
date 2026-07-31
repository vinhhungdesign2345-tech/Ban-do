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
    let isFeatureClicked = false; // Cờ kiểm tra click trúng thửa đất

    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return;

            isFeatureClicked = true; // Đánh dấu đã click trúng thửa đất

            const selectedFeature = e.features[0];
            const rawProps = selectedFeature.properties || {};

            const props = {};
            Object.keys(rawProps).forEach(key => {
                const cleanKey = key.replace(/[\r\n\t]/g, '')
                                    .normalize("NFD")
                                    .replace(/[\u0300-\u036f]/g, "")
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, "");
                props[cleanKey] = rawProps[key];
            });

            const soTo = props['soto'] || props['to'] || '-';
            const soThua = props['sothua'] || props['thua'] || '-';
            const dienTich = props['dientichm2'] || props['dientich'] || '-';
            const loaiDat = props['loaidat'] || '-';
            const tenChu = props['tenchu'] || '-';
            const soDinhDanh = props['sodinhdanhchudat'] || props['sodinhdanh'] || 'Không có';
            const ghiChu = props['ghichu'] || 'Không có';

            const parcelId = props['idthuadat'] || props['id'];

            let selectFilter;
            if (parcelId) {
                selectFilter = ['==', ['get', 'ID Thửa Đất'], rawProps['ID Thửa Đất'] || parcelId];
            } else {
                selectFilter = ['==', ['get', 'Tên Chủ'], rawProps['Tên Chủ'] || tenChu];
            }

            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            }
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
            }

            // POPUP GỌN SÁT LỀ TRÁI
            const popupContent = `
                <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #1a1a1a; width: 170px; text-align: left;">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div><b>Số tờ:</b> ${soTo}</div>
                        <div><b>Số thửa:</b> ${soThua}</div>
                        <div><b>Diện tích:</b> ${dienTich} m²</div>
                        <div><b>Loại đất:</b> ${loaiDat}</div>
                        <div><b>Tên chủ:</b> ${tenChu}</div>
                        <div><b>Số định danh:</b> ${soDinhDanh}</div>
                        <div><b>Ghi chú:</b> ${ghiChu}</div>
                    </div>
                </div>
            `;

            new maplibregl.Popup({ offset: [0, -5], maxWidth: "190px" })
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
        });

        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    });

    // 🔴 SỰ KIỆN CLICK VÙNG TRỐNG TRÊN MAP
    map.on('click', (e) => {
        if (!isFeatureClicked) {
            // 1. Reset highlight về màu cũ
            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
            }
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
            }

            // 2. Chọn Phường/Xã tương ứng vị trí vừa click
            if (typeof selectPhuongFromPoint === 'function') {
                selectPhuongFromPoint(e.lngLat.lng, e.lngLat.lat, map);
            }
        }
        isFeatureClicked = false; // Reset trạng thái
    });
}

document.addEventListener('DOMContentLoaded', initMap);
