// ==========================================
// HÀM MỞ POPUP XEM HOẶC NHẬP GHI CHÚ VÀ CẬP NHẬT NGÀY GHI CHÚ (CỘT O)
// ==========================================
function openColumnNPopup(parcelId, mode, currentData = '') {
    // 1. Kiểm tra xem phần tử giao diện popup đã tồn tại trên DOM chưa, nếu chưa thì tiến hành tạo mới
    let popupContainer = document.getElementById('column-n-popup-modal');
    
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'column-n-popup-modal';
        // Đặt kiểu CSS phủ kín toàn màn hình với hiệu ứng mờ nền (backdrop-filter)
        popupContainer.style.cssText = `
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%;
            background: rgba(0, 0, 0, 0.6); 
            backdrop-filter: blur(2px);
            display: flex; 
            align-items: center;
            justify-content: center; 
            z-index: 9999;
            padding: 16px;
            box-sizing: border-box;
        `;
        document.body.appendChild(popupContainer);
    }

    // 2. Xác định chế độ làm việc: 'view' (xem/sửa ghi chú cũ) hoặc mặc định (nhập mới)
    const isViewMode = mode === 'view';
    
    // 3. Xây dựng cấu trúc giao diện HTML bên trong của Popup Modal
    popupContainer.innerHTML = `
        <div style="background: #fff; padding: 20px; border-radius: 12px; width: 100%; max-width: 380px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1a73e8; display: flex; align-items: center; gap: 8px;">
                ${isViewMode ? '✍️ Chỉnh sửa Ghi chú' : '✍️ Nhập Ghi chú'}
            </h3>
            <p style="font-size: 13px; color: #5f6368; margin: 0 0 16px 0;">ID Thửa đất: <b>${parcelId}</b></p>
            
            <div style="margin-bottom: 20px;">
                <textarea id="popup-n-content" placeholder="Nhập nội dung ghi chú..." style="width: 100%; height: 120px; padding: 12px; border: 1px solid #dadce0; border-radius: 8px; resize: none; font-size: 14px; box-sizing: border-box; outline: none;" onfocus="this.style.borderColor='#1a73e8'" onblur="this.style.borderColor='#dadce0'">${currentData}</textarea>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="popup-close-btn" style="flex: 1; padding: 10px 16px; background: #f1f3f4; color: #3c4043; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">Đóng</button>
                <button id="popup-save-btn" style="flex: 1; padding: 10px 16px; background: #1a73e8; color: #fff; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">Lưu lại</button>
            </div>
        </div>
    `;

    // Hiển thị popup lên màn hình bằng thuộc tính flex
    popupContainer.style.display = 'flex';

    // 4. Xử lý sự kiện khi người dùng bấm nút "Đóng" (Hủy bỏ)
    document.getElementById('popup-close-btn').onclick = () => {
        popupContainer.style.display = 'none';
    };

    // 5. Xử lý sự kiện khi người dùng bấm nút "Lưu lại" dữ liệu ghi chú
    document.getElementById('popup-save-btn').onclick = () => {
        const val = document.getElementById('popup-n-content').value; // Lấy giá trị nội dung vừa nhập từ textarea
        
        // Lấy ngày hiện tại ở dạng chuỗi định dạng dd/MM/yyyy để cập nhật ngay vào UI giao diện
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const todayFormatted = `${day}/${month}/${year}`;

        // Bước 5.1: Cập nhật ngay lập tức vào bộ nhớ tạm để phản hồi giao diện tức thì
        if (window._currentParcelRawProps) {
            window._currentParcelRawProps['Cột N'] = val;
            window._currentParcelRawProps['Ngày Ghi chú'] = todayFormatted; // Cập nhật luôn ngày ghi chú vào bộ nhớ tạm
        }

        // Đổi trạng thái nút bấm sang "Đang lưu..." và vô hiệu hóa để tránh bấm nhiều lần
        const saveBtn = document.getElementById('popup-save-btn');
        saveBtn.innerText = 'Đang lưu...';
        saveBtn.disabled = true;

        // Bước 5.2: Gửi request phương thức POST đến URL Web App của Google Apps Script
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec';

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Sử dụng no-cors để tránh lỗi chính sách chia sẻ tài nguyên chéo từ trình duyệt
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                action: 'update_column_n', // Hành động nhận diện cập nhật nhanh cột N
                id_thua_dat: parcelId,    // ID thửa đất cần thao tác
                ghi_chu: val              // Nội dung ghi chú mới
            })
        });

        // Bước 5.3: Ẩn popup modal đi sau khi đã kích hoạt gửi dữ liệu
        popupContainer.style.display = 'none';

        // Bước 5.4: Làm mới và cập nhật lại giao diện bảng thông tin (Panel Info) ngay tại chỗ
        if (window.selectedThuaDatId === parcelId && window._currentParcelRawProps) {
            // Đăng ký lại hàm xem/sửa với dữ liệu ghi chú mới nhất
            window[`_viewColN_${parcelId}`] = () => openColumnNPopup(parcelId, 'view', val);
            
            // Tạo liên kết chữ "xem" có gắn sự kiện mở popup chi tiết
            const columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._viewColN_${parcelId}();" style="color: #007bff; text-decoration: underline; font-weight: bold;">xem</a>`;
            
            // Đọc các thông số chi tiết của thửa đất từ bộ nhớ tạm
            const soTo = window._currentParcelRawProps['Số tờ'] || window._currentParcelRawProps['So to'] || '-';
            const soThua = window._currentParcelRawProps['Số thửa'] || window._currentParcelRawProps['So thua'] || '-';
            const rawDienTich = window._currentParcelRawProps['Diện tích'] || window._currentParcelRawProps['Dien tich'] || window._currentParcelRawProps['dien_tich'] || window._currentParcelRawProps['DienTich'] || window._currentParcelRawProps['DIỆN TÍCH'] || '-';
            const dienTich = formatNumberVN(rawDienTich); // Hàm định dạng số kiểu Việt Nam
            const loaiDat = window._currentParcelRawProps['Loại Đất'] || window._currentParcelRawProps['Loại đất'] || '-';
            const tenChu = window._currentParcelRawProps['Tên Chủ'] || window._currentParcelRawProps['Tên chủ'] || '-';
            const soDinhDanh = window._currentParcelRawProps['Số định danh chủ đất'] || window._currentParcelRawProps['Số định danh'] || 'Không có';
            const ngayGhiChu = window._currentParcelRawProps['Ngày Ghi chú'] || todayFormatted; // Hiển thị ngày ghi chú mới cập nhật

            // Cấu trúc lại mã HTML hiển thị chi tiết trong bảng thông tin (Panel)
            const panelContent = `
                <div><b>Số tờ:</b> ${soTo}</div>
                <div><b>Số thửa:</b> ${soThua}</div>
                <div><b>Diện tích:</b> ${dienTich} m²</div>
                <div><b>Loại đất:</b> ${loaiDat}</div>
                <div style="grid-column: span 2;"><b>Tên chủ:</b> ${tenChu}</div>
                <div><b>Số định danh:</b> ${soDinhDanh}</div>
                <div><b>Ghi chú:</b> ${columnNLinkHTML}</div>
                <div style="grid-column: span 2; color: #5f6368; font-size: 12px; margin-top: 4px;"><b>Ngày ghi chú:</b> ${ngayGhiChu}</div>
            `;
            
            // Đẩy nội dung HTML mới vào phần tử chứa nội dung panel trên giao diện bản đồ
            const panelContentEl = document.getElementById('panel-content');
            if (panelContentEl) panelContentEl.innerHTML = panelContent;
        }

        // Thông báo thành công cho người dùng
        alert('Đã cập nhật Ghi chú và Ngày Ghi chú thành công vào Google Sheet!');
    };
}
