// TO DO -- implement currency
// TO DO -- optimize/remove xs code

import * as LocalStorageManager from "/LocalStorageManager.js";
import * as MathsHelpers from "/MathsHelpers.js";
import * as DragHelper from "/DragHelper.js";
import * as CoinCodes from "/coinCodes2.js";

const coinCodeInput = document.querySelector("#coin-code-input");
const coinHoldingsInput = document.querySelector("#holdings-input");

// Get the modal
const modal = document.getElementById("addCoinModal");
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

let codeInputErrorLabel = document.querySelector(
  "#coin-code-input-container-label"
);


// Get the modal
const selectCoinModal = document.getElementById("selectCoinModal");
// Get the button that opens the modal
const searchOpenBtn = document.querySelector("#open-modal-btn");
// Get the close button
let searchClsBtn = document.getElementById("searchClsBtn");

let testHoldingsInput = document.querySelector("#holdings-input");

// button to open select coin panel
let coinCodeBtn = document.querySelector("#coin-code-button");

let coinSearchList = document.querySelector("#coinSearchList");

let welcomeMsg = document.querySelector('#welcome-msg');

coinItemList.addEventListener("touchstart", dragStart, false);
coinItemList.addEventListener("touchend", dragEnd, false);
coinItemList.addEventListener("touchmove", drag, false);

// event listener for filter of coin code/name input
coinCodeInput.addEventListener("input", (e) => filterData(e.target.value));

// event listener for holdings input clicked to close dropdown
coinHoldingsInput.addEventListener("click", (e) => {
  
});

// event listener for add new coin list item
addCoinItemBtn.addEventListener("click", function (e) {
  createNewWatchListItem(coinCodeInput.value, coinHoldingsInput.value);
});

// when user clicks search coin modal open btn
coinCodeBtn.addEventListener("click", function (e) {
  selectCoinModal.style.display = "flex";populateSelectTokenList();
});

// when user clicks search coin modal close btn
searchClsBtn.addEventListener("click", function (e) {
  closeSearchModal();
});

function closeSearchModal() {
  selectCoinModal.style.display = "none";
}

// When the user clicks open add coin modal btn
openModalBtn.onclick = function () {
  modal.style.display = "flex";
  // testHoldingsInput.focus();
  coinCodeBtn.innerHTML = 
  `<div id="button-display">
    
    <div class="button-display-item">
      Select token
    </div>
    <div class="button-display-item">
      <i class="fa-solid fa-angle-down"></i>
    </div>  
  </div>
  `
};

