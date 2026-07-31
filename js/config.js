// js/config.js
const CONFIG = {
    // Đường dẫn đọc file GeoJSON nội bộ trên GitHub
    GEOJSON_URL: "./Ca-Mau.geojson",
    
    // Nền bản đồ Google Vệ tinh (Google Satellite) mới nhất
    MAP_STYLE: {
        'version': 8,
        'sources': {
            'google-satellite': {
                'type': 'raster',
                'tiles': [
                    'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
                ],
                'tileSize': 256
            }
        },
        'layers': [
            {
                'id': 'google-satellite-layer',
                'type': 'raster',
                'source': 'google-satellite',
                'minzoom': 0,
                'maxzoom': 22
            }
        ]
    },

    // Tọa độ trung tâm Cà Mau & Zoom mặc định
    MAP_CENTER: [105.15, 9.18],
    MAP_ZOOM: 12,
    
    // Viền thửa đất màu vàng chanh nổi bật trên nền Vệ tinh
    FILL_COLOR: '#00ffcc',
    FILL_OPACITY: 0.3,
    OUTLINE_COLOR: '#ffffff'
};
