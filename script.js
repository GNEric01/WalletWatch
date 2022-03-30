// TO DO -- implement currency
// TO DO -- manage duplicate items
// TO DO -- optimize/remove xs code

import * as LocalStorageManager from "/LocalStorageManager.js";
import * as MathsHelpers from "/MathsHelpers.js";
import * as DragHelper from "/DragHelper.js";
import * as CoinCodes from "/coinCodes2.js";

const coinCodeInput = document.querySelector("#coin-code-input");
const coinHoldingsInput = document.querySelector("#coin-holdings-input");

// Get the modal
const modal = document.getElementById("myModal");
// Get the button that opens the modal
const openModalBtn = document.querySelector("#open-modal-btn");
// Get the close button
let clsBtn = document.getElementById("clsBtn");
// add new coin item btn
const addCoinItemBtn = document.querySelector("#addCoinBtn");
// coin item container,new coin items added to this
const coinItemContainer = document.querySelector(".coin-item-container");
const coinItemList = document.querySelector(".coin-item-list");
// net worth total
let netWorth = document.querySelector("#networth-text");
// coin code dropdown options list
let inputOptions = document.getElementById("coins");
// coin dropdown
let coinDropdown = document.querySelector(".coin-dropdown-list");
let coinDropdownUL = document.querySelector("#coin-dropdown-ul");

let codeInputErrorLabel = document.querySelector(
  "#coin-code-input-container-label"
);

// coinItemList.addEventListener("touchstart", startTouch, false);
//  coinItemList.addEventListener("touchmove", moveTouch, false);

coinItemList.addEventListener("touchstart", dragStart, false);
coinItemList.addEventListener("touchend", dragEnd, false);
coinItemList.addEventListener("touchmove", drag, false);

// event listener for filter of coin code/name input
coinCodeInput.addEventListener("input", (e) => filterData(e.target.value));

// event listener for input clicked to open dropdown
coinCodeInput.addEventListener("input", (e) => filterData(e.target.value));

// event listener for holdings input clicked to close dropdown
coinHoldingsInput.addEventListener("click", (e) => {
  coinDropdown.style.display = "none";
});

// event listener for add new coin list item
addCoinItemBtn.addEventListener("click", function (e) {
  createNewWatchListItem(coinCodeInput.value, coinHoldingsInput.value);
});

// When the user clicks the button, open the modal
openModalBtn.onclick = function () {
  modal.style.display = "flex";
};

// When the user clicks btn to close the modal
clsBtn.onclick = function () {
  closeModal();
};

function closeModal() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// global arrays
var localStorageCoinData = [];
var fetchedCoinsData = [];

// $total setup
var netWorthNumber = 0;
netWorth.textContent = "$0.00";

// populate table on pageload, from local storage
document.onload = createWatchListItemsFromLocalStorage();

function createWatchListItemsFromLocalStorage() {
  clearCoinItems();
  inputOptions.innerHTML = "";
  resetNetworth();
  // get local storage items
  let watchList = LocalStorageManager.getFromLocalStorage("watchList");

  // --TODO--
  // get current currency from currency dropdown
  // let currentSelectedCurrency = getCurrentCurrency();

  // if watchlist is empty ensure networth total is $0
  if (watchList == null) {
    var netWorthNumber = 0;
    netWorth.textContent = "$0.00";
  }
  // create table item for each item in local storage
  if (watchList != null) {
    // zero local storage array
    localStorageCoinData = [];
    // save local storage object in local array
    for (let i = 0; i < watchList.length; i++) {
      let localCoin = {
        code: watchList[i].code,
        coins: watchList[i].coins,
        id: watchList[i].id,
      };
      localStorageCoinData.push(localCoin);
    }
  }

  // create string from local storage to allow single API call for multiple coins
  let coinCodeString = "";
  watchList.forEach((element) => {
    if (coinCodeString == "") {
      coinCodeString += element.code;
    } else {
      coinCodeString += "," + element.code;
    }
  });

  if (coinCodeString != "") {
    // clear fetched coin data for new fetch
    fetchedCoinsData = [];
    getCoinDetailsFromAPI(coinCodeString, "USD");
  }
}

