/**
 * Mô-đun: Tra cứu giá đất theo tên đường (Cho phép nhập tự do, không bắt buộc chọn popup, hỗ trợ nhận dữ liệu từ map)
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongInput = document.getElementById("duongFilter");
    const searchDuongBtn = document.getElementById("searchDuongBtn");
    const popupList = document.getElementById("duongPopupList");
    const resultPanel = document.getElementById("giaDatResultPanel");

    let giaDatRecords = [];

    // Hàm chuẩn hóa chuỗi để so khớp không lỗi khoảng trắng, hoa thường
    function normalizeStr(str) {
        return (str || "").toString().toLowerCase().trim().replace(/\s+/g, ' ');
    }

    // Kiểm tra và cập nhật trạng thái mở khóa ô nhập đường dựa trên dropdown Phường/Xã
    function updateInputState() {
        const hasPhuong = phuongSelect && phuongSelect.value && phuongSelect.value.trim() !== "";
        if (duongInput) duongInput.disabled = !hasPhuong;
        if (searchDuongBtn) searchDuongBtn.disabled = !hasPhuong;
        
        if (!hasPhuong && duongInput) {
            duongInput.value = "";
            if (resultPanel) resultPanel.style.display = "none";
            if (popupList) popupList.style.display = "none";
        }
    }

    // Tải dữ liệu từ Google Apps Script
    async function loadGiaDatFromSheet() {
        try {
            const apiUrl = "https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec?sheet=giadat";
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (Array.isArray(data)) {
                giaDatRecords = data.map(item => ({
                    phuong: (item.phuong || item.Phuong || "").toString().trim(),
                    duong: (item.duong || item.Duong || "").toString().trim(),
                    doan: (item.doan || item.Doan || "").toString().trim(),
                    gia: (item.gia || item.Gia || "").toString().trim()
                }));
            } else {
                throw new Error("Dữ liệu không phải mảng JSON hợp lệ");
            }
        } catch (err) {
            console.warn("Dùng dữ liệu mẫu dự phòng do lỗi API:", err);
            giaDatRecords = [
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", doan: "Huỳnh Thúc Kháng", gia: "12.600" },
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Đường Cà Mau - Đầm Dơi", doan: "Đường Hải Thượng Lãn Ông", gia: "9.600" }
            ];
        }
        updateInputState();
    }

    loadGiaDatFromSheet();

    // Hàm thực hiện tìm kiếm tuyến đường (Gõ tự do và bấm tìm kiếm)
    function thucHienTimKiemDuong() {
        const keyword = normalizeStr(duongInput.value);
        const selectedPhuong = normalizeStr(phuongSelect.value);

        if (!resultPanel) return;
        resultPanel.style.display = "block";

        if (!selectedPhuong) {
            resultPanel.innerHTML = `<div style="color: #d9534f;">Vui lòng chọn Phường/Xã trước khi tra cứu giá đất!</div>`;
            return;
        }

        if (!keyword) {
            resultPanel.innerHTML = `<div style="color: #d9534f;">Vui lòng nhập tên đường cần tra cứu.</div>`;
            return;
        }

        // Lọc linh hoạt: Khớp Phường/Xã VÀ từ khóa xuất hiện ở tên đường hoặc đoạn đường
        const matchedRows = giaDatRecords.filter(item => {
            const itemPhuongNorm = normalizeStr(item.phuong);
            const itemDuongNorm = normalizeStr(item.duong);
            const itemDoanNorm = normalizeStr(item.doan);

            const matchPhuong = itemPhuongNorm === selectedPhuong || itemPhuongNorm.includes(selectedPhuong) || selectedPhuong.includes(itemPhuongNorm);
            const matchKeyword = itemDuongNorm.includes(keyword) || itemDoanNorm.includes(keyword);

            return matchPhuong && matchKeyword;
        });

        if (popupList) popupList.style.display = "none";

        if (matchedRows.length > 0) {
            let htmlContent = `<div style="font-weight: bold; color: #1a73e8; margin-bottom: 6px;">📍 Kết quả tại: ${phuongSelect.value}</div>`;
            
            matchedRows.forEach(row => {
                htmlContent += `
                    <div style="border-top: 1px solid #eee; padding-top: 6px; margin-top: 6px;">
                        <div style="color: #333;"><b>Đường:</b> ${row.duong || '(Trống)'}</div>
                        <div style="color: #555;"><b>Đoạn/Mô tả:</b> ${row.doan || 'Toàn tuyến'}</div>
                        <div style="color: #d9534f; font-weight: bold;"><b>Giá đất:</b> ${row.gia}</div>
                    </div>
                `;
            });

            resultPanel.innerHTML = htmlContent;
        } else {
            resultPanel.innerHTML = `<div style="color: #d9534f;">Không tìm thấy nội dung liên quan đến "${duongInput.value}" trong khu vực này.</div>`;
        }
    }

    if (phuongSelect && duongInput && searchDuongBtn) {
        // Lắng nghe sự kiện thay đổi thủ công trên dropdown
        phuongSelect.addEventListener("change", updateInputState);

        // Theo dõi liên tục trường hợp bản đồ tự động gán giá trị cho dropdown (dùng MutationObserver)
        const observer = new MutationObserver(updateInputState);
        observer.observe(phuongSelect, { attributes: true, childList: true, subtree: true });
        setInterval(updateInputState, 500); // Quét định kỳ nhẹ để đồng bộ tức thì với map click

        // Gõ phím hiển thị Popup gợi ý (Chỉ mang tính chất gợi ý nhanh, không bắt buộc phải bấm vào)
        duongInput.addEventListener("input", function () {
            updateInputState();
            const keyword = normalizeStr(this.value);
            const selectedPhuong = normalizeStr(phuongSelect.value);

            if (!keyword || !selectedPhuong || !popupList) {
                if (popupList) popupList.style.display = "none";
                return;
            }

            const matchedRows = giaDatRecords.filter(item => {
                const itemPhuongNorm = normalizeStr(item.phuong);
                const itemDuongNorm = normalizeStr(item.duong);
                const itemDoanNorm = normalizeStr(item.doan);
                const matchPhuong = itemPhuongNorm === selectedPhuong || itemPhuongNorm.includes(selectedPhuong) || selectedPhuong.includes(itemPhuongNorm);
                return matchPhuong && (itemDuongNorm.includes(keyword) || itemDoanNorm.includes(keyword));
            });

            if (matchedRows.length > 0) {
                popupList.innerHTML = "";
                popupList.style.display = "block";

                matchedRows.forEach(row => {
                    const divItem = document.createElement("div");
                    divItem.style.padding = "8px 10px";
                    divItem.style.cursor = "pointer";
                    divItem.style.borderBottom = "1px solid #eee";
                    divItem.innerHTML = `<b>${row.duong}</b> <span style="font-size: 11px; color: #666;">(${row.doan})</span>`;

                    divItem.addEventListener("mouseenter", () => divItem.style.backgroundColor = "#f1f3f4");
                    divItem.addEventListener("mouseleave", () => divItem.style.backgroundColor = "#fff");

                    // Người dùng có thể click gợi ý HOẶC cứ gõ tự do rồi bấm nút Tìm kiếm / Enter đều được
                    divItem.addEventListener("click", function () {
                        duongInput.value = row.duong;
                        popupList.style.display = "none";
                        thucHienTimKiemDuong();
                    });

                    popupList.appendChild(divItem);
                });
            } else {
                popupList.style.display = "none";
            }
        });

        // Bấm nút tìm kiếm 🔍 (Xử lý trực tiếp từ khóa đang gõ)
        searchDuongBtn.addEventListener("click", function (e) {
            e.preventDefault();
            thucHienTimKiemDuong();
        });

        // Nhấn phím Enter (Xử lý trực tiếp từ khóa đang gõ)
        duongInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                thucHienTimKiemDuong();
            }
        });

        // Click ra ngoài thì ẩn popup gợi ý nhưng không ảnh hưởng kết quả tìm kiếm
        document.addEventListener("click", function (e) {
            if (popupList && !duongInput.contains(e.target) && !popupList.contains(e.target) && !searchDuongBtn.contains(e.target)) {
                popupList.style.display = "none";
            }
        });
    }
});
