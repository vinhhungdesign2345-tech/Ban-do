/**
 * ====================================================================================
 * MÔ-ĐUN: TRA CỨU GIÁ ĐẤT THEO TÊN ĐƯỜNG VÀ PHƯỜNG/XÃ
 * ====================================================================================
 */
document.addEventListener("DOMContentLoaded", function () {
    // 1. Khai báo các thành phần giao diện (DOM Elements) liên quan đến tra cứu giá đất
    const phuongSelect = document.getElementById("phuongFilter");     // Thẻ chọn Phường/Xã (Dropdown)
    const duongInput = document.getElementById("duongFilter");         // Ô nhập tên đường cần tìm kiếm
    const searchDuongBtn = document.getElementById("searchDuongBtn"); // Nút bấm thực hiện tìm kiếm
    const popupList = document.getElementById("duongPopupList");       // Khung popup chứa danh sách gợi ý đường khi gõ
    const resultPanel = document.getElementById("giaDatResultPanel");   // Khung hiển thị bảng kết quả tra cứu chi tiết

    // Biến toàn cục lưu trữ danh sách dữ liệu giá đất được tải về từ Google Sheet
    let giaDatRecords = [];

    /**
     * Hàm loại bỏ dấu tiếng Việt và chuẩn hóa chuỗi ký tự.
     * Tác dụng: Giúp quá trình tìm kiếm không phân biệt chữ hoa/thường, có dấu hay không dấu.
     */
    function removeDiacritics(str) {
        return (str || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Xóa các ký tự dấu tiếng Việt
            .replace(/đ/g, "d")               // Đổi chữ 'đ' thường thành 'd'
            .replace(/Đ/g, "D")               // Đổi chữ 'Đ' hoa thành 'D'
            .replace(/\s+/g, " ")             // Thu gọn khoảng trắng thừa thành 1 khoảng trắng
            .trim();                          // Cắt bỏ khoảng trắng ở đầu và cuối chuỗi
    }

    /**
     * Hàm cập nhật trạng thái kích hoạt của ô nhập đường và nút bấm tìm kiếm.
     * Quy tắc: Ô nhập tên đường và nút tìm kiếm chỉ được mở khóa khi người dùng đã chọn Phường/Xã.
     */
    function updateInputState() {
        // Kiểm tra xem người dùng đã chọn Phường/Xã hợp lệ chưa
        const hasPhuong = phuongSelect && phuongSelect.value && phuongSelect.value.trim() !== "";
        
        // Vô hiệu hóa (disabled = true) hoặc kích hoạt (disabled = false) dựa trên biến hasPhuong
        if (duongInput) duongInput.disabled = !hasPhuong;
        if (searchDuongBtn) searchDuongBtn.disabled = !hasPhuong;
        
        // Nếu người dùng chưa chọn Phường, tự động xóa ô nhập đường và ẩn bảng kết quả/gợi ý
        if (!hasPhuong && duongInput) {
            duongInput.value = "";
            if (resultPanel) resultPanel.style.display = "none";
            if (popupList) popupList.style.display = "none";
        }
    }

    /**
     * Hàm bất đồng bộ (Async) tải dữ liệu giá đất từ Google Apps Script API.
     * Ánh xạ chính xác cấu trúc mảng 5 cột: [Phường, Đường, Từ, Đến, Giá đất]
     */
    async function loadGiaDatFromSheet() {
        try {
            // Đường dẫn URL API triển khai từ Google Apps Script với tham số chỉ định sheet
            const apiUrl = "https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec?sheet=giadat";
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Kiểm tra xem dữ liệu phản hồi có đúng là kiểu mảng (Array) hay không
            if (Array.isArray(data)) {
                giaDatRecords = data.map(item => {
                    let phuong = "", duong = "", tu = "", den = "", gia = "";
                    
                    if (Array.isArray(item)) {
                        // Ánh xạ dữ liệu theo đúng thứ tự 5 cột trả về từ Apps Script:
                        phuong = (item[0] || "").toString().trim(); // Cột 0: Phường/Xã
                        duong =  (item[1] || "").toString().trim(); // Cột 1: Tên đường
                        tu =     (item[2] || "").toString().trim(); // Cột 2: Đoạn từ điểm nào
                        den =    (item[3] || "").toString().trim(); // Cột 3: Đoạn đến điểm nào
                        gia =    (item[4] || "").toString().trim(); // Cột 4: Đơn giá đất
                    } else if (typeof item === "object" && item !== null) {
                        // Phương án dự phòng an toàn nếu dữ liệu trả về ở dạng đối tượng (Object)
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
            console.warn("Dùng dữ liệu mẫu dự phòng (fallback) do lỗi kết nối API:", err);
            // Dữ liệu mẫu dự phòng khi xảy ra sự cố mạng hoặc lỗi script
            giaDatRecords = [
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", tu: "Huỳnh Thúc Kháng", den: "Kênh Cổng Đôi", gia: "12.600.000" },
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Hải Thượng Lãn Ông", tu: "Kênh Cổng Đôi", den: "Cổng Cầu Nhum", gia: "9.600.000" },
                { phuong: "PHƯỜNG HOÀ THÀNH", duong: "Đường Cà Mau - Đầm Dơi", tu: "Đường Hải Thượng Lãn Ông", den: "hết đoạn 2 chiều", gia: "9.600.000" }
            ];
        }
        updateInputState();
    }

    // Gọi hàm tải dữ liệu ngay khi trình tải xong mã
    loadGiaDatFromSheet();

    /**
     * Hàm thực hiện tìm kiếm chính thức khi người dùng bấm nút tìm kiếm hoặc nhấn phím Enter.
     * Chức năng: Lọc dữ liệu theo Phường và từ khóa đường, sau đó hiển thị kết quả chi tiết.
     */
    function thucHienTimKiemDuong() {
        const keywordClean = removeDiacritics(duongInput.value);
        const selectedPhuongClean = removeDiacritics(phuongSelect.value);

        if (!resultPanel) return;
        resultPanel.style.display = "block"; // Hiển thị khung kết quả

        // Kiểm tra điều kiện bắt buộc 1: Phải chọn Phường/Xã
        if (!selectedPhuongClean) {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Vui lòng chọn Phường/Xã trước khi tra cứu giá đất!</div>`;
            return;
        }

        // Kiểm tra điều kiện bắt buộc 2: Phải nhập từ khóa tên đường
        if (!keywordClean) {
            resultPanel.innerHTML = `<div style="color: #d9534f; padding: 5px;">Vui lòng nhập tên đường cần tra cứu.</div>`;
            return;
        }

        // Lọc danh sách: Khớp tên Phường VÀ từ khóa xuất hiện ở Tên đường, Từ, hoặc Đến
        const matchedRows = giaDatRecords.filter(item => {
            const itemPhuongClean = removeDiacritics(item.phuong);
            const itemDuongClean = removeDiacritics(item.duong);
            const itemTuClean = removeDiacritics(item.tu);
            const itemDenClean = removeDiacritics(item.den);

            const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
            const matchKeyword = itemDuongClean.includes(keywordClean) || itemTuClean.includes(keywordClean) || itemDenClean.includes(keywordClean);

            return matchPhuong && matchKeyword;
        });

        // Ẩn bảng gợi ý (popup) khi đã thực hiện xong lệnh tìm kiếm
        if (popupList) popupList.style.display = "none";

        // Xử lý hiển thị kết quả ra giao diện HTML
        if (matchedRows.length > 0) {
            let keywordHienThi = duongInput.value.trim();
            // Tiêu đề hiển thị số lượng kết quả kèm theo tên đường tìm kiếm theo yêu cầu chuẩn
            let htmlContent = `<div style="font-weight: bold; color: #1a73e8; margin-bottom: 8px; font-size: 13px;">📍 Tìm thấy ${matchedRows.length} kết quả cho ${keywordHienThi}</div>`;
            
            // Duyệt qua từng dòng tìm được để tạo thẻ giao diện dạng khối (card) đẹp mắt
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

    // 2. Đăng ký các bộ lắng nghe sự kiện (Event Listeners) tương tác với người dùng
    if (phuongSelect && duongInput && searchDuongBtn) {
        
        // Sự kiện xảy ra khi người dùng thay đổi lựa chọn tại thẻ Phường/Xã
        phuongSelect.addEventListener("change", updateInputState);

        // Theo dõi sự thay đổi cấu trúc của thẻ Phường bằng MutationObserver & setInterval để đồng bộ trạng thái
        const observer = new MutationObserver(updateInputState);
        observer.observe(phuongSelect, { attributes: true, childList: true, subtree: true });
        setInterval(updateInputState, 500);

        // Sự kiện khi người dùng gõ phím vào ô nhập tên đường (Tạo danh sách gợi ý tự động - Autocomplete)
        duongInput.addEventListener("input", function () {
            updateInputState();
            const keywordClean = removeDiacritics(this.value);
            const selectedPhuongClean = removeDiacritics(phuongSelect.value);

            if (!keywordClean || !selectedPhuongClean || !popupList) {
                if (popupList) popupList.style.display = "none";
                return;
            }

            // Lọc danh sách các đường phù hợp với ký tự đang nhập để làm gợi ý
            const matchedRows = giaDatRecords.filter(item => {
                const itemPhuongClean = removeDiacritics(item.phuong);
                const itemDuongClean = removeDiacritics(item.duong);
                const itemTuClean = removeDiacritics(item.tu);
                const itemDenClean = removeDiacritics(item.den);
                const matchPhuong = itemPhuongClean.includes(selectedPhuongClean) || selectedPhuongClean.includes(itemPhuongClean);
                return matchPhuong && (itemDuongClean.includes(keywordClean) || itemTuClean.includes(keywordClean) || itemDenClean.includes(keywordClean));
            });

            // Hiển thị danh sách gợi ý ra popup nếu tìm thấy dữ liệu phù hợp
            if (matchedRows.length > 0) {
                popupList.innerHTML = "";
                popupList.style.display = "block";

                matchedRows.forEach(row => {
                    const divItem = document.createElement("div");
                    divItem.style.padding = "8px 10px";
                    divItem.style.cursor = "pointer";
                    divItem.style.borderBottom = "1px solid #eee";
                    divItem.innerHTML = `<b>${row.duong}</b> <span style="font-size: 11px; color: #666;">(Từ: ${row.tu} - Đến: ${row.den})</span>`;

                    // Hiệu ứng rê chuột (hover) đổi màu nền để nhận biết
                    divItem.addEventListener("mouseenter", () => divItem.style.backgroundColor = "#f1f3f4");
                    divItem.addEventListener("mouseleave", () => divItem.style.backgroundColor = "#fff");

                    // Sự kiện click vào một gợi ý: tự điền tên đường vào ô input, ẩn popup và chạy tìm kiếm luôn
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

        // Sự kiện khi người dùng click vào nút Tìm kiếm đường
        searchDuongBtn.addEventListener("click", function (e) {
            e.preventDefault();
            thucHienTimKiemDuong();
        });

        // Sự kiện khi người dùng nhấn phím Enter trực tiếp tại ô nhập tên đường
        duongInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                thucHienTimKiemDuong();
            }
        });

        // Sự kiện toàn cục (Global Click): Tự động ẩn Popup gợi ý và Ẩn Bảng kết quả khi click ra ngoài vùng làm việc
        document.addEventListener("click", function (e) {
            // 1. Ẩn khung gợi ý (popupList) nếu click ra ngoài ô nhập đường, khung gợi ý và nút tìm kiếm
            if (popupList && !duongInput.contains(e.target) && !popupList.contains(e.target) && !searchDuongBtn.contains(e.target)) {
                popupList.style.display = "none";
            }

            // 2. [ĐÃ CẬP NHẬT - CÁCH 2] Ẩn bảng kết quả (resultPanel) nếu click ra ngoài bảng kết quả, ô nhập đường và nút tìm kiếm
            if (resultPanel && !resultPanel.contains(e.target) && !duongInput.contains(e.target) && !searchDuongBtn.contains(e.target)) {
                resultPanel.style.display = "none";
            }
        });
    }
});
