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
            const rawProps = selectedFeature.properties || {};

            // Chuẩn hóa key, diệt sạch \n và ký tự đặc biệt
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

            // 1. Highlight thửa đất
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

            // 2. POPUP DẠNG 1 CỘT - THẨM MỸ, GỌN GÀNG
            const popupContent = `
                <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #2b2d42; max-width: 220px; padding: 2px;">
                    <div style="background: #d90429; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-align: center; margin-bottom: 8px; font-size: 13px;">
                        Tờ: ${soTo} &nbsp;|&nbsp; Thửa: ${soThua}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div><span style="color: #8d99ae; font-weight: 600;">Diện tích:</span> <b>${dienTich} m²</b></div>
                        <div><span style="color: #8d99ae; font-weight: 600;">Loại đất:</span> ${loaiDat}</div>
                        <div><span style="color: #8d99ae; font-weight: 600;">Tên chủ:</span> ${tenChu}</div>
                        <div><span style="color: #8d99ae; font-weight: 600;">Số định danh:</span> ${soDinhDanh}</div>
                        <div><span style="color: #8d99ae; font-weight: 600;">Ghi chú:</span> ${ghiChu}</div>
                    </div>
                </div>
            `;

            new maplibregl.Popup({ offset: [0, -5] })
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
        });

        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    });
}

document.addEventListener('DOMContentLoaded', initMap);
