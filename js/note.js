// ==========================================
// note.js HÀM MỞ POPUP XEM HOẶC NHẬP GHI CHÚ
// ==========================================
function openColumnNPopup(parcelId, mode, currentData = '') {
    // Kiểm tra hoặc tạo phần tử Popup trên DOM nếu chưa có
    let popupContainer = document.getElementById('column-n-popup-modal');
    
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'column-n-popup-modal';
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

    // Ở chế độ 'view' có thể chỉnh sửa nội dung
    const isViewMode = mode === 'view';
    
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

    popupContainer.style.display = 'flex';

    // Xử lý sự kiện đóng popup
    document.getElementById('popup-close-btn').onclick = () => {
        popupContainer.style.display = 'none';
    };

    // Xử lý sự kiện lưu lại dữ liệu (cho cả 2 trường hợp thêm mới hoặc cập nhật)
    document.getElementById('popup-save-btn').onclick = () => {
        const val = document.getElementById('popup-n-content').value;
        
        // 1. Cập nhật ngay vào bộ nhớ tạm để UI phản hồi
        if (window._currentParcelRawProps) {
            window._currentParcelRawProps['Cột N'] = val;
        }

        const saveBtn = document.getElementById('popup-save-btn');
        saveBtn.innerText = 'Đang lưu...';
        saveBtn.disabled = true;

        // 2. Gửi request POST đến Web App URL của Google Apps Script
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec';

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                action: 'update_column_n',
                id_thua_dat: parcelId,
                ghi_chu: val
            })
        });

        // 3. Đóng popup và cập nhật lại giao diện bảng thông tin
        popupContainer.style.display = 'none';

        if (window.selectedThuaDatId === parcelId && window._currentParcelRawProps) {
            window[`_viewColN_${parcelId}`] = () => openColumnNPopup(parcelId, 'view', val);
            
            const columnNLinkHTML = `<a href="javascript:void(0);" onclick="window._viewColN_${parcelId}();" style="color: #007bff; text-decoration: underline; font-weight: bold;">xem</a>`;
            
            const soTo = window._currentParcelRawProps['Số tờ'] || window._currentParcelRawProps['So to'] || '-';
            const soThua = window._currentParcelRawProps['Số thửa'] || window._currentParcelRawProps['So thua'] || '-';
            const rawDienTich = window._currentParcelRawProps['Diện tích'] || window._currentParcelRawProps['Dien tich'] || window._currentParcelRawProps['dien_tich'] || window._currentParcelRawProps['DienTich'] || window._currentParcelRawProps['DIỆN TÍCH'] || '-';
            const dienTich = formatNumberVN(rawDienTich);
            const loaiDat = window._currentParcelRawProps['Loại Đất'] || window._currentParcelRawProps['Loại đất'] || '-';
            const tenChu = window._currentParcelRawProps['Tên Chủ'] || window._currentParcelRawProps['Tên chủ'] || '-';
            const soDinhDanh = window._currentParcelRawProps['Số định danh chủ đất'] || window._currentParcelRawProps['Số định danh'] || 'Không có';

            const panelContent = `
                <div><b>Số tờ:</b> ${soTo}</div>
                <div><b>Số thửa:</b> ${soThua}</div>
                <div><b>Diện tích:</b> ${dienTich} m²</div>
                <div><b>Loại đất:</b> ${loaiDat}</div>
                <div style="grid-column: span 2;"><b>Tên chủ:</b> ${tenChu}</div>
                <div><b>Số định danh:</b> ${soDinhDanh}</div>
                <div><b>Ghi chú:</b> ${columnNLinkHTML}</div>
            `;
            
            const panelContentEl = document.getElementById('panel-content');
            if (panelContentEl) panelContentEl.innerHTML = panelContent;
        }

        alert('Đã cập nhật Ghi chú thành công vào Google Sheet!');
    };
}
