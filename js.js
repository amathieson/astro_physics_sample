let start = document.getElementById("start");
let reset = document.getElementById("reset");

let gps = document.getElementById("gps");
let orientation = document.getElementById("orientation");
let time = document.getElementById("time");
let sun = document.getElementById("sun");
let heading = document.getElementById("heading");

let controller;
let lastLoc = {latitude:0, longitude:0};

start.addEventListener("click", ()=>{
    navigator.geolocation.watchPosition((pos)=>{
        gps.innerText = `${pos.coords.latitude} / ${pos.coords.longitude}`;
        lastLoc = pos.coords;
    }, console.error, {enableHighAccuracy: true})

    FULLTILT.getDeviceOrientation({'type': 'world'})
        .then(function(ctrl) {
            controller = ctrl;
        })
        .catch(function(message) {
            console.error(message);
        });

    setInterval(()=>{
        time.innerText = Date.now();
        orientation.innerText = JSON.stringify(controller.getScreenAdjustedEuler());
        sun.innerText = JSON.stringify(sun_pos(lastLoc, Date.now()));
    })
})

const JD2000 = 2451545.0;
const RAD = Math.PI / 180.0;
const DEG = 180.0 / Math.PI;
function sun_pos(location, t) {
    let time = new Date(t);
    let longitude_deg = location.longitude;
    let latitude_deg = location.latitude;
    let year = time.getUTCFullYear();
    let month = time.getUTCMonth();
    let day = time.getDate();
    let hour = time.getUTCHours();
    let minute = time.getUTCMinutes();
    let second = time.getUTCSeconds();
    if (month <= 2) {
        year -= 1
        month += 12
    }
    let century = Math.floor(year / 100);
    let Leap_Years = 2 - century + Math.floor(century/4)
    let JD = Math.round(365.25 * (year + 4716)) + Math.round(30.6001 * (month + 1)) + day + Leap_Years - 1524.5 + (hour + minute / 60.0 + second / 3600.0) / 24.0
    let Julian_DateStamp = JD - JD2000
    let GMST = 18.697374558 + 24.06570982441908 * Julian_DateStamp
    GMST %= 24
    if (GMST < 0)
        GMST += 24

    // Sun's mean longitude
    let L = (280.46646 + 36000.76983 * Julian_DateStamp) % 360
    if (L < 0)
        L += 360


    // Sun's mean anomaly
    let M = (357.52911 + 35999.05029 * Julian_DateStamp) % 360
    if (M < 0)
        M += 360

    let lambda_sun = L + 1.914602 * Math.sin(M * RAD) + 0.019993 * Math.sin(2 * M * RAD)
    lambda_sun %= 360
    if (lambda_sun < 0)
        lambda_sun += 360


    // Sun's right ascension
    let alpha_sun = Math.atan2(Math.sin(lambda_sun * RAD) * Math.cos(23.439292 * RAD), Math.cos(lambda_sun * RAD)) * DEG
    if (alpha_sun < 0)
        alpha_sun += 360

    // Sun's declination
    let delta_sun = Math.asin(Math.sin(23.439292 * RAD) * Math.sin(lambda_sun * RAD)) * DEG

    // Hour angle
    let hour_angle = GMST * 15 + longitude_deg - alpha_sun
    if (hour_angle < -180)
        hour_angle += 360
    else if (hour_angle > 180)
        hour_angle -= 360

    // Altitude and azimuth
    let altitude = Math.asin(Math.sin(latitude_deg * RAD) * Math.sin(delta_sun * RAD) + Math.cos(latitude_deg * RAD) * Math.cos(delta_sun * RAD) * Math.cos(hour_angle * RAD)) * DEG
    let azimuth = Math.atan2(-Math.sin(hour_angle * RAD), Math.cos(hour_angle * RAD) * Math.sin(latitude_deg * RAD) - Math.tan(delta_sun * RAD) * Math.cos(latitude_deg * RAD)) * DEG
    if (azimuth < 0)
        azimuth += 360
    return {altitude, azimuth};
}