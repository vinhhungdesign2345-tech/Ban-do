// js/config.js
const CONFIG = {
    // THÊM TỈNH TẠI ĐÂY
    PROVINCES: [
        { id: "AnGiang", name: "Tỉnh An Giang", file: "./geojson/An-Giang.json" },
        { id: "BacNinh", name: "Tỉnh Bắc Ninh", file: "./geojson/Bac-Ninh.json" },
        { id: "CaMau", name: "Tỉnh Cà Mau", file: "./geojson/Ca-Mau.json" },
        { id: "CaoBang", name: "Tỉnh Cao Bằng", file: "./geojson/Cao-Bang.json" },
        { id: "DakLak", name: "Tỉnh Dak Lak", file: "./geojson/Dak-Lak.json" },
        
        
  
    ],

    // Đường dẫn URL lấy dữ liệu trực tiếp từ nhánh main của GitHub (đã đổi sang dạng raw)
    SHEET_DATA_URL: 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec',

    // Cấu hình giao diện nền bản đồ vệ tinh sử dụng nguồn tile trực tiếp từ Google Maps
    MAP_STYLE: {
        'version': 8,                     /* Phiên bản định dạng cấu hình style của MapLibre GL */
        'sources': {
            'google-satellite': {
                'type': 'raster',          /* Định dạng nguồn ảnh dạng lưới raster */
                'tiles': ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'], /* URL lấy mảnh ảnh bản đồ vệ tinh Google */
                'tileSize': 256            /* Kích thước tiêu chuẩn của mỗi mảnh ảnh (tile) là 256x256 pixel */
            }
        },
        'layers': [
            {
                'id': 'google-satellite-layer', /* ID định danh lớp hiển thị bản đồ vệ tinh */
                'type': 'raster',              /* Kiểu hiển thị là dạng ảnh raster */
                'source': 'google-satellite',   /* Liên kết trực tiếp đến nguồn 'google-satellite' đã định nghĩa phía trên */
                'minzoom': 0,                  /* Mức thu nhỏ tối đa cho phép hiển thị */
                'maxzoom': 22                  /* Mức phóng to chi tiết tối đa cho phép hiển thị */
            }
        ]
    },

    MAP_CENTER: [105.15, 9.18],            /* Tọa độ trung tâm mặc định khởi tạo ban đầu cho toàn bản đồ [Kinh độ, Vĩ độ] */
    MAP_ZOOM: 12,                          /* Mức độ phóng to (zoom level) mặc định khi vừa mở trang web */
    FILL_COLOR: '#00ffcc',                 /* Màu tô nền mặc định cho các thửa đất/vùng chọn */
    FILL_OPACITY: 0.3,                     /* Độ trong suốt của lớp màu tô nền (0.3 tương đương 30%) */
    OUTLINE_COLOR: '#ffffff'               /* Màu đường viền bao quanh thửa đất (màu trắng) */
};

// Biểu thức quy tắc phân loại màu sắc quy hoạch dựa theo từng loại đất cụ thể
const COLOR_MATCH_EXPRESSION = [
    'match',                                /* Hàm so khớp điều kiện của MapLibre Style Specification */
    ['get', 'Loại Đất'],                    /* Lấy giá trị thuộc tính 'Loại Đất' của từng thửa đất từ dữ liệu bản đồ */
    'Đất ở tại đô thị', '#e063ce',          /* Nếu là Đất ở tại đô thị -> Tô màu hồng đậm (#ff007f) */
    'Đất ở tại nông thôn', '#cf99c7',       /* Nếu là Đất ở tại nông thôn -> Tô màu cam (#ff5400) */
    'Đất nuôi trồng thuỷ sản', '#00b4d8',   /* Nếu là Đất nuôi trồng thuỷ sản -> Tô màu xanh dương nhạt (#00b4d8) */
    'Đất nuôi trồng thủy sản', '#00b4d8',   /* Dự phòng thêm trường hợp sai chính tả dấu/chữ -> Tô màu xanh dương nhạt */
    'Đất trồng cây lâu năm', '#519e05',     /* Nếu là Đất trồng cây lâu năm -> Tô màu xanh lá mạ (#70e000) */
    'Đất trồng cây hàng năm khác', '#519e05',/* Nếu là Đất trồng cây hàng năm khác -> Tô màu xanh nõn chuối (#9ef01a) */
    'Đất trồng lúa', '#f5e753',             /* Nếu là Đất trồng lúa -> Tô màu vàng nhạt (#f5e753) */
    'Đất chuyên trồng lúa nước', '#ffea00', /* Nếu là Đất chuyên trồng lúa nước -> Tô màu vàng tươi (#ffea00) */
    '#c2b9ab'                               /* Màu mặc định dự phòng nếu loại đất không nằm trong danh sách trên (màu cam vàng) */
];
