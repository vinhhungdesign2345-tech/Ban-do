```javascript
// js/province.js

// ======================================================
// CACHE DỮ LIỆU RANH GIỚI TRONG TRÌNH DUYỆT
// ======================================================

let currentGeoData = null;

// Lưu dữ liệu tỉnh đã tải
const provinceGeoCache = new Map();

// Lưu Promise đang tải để tránh tải trùng cùng lúc
const provinceLoadingCache = new Map();


// ======================================================
// HÀM LẤY GEOJSON CÓ CACHE
// ======================================================

async function getProvinceGeoData(url) {

    // Đã có dữ liệu trong RAM
    if (provinceGeoCache.has(url)) {
        return provinceGeoCache.get(url);
    }

    // Đang tải rồi thì dùng chung Promise
    if (provinceLoadingCache.has(url)) {
        return provinceLoadingCache.get(url);
    }

    const promise = fetchGeoDataByUrl(url)
        .then(data => {

            if (data && data.features) {
                provinceGeoCache.set(url, data);
            }

            provinceLoadingCache.delete(url);

            return data;
        })
        .catch(err => {

            provinceLoadingCache.delete(url);

            console.error(
                "Lỗi tải GeoJSON:",
                url,
                err
            );

            return null;
        });

    provinceLoadingCache.set(url, promise);

    return promise;
}


// ======================================================
// 1. CLICK TRÊN BẢN ĐỒ → TÌM TỈNH/XÃ
// ======================================================

async function selectPhuongFromPoint(lng, lat, map) {

    const tinhSelect =
        document.getElementById('tinhFilter');

    const phuongSelect =
        document.getElementById('phuongFilter');

    const point =
        turf.point([lng, lat]);


    let matchedProvince = null;
    let matchedPhuong = null;
    let targetGeoData = null;


    // ==================================================
    // TÌM TRONG CÁC TỈNH
    // ==================================================

    for (const provinceInfo of CONFIG.PROVINCES) {

        const geoData =
            await getProvinceGeoData(
                provinceInfo.file
            );


        if (
            !geoData ||
            !geoData.features
        ) {
            continue;
        }


        for (const feature of geoData.features) {

            try {

                if (
                    turf.booleanPointInPolygon(
                        point,
                        feature
                    )
                ) {

                    matchedProvince =
                        provinceInfo;

                    targetGeoData =
                        geoData;


                    const p =
                        feature.properties || {};


                    matchedPhuong =
                        p.name ||
                        p.dia_chi ||
                        p.Phuong ||
                        p.Xa ||
                        p.NAME_2 ||
                        p.NAME_3;


                    break;
                }

            } catch (err) {

                console.warn(
                    "Lỗi kiểm tra polygon:",
                    err
                );

            }

        }


        if (matchedProvince) {
            break;
        }

    }


    // ==================================================
    // NẾU TÌM THẤY
    // ==================================================

    if (
        matchedProvince &&
        targetGeoData
    ) {

        if (
            tinhSelect.value !==
            matchedProvince.id
        ) {

            tinhSelect.value =
                matchedProvince.id;


            currentGeoData =
                targetGeoData;


            // ==========================================
            // MAP SOURCE
            // ==========================================

            if (
                map.getSource(
                    'thua-dat-src'
                )
            ) {

                map
                    .getSource(
                        'thua-dat-src'
                    )
                    .setData(
                        targetGeoData
                    );

            } else {

                map.addSource(
                    'thua-dat-src',
                    {
                        type: 'geojson',
                        data: targetGeoData
                    }
                );


                map.addLayer({

                    id:
                        'thua-dat-layer',

                    type:
                        'fill',

                    source:
                        'thua-dat-src',

                    paint: {

                        'fill-color':
                            '#000000',

                        'fill-opacity':
                            0

                    }

                });


                map.addLayer({

                    id:
                        'thua-dat-line-layer',

                    type:
                        'line',

                    source:
                        'thua-dat-src',

                    paint: {

                        'line-color':
                            '#ff0000',

                        'line-width':
                            2

                    }

                });

            }


            // ==========================================
            // TẠO DROPDOWN XÃ
            // ==========================================

            phuongSelect.innerHTML =
                '<option value="">-- Phường / Xã --</option>';

            phuongSelect.disabled =
                false;


            const phuongSet =
                new Set();


            targetGeoData.features.forEach(
                feature => {

                    const p =
                        feature.properties || {};


                    const val =
                        p.name ||
                        p.dia_chi ||
                        p.Phuong ||
                        p.Quan ||
                        p.Xa ||
                        p.NAME_2 ||
                        p.NAME_3;


                    if (val) {

                        phuongSet.add(
                            String(val).trim()
                        );

                    }

                }
            );


            Array
                .from(phuongSet)
                .sort()
                .forEach(
                    pName => {

                        const opt =
                            document.createElement(
                                'option'
                            );


                        opt.value =
                            pName;

                        opt.textContent =
                            pName;


                        phuongSelect.appendChild(
                            opt
                        );

                    }
                );


            // ==========================================
            // TẢI THỬA ĐẤT
            // ==========================================

            await loadThuaDatFromSheet(map);

        }


        // ==========================================
        // CHỌN XÃ TỰ ĐỘNG
        // ==========================================

        if (
            matchedPhuong &&
            phuongSelect
        ) {

            phuongSelect.value =
                matchedPhuong;


            const filterExpr = [

                'any',

                [
                    '==',
                    ['get', 'name'],
                    matchedPhuong
                ],

                [
                    '==',
                    ['get', 'dia_chi'],
                    matchedPhuong
                ],

                [
                    '==',
                    ['get', 'Phuong'],
                    matchedPhuong
                ],

                [
                    '==',
                    ['get', 'Xa'],
                    matchedPhuong
                ]

            ];


            const sheetFilterExpr = [

                '==',

                [
                    'get',
                    'Địa Chỉ Thửa Đất'
                ],

                matchedPhuong

            ];


            if (
                map.getLayer(
                    'thua-dat-layer'
                )
            ) {

                map.setFilter(
                    'thua-dat-layer',
                    filterExpr
                );

            }


            if (
                map.getLayer(
                    'thua-dat-line-layer'
                )
            ) {

                map.setFilter(
                    'thua-dat-line-layer',
                    filterExpr
                );

            }


            if (
                map.getLayer(
                    'sheet-thua-dat-fill'
                )
            ) {

                map.setFilter(
                    'sheet-thua-dat-fill',
                    sheetFilterExpr
                );

            }


            if (
                map.getLayer(
                    'sheet-thua-dat-line'
                )
            ) {

                map.setFilter(
                    'sheet-thua-dat-line',
                    sheetFilterExpr
                );

            }

        }

    }

}


// ======================================================
// 2. TẢI TỈNH TỪ DROPDOWN
// ======================================================

async function loadProvinceData(
    provinceId,
    map
) {

    const phuongSelect =
        document.getElementById(
            'phuongFilter'
        );


    phuongSelect.innerHTML =
        '<option value="">-- Phường / Xã --</option>';


    hideThuaDat(map);


    if (!provinceId) {

        phuongSelect.disabled =
            true;

        currentGeoData =
            null;

        return;

    }


    const provinceInfo =
        CONFIG.PROVINCES.find(
            p => p.id === provinceId
        );


    if (!provinceInfo) {
        return;
    }


    // ==================================================
    // CACHE → KHÔNG FETCH LẠI
    // ==================================================

    const geoData =
        await getProvinceGeoData(
            provinceInfo.file
        );


    if (
        !geoData ||
        !geoData.features
    ) {

        alert(
            "Chưa tải được file GeoJSON!"
        );

        return;

    }


    currentGeoData =
        geoData;


    const phuongSet =
        new Set();


    geoData.features.forEach(
        feature => {

            const p =
                feature.properties || {};


            const val =
                p.name ||
                p.dia_chi ||
                p.Phuong ||
                p.Quan ||
                p.Xa ||
                p.NAME_2 ||
                p.NAME_3;


            if (val) {

                phuongSet.add(
                    String(val).trim()
                );

            }

        }
    );


    // ==================================================
    // MAP SOURCE
    // ==================================================

    if (
        map.getSource(
            'thua-dat-src'
        )
    ) {

        map
            .getSource(
                'thua-dat-src'
            )
            .setData(
                geoData
            );

    } else {

        map.addSource(

            'thua-dat-src',

            {

                type:
                    'geojson',

                data:
                    geoData

            }

        );


        map.addLayer({

            id:
                'thua-dat-layer',

            type:
                'fill',

            source:
                'thua-dat-src',

            paint: {

                'fill-color':
                    '#000000',

                'fill-opacity':
                    0

            }

        });


        map.addLayer({

            id:
                'thua-dat-line-layer',

            type:
                'line',

            source:
                'thua-dat-src',

            paint: {

                'line-color':
                    '#ff0000',

                'line-width':
                    2

            }

        });

    }


    // ==================================================
    // HIỂN THỊ TOÀN BỘ TỈNH
    // ==================================================

    const showAllProvinceFilter = [
        '!=',
        '$type',
        'Point'
    ];


    if (
        map.getLayer(
            'thua-dat-layer'
        )
    ) {

        map.setFilter(
            'thua-dat-layer',
            showAllProvinceFilter
        );

    }


    if (
        map.getLayer(
            'thua-dat-line-layer'
        )
    ) {

        map.setFilter(
            'thua-dat-line-layer',
            showAllProvinceFilter
        );

    }


    // ==================================================
    // ZOOM
    // ==================================================

    try {

        const bbox =
            turf.bbox(
                geoData
            );


        map.fitBounds(
            bbox,
            {
                padding: 50,
                maxZoom: 15,
                duration: 300
            }
        );

    } catch (err) {

        console.error(
            "Lỗi tự động zoom:",
            err
        );

    }


    // ==================================================
    // DROPDOWN XÃ
    // ==================================================

    phuongSelect.disabled =
        false;


    Array
        .from(phuongSet)
        .sort()
        .forEach(
            pName => {

                const opt =
                    document.createElement(
                        'option'
                    );


                opt.value =
                    pName;

                opt.textContent =
                    pName;


                phuongSelect.appendChild(
                    opt
                );

            }
        );

}


// ======================================================
// 3. KHỞI TẠO DROPDOWN
// ======================================================

function initFilter(map) {

    const tinhSelect =
        document.getElementById(
            'tinhFilter'
        );


    const phuongSelect =
        document.getElementById(
            'phuongFilter'
        );


    tinhSelect.innerHTML =
        '<option value="">-- Tỉnh / TP --</option>';


    CONFIG.PROVINCES.forEach(
        province => {

            const opt =
                document.createElement(
                    'option'
                );


            opt.value =
                province.id;

            opt.textContent =
                province.name;


            tinhSelect.appendChild(
                opt
            );

        }
    );


    // ==================================================
    // CHỌN TỈNH
    // ==================================================

    tinhSelect.addEventListener(
        'change',
        e => {

            loadProvinceData(
                e.target.value,
                map
            );

        }
    );


    // ==================================================
    // CHỌN XÃ
    // ==================================================

    phuongSelect.addEventListener(
        'change',
        async e => {

            const selectedPhuong =
                e.target.value;


            // ==========================================
            // BỎ CHỌN XÃ
            // ==========================================

            if (!selectedPhuong) {

                hideThuaDat(map);


                const showAllProvinceFilter = [
                    '!=',
                    '$type',
                    'Point'
                ];


                if (
                    map.getLayer(
                        'thua-dat-layer'
                    )
                ) {

                    map.setFilter(
                        'thua-dat-layer',
                        showAllProvinceFilter
                    );

                }


                if (
                    map.getLayer(
                        'thua-dat-line-layer'
                    )
                ) {

                    map.setFilter(
                        'thua-dat-line-layer',
                        showAllProvinceFilter
                    );

                }


                return;

            }


            // ==========================================
            // LỌC XÃ
            // ==========================================

            const filterExpr = [

                'any',

                [
                    '==',
                    ['get', 'name'],
                    selectedPhuong
                ],

                [
                    '==',
                    ['get', 'dia_chi'],
                    selectedPhuong
                ],

                [
                    '==',
                    ['get', 'Phuong'],
                    selectedPhuong
                ],

                [
                    '==',
                    ['get', 'Xa'],
                    selectedPhuong
                ]

            ];


            const sheetFilterExpr = [

                '==',

                [
                    'get',
                    'Địa Chỉ Thửa Đất'
                ],

                selectedPhuong

            ];


            if (
                map.getLayer(
                    'thua-dat-layer'
                )
            ) {

                map.setFilter(
                    'thua-dat-layer',
                    filterExpr
                );

            }


            if (
                map.getLayer(
                    'thua-dat-line-layer'
                )
            ) {

                map.setFilter(
                    'thua-dat-line-layer',
                    filterExpr
                );

            }


            // ==========================================
            // TẢI THỬA ĐẤT
            // ==========================================

            await loadThuaDatFromSheet(map);


            if (
                map.getLayer(
                    'sheet-thua-dat-fill'
                )
            ) {

                map.setFilter(
                    'sheet-thua-dat-fill',
                    sheetFilterExpr
                );

            }


            if (
                map.getLayer(
                    'sheet-thua-dat-line'
                )
            ) {

                map.setFilter(
                    'sheet-thua-dat-line',
                    sheetFilterExpr
                );

            }


            // ==========================================
            // ZOOM TỚI XÃ
            // ==========================================

            if (currentGeoData) {

                const filtered =
                    currentGeoData.features.filter(
                        feature => {

                            const p =
                                feature.properties || {};


                            return (

                                p.name ===
                                selectedPhuong

                                ||

                                p.dia_chi ===
                                selectedPhuong

                                ||

                                p.Phuong ===
                                selectedPhuong

                                ||

                                p.Xa ===
                                selectedPhuong

                            );

                        }
                    );


                if (
                    filtered.length > 0
                ) {

                    const fc =
                        turf.featureCollection(
                            filtered
                        );


                    const bbox =
                        turf.bbox(fc);


                    map.fitBounds(
                        bbox,
                        {
                            padding: 50,
                            duration: 300
                        }
                    );

                }

            }

        }
    );

}
```