// When the user clicks close add coin modal btn
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
  // inputOptions.innerHTML = "";
  resetNetworth();
  // get local storage items
  let watchList = LocalStorageManager.getFromLocalStorage("watchList");

  // --TODO--
  // get current currency from currency dropdown
  // let currentSelectedCurrency = getCurrentCurrency();

  // if watchlist is empty ensure networth total is $0
  if (watchList.length == 0) {
    var netWorthNumber = 0;
    netWorth.textContent = "$0.00";
    welcomeMsg.style.display = "flex";
    // hide networth total
    // show welcome message
    return;
  }

  // create table item for each item in local storage
  if (watchList != null) {
    // hide welcome msg
    welcomeMsg.style.display = "none";
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
        console.log(swappedImgURL);

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
  // disable right click default menu for each list item
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
        <p class="holdings">${formattedCoin.coinHoldings} ${formattedCoin.coinCode}</p>
      </div>
      <!-- delete btn -->
      <button class="delete-btn btn-round"><i class="fa-solid fa-xmark"></i></button>
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
    if (arr[index].symbol == coinName) {
      coinId = arr[index].id;
    }
  }

  // if coin input isnt matched to coin id's
  if (coinId == "") {
    // codeInputErrorLabel.textContent = "Please select coin from dropdown";
    // codeInputErrorLabel.classList.remove("no-error");
    // codeInputErrorLabel.classList.add("error");
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

function populateSelectTokenList() {
  coinCodeInput.value = "";
  let arr = CoinCodes.coinCodes;

  coinSearchList.innerHTML = "";
  // coinDropdownUL.innerHTML = "";
  for (let index = 0; index < arr.length; index++) {
    const li = document.createElement("li");
    li.innerHTML = `
    <button class="coinSearchButton">
      <div class="coinSearchItemContainer">
        <img class="coinSearchItemIcon" src="${arr[index].icon}" alt="" />
        <div class="coinSearchItemTextContainer">
          <div class="coinSearchItemName">${arr[index].symbol}</div>
          <div class="coinSearchItemCode">${arr[index].name}</div>
        </div>
      </div>
    </button>
    `;
    li.classList.add("coinSearchItem");
    li.addEventListener("click", () => {
     
      coinCodeBtn.innerHTML = 
      `<div id="button-display">
        <div class="button-display-item">
          <img class="coinSearchItemIcon" src="${arr[index].icon}" alt="" />
        </div>
        <div class="button-display-item">
          ${arr[index].symbol}
        </div>
        <div class="button-display-item">
          <i class="fa-solid fa-angle-down"></i>
        </div>  
      </div>
      `
      coinCodeInput.value = arr[index].symbol;
      closeSearchModal();
    });
    // coinDropdownUL.appendChild(li);
    coinSearchList.appendChild(li);
}
}

function filterData(searchInput) {
  
  let arr = CoinCodes.coinCodes;
  // return array of filtered coins containing search input value
  const filteredData = arr.filter((value) => {
    const searchStr = searchInput.toLowerCase();

    const matches = value.name.toLowerCase().includes(searchStr) || value.symbol.toLowerCase().includes(searchStr) ;

    return matches;
  });

  coinSearchList.innerHTML = "";
  // coinDropdownUL.innerHTML = "";
  for (let index = 0; index < filteredData.length; index++) {
    const li = document.createElement("li");
    li.innerHTML = `
    <button class="coinSearchButton">
      <div class="coinSearchItemContainer">
        <img class="coinSearchItemIcon" src="${filteredData[index].icon}" alt="" />
        <div class="coinSearchItemTextContainer">
          <div class="coinSearchItemName">${filteredData[index].symbol}</div>
          <div class="coinSearchItemCode">${filteredData[index].name}</div>
        </div>
      </div>
    </button>
    `;
    li.classList.add("coinSearchItem");
    li.addEventListener("click", () => {
      coinCodeInput.value = "";
      coinCodeBtn.innerHTML =  `
      <div id="button-display">
      <div class="button-display-item">
        <img class="coinSearchItemIcon" src="${filteredData[index].icon}" alt="" />
      </div>
      <div class="button-display-item">
        ${filteredData[index].symbol}
      </div>
      <div class="button-display-item">
        <i class="fa-solid fa-angle-down"></i>
      </div>  
    </div>
    `
    coinCodeInput.value = filteredData[index].symbol;
    closeSearchModal();
    });
    // coinDropdownUL.appendChild(li);
    coinSearchList.appendChild(li);
  }
}

// clear input fields and reset input dropdown after coin has been added to local storage
function resetInput() {
  
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
  // codeInputErrorLabel.classList.add("no-error");
  // codeInputErrorLabel.classList.remove("error");
}

// remove all coin items to allow updated local storage array to be shown
function clearCoinItems() {
  coinItemList.innerHTML = "";
}





var activeItem = null;
var initialXPos = 0;
var active = false;
export var del = false;

function dragStart(e) {
  active = true;
  
  // this is the item we are interacting with
  activeItem = e.target.closest(".coin-item");
  activeItem.classList.remove('dragged');
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
      activeItem.classList.add('dragged');
      setTranslate(initialXPos, 0, activeItem);

      initialXPos = 0;
      active = false;
      //activeItem.classList.add('not-dragged');
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

      // disable swipe right
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
