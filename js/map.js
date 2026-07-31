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
            const props = selectedFeature.properties || {};

            // 🔍 LOG OUT ĐỂ BẠN THẤY TOÀN BỘ TÊN CỘT THỰC TẾ TRONG CONSOLE (F12)
            console.log("DỮ LIỆU THỰC TẾ NHẬN ĐƯỢC TỪ GOOGLE SHEET:", props);

            // Bắt tất cả các kiểu tên cột (Có dấu, Không dấu, Chữ hoa, Chữ thường, Có khoảng trắng)
            const soTo = props['Số Tờ'] || props['so_to'] || props['soto'] || props['Số tờ'] || props['SoTo'] || props['So_To'] || '-';
            const soThua = props['Số Thửa'] || props['so_thua'] || props['sothua'] || props['Số thửa'] || props['SoThua'] || props['So_Thua'] || '-';
            const dienTich = props['Diện Tích (m²)'] || props['dien_tich'] || props['dientich'] || props['Diện tích'] || props['DienTich'] || props['Dien_Tich'] || '-';
            const diaChi = props['Địa Chỉ Thửa Đất'] || props['dia_chi'] || props['diachi'] || props['Địa chỉ'] || props['DiaChi'] || 'Chưa cập nhật';
            const loaiDat = props['Loại Đất'] || props['loai_dat'] || props['loaidat'] || props['Loại đất'] || props['LoaiDat'] || '-';
            const tenChu = props['Tên Chủ'] || props['ten_chu'] || props['tenchu'] || props['Tên chủ'] || props['TenChu'] || '-';
            const ngayCapNhat = props['Ngày Cập Nhật'] || props['ngay_cap_nhat'] || props['ngaycapnhat'] || props['Ngày cập nhật'] || props['NgayCapNhat'] || '-';
            const parcelId = props['ID Thửa Đất'] || props['id_thua_dat'] || props['id'];

            // 1. Kích hoạt hiệu ứng phát sáng cho thửa đất được chọn
            let selectFilter;
            if (parcelId) {
                selectFilter = ['==', ['get', 'ID Thửa Đất'], parcelId];
            } else {
                selectFilter = [
                    'all',
                    ['==', ['get', 'Số Tờ'], soTo],
                    ['==', ['get', 'Số Thửa'], soThua]
                ];
            }

            if (map.getLayer('sheet-thua-dat-highlight-fill')) {
                map.setFilter('sheet-thua-dat-highlight-fill', selectFilter);
            }
            if (map.getLayer('sheet-thua-dat-highlight-line')) {
                map.setFilter('sheet-thua-dat-highlight-line', selectFilter);
            }

            // 2. Hiển thị Popup
            const popupContent = `
                <div style="font-weight:bold; color:#d90429; font-size:14px; border-bottom:1px solid #ccc; padding-bottom:3px; margin-bottom:5px;">
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

        map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
    });
}

document.addEventListener('DOMContentLoaded', initMap);
