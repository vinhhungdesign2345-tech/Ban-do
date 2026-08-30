/**
 * Mô-đun: Tra cứu giá đất theo tên đường (Đã cập nhật chuẩn logic lọc theo Phường/Xã và tìm kiếm toàn bộ nội dung liên quan)
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongInput = document.getElementById("duongFilter");
    const searchDuongBtn = document.getElementById("searchDuongBtn");
    const popupList = document.getElementById("duongPopupList");
    const resultPanel = document.getElementById("giaDatResultPanel");

    let giaDatRecords = [];

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
                { phuong: "Phường 7", duong: "Hải Thượng Lãn Ông", doan: "Đoạn từ QL1 đến hết tuyến", gia: "3.500.000 đ/m²" },
                { phuong: "Phường 7", duong: "Hùng Vương", doan: "Toàn tuyến", gia: "5.000.000 đ/m²" },
                { phuong: "Phường 5", duong: "Phan Ngọc Hiển", doan: "Đoạn từ cầu Phụng Hiệp", gia: "12.000.000 đ/m²" },
                { phuong: "Xã Hòa Thành", duong: "Tuyến lộ Xà No", doan: "Toàn tuyến", gia: "1.200.000 đ/m²" }
            ];
        }
    }

    loadGiaDatFromSheet();

    // Hàm thực hiện tìm kiếm tuyến đường theo đúng Phường/Xã đã chọn
    function thucHienTimKiemDuong() {
        const keyword = duongInput.value.toLowerCase().trim();
        const selectedPhuong = phuongSelect.value ? phuongSelect.value.trim() : "";

        resultPanel.style.display = "block";

        // Kiểm tra nếu chưa chọn Phường/Xã
        if (!selectedPhuong) {
            resultPanel.innerHTML = `<div style="color: #d9534f;">Vui lòng chọn Phường/Xã trước khi tra cứu giá đất!</div>`;
            return;
        }

        if (!keyword) {
            resultPanel.innerHTML = `<div style="color: #d9534f;">Vui lòng nhập tên đường cần tra cứu.</div>`;
            return;
        }

        // BẮT BUỘC: Lọc tất cả các dòng trong Sheet có cột Phường trùng khớp với Phường đang chọn (không phân biệt hoa thường)
        // và tên đường chứa từ khóa người dùng nhập vào
        const matchedRows = giaDatRecords.filter(item => 
            item.phuong.toLowerCase() === selectedPhuong.toLowerCase() && 
            item.duong.toLowerCase().includes(keyword)
        );

        popupList.style.display = "none";

        if (matchedRows.length > 0) {
            // Hiển thị tất cả các đoạn/kết quả liên quan tìm được
            let htmlContent = `<div style="font-weight: bold; color: #1a73e8; margin-bottom: 4px;">📍 Kết quả tại: ${selectedPhuong}</div>`;
            
            matchedRows.forEach(row => {
                htmlContent += `
                    <div style="border-top: 1px solid #eee; padding-top: 4px; margin-top: 4px;">
                        <div style="color: #333;"><b>Đường:</b> ${row.duong}</div>
                        <div style="color: #555;"><b>Đoạn:</b> ${row.doan || 'Toàn tuyến'}</div>
                        <div style="color: #d9534f; font-weight: bold;"><b>Giá đất:</b> ${row.gia}</div>
                    </div>
                `;
            });

            resultPanel.innerHTML = htmlContent;
        } else {
            resultPanel.innerHTML = `<div style="color: #d9534f;">Không tìm thấy tuyến đường "${keyword}" thuộc khu vực "${selectedPhuong}" trong cơ sở dữ liệu giá đất.</div>`;
        }
    }

    // Sự kiện chọn Phường -> Mở khóa ô nhập đường
    if (phuongSelect && duongInput && searchDuongBtn) {
        phuongSelect.addEventListener("change", function () {
            const selectedPhuong = this.value;
            duongInput.disabled = !selectedPhuong;
            searchDuongBtn.disabled = !selectedPhuong;
            if (!selectedPhuong) {
                duongInput.value = "";
                resultPanel.style.display = "none";
                popupList.style.display = "none";
            }
        });

        // Gõ phím hiển thị Popup gợi ý (chỉ gợi ý các đường thuộc đúng Phường đang chọn)
        duongInput.addEventListener("input", function () {
            const keyword = this.value.toLowerCase().trim();
            const selectedPhuong = phuongSelect.value ? phuongSelect.value.trim() : "";

            if (!keyword || !selectedPhuong) {
                popupList.style.display = "none";
                return;
            }

            // Lọc danh sách gợi ý theo đúng Phường và chứa từ khóa tên đường
            const matchedRows = giaDatRecords.filter(item => 
                item.phuong.toLowerCase() === selectedPhuong.toLowerCase() && 
                item.duong.toLowerCase().includes(keyword)
            );

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

        // Bấm nút tìm kiếm 🔍
        searchDuongBtn.addEventListener("click", function (e) {
            e.preventDefault();
            thucHienTimKiemDuong();
        });

        // Nhấn phím Enter
        duongInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                thucHienTimKiemDuong();
            }
        });

        // Click ra ngoài thì ẩn popup
        document.addEventListener("click", function (e) {
            if (!duongInput.contains(e.target) && !popupList.contains(e.target) && !searchDuongBtn.contains(e.target)) {
                popupList.style.display = "none";
            }
        });
    }
});
