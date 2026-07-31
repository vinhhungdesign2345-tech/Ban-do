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

            // ?? DI?T S?CH KÝ T? XU?NG DÒNG \n, CHU?N HÓA KEY V? CH? TH??NG KHÔNG D?U
            const props = {};
            Object.keys(rawProps).forEach(key => {
                const cleanKey = key.replace(/[\r\n\t]/g, '') // Xóa s?ch xu?ng dòng \n và tab
                                    .normalize("NFD")
                                    .replace(/[\u0300-\u036f]/g, "")
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, ""); // Ch? gi? l?i ch? và s?
                props[cleanKey] = rawProps[key];
            });

            // ?? L?Y CHÍNH XÁC CÁC TR??NG D? LI?U C?A B?N
            const soTo = props['soto'] || props['to'] || '-';
            const soThua = props['sothua'] || props['thua'] || '-';
            const dienTich = props['dientichm2'] || props['dientich'] || '-';
            const loaiDat = props['loaidat'] || '-';
            const tenChu = props['tenchu'] || '-';
            const soDinhDanh = props['sodinhdanhchudat'] || props['sodinhdanh'] || 'Không có';
            const ghiChu = props['ghichu'] || '';

            const parcelId = props['idthuadat'] || props['id'];

            // 1. HIGHLIGHT TH?A ??T ???C CH?N
            let selectFilter;
            if (parcelId) {
                selectFilter = ['==', ['get', 'ID Th?a ??t'], rawProps['ID Th?a ??t'] || parcelId];
            } else {
                selectFilter = ['==', ['get', 'Tên Ch?'], rawProps['Tên Ch?'] || tenChu];
            }

            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            }
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
            }

            // 2. T?O POPUP
            const popupContent = `
                <div style="font-weight:bold; color:#d90429; font-size:14px; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:5px;">
                    T?: ${soTo} | Th?a: ${soThua}
                </div>
                <b>Di?n tích:</b> ${dienTich} m²<br>
                <b>Lo?i ??t:</b> ${loaiDat}<br>
                <b>Tên ch?:</b> ${tenChu}<br>
                <b>S? ??nh danh:</b> ${soDinhDanh}<br>
                <b>Ghi chú:</b> ${ghiChu}
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
