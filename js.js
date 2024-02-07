let start = document.getElementById("start");
let reset = document.getElementById("reset");

let gps = document.getElementById("gps");
let orientation = document.getElementById("orientation");
let time = document.getElementById("time");
let sun = document.getElementById("sun");
let heading = document.getElementById("heading");

let controller;
let lastLoc = {latitude:0, longitude:0};
let NorthOff = 0;

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
        time.innerText = new Date();
        orientation.innerText = JSON.stringify(controller?.getScreenAdjustedEuler());
        sun.innerText = JSON.stringify(sun_pos(lastLoc));
        heading.innerText = (360-controller?.getScreenAdjustedEuler().alpha) + NorthOff;
    })
})

reset.addEventListener("click", ()=>{
    NorthOff = -(360-controller?.getScreenAdjustedEuler().alpha) + sun_pos(lastLoc).azimuth;
})

const RAD = Math.PI / 180
const DEG = 180 / Math.PI
function sun_pos(location) {
    const time = new Date();
    const longitude_deg = location.longitude;
    const latitude_deg = location.latitude;
    const year = time.getFullYear();
    const hour = time.getHours();
    const minute = time.getMinutes();
    const sec = time.getSeconds();
    const start = new Date(year, 0, 0);
    const diff = time - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day_of_year = Math.floor(diff / oneDay);
    const days_in_year = ((0 === year % 4) && (0 !== year % 100) || (0 === year % 400)) ? 366 : 365;

    let altitude = Number.NaN;
    let azimuth = Number.NaN;

    let frac_year = (2*Math.PI)/(days_in_year) *  (day_of_year - 1 + (hour-12)/24)

    let equi_time = 229.18 * (0.000075 + 0.001868*Math.cos(frac_year) - 0.032077*Math.sin(frac_year) - 0.014615 * Math.cos(2*frac_year) - 0.040849*Math.sin(2*frac_year));

    let decl = 0.006918 - 0.399912*Math.cos(frac_year) + 0.070257*Math.sin(frac_year) - 0.00675*Math.cos(2*frac_year) + 0.000907 * Math.sin(2 * frac_year) - 0.002697*Math.cos(3 * frac_year) + 0.00148 * Math.sin(3 * frac_year);

    let time_offset = equi_time + 4*longitude_deg - 60*(time.getTimezoneOffset())

    let tst = hour * 60 + minute + sec/60 + time_offset;

    let hour_angle = tst / 4 - 180;

    let zenith = Math.acos(Math.sin(latitude_deg * RAD)*Math.sin(decl) + Math.cos(latitude_deg * RAD)*Math.cos(decl)*Math.cos(hour_angle * RAD));

    azimuth = 180 + Math.acos((Math.sin(latitude_deg * RAD)*Math.cos(zenith) - Math.sin((decl))) / (Math.cos(latitude_deg * RAD) * Math.sin(zenith))) * DEG

    altitude = 90 - zenith * DEG
    // Return altitude and azimuth
    return {altitude, azimuth};
}