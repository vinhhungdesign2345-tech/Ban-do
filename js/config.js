// js/config.js
const CONFIG = {
    // THÊM TỈNH TẠI ĐÂY
    PROVINCES: [
        { id: "AnGiang", name: "Tỉnh An Giang", file: "./geojson/An-Giang.json" },
        { id: "BacNinh", name: "Tỉnh Bắc Ninh", file: "./geojson/Bac-Ninh.json" },
        { id: "CaMau", name: "Tỉnh Cà Mau", file: "./geojson/Ca-Mau.json" },
        { id: "CaoBang", name: "Tỉnh Cao Bằng", file: "./geojson/Cao-Bang.json" },
        { id: "DakLak", name: "Tỉnh Dak Lak", file: "./geojson/Dak-Lak.json" },
        { id: "DienBien", name: "Tỉnh Điện Biên", file: "./geojson/Dien-Bien.json" },
        { id: "DongThap", name: "Tỉnh Đồng Tháp", file: "./geojson/Dong-Thap.json" },
        { id: "GiaLai", name: "Tỉnh Gia Lai", file: "./geojson/Gia-Lai.json" },
        { id: "HaTinh", name: "Tỉnh Hà Tĩnh", file: "./geojson/Ha-Tinh.json" },
        { id: "HungYen", name: "Tỉnh Hưng Yên", file: "./geojson/Hung-Yen.json" },
        { id: "KhanhHoa", name: "Tỉnh Khánh Hòa", file: "./geojson/Khanh-Hoa.json" },
        { id: "LaiChau", name: "Tỉnh Lai Châu", file: "./geojson/Lai-Chau.json" },
        { id: "LamDong", name: "Tỉnh Lâm Đồng", file: "./geojson/Lam-Dong.json" },
        { id: "LangSon", name: "Tỉnh Lạng Sơn", file: "./geojson/Lang-Son.json" },
        { id: "LaoCai", name: "Tỉnh Lào Cai", file: "./geojson/Lao-Cai.json" },
        { id: "NgheAn", name: "Tỉnh Nghệ An", file: "./geojson/Nghe-An.json" },
        { id: "NinhBinh", name: "Tỉnh Ninh Bình", file: "./geojson/Ninh_Binh.json" },
        { id: "PhuTho", name: "Tỉnh Phú Thọ", file: "./geojson/Phu-Tho.json" },
        { id: "QuangNgai", name: "Tỉnh Quảng Ngãi", file: "./geojson/Quang-Ngai.json" },
        { id: "QuangNinh", name: "Tỉnh Quảng Ninh", file: "./geojson/Quang-Ninh.json" },
        { id: "QuangTri", name: "Tỉnh Quảng Trị", file: "./geojson/Quang-Tri.json" },
        { id: "SonLa", name: "Tỉnh Sơn La", file: "./geojson/Son-La.json" },
        { id: "TPCanTho", name: "Thành Phố Cần Thơ", file: "./geojson/TP-Can-Tho.json" },
        { id: "TPDaNang", name: "Thành Phố Đà Nẵng", file: "./geojson/TP-Da-Nang.json" },
        { id: "TPDongNai", name: "Thành Phố Đồng Nai", file: "./geojson/TP-Dong-Nai.json" },
        { id: "TPHaNoi", name: "Thành Phố Hà Nội", file: "./geojson/TP-Ha-Noi.json" },
        { id: "TPHaiPhong", name: "Thành Phố Hải Phòng", file: "./geojson/TP-Hai-Phong.json" },
        { id: "TPHoChiMinh", name: "Thành Phố Hồ Chí Minh", file: "./geojson/TP-Ho-Chi-Minh.json" },
        { id: "TPHue", name: "Thành Phố Huế", file: "./geojson/TP-Hue.json" },
        { id: "TayNinh", name: "Tỉnh Tây Ninh", file: "./geojson/Tay-Ninh.json" },
        { id: "ThaiNguyen", name: "Tỉnh Thái Nguyên", file: "./geojson/Thai-Nguyên.json" },
        { id: "ThanhHoa", name: "Tỉnh Thanh Hóa", file: "./geojson/Thanh-Hoa.json" },
        { id: "TuyenQuang", name: "Tỉnh Tuyên Quang", file: "./geojson/Tuyen-Quang.json" },
        { id: "VinhLong", name: "Tỉnh Vĩnh Long", file: "./geojson/Vinh-Long.json" },
    ],

    // Cập nhật đường dẫn Web URL của Sheet tại đây
    SHEET_DATA_URL: 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec',

    // Cấu hình giao diện: Nền vệ tinh Google sắc nét (không icon rườm rà) + Lớp đường nét vector tối giản từ dữ liệu OSM
    MAP_STYLE: {
        'version': 8,
        'sources': {
            // 1. Nguồn ảnh vệ tinh thuần túy của Google (giống ảnh 1.3 nhưng sạch sẽ không có các icon dịch vụ)
            'google-satellite-clean': {
                'type': 'raster',
                'tiles': ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
                'tileSize': 256
            },
            // 2. Nguồn nét đường và nhãn tối giản dạng trong suốt từ dữ liệu OSM (CartoDB Voyager Labels hoặc Stamen style)
            'osm-lines-labels': {
                'type': 'raster',
                'tiles': ['https://a.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}@2x.png'],
                'tileSize': 256,
                'attribution': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }
        },
        'layers': [
            // Lớp 1: Nền vệ tinh nằm ở dưới cùng
            {
                'id': 'google-sat-layer',
                'type': 'raster',
                'source': 'google-satellite-clean',
                'minzoom': 0,
                'maxzoom': 22
            },
            // Lớp 2: Lớp đường sá và nhãn phong cách OSM phủ lên trên, làm nổi bật đường đi mà không che lấp vệ tinh
            {
                'id': 'osm-overlay-layer',
                'type': 'raster',
                'source': 'osm-lines-labels',
                'minzoom': 0,
                'maxzoom': 22,
                'paint': {
                    'raster-opacity': 0.85 // Độ rõ nét của đường xá phía trên
                }
            }
        ]
    },

    MAP_CENTER: [105.15, 9.18],              /* Tọa độ trung tâm mặc định */
    MAP_ZOOM: 12,                            /* Mức độ phóng to mặc định */
    FILL_COLOR: '#00ffcc',                   /* Màu tô nền mặc định cho thửa đất */
    FILL_OPACITY: 0.3,                       /* Độ trong suốt nền thửa đất */
    OUTLINE_COLOR: '#ffffff'                 /* Màu viền thửa đất */
};

// Biểu thức quy tắc phân loại màu sắc quy hoạch theo từng loại đất
const COLOR_MATCH_EXPRESSION = [
    'match',                                 
    ['get', 'Loại Đất'],                     
    'Đất ở tại đô thị', '#e063ce',           
    'Đất ở tại nông thôn', '#cf99c7',        
    'Đất nuôi trồng thuỷ sản', '#00b4d8',    
    'Đất nuôi trồng thủy sản', '#00b4d8',    
    'Đất trồng cây lâu năm', '#519e05',      
    'Đất trồng cây hàng năm khác', '#519e05',
    'Đất trồng lúa', '#f5e753',              
    'Đất chuyên trồng lúa nước', '#ffea00',  
    '#c2b9ab'                                
];