function getCoinDetailsFromAPI(code, currency) {
  // init fetchdata object
  const coinData = new FetchData(code, currency);
  coinData
    .getCoinData()
    .then((results) => {
      for (const item in results) {
        let currentCoinQuantity = 0;
        let coinId = 0;
        // match filtered coins to local storage array to get quantity
        for (let index = 0; index < localStorageCoinData.length; index++) {
          if (results[item].id == localStorageCoinData[index].code) {
            currentCoinQuantity = localStorageCoinData[index].coins;
            coinId = localStorageCoinData[index].id;
          }
        }
        // set image size
        let fetchedImgURL = results[item].image;
        let swappedImgURL = fetchedImgURL.replace("large", "small");

        let fetchedCoin = {
          price: results[item].current_price,
          coinCode: results[item].symbol,
          coinName: results[item].name,
          coinCurrency: currency,
          coinHoldings: currentCoinQuantity,
          coinDailyChange: results[item].price_change_percentage_24h,
          coinCurrentValue: 0,
          coinImg: swappedImgURL,
          coinIndex: coinId,
        };
        fetchedCoinsData.push(fetchedCoin);
      }

      // sort fetchedCoinsData items into numerically ordered array by id.
      fetchedCoinsData.sort(function (a, b) {
        return a.coinIndex - b.coinIndex;
      });
      writeToTable();
    })
    .catch((err) => console.log(err));
}

function writeToTable() {
  for (let index = 0; index < fetchedCoinsData.length; index++) {
    let formattedCoin = formatCoinData(fetchedCoinsData[index]);

    // format
    let num = MathsHelpers.numberWithCommas(formattedCoin.coinCurrentValue);
    formattedCoin.coinCurrentValue = "$" + num;

    displayNewCoinItem(formattedCoin, index);

    // after items drawn to list, attach listeners and delete functionality
    setUpCoinItemDelete();
  }
}

function setUpCoinItemDelete() {
  // get all coin list items
  const coinItems = document.querySelectorAll(".coin-item");
  // disable right click for each list iten
  coinItems.forEach((element) => {
    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  });
  // get index of right clicked list item
  for (var i = 0; i < coinItems.length; i++) {
    coinItems[i].addEventListener(
      "contextmenu",
      ((j) => {
        return function () {
          LocalStorageManager.removeItemFromLocalStorage("watchList", j + 1);
          createWatchListItemsFromLocalStorage();
        };
      })(i)
    );
  }
}

function formatCoinData(coin) {
  // format data
  let priceFloat = parseFloat(coin.price).toFixed(2);
  let price = "$" + MathsHelpers.numberWithCommas(priceFloat);
  let holdingsFloat = parseFloat(coin.price * coin.coinHoldings);
  let totalHoldings = parseFloat(holdingsFloat).toFixed(2);
  let dailyChange = MathsHelpers.roundToTwo(coin.coinDailyChange);

  let formattedCoin = {
    price: price,
    coinCode: coin.coinCode.toUpperCase(),
    coinName: coin.coinName,
    //coinCurrency: coinCurrency,
    coinDailyChange: dailyChange,
    coinHoldings: coin.coinHoldings,
    coinCurrentValue: totalHoldings,
    coinImg: coin.coinImg,
  };

  updateNetworthTotal(holdingsFloat);
  return formattedCoin;
}

function updateNetworthTotal(holdings) {
  netWorthNumber += holdings;
  netWorth.textContent =
    "$" + MathsHelpers.numberWithCommas(Math.round(netWorthNumber));
}

function resetNetworth() {
  netWorthNumber = 0;
  netWorth.textContent = "$0.00";
}

