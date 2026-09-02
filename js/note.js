// ==========================================
// HÀM MỞ POPUP XEM HOẶC NHẬP GHI CHÚ VÀ CẬP NHẬT NGÀY GHI CHÚ (CỘT O)
// ==========================================
function openColumnNPopup(parcelId, mode, currentData = '') {
    
    // ----------------------------------------------------
    // BƯỚC 1: KIỂM TRA VÀ KHỞI TẠO KHUNG POPUP (MODAL CONTAINER) TRÊN DOM
    // ----------------------------------------------------
    let popupContainer = document.getElementById('column-n-popup-modal');
    
    // Nếu khung popup chưa tồn tại trong tài liệu HTML, ta tiến hành tạo mới một thẻ div
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'column-n-popup-modal'; // Gán ID để nhận diện cho các lần gọi sau
        
        // Thiết lập toàn bộ định dạng CSS trực tiếp cho lớp nền che màn hình (overlay)
        popupContainer.style.cssText = `
            position: fixed;             /* Cố định vị trí khung nhìn theo cửa sổ trình duyệt */
            top: 0;                      /* Canh sát mép trên cùng màn hình */
            left: 0;                     /* Canh sát mép trái cùng màn hình */
            width: 100%;                 /* Chiếm toàn bộ chiều rộng màn hình (100%) */
            height: 100%;                /* Chiếm toàn bộ chiều cao màn hình (100%) */
            background: rgba(0, 0, 0, 0.6); /* Màu nền đen mờ đục 60% tạo hiệu ứng tối cảnh phía sau */
            backdrop-filter: blur(2px);  /* Làm mờ nhẹ nội dung phía sau popup (hiệu ứng kính mờ) */
            display: flex;               /* Sử dụng mô hình flexbox để canh chỉnh phần tử con */
            align-items: center;         /* Canh giữa nội dung con theo chiều dọc */
            justify-content: center;     /* Canh giữa nội dung con theo chiều ngang */
            z-index: 9999;               /* Đặt lớp hiển thị cao nhất (nằm trên mọi thành phần giao diện khác) */
            padding: 16px;               /* Khoảng cách đệm an toàn xung quanh tránh sát mép màn hình thiết bị */
            box-sizing: border-box;      /* Bao gồm padding và border vào tổng kích thước chiều rộng/chiều cao */
        `;
        // Đưa khung popup vừa tạo vào bên trong thẻ body của trang web
        document.body.appendChild(popupContainer);
    }

    // ----------------------------------------------------
    // BƯỚC 2: XÁC ĐỊNH CHẾ ĐỘ HIỂN THỊ (VIEW HOẶC CREATE)
    // ----------------------------------------------------
    // Kiểm tra biến 'mode' được truyền vào có phải là chế độ 'view' (xem/sửa dữ liệu cũ) hay không
    const isViewMode = mode === 'view';
    
    // ----------------------------------------------------
    // BƯỚC 3: XÂY DỰNG CẤU TRÚC GIAO DIỆN HTML CHO HỘP THOẠI POPUP
    // ----------------------------------------------------
    popupContainer.innerHTML = `
        <div style="background: #fff; padding: 20px; border-radius: 12px; width: 100%; max-width: 380px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            
            <!-- Tiêu đề của popup: Tự động thay đổi biểu tượng và chữ dựa vào chế độ xem hay nhập mới -->
            <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1a73e8; display: flex; align-items: center; gap: 8px;">
                ${isViewMode ? '✍️ Chỉnh sửa Ghi chú' : '✍️ Nhập Ghi chú'}
            </h3>
            
            <!-- Dòng hiển thị ID của thửa đất đang được thao tác -->
            <p style="font-size: 13px; color: #5f6368; margin: 0 0 16px 0;">ID Thửa đất: <b>${parcelId}</b></p>
            
            <!-- Khu vực chứa ô nhập liệu dạng văn bản (textarea) -->
            <div style="margin-bottom: 20px;">
                <textarea id="popup-n-content" placeholder="Nhập nội dung ghi chú..." style="width: 100%; height: 120px; padding: 12px; border: 1px solid #dadce0; border-radius: 8px; resize: none; font-size: 14px; box-sizing: border-box; outline: none;" onfocus="this.style.borderColor='#1a73e8'" onblur="this.style.borderColor='#dadce0'">${currentData}</textarea>
            </div>
            
            <!-- Khu vực chứa các nút bấm hành động (Đóng và Lưu lại) -->
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="popup-close-btn" style="flex: 1; padding: 10px 16px; background: #f1f3f4; color: #3c4043; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">Đóng</button>
                <button id="popup-save-btn" style="flex: 1; padding: 10px 16px; background: #1a73e8; color: #fff; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">Lưu lại</button>
            </div>
        </div>
    `;

    // Hiển thị khung popup lên màn hình bằng cách chuyển trạng thái hiển thị thành 'flex'
    popupContainer.style.display = 'flex';

    // ----------------------------------------------------
    // BƯỚC 4: XỬ LÝ SỰ KIỆN KHI BẤM NÚT ĐÓNG (HỦY BỎ)
    // ----------------------------------------------------
    document.getElementById('popup-close-btn').onclick = () => {
        // Ẩn popup đi bằng cách gán display bằng 'none' mà không lưu lại thay đổi
        popupContainer.style.display = 'none';
    };

    // ----------------------------------------------------
    // BƯỚC 5: XỬ LÝ SỰ KIỆN KHI BẤM NÚT LƯU LẠI DỮ LIỆU
    // ----------------------------------------------------
    document.getElementById('popup-save-btn').onclick = () => {
        // Lấy nội dung chuỗi văn bản mới nhất từ ô textarea thông qua ID 'popup-n-content'
        const val = document.getElementById('popup-n-content').value; 
        
        // Tạo đối tượng thời gian hiện tại của hệ thống để lấy mốc ngày tháng thực tế
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');         // Lấy ngày (đảm bảo luôn có 2 chữ số, ví dụ: 02)
        const month = String(now.getMonth() + 1).padStart(2, '0');   // Lấy tháng (cộng 1 vì tháng bắt đầu từ 0, định dạng 2 chữ số)
        const year = now.getFullYear();                              // Lấy đầy đủ năm hiện tại (ví dụ: 2026)
        const todayFormatted = `${day}/${month}/${year}`;            // Ghép thành định dạng chuẩn ngày/tháng/năm

        // ----------------------------------------------------
        // BƯỚC 5.1: CẬP NHẬT TẠM THỜI VÀO BỘ NHỚ TRÌNH DUYỆT (UI CACHE)
        // ----------------------------------------------------
        if (window._currentParcelRawProps) {
            window._currentParcelRawProps['Cột N'] = val;           // Cập nhật nội dung ghi chú mới vào biến lưu trữ thô
            window._currentParcelRawProps['Ngày Ghi chú'] = todayFormatted; // Cập nhật đồng thời ngày ghi chú mới vào biến lưu trữ thô
        }

        // Thay đổi trạng thái trực quan của nút Lưu thành "Đang lưu..." và vô hiệu hóa (disabled) để tránh người dùng bấm liên tục nhiều lần
        const saveBtn = document.getElementById('popup-save-btn');
        saveBtn.innerText = 'Đang lưu...';
        saveBtn.disabled = true;

        // ----------------------------------------------------
        // BƯỚC 5.2: GỬI DỮ LIỆU LÊN HỆ THỐNG GOOGLE APPS SCRIPT QUA API (FETCH POST)
        // ----------------------------------------------------
        // Hằng số chứa đường dẫn định danh Web App được cung cấp bởi Google Apps Script
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec';

        fetch(SCRIPT_URL, {
            method: 'POST',           // Sử dụng phương thức HTTP POST để gửi dữ liệu cập nhật
            mode: 'no-cors',          // Chế độ không yêu cầu CORS để vượt qua cơ chế chặn chính sách nguồn gốc chéo của trình duyệt
            headers: { 
                'Content-Type': 'application/json' // Khai báo kiểu định dạng dữ liệu gửi đi là chuỗi JSON
            },
            body: JSON.stringify({
                action: 'update_column_n', // Tham số định danh hành động xử lý ở phía tập lệnh Google Apps Script
                id_thua_dat: parcelId,     // Truyền mã ID định danh thửa đất cần cập nhật dòng dữ liệu tương ứng
                ghi_chu: val               // Truyền nội dung văn bản ghi chú mới cần ghi nhận vào bảng tính
            })
        });

        // ----------------------------------------------------
        // BƯỚC 5.3: ĐÓNG GIAO DIỆN POPUP SAU KHI ĐÃ KÍCH HOẠT GỬI LỆNH
        // ----------------------------------------------------
        popupContainer.style.display = 'none';

        // ----------------------------------------------------
        // BƯỚC 5.4: LÀM MỚI VÀ RENDER LẠI KHUNG HIỂN THỊ THÔNG TIN (INFO PANEL) NGAY TẠI CHỖ
        // ----------------------------------------------------
        if (window.selectedThuaDatId === parcelId && window._currentParcelRawProps) {
            
            // Đăng ký lại hàm callback xem/sửa chi tiết gắn liền với mã ID thửa đất hiện tại kèm dữ liệu mới
            window[`_viewColN_${parcelId}`] = () => openColumnNPopup(parcelId, 'view', val);
            
            // Tạo đoạn mã HTML liên kết chữ "xem" tương tác kích hoạt hàm mở lại popup
            const columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._viewColN_${parcelId}();" style="color: #007bff; text-decoration: underline; font-weight: bold;">xem</a>`;
            
            // Trích xuất các thuộc tính thông tin chi tiết khác của thửa đất từ biến bộ nhớ tạm với các tên biến dự phòng khác nhau
            const soTo = window._currentParcelRawProps['Số tờ'] || window._currentParcelRawProps['So to'] || '-';
            const soThua = window._currentParcelRawProps['Số thửa'] || window._currentParcelRawProps['So thua'] || '-';
            const rawDienTich = window._currentParcelRawProps['Diện tích'] || window._currentParcelRawProps['Dien tich'] || window._currentParcelRawProps['dien_tich'] || window._currentParcelRawProps['DienTich'] || window._currentParcelRawProps['DIỆN TÍCH'] || '-';
            const dienTich = formatNumberVN(rawDienTich); // Gọi hàm tiện ích chuẩn hóa định dạng số kiểu Việt Nam
            const loaiDat = window._currentParcelRawProps['Loại Đất'] || window._currentParcelRawProps['Loại đất'] || '-';
            const tenChu = window._currentParcelRawProps['Tên Chủ'] || window._currentParcelRawProps['Tên chủ'] || '-';
            const soDinhDanh = window._currentParcelRawProps['Số định danh chủ đất'] || window._currentParcelRawProps['Số định danh'] || 'Không có';
            const ngayGhiChu = window._currentParcelRawProps['Ngày Ghi chú'] || todayFormatted; // Lấy ngày ghi chú mới cập nhật để hiển thị

            // Gom nhóm toàn bộ cấu trúc nội dung hiển thị chi tiết dạng lưới (Grid layout) của bảng thông tin
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
            
            // Tìm phần tử chứa nội dung panel trên giao diện và tiêm đoạn mã HTML mới vào để cập nhật hiển thị trực quan
            const panelContentEl = document.getElementById('panel-content');
            if (panelContentEl) panelContentEl.innerHTML = panelContent;
        }

        // ----------------------------------------------------
        // BƯỚC 6: THÔNG BÁO HOÀN TẤT CHO NGƯỜI DÙNG
        // ----------------------------------------------------
        alert('Đã cập nhật Ghi chú thành công!');
    };
}
