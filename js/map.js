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

            // Chuẩn hóa key
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

            // Highlight thửa
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

            // POPUP SIÊU NHỎ GỌN - 1 CỘT SÁT LỀ TRÁI
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
}

document.addEventListener('DOMContentLoaded', initMap);
