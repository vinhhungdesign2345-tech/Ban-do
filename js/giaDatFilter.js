/**
 * Mô-đun: Tra cứu giá đất theo tên đường (Tích hợp chuẩn hóa, tự động loại bỏ dấu & khoảng trắng để khớp tuyệt đối)
 */
document.addEventListener("DOMContentLoaded", function () {
    const phuongSelect = document.getElementById("phuongFilter");
    const duongInput = document.getElementById("duongFilter");
    const searchDuongBtn = document.getElementById("searchDuongBtn");
    const popupList = document.getElementById("duongPopupList");
    const resultPanel = document.getElementById("giaDatResultPanel");

    let giaDatRecords = [];

    // Hàm loại bỏ dấu tiếng Việt, đưa về chữ thường để so khớp chính xác tuyệt đối
    function removeDiacritics(str) {
        return (str || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Xóa các dấu huyền, sắc, hỏi, ngã, nặng...
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/\s+/g, " ")
            .trim();
    }

    // Kiểm tra và mở khóa ô nhập đường khi đã có Phường/Xã từ bản đồ hoặc chọn thủ công
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
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", doan: "Huỳnh Thúc Kháng", gia: "12.600 đ/m²" },
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Đường Cà Mau - Đầm Dơi", doan: "Đường Hải Thượng Lãn Ông", gia: "9.600 đ/m²" }
            ];
        }
        updateInputState();
    }

    loadGiaDatFromSheet();

    // Hàm thực hiện tìm kiếm tuyến đường
    function thucHienTimKiemDuong() {
        const keywordClean = removeDiacritics(duongInput.value);
        const selectedPhuongClean = removeDiacritics(phuongSelect.value);

        if (!resultPanel) return;
        resultPanel.style.display = "block";

        if (!selectedPhuongClean) {
            resultPanel.innerHTML = `<div style="color: #d9534f;">Vui lòng chọn Phường/Xã trước khi tra cứu giá đất!</div>`;
            return;
        }

        if (!keywordClean) {
            resultPanel.innerHTML = `<div style="color: #d9534f;">Vui lòng nhập tên đường cần tra cứu.</div>`;
            return;
        }

        // Lọc dữ liệu dựa trên chuỗi đã được loại bỏ dấu (khớp hoàn toàn không sợ lỗi font/kiểu gõ dấu)
        const matchedRows = giaDatRecords.filter(item => {
            const itemPhuongClean = removeDiacritics(item.phuong);
            const itemDuongClean = removeDiacritics(item.duong);
            const itemDoanClean = removeDiacritics(item.doan);

            const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
            const matchKeyword = itemDuongClean.includes(keywordClean) || itemDoanClean.includes(keywordClean);

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
        phuongSelect.addEventListener("change", updateInputState);

        // Theo dõi liên tục trạng thái thay đổi từ bản đồ click
        const observer = new MutationObserver(updateInputState);
        observer.observe(phuongSelect, { attributes: true, childList: true, subtree: true });
        setInterval(updateInputState, 500);

        // Gõ phím hiển thị Popup gợi ý
        duongInput.addEventListener("input", function () {
            updateInputState();
            const keywordClean = removeDiacritics(this.value);
            const selectedPhuongClean = removeDiacritics(phuongSelect.value);

            if (!keywordClean || !selectedPhuongClean || !popupList) {
                if (popupList) popupList.style.display = "none";
                return;
            }

            const matchedRows = giaDatRecords.filter(item => {
                const itemPhuongClean = removeDiacritics(item.phuong);
                const itemDuongClean = removeDiacritics(item.duong);
                const itemDoanClean = removeDiacritics(item.doan);
                const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
                return matchPhuong && (itemDuongClean.includes(keywordClean) || itemDoanClean.includes(keywordClean));
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

        searchDuongBtn.addEventListener("click", function (e) {
            e.preventDefault();
            thucHienTimKiemDuong();
        });

        duongInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                thucHienTimKiemDuong();
            }
        });

        document.addEventListener("click", function (e) {
            if (popupList && !duongInput.contains(e.target) && !popupList.contains(e.target) && !searchDuongBtn.contains(e.target)) {
                popupList.style.display = "none";
            }
        });
    }
});
