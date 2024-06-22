let routeSearchedList = document.querySelector(".routeSearchedList");
let searchbox = document.querySelector("#searchbox");
let searchBtn = document.querySelector("#searchBtn");
let stopID_name = {};
let etaList = document.querySelector(".etaList");
let stopList22 = document.querySelector(".stopList22");
let loading = document.getElementById("loading");

// Function to show the loading indicator
function showLoading() {
  loading.classList.remove("hidden");
}

// Function to hide the loading indicator
function hideLoading() {
  loading.classList.add("hidden");
}

// Getting stop ID name first
window.addEventListener("load", () => {
  showLoading();
  axios
    .get("https://data.etabus.gov.hk/v1/transport/kmb/stop")
    .then(function (stopNames_response) {
      for (let stoplist of stopNames_response.data.data) {
        stopID_name[stoplist.stop] = stoplist.name_tc;
      }
      console.log(stopID_name);
    })
    .catch(function (stopNames_error) {
      alert("API is unavailable");
      console.log("API is unavailable");
    })
    .finally(() => {
      hideLoading();
    });
});

searchBtn.addEventListener("click", function () {
  routeSearchedList.innerHTML = "";
  stopList22.innerHTML = "";
  etaList.innerHTML = "";

  showLoading();
  axios
    .get("https://data.etabus.gov.hk/v1/transport/kmb/route/")
    .then(function (route_response) {
      let routes = route_response.data.data;
      let routeChecked = [];
      let inputUpper = searchbox.value.toUpperCase();
      let fixInput = inputUpper.replace(/ /g, "");
      searchbox.value = fixInput;

      for (let route of routes) {
        if (route["route"] == searchbox.value) {
          routeChecked.push(route);
        }
      }
      if (!routeChecked.length) {
        alert("Bus route is not found");
        searchbox.value = "";
      }
      console.log(routeChecked);

      for (let i = 0; i < routeChecked.length; i++) {
        routeSearchedList.innerHTML += `<button
          class="routeNumber mt-1.5 align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none mx-0.5"
          type="button"
          data-ripple-light="true"
        >
        ${routeChecked[i].orig_tc}->${routeChecked[i].dest_tc}
        </button>`;
        let selectedRoute = document.querySelectorAll(`.routeNumber`);
        selectedRoute.forEach((eachRoute, eachIndex) => {
          eachRoute.addEventListener("click", function () {
            let routeboundConverted = "";
            stopList22.innerHTML = "";
            etaList.innerHTML = "";

            routeboundConverted =
              routeChecked[eachIndex].bound == "O" ? "outbound" : "inbound";
            showLoading();
            axios
              .get(
                "https://data.etabus.gov.hk/v1/transport/kmb/route-stop/" +
                  routeChecked[eachIndex].route +
                  "/" +
                  routeboundConverted +
                  "/" +
                  routeChecked[eachIndex].service_type
              )
              .then(function (response) {
                let stopInfo;
                let etaClicks = [];
                let stopIDList = [];

                for (let j = 0; j < response.data.data.length; j++) {
                  stopInfo = response.data.data[j];
                  stopIDList.push(stopInfo.stop);

                  for (let stopMatching in stopID_name) {
                    if (stopInfo.stop == stopMatching) {
                      stopList22.innerHTML += `<button
                        type="button"
                        class="stopNumber w-100 px-4 py-2 font-medium text-left rtl:text-right border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white"
                      >
                        <div class="text-red-700 p-px bg-yellow-300 flex w-5 justify-center rounded-lg">${
                          j + 1
                        }</div> ${stopID_name[stopMatching]}
                      </button>`;
                    }
                  }
                }

                etaClicks = document.querySelectorAll(".stopNumber");
                etaClicks.forEach((element, index) => {
                  element.addEventListener("click", function () {
                    etaList.innerHTML = "";
                    showLoading();
                    axios
                      .get(
                        "https://data.etabus.gov.hk/v1/transport/kmb/eta/" +
                          stopIDList[index] +
                          "/" +
                          routeChecked[eachIndex].route +
                          "/" +
                          routeChecked[eachIndex].service_type
                      )
                      .then(function (etaResponse) {
                        let arrayOfEtas = etaResponse.data.data;
                        // console.log(arrayOfEtas);
                        let filter_arrayOfEtas = arrayOfEtas.filter(function (
                          info
                        ) {
                          return (
                            info.dir == routeChecked[eachIndex].bound &&
                            info.service_type ==
                              routeChecked[eachIndex].service_type &&
                            info.seq == index + 1
                          );
                        });

                        for (let k = 0; k < filter_arrayOfEtas.length; k++) {
                          let etaTime = filter_arrayOfEtas[k].eta;
                          if (etaTime) {
                            etaTime = filter_arrayOfEtas[k].eta.slice(11, 16);
                          } else {
                            etaTime = "Eta is not provided by KMB";
                          }
                          let etaMode = "";
                          console.log(etaTime);
                          if (filter_arrayOfEtas[k].rmk_tc == "") {
                            etaMode = "實時班次";
                          } else {
                            etaMode = filter_arrayOfEtas[k].rmk_tc;
                          }
                          etaList.innerHTML += `<div
                            id="toast-simple"
                            class="flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-indigo-700 bg-white divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800"
                            role="alert"
                          >
                            <img
                              class="w-5 h-5 text-blue-600 dark:text-blue-500 rotate-45"
                              src="clock.svg"
                            />
                            <div class="ps-4 text-sm font-normal">${etaTime}</div>
                            <div class="ps-4 text-sm font-normal">${etaMode}</div>
                          </div>`;
                          etaList.classList.add("show");
                        }
                      })
                      .finally(() => {
                        hideLoading();
                      });
                  });
                  element.addEventListener("blur", function () {
                    etaList.classList.remove("show");
                  });
                });
              })
              .finally(() => {
                hideLoading();
              });
          });
        });
      }
    })
    .finally(() => {
      hideLoading();
    });
});
