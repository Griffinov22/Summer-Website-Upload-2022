"use stric";

const textSpace = document.querySelector("#text-space");
const form = document.querySelector("#form");
const bigDegree = document.querySelector("#degree-p");
const cityText = document.querySelector("#city-text");
const days = document.querySelectorAll("#forecast-ul li");
const daysEmoji = document.querySelectorAll(".list-img");
const dayNames = document.querySelectorAll(".day-text");
let day = new Date().getDay();
const week = ["Sun.", "Mon.", "Tue.", "Wed.", "Thur.", "Fri.", "Sat."];
let lat, lng, map;

(function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async function (pos) {
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        cityText.textContent = await getComputerCity(lng, lat); // displays city on UI
        bigDegree.textContent = (await setBigDegree(lat, lng)) + "°F";
        await setForecast(lat, lng);
        setDegreeColor(bigDegree, Number.parseInt(bigDegree.textContent));
        initializeMap(lat, lng);
      },
      () => alert("You did not allow your location.")
    );
  }
})();
//end function
const initializeMap = async function (lat, lng) {
  const osm = L.tileLayer(
    `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`,
    {
      maxZoom: 18,
      attribution: "Yours Truly",
    }
  );
  const clouds = L.OWM.clouds({
    showLegend: false,
    opacity: 0.5,
    appId: "7c934f0478da5f79399cb1d62dbe5273",
  });
  const temp = L.OWM.temperature({ appId: "7c934f0478da5f79399cb1d62dbe5273" });
  const city = L.OWM.current({ intervall: 15, lang: "en" });

  map = L.map("maps-div", {
    center: new L.LatLng(lat, lng),
    zoom: 10,
    layers: [osm],
  });
  CreateAndPlacePoppup(map, [lat, lng], await getDescription(lat, lng));
  const baseMaps = { "OSM Standard": osm };
  //prettier-ignore
  const overlayMaps = { "Clouds": clouds, "Cities": city, "Temp": temp };
  const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
};
//end function
const moveToCity = function (map, coords) {
  map.setView(coords, 10, {
    animate: true,
    pan: {
      duration: 1,
    },
  });
};
//end function
//end function
const setDegreeColor = function (el, deg) {
  let color;
  if (deg >= 80) {
    color = "red";
  } else if (deg > 75) {
    color = "orange";
  } else if (deg > 50) {
    color = "green";
  } else if (deg > 30) {
    color = "lightBlue";
  } else {
    color = "blue";
  }
  el.style.color = color;
};

