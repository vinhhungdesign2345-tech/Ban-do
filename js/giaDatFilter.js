/**
 * ====================================================================================
 * MÔ-ĐUN: TRA CỨU GIÁ ĐẤT THEO TÊN ĐƯỜNG VÀ PHƯỜNG/XÃ
 * Tính năng: Lọc, gợi ý tự động (autocomplete) và hiển thị chi tiết 5 cột 
 * (Phường, Đường, Từ, Đến, Giá đất) từ Google Apps Script.
 * ====================================================================================
 */
document.addEventListener("DOMContentLoaded", function () {
    // 1. Khai báo các thành phần giao diện (DOM Elements) liên quan đến tra cứu giá đất
    const phuongSelect = document.getElementById("phuongFilter");     // Thẻ chọn Phường/Xã
    const duongInput = document.getElementById("duongFilter");         // Ô nhập tên đường cần tìm
    const searchDuongBtn = document.getElementById("searchDuongBtn"); // Nút bấm tìm kiếm
    const popupList = document.getElementById("duongPopupList");       // Khung popup hiển thị gợi ý đường
    const resultPanel = document.getElementById("giaDatResultPanel");   // Khung chứa kết quả tra cứu chi tiết

    // Biến toàn cục lưu trữ danh sách dữ liệu giá đất tải về từ Google Sheet
    let giaDatRecords = [];

    /**
     * Hàm loại bỏ dấu tiếng Việt và chuẩn hóa chuỗi
     * Giúp quá trình tìm kiếm không bị phân biệt chữ hoa/thường, có dấu hay không dấu.
     */
    function removeDiacritics(str) {
        return (str || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Xóa các ký tự dấu
            .replace(/đ/g, "d")               // Đổi chữ đ thường
            .replace(/Đ/g, "D")               // Đổi chữ Đ hoa
            .replace(/\s+/g, " ")             // Thu gọn khoảng trắng thừa
            .trim();                          // Cắt khoảng trắng đầu cuối
    }

    /**
     * Hàm cập nhật trạng thái kích hoạt của ô nhập đường và nút bấm tìm kiếm.
     * Quy tắc: Chỉ cho phép nhập/tìm kiếm đường khi người dùng đã chọn Phường/Xã.
     */
    function updateInputState() {
        const hasPhuong = phuongSelect && phuongSelect.value && phuongSelect.value.trim() !== "";
        
        // Vô hiệu hóa hoặc kích hoạt ô nhập và nút tìm kiếm dựa trên việc đã chọn Phường chưa
        if (duongInput) duongInput.disabled = !hasPhuong;
        if (searchDuongBtn) searchDuongBtn.disabled = !hasPhuong;
        
        // Nếu chưa chọn Phường, tự động reset ô nhập đường và ẩn các bảng kết quả/gợi ý
        if (!hasPhuong && duongInput) {
            duongInput.value = "";
            if (resultPanel) resultPanel.style.display = "none";
            if (popupList) popupList.style.display = "none";
        }
    }

    /**
     * Hàm bất đồng bộ (Async) tải dữ liệu giá đất từ Google Apps Script API.
     * Ánh xạ chính xác mảng 5 cột: [Phường, Đường, Từ, Đến, Giá đất]
     */
    async function loadGiaDatFromSheet() {
        try {
            // URL API triển khai từ Google Apps Script với tham số ?sheet=giadat
            const apiUrl = "https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec?sheet=giadat";
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Kiểm tra nếu dữ liệu trả về đúng định dạng mảng
            if (Array.isArray(data)) {
                giaDatRecords = data.map(item => {
                    let phuong = "", duong = "", tu = "", den = "", gia = "";
                    
                    if (Array.isArray(item)) {
                        // Ánh xạ chuẩn xác từ mảng 5 cột do GAS trả về:
                        phuong = (item[0] || "").toString().trim(); // Cột A: Phường
                        duong =  (item[1] || "").toString().trim(); // Cột B: Đường
                        tu =     (item[2] || "").toString().trim(); // Cột C: Từ
                        den =    (item[3] || "").toString().trim(); // Cột D: Đến
                        gia =    (item[4] || "").toString().trim(); // Cột E: Giá đất 2026
                    } else if (typeof item === "object" && item !== null) {
                        // Dự phòng (Fallback) an toàn nếu dữ liệu trả về dạng object
                        const vals = Object.values(item);
                        phuong = (vals[0] || item.phuong || item.Phuong || "").toString().trim();
                        duong =  (vals[1] || item.duong || item.Duong || "").toString().trim();
                        tu =     (vals[2] || item.tu || item.Tu || "").toString().trim();
                        den =    (vals[3] || item.den || item.Den || "").toString().trim();
                        gia =    (vals[4] || item.gia || item.Gia || "").toString().trim();
                    }

                    return { phuong, duong, tu, den, gia };
                });
            } else {
                throw new Error("Dữ liệu trả về từ API không phải là mảng JSON hợp lệ");
            }
        } catch (err) {
            console.warn("Dùng dữ liệu mẫu dự phòng do lỗi kết nối API:", err);
            // Dữ liệu mẫu dự phòng khi lỗi mạng hoặc lỗi script
            giaDatRecords = [
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", tu: "Huỳnh Thúc Kháng", den: "Kênh Cổng Đôi", gia: "12.600.000" },
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", tu: "Kênh Cổng Đôi", den: "Cổng Cầu Nhum", gia: "9.600.000" },
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Đường Cà Mau - Đầm Dơi", tu: "Đường Hải Thượng Lãn Ông", den: "hết đoạn 2 chiều", gia: "9.600.000" }
            ];
        }
        updateInputState();
    }

    // Gọi hàm tải dữ liệu ngay khi tải trang
    loadGiaDatFromSheet();

    /**
     * Hàm thực hiện tìm kiếm chính thức khi người dùng bấm nút tìm kiếm hoặc nhấn phím Enter.
     * Lọc và hiển thị kết quả chi tiết gồm 4 cột thông tin (Đường, Từ, Đến, Giá đất).
     */
    function thucHienTimKiemDuong() {
        const keywordClean = removeDiacritics(duongInput.value);
        const selectedPhuongClean = removeDiacritics(phuongSelect.value);

        if (!resultPanel) return;
        resultPanel.style.display = "block";

        // Kiểm tra điều kiện bắt buộc: Phải chọn Phường trước
        if (!selectedPhuongClean) {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Vui lòng chọn Phường/Xã trước khi tra cứu giá đất!</div>`;
            return;
        }

        // Kiểm tra điều kiện bắt buộc: Phải nhập từ khóa tên đường
        if (!keywordClean) {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Vui lòng nhập tên đường cần tra cứu.</div>`;
            return;
        }

        // Lọc danh sách: Phải khớp Phường VÀ từ khóa xuất hiện ở Tên đường, Từ, hoặc Đến
        const matchedRows = giaDatRecords.filter(item => {
            const itemPhuongClean = removeDiacritics(item.phuong);
            const itemDuongClean = removeDiacritics(item.duong);
            const itemTuClean = removeDiacritics(item.tu);
            const itemDenClean = removeDiacritics(item.den);

            const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
            const matchKeyword = itemDuongClean.includes(keywordClean) || itemTuClean.includes(keywordClean) || itemDenClean.includes(keywordClean);

            return matchPhuong && matchKeyword;
        });

        // Ẩn bảng gợi ý (popup) khi đã thực hiện tìm kiếm xong
        if (popupList) popupList.style.display = "none";

        // Xử lý hiển thị kết quả tìm kiếm ra giao diện
        if (matchedRows.length > 0) {
            let keywordHienThi = duongInput.value.trim();
            // Cập nhật tiêu đề hiển thị số lượng kết quả và tên đường theo yêu cầu mới
            let htmlContent = `<div style="font-weight: bold; color: #1a73e8; margin-bottom: 8px; font-size: 13px;">📍 Tìm thấy ${matchedRows.length} kết quả cho ${keywordHienThi}</div>`;
            
            // Duyệt qua từng dòng kết quả phù hợp để dựng giao diện thẻ (card)
            matchedRows.forEach(row => {
                htmlContent += `
                    <div style="background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="color: #000; font-weight: bold; margin-bottom: 3px;">🛣️ Đường: ${row.duong || '(Trống)'}</div>
                        <div style="color: #444; margin-bottom: 2px;"><b>Từ:</b> ${row.tu || '---'}</div>
                        <div style="color: #444; margin-bottom: 4px;"><b>Đến:</b> ${row.den || '---'}</div>
                        <div style="color: #d9534f; font-weight: bold; border-top: 1px dashed #eee; padding-top: 4px;">💰 Giá đất: ${row.gia ? row.gia + ' đ/m²' : 'Chưa cập nhật'}</div>
                    </div>
                `;
            });

            resultPanel.innerHTML = htmlContent;
        } else {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Không tìm thấy nội dung liên quan đến "${duongInput.value}" trong khu vực này.</div>`;
        }
    }

    // 2. Đăng ký các bộ lắng nghe sự kiện (Event Listeners) cho các thao tác người dùng
    if (phuongSelect && duongInput && searchDuongBtn) {
        
        // Sự kiện khi thay đổi lựa chọn Phường/Xã
        phuongSelect.addEventListener("change", updateInputState);

        // Theo dõi thay đổi cấu trúc của thẻ chọn Phường bằng MutationObserver & setInterval để đồng bộ trạng thái
        const observer = new MutationObserver(updateInputState);
        observer.observe(phuongSelect, { attributes: true, childList: true, subtree: true });
        setInterval(updateInputState, 500);

        // Sự kiện khi người dùng gõ phím vào ô nhập tên đường (Gợi ý tự động - Autocomplete)
        duongInput.addEventListener("input", function () {
            updateInputState();
            const keywordClean = removeDiacritics(this.value);
            const selectedPhuongClean = removeDiacritics(phuongSelect.value);

            if (!keywordClean || !selectedPhuongClean || !popupList) {
                if (popupList) popupList.style.display = "none";
                return;
            }

            // Lọc các dòng gợi ý phù hợp với từ khóa đang gõ
            const matchedRows = giaDatRecords.filter(item => {
                const itemPhuongClean = removeDiacritics(item.phuong);
                const itemDuongClean = removeDiacritics(item.duong);
                const itemTuClean = removeDiacritics(item.tu);
                const itemDenClean = removeDiacritics(item.den);
                const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
                return matchPhuong && (itemDuongClean.includes(keywordClean) || itemTuClean.includes(keywordClean) || itemDenClean.includes(keywordClean));
            });

            // Hiển thị danh sách gợi ý trong popup
            if (matchedRows.length > 0) {
                popupList.innerHTML = "";
                popupList.style.display = "block";

                matchedRows.forEach(row => {
                    const divItem = document.createElement("div");
                    divItem.style.padding = "8px 10px";
                    divItem.style.cursor = "pointer";
                    divItem.style.borderBottom = "1px solid #eee";
                    divItem.innerHTML = `<b>${row.duong}</b> <span style="font-size: 11px; color: #666;">(Từ: ${row.tu} - Đến: ${row.den})</span>`;

                    // Hiệu ứng rê chuột đổi màu nền
                    divItem.addEventListener("mouseenter", () => divItem.style.backgroundColor = "#f1f3f4");
                    divItem.addEventListener("mouseleave", () => divItem.style.backgroundColor = "#fff");

                    // Khi bấm vào một gợi ý, tự điền tên đường và thực hiện tìm kiếm luôn
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

        // Sự kiện bấm nút Tìm kiếm
        searchDuongBtn.addEventListener("click", function (e) {
            e.preventDefault();
            thucHienTimKiemDuong();
        });

        // Sự kiện nhấn phím Enter trong ô nhập tên đường
        duongInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                thucHienTimKiemDuong();
            }
        });

        // Sự kiện click ra bên ngoài vùng tìm kiếm sẽ tự động ẩn khung popup gợi ý
        document.addEventListener("click", function (e) {
            if (popupList && !duongInput.contains(e.target) && !popupList.contains(e.target) && !searchDuongBtn.contains(e.target)) {
                popupList.style.display = "none";
            }
        });
    }
});