function displayNewCoinItem(formattedCoin, id) {
  // set color of daily change
  let change = parseFloat(formattedCoin.coinDailyChange);
  let changeColor = "";
  if (change < 0) {
    changeColor = "rgb(255, 123, 123";
  } else if (change > 0) {
    changeColor = "#04AA1D";
  }

  var li = document.createElement("li");

  let newCoinItem = `
  <!-- <li class='coin-list-item'> -->
      <div class="coin-item" data-id="${parseInt(id + 1)}">
      <!-- coin img name code -->
      <div class="coin-info-container">
        <img src="${formattedCoin.coinImg}?width=100" alt="" class="logo">
        <div class="coin-text-container">
          <p class="name">${formattedCoin.coinName}
          </p>
          <p class="code">${formattedCoin.coinCode}</p>
        </div>
      </div>
      <!-- coin price 24hrchange -->
      <div class="price-container">
        <p class="price">${formattedCoin.price}</p>
        <p class="change" style="color:${changeColor}">${change}%</p>
      </div>
      <!-- holdings total holdings -->
      <div class="holdings-container">
        <p class="holdings-total">${formattedCoin.coinCurrentValue}</p>
        <p class="holdings">${formattedCoin.coinHoldings} ${
    formattedCoin.coinCode
  }</p>
      </div>
    </div>
    <!-- <li/> -->
  `;
  li.classList.add("coin-list-item");
  li.innerHTML = newCoinItem;
  // li.draggable = "true";

  coinItemList.appendChild(li);
}

function createNewWatchListItem(coinName, coinQuantity) {
  if (coinQuantity == "") {
    coinQuantity = 0;
  }

  // TO DO - implement currency func
  // let currentCurrency = getCurrentCurrency();
  // get current coin details from API
  // getCoinDetailsFromAPI(coinName.toUpperCase(), currentCurrency, coinQuantity);

  let coinId = "";
  let arr = CoinCodes.coinCodes;
  for (let index = 0; index < arr.length; index++) {
    if (arr[index].name == coinName) {
      coinId = arr[index].id;
    }
  }

  // if coin input isnt matched to coin id's
  if (coinId == "") {
    // codeInputErrorLabel.textContent = "Please select coin from dropdown";
    codeInputErrorLabel.classList.remove("no-error");
    codeInputErrorLabel.classList.add("error");
    resetInput();
    return;
  }

  const watchListItem = {
    code: coinId,
    coins: coinQuantity,
  };

  LocalStorageManager.addItemToLocalStorage("watchList", watchListItem);
  clearCoinItems();
  resetInput();
  resetInputErrorLabel();
  createWatchListItemsFromLocalStorage();
  closeModal();
}

function filterData(searchInput) {
  coinDropdown.style.display = "block";
  let arr = CoinCodes.coinCodes;
  // return array of filtered coins containing search input value
  const filteredData = arr.filter((value) => {
    const searchStr = searchInput.toLowerCase();

    const matches = value.name.toLowerCase().includes(searchStr);

    return matches;
  });

  coinDropdownUL.innerHTML = "";
  for (let index = 0; index < filteredData.length; index++) {
    const li = document.createElement("li");
    li.innerText = `${filteredData[index].name}`;
    li.addEventListener("click", () => {
      coinCodeInput.value = filteredData[index].name;
      coinDropdown.style.display = "none";
    });
    coinDropdownUL.appendChild(li);
  }
}

// clear input fields and reset input dropdown after coin has been added to local storage
function resetInput() {
  coinDropdown.style.display = "none";
  // clear input fields
  coinCodeInput.value = "";
  coinHoldingsInput.value = "";
  if (coinCodeInput) {
    window.onpageshow = function () {
      coinCodeInput.reset();
    };
  }
}

function resetInputErrorLabel() {
  codeInputErrorLabel.classList.add("no-error");
  codeInputErrorLabel.classList.remove("error");
}

// remove all coin items to allow updated local storage array to be shown
function clearCoinItems() {
  coinItemList.innerHTML = "";
}

// swipe data

// var initialX = null;
// var initialY = null;

// function startTouch(e) {
//   // initialX = e.touches[0].clientX;
//   // initialY = e.touches[0].clientY;
//   // console.log(touched - e.CoinCodes);