const displayData = function (data) {
  const [r, g, b] = threeRand();
  cityText.style.color = `rgb(${r} ${g} ${b})`;
  bigDegree.textContent = Math.round(data.daily[0].temp.day) + "°F";
  setDegreeColor(bigDegree, Math.round(data.daily[0].temp.day));
  //looping over days in forecast and adding data to UI
  for (let i = 0; i < days.length; i++) {
    days[i].children[1].textContent = Math.round(data.daily[i].temp.day) + "°F";
    setDegreeColor(days[i].children[1], Math.round(data.daily[i].temp.day));

    if (day >= 7) {
      day = 0;
    }
    dayNames[i].textContent = week[day];
    day++;
  }
  renderForecastEmoji(data.daily);
  //highlight current day (always first li)
  days[0].style.background = "linear-gradient(lightgreen,white)";
};
//end function
const renderForecastEmoji = function (dailyData) {
  // 8 day-forecast so subtract one from the length
  for (let i = 0; i < dailyData.length - 1; i++) {
    // console.log(dailyData[i].weather[0].main);
    switch (dailyData[i].weather[0].main) {
      case "Rain":
        daysEmoji[i].src = "/img/rain.png";
        break;
      case "Clouds":
        daysEmoji[i].src = "/img/cloudy.png";
        break;
      case "Sun":
      case "Sunny":
        daysEmoji[i].src = "/img/sun.png";
        break;
      case "Thunder":
      case "Thunder Storm":
        daysEmoji[i].src = "/img/thunder.png";
        break;
      case "Windy":
      case "Wind":
        daysEmoji[i].src = "/img/windy.png";
        break;
      case "Snow":
        daysEmoji[i].src = "/img/snow.png";
        break;
      case "Clear":
        daysEmoji[i].src = "/img/sun.png";
        break;
      default:
        daysEmoji[i].src = "/img/dont_know.png";
        console.log(
          "For all we know it's going to be sand storm. Griffin Needs to fix this."
        );
    }
  }
};
//end function
const renderCityText = function (text) {
  cityText.textContent = text;
};
//end funtion
const threeRand = function () {
  const digits = [];
  for (let i = 0; i < 3; i++) {
    digits.push(Math.floor(Math.random() * 255) + 1);
  }
  return digits;
};
//end function
const CreateAndPlacePoppup = function (map, coords, description) {
  L.marker(coords)
    .addTo(map)
    .bindPopup(
      L.popup({
        // maxWidth: 500,
        // minWidth: 300,
        autoClose: false,
        closeOnClick: true,
        className: "createPopup",
      })
    )
    .setPopupContent(description)
    .openPopup();
};
//end function
const getComputerCity = async function (lng, lat) {
  let city, state;
  await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=7b891ce6023a4080a275d5069685fe69`
  )
    .then((res) => res.json())
    .then((data) => {
      city = data.features[0].properties.city;
      state = data.features[0].properties.state_code;
    });
  return `${city}, ${state}`;
};
//end function
const setBigDegree = async function (lat, lng) {
  let deg;
  await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&exclude=current,hourly,minutely,alerts&units=imperial&appid=7c934f0478da5f79399cb1d62dbe5273`
  )
    .then((res) => res.json())
    .then((resData) => {
      deg = Math.round(resData.daily[0].temp.day);
    });
  return deg;
};
//end function
const setForecast = async function (lat, lng) {
  await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&exclude=current,hourly,minutely,alerts&units=imperial&appid=7c934f0478da5f79399cb1d62dbe5273`
  )
    .then((res) => res.json())
    .then((resData) => {
      for (let i = 0; i < days.length; i++) {
        days[i].children[1].textContent =
          Math.round(resData.daily[i].temp.day) + "°F";
        setDegreeColor(
          days[i].children[1],
          Math.round(resData.daily[i].temp.day)
        );

        if (day >= 7) {
          day = 0;
        }
        dayNames[i].textContent = week[day];
        day++;
      }
      renderForecastEmoji(resData.daily);
      //highlight current day (always first li)
      days[0].style.background = "linear-gradient(lightgreen,white)";
    });
};
//end function
const getDescription = async function (lat, lng) {
  let description;
  await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&exclude=current,hourly,minutely,alerts&units=imperial&appid=7c934f0478da5f79399cb1d62dbe5273`
  )
    .then((res) => res.json())
    .then((resData) => {
      const today = resData.daily[0];

      description = `High: ${today.temp.max}°F</br> Low: ${today.temp.min}°F</br> includes ${today.weather[0].description}`;
    });
  return description;
};
//end function

//start
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const currCity = textSpace.value;
  textSpace.value = "";
  //fetch coordinates of location HERE//
  await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${currCity}&apiKey=7b891ce6023a4080a275d5069685fe69`
  )
    .then((res) => res.json())
    .then((data) => {
      // console.log(data);
      [lng, lat] = data.features[0].geometry.coordinates;
      renderCityText(
        `${data.features[0].properties.city}, ${data.features[0].properties.state}`
      );
      moveToCity(map, [lat, lng]);
      return fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&exclude=current,hourly,minutely,alerts&units=imperial&appid=7c934f0478da5f79399cb1d62dbe5273`
      );
    })
    .then((res) => res.json())
    .then((resData) => {
      displayData(resData);
      const today = resData.daily[0];

      const description = `High: ${today.temp.max}°F</br> Low: ${today.temp.min}°F</br> includes ${today.weather[0].description}`;
      CreateAndPlacePoppup(map, [lat, lng], description);
    })
    .catch((err) => {
      renderCityText("N/A (Error)");
      console.log(err);
    });
});
