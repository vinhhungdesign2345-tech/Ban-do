/**
 * Mô-đun: Tra cứu giá đất theo tên đường (Đã tối ưu hóa tìm kiếm không bị kẹt lỗi)
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

    // Hàm thực hiện tìm kiếm tuyến đường
    function thucHienTimKiemDuong() {
        const keyword = duongInput.value.toLowerCase().trim();
        const selectedPhuong = phuongSelect.value ? phuongSelect.value.toLowerCase().trim() : "";

        if (!keyword) return;

        // Tìm kiếm linh hoạt: Ưu tiên khớp cả Phường và Tên đường; nếu người dùng chưa chọn kỹ phường thì quét theo tên đường
        let matchedRow = null;
        if (selectedPhuong) {
            matchedRow = giaDatRecords.find(item => 
                item.duong.toLowerCase().includes(keyword) && 
                item.phuong.toLowerCase().includes(selectedPhuong)
            );
        }
        
        // Nếu không thấy theo phường, quét rộng ra toàn bộ danh sách theo tên đường
        if (!matchedRow) {
            matchedRow = giaDatRecords.find(item => item.duong.toLowerCase().includes(keyword));
        }

        resultPanel.style.display = "block";
        if (matchedRow) {
            duongInput.value = matchedRow.duong;
            popupList.style.display = "none";
            resultPanel.innerHTML = `
                <div style="font-weight: bold; color: #1a73e8; margin-bottom: 2px;">📍 ${matchedRow.duong} (${matchedRow.phuong || 'Toàn khu vực'})</div>
                <div style="color: #555; margin-bottom: 2px;"><b>Đoạn:</b> ${matchedRow.doan || 'Toàn tuyến'}</div>
                <div style="color: #d9534f; font-weight: bold;"><b>Giá đất:</b> ${matchedRow.gia}</div>
            `;
        } else {
            popupList.style.display = "none";
            resultPanel.innerHTML = `<div style="color: #d9534f;">Không tìm thấy tuyến đường "${keyword}" trong cơ sở dữ liệu giá đất.</div>`;
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
            }
        });

        // Gõ phím hiển thị Popup gợi ý
        duongInput.addEventListener("input", function () {
            const keyword = this.value.toLowerCase().trim();
            if (!keyword) {
                popupList.style.display = "none";
                return;
            }

            const matchedRows = giaDatRecords.filter(item => item.duong.toLowerCase().includes(keyword));

            if (matchedRows.length > 0) {
                popupList.innerHTML = "";
                popupList.style.display = "block";

                matchedRows.forEach(row => {
                    const divItem = document.createElement("div");
                    divItem.style.padding = "8px 10px";
                    divItem.style.cursor = "pointer";
                    divItem.style.borderBottom = "1px solid #eee";
                    divItem.innerHTML = `<b>${row.duong}</b> <span style="font-size: 11px; color: #666;">(${row.phuong} - ${row.doan})</span>`;

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
