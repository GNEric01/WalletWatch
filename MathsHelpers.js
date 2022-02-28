export function roundToTwo(num) {    
    return +(Math.round(num + "e+2")  + "e-2");
}

export function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}