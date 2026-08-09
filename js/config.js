// js/config.js
const CONFIG = {
    // ... giữ nguyên danh sách PROVINCES như cũ ...
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

    SHEET_DATA_URL: 'https://script.google.com/macros/s/AKfycbz87dcUkndM5w5BeFqUFYJt8JDEcPu98IH5mbzNdov_6eXTNUEhIiknFQ9P7H2c0ZQE/exec',

    MAP_STYLE: {
        'version': 8,
        'sources': {
            'google-satellite': {
                'type': 'raster',
                'tiles': ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'],
                'tileSize': 256
            },
            'osm-map': { // Nguồn OpenStreetMap
                'type': 'raster',
                'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                'tileSize': 256,
                'attribution': '&copy; OpenStreetMap contributors'
            },
            'ha-tang-dien-source': {
                'type': 'geojson',
                'data': './geojson/Ca-Mau-ha-tang-dien.json'
            }
        },
        'layers': [
            {
                'id': 'google-satellite-layer',
                'type': 'raster',
                'source': 'google-satellite',
                'minzoom': 0, 'maxzoom': 22
            },
            {
                'id': 'osm-layer', // Lớp OSM (mặc định ẩn)
                'type': 'raster',
                'source': 'osm-map',
                'layout': { 'visibility': 'none' },
                'minzoom': 0, 'maxzoom': 22
            },
            {
                'id': 'ha-tang-dien-line',
                'type': 'line',
                'source': 'ha-tang-dien-source',
                'filter': ['==', '$type', 'LineString'],
                'minzoom': 0, 'maxzoom': 22,
                'paint': {
                    'line-color': '#ffcc00',
                    'line-width': 1,
                    'line-opacity': 0.5
                }
            },
            {
                'id': 'ha-tang-dien-points',
                'type': 'circle',
                'source': 'ha-tang-dien-source',
                'filter': ['==', '$type', 'Point'],
                'minzoom': 14,
                'maxzoom': 22,
                'paint': {
                    'circle-radius': 4,
                    'circle-color': '#ff0000',
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff'
                }
            }
        ]
    },

    MAP_CENTER: [105.15, 9.18],
    MAP_ZOOM: 12,
    FILL_COLOR: '#00ffcc',
    FILL_OPACITY: 0.3,
    OUTLINE_COLOR: '#ffffff'
};

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
