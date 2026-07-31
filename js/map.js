// js/map.js

function initMap() {
    // ... Khởi tạo map của ông ...

    const sheetLayers = ['sheet-thua-dat-fill', 'sheet-thua-dat-line'];

    // Variable theo dõi xem lượt click có trúng thửa đất nào không
    let isFeatureClicked = false;

    sheetLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (!e.features || !e.features.length) return;

            isFeatureClicked = true; // Đánh dấu đã click vào thửa đất

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

            const parcelId = props['idthuadat'] || props['id'];
            const tenChu = props['tenchu'] || '-';

            // HIGHLIGHT THỬA ĐẤT ĐƯỢC CHỌN
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

            // POPUP... (Đoạn popup giữ nguyên như của ông)
        });
    });

    // 🔴 SỰ KIỆN CLICK RA NGOÀI THỬA ĐẤT (BẮT SỰ KIỆN TOÀN MAP)
    map.on('click', (e) => {
        // Nếu click không trúng bất kỳ thửa đất nào
        if (!isFeatureClicked) {
            // Reset filter highlight về rỗng để thửa đất trở về màu ban đầu
            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', ['==', ['get', 'ID Thửa Đất'], '']);
            }
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', ['==', ['get', 'ID Thửa Đất'], '']);
            }
        }
        // Đặt lại trạng thái cho lượt click tiếp theo
        isFeatureClicked = false;
    });
}