//   let swipedLiData = e.target.closest('.coin-item');
//   DragHelper.applyDrag(swipedLiData);
// };

// function moveTouch(e) {
// if (initialX === null) {
//   return;
// }

// if (initialY === null) {
//   return;
// }

// var currentX = e.touches[0].clientX;
// var currentY = e.touches[0].clientY;

// var diffX = initialX - currentX;
// var diffY = initialY - currentY;

// if (Math.abs(diffX) > Math.abs(diffY)) {
//   // sliding horizontally
//   if (diffX > 0) {
//     // swiped left
//     console.log("swiped left");
//     //
//     let swipedLiData = e.target.closest('.coin-item');
//     let itemId = swipedLiData.getAttribute('data-id');
//     console.log(parseInt(itemId));

//     setTimeout(() => {
//       LocalStorageManager.removeItemFromLocalStorage("watchList", parseInt(itemId));
//       createWatchListItemsFromLocalStorage();
//     },200);

//     // LocalStorageManager.removeItemFromLocalStorage("watchList", parseInt(itemId));
//     // createWatchListItemsFromLocalStorage();
//     // return;

//   } else {
//     // swiped right
//     console.log("swiped right");
//   }
// } else {
//   // sliding vertically
//   if (diffY > 0) {
//     // swiped up
//     console.log("swiped up");
//   } else {
//     // swiped down
//     console.log("swiped down");
//   }
// }

// initialX = null;
// initialY = null;

// e.preventDefault();
//};

var swipeItems = document.querySelector(".swipe-item");

var activeItem = null;
var initialXPos = 0;
var active = false;
export var del = false;
var swiper;

// swipeItems.addEventListener("mousedown", dragStart, false);
// swipeItems.addEventListener("mouseup", dragEnd, false);
// swipeItems.addEventListener("mousemove", drag, false);

function dragStart(e) {
  active = true;
  // setTimeout(() => {
  //   active = true;
  // },150);
   
  // this is the item we are interacting with
  activeItem = e.target.closest(".coin-item");

  if (activeItem !== null) {
    if (!activeItem.xOffset) {
      activeItem.xOffset = 0;
    }

    if (e.type === "touchstart") {
      activeItem.xOffset = 0;
      activeItem.initialX = e.touches[0].clientX - activeItem.xOffset;
      initialXPos = activeItem.xOffset;
    } else {
      activeItem.initialX = e.clientX - activeItem.xOffset;
    }
  }
}

function dragEnd(e) {
  if (active) {
    if (activeItem !== null) {
      activeItem.currentX = activeItem.initialX;
    }

    // if swipe < 50px reset to start pos
    if (initialXPos - activeItem.currentX <= 50) {
      setTranslate(initialXPos, 0, activeItem);

      initialXPos = 0;
      active = false;
      activeItem = null;
    }
  }
}

function drag(e) {
  if (active) {
    if (e.type === "touchmove") {
      // e.preventDefault();

      activeItem.currentX = e.touches[0].clientX - activeItem.initialX;

      // if swipe left > 300 action taken
      if (initialXPos - activeItem.currentX >= 300) {
        active = false;
        let itemId = activeItem.getAttribute("data-id");
        console.log(parseInt(itemId));

        setTimeout(() => {
          LocalStorageManager.removeItemFromLocalStorage(
            "watchList",
            parseInt(itemId)
          );
          createWatchListItemsFromLocalStorage();
        }, 100);
      }

      // if swipe right return to start pos
      if (initialXPos - activeItem.currentX < 0) {
        setTranslate(initialXPos, 0, activeItem);
        initialXPos = 0;
        active = false;
        return;
      }
    } else {
      activeItem.currentX = e.clientX - activeItem.initialX;
    }
    activeItem.xOffset = activeItem.currentX;
    setTranslate(activeItem.currentX, 0, activeItem);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = "translate3d(" + xPos + "px, " + 0 + "px, 0)";
}
