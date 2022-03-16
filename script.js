import * as LocalStorageManager from "/LocalStorageManager.js";
import * as MathsHelpers from "/MathsHelpers.js";
// import * as ProgressItems from "/progressData.js";
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
// const coinItemList = document.querySelector();
// net worth total
let netWorth = document.querySelector("#networth-text");
// coin code dropdown options list
let inputOptions = document.getElementById("coins");
// coin dropdown
let coinDropdown = document.querySelector(".coin-dropdown-list");
let coinDropdownUL = document.querySelector('#coin-dropdown-ul');

let codeInputErrorLabel = document.querySelector("#coin-code-input-container-label");  

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

    displayNewCoinItem(formattedCoin);

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

function displayNewCoinItem(formattedCoin) {
  // set color of daily change
  let change = parseFloat(formattedCoin.coinDailyChange);
  let changeColor = "";
  if (change < 0) {
    changeColor = "rgba(219, 40, 40, 0.9)";
  } else if (change > 0) {
    changeColor = "#04AA1D";
  }

  let newCoinItem = `
  <li>
      <div class="coin-item">
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
    </div>
    </li>
  `;
  coinItemContainer.innerHTML += newCoinItem;
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
  coinDropdown.style.display = 'block';
  let arr = CoinCodes.coinCodes;
  // return array of filtered coins containing search input value
  const filteredData = arr.filter((value) => {
    const searchStr = searchInput.toLowerCase();

    const matches = value.name.toLowerCase().includes(searchStr);

    return matches;
  });
  
  coinDropdownUL.innerHTML = "";
  for (let index = 0; index < filteredData.length; index++) {
    const li = document.createElement('li');
    li.innerText = `${filteredData[index].name}`;
    li.addEventListener('click', () => {
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
  coinItemContainer.innerHTML = "";
}
