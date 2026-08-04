// js/searchThuaDat.js

function initThuaDatSearch(map) {
    const searchInput = document.getElementById('searchThuaDatInput');
    if (!searchInput) return;

    const performSearch = () => {
        const rawKeyword = searchInput.value.trim().toLowerCase();
        if (!rawKeyword) return;

        // Quét toàn bộ source dữ liệu của bản đồ
        let allFeatures = [];
        const style = map.getStyle();
        if (style && style.sources) {
            for (const sourceId in style.sources) {
                const src = map.getSource(sourceId);
                if (src && src._data && src._data.features) {
                    allFeatures = allFeatures.concat(src._data.features);
                }
            }
        }

        if (allFeatures.length === 0) {
            alert("Chưa có dữ liệu bản đồ! Hãy thử thu phóng bản đồ một chút.");
            return;
        }

        console.log("--- BẮT ĐẦU KIỂM TRA DỮ LIỆU THỬA ĐẤT ---");
        console.log("Tổng số thửa đất trong nguồn:", allFeatures.length);
        console.log("Thuộc tính của thửa đất đầu tiên:", allFeatures[0].properties);

        const matchedIds = [];
        allFeatures.forEach(f => {
            const props = f.properties || {};
            
            // Nối tất cả các giá trị thuộc tính lại thành một chuỗi duy nhất để tìm kiếm quét vét cạn
            let combinedValues = "";
            for (let key in props) {
                if (props[key]) {
                    combinedValues += " " + String(props[key]).toLowerCase();
                }
            }

            if (combinedValues.includes(rawKeyword)) {
                const uniqueId = props['ID Thửa Đất'] || props['id'] || props['Tên Chủ'] || props['Số thửa'];
                if (uniqueId && !matchedIds.includes(uniqueId)) {
                    matchedIds.push(uniqueId);
                }
            }
        });

        console.log("Số lượng tìm thấy khớp từ khóa:", matchedIds.length);

        let finalFilter;
        if (matchedIds.length > 0) {
            finalFilter = ['in', ['get', 'ID Thửa Đất'], ['literal', matchedIds]];
        } else {
            finalFilter = ['==', ['get', 'ID Thửa Đất'], '___no_match___'];
        }

        if (map.getLayer('sheet-thua-dat-fill')) {
            map.setFilter('sheet-thua-dat-fill', finalFilter);
        }
        if (map.getLayer('sheet-thua-dat-line')) {
            map.setLayer('sheet-thua-dat-line', finalFilter);
        }

        setTimeout(() => {
            try {
                const matchedFeaturesList = allFeatures.filter(f => {
                    const id = f.properties['ID Thửa Đất'] || f.properties['id'] || f.properties['Tên Chủ'] || f.properties['Số thửa'];
                    return matchedIds.includes(id);
                });

                if (matchedFeaturesList.length > 0) {
                    const fc = turf.featureCollection(matchedFeaturesList);
                    const bbox = turf.bbox(fc);
                    map.fitBounds(bbox, { padding: 60, maxZoom: 18 });
                } else {
                    alert("Không tìm thấy kết quả cho: " + rawKeyword);
                }
            } catch (err) {
                console.log("Lỗi zoom:", err);
            }
        }, 300);
    };

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
}
