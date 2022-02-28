import * as LocalStorageManager from "/LocalStorageManager.js";
import * as MathsHelpers from "/MathsHelpers.js";
import * as ProgressItems from "/progressData.js";
import * as CoinCodes from "/coinCodes2.js";

let coinQuantity = document.getElementById("holdings-input");
const addBtn = document.querySelector("#add-btn");
const coinCodeInput = document.querySelector("#coin-code-input");
const netWorth = document.querySelector(".net-worth");
let table = document.querySelector(".styled-table");
let currency = document.getElementById("currency");
let progressBar = document.getElementById("myBar");
let progressBarLabel = document.getElementById("bar-progress-label");
let progressQuote = document.getElementById("progress-quote");
let inputOptions = document.getElementById("coins");
const coinInputError = document.querySelector(".coin-input-error");
const coinQuantityError = document.querySelector(".coin-quantity-error");

// global arrays
var localStorageCoinData = [];
var fetchedCoinsData = [];
// var selectedCoinCode = "";
// var to hold setInterval for num animation
let isCounting;

// populate table on pageload, from local storage
document.onload = createWatchListItemsFromLocalStorage();

// event listener for currency dropdown change
currency.addEventListener("change", function (e) {
  clearTable();
  createWatchListItemsFromLocalStorage();
});

// event listener for add new table row
addBtn.addEventListener("click", function (e) {
  createNewWatchListItem(coinCodeInput.value, coinQuantity.value);
});

// event listener for delete buttons on table
document.body.addEventListener("click", function (event) {
  if (event.target.id == "delete-selection-btn") {
    removeItem(event.target);
  }
});

// event listener for filter of coin code/name input
coinCodeInput.addEventListener("input", (e) => filterData(e.target.value));

// event listener for input to test for focus
coinCodeInput.addEventListener("focus", () => {
  coinInputError.classList.remove("show");
  coinInputError.classList.add("hide");
});

// event listener for input to test for focus
coinQuantity.addEventListener("focus", () => {
  coinQuantityError.classList.remove("show");
  coinQuantityError.classList.add("hide");
});

// $total setup
var netWorthNumber = 0;
netWorth.textContent = "$0.00";

function createWatchListItemsFromLocalStorage() {
  // get local storage items
  let watchList = LocalStorageManager.getFromLocalStorage("watchList");
  // get current currency from currency dropdown
  let currentSelectedCurrency = getCurrentCurrency();
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

function filterData(searchInput) {
  let arr = CoinCodes.coinCodes;
  // return array of filtered coins containing search input value
  const filteredData = arr.filter((value) => {
    const searchStr = searchInput.toLowerCase();

    const matches = value.name.toLowerCase().includes(searchStr);

    return matches;
  });
  // set update options to filtered coins
  inputOptions.innerHTML = "";
  for (let index = 0; index < filteredData.length; index++) {
    inputOptions.innerHTML += `<option value="${filteredData[index].name}">`;
  }
}

function setProgressBar(hld) {
  let gotQuote = ProgressItems.getRandomItem();
  let progressTotal = gotQuote.cost;
  let percentProgress = (hld / progressTotal) * 100;
  // stop progress bar overflowing when above 100%
  if (percentProgress > 100) {
    progressBar.style.width = "100%";
  } else {
    progressBar.style.width = percentProgress + "%";
  }
  progressBarLabel.textContent = Math.round(percentProgress) + "%";
  progressQuote.innerHTML = `"${gotQuote.quote}"<span id="progress-quote-author">${gotQuote.author} </span><i class="fab fa-twitter"></i>`;
}

function getCurrentCurrency() {
  // get current currency value from dropdown
  let currentCurrency = currency.options[currency.selectedIndex].value;
  return currentCurrency;
}

function clearTable() {
  // get current rows in table
  let tableBody = document.getElementById("table-body");
  let rows = tableBody.rows.length;
  // delete rows in table
  for (var i = 0; i < rows; i++) {
    tableBody.deleteRow(i);
    rows--;
    i--;
  }
  netWorthNumber = 0;
  netWorth.textContent = "$0.00";
}

function createNewWatchListItem(coinName, coinQuantity) {
  if (coinName == "") {
    coinInputError.textContent = "Please enter coin code";
    coinInputError.classList.remove("hide");
    coinInputError.classList.add("show");
    //  alert("Please enter coin code");
    return;
  }
  if (coinQuantity == "") {
    coinQuantityError.textContent = "Please enter coin quantity";
    coinQuantityError.classList.remove("hide");
    coinQuantityError.classList.add("show");
    // alert("Please enter coin quantity");
    return;
  }

  // TO DO - implement currency func
  let currentCurrency = getCurrentCurrency();
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
    coinInputError.textContent = "Please select coin from dropdown";
    coinInputError.classList.remove("hide");
    coinInputError.classList.add("show");
    // alert("Please select from suggested coins");
    resetInput();
    return;
  }

  // set to save to local in API fetch
  saveWatchListItemToLocalStorage(coinId, coinQuantity);
  clearTable();
  createWatchListItemsFromLocalStorage();
  resetInput();
}

function getCoinDetailsFromAPI(code, currency) {
  isCounting = setInterval(numberCounterAnimation, 60);

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
      clearInterval(isCounting);
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

    insertTableRow(formattedCoin);
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
    coinCode: coin.coinCode,
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

function insertTableRow(formattedCoin) {
  // set color of daily change
  let change = parseFloat(formattedCoin.coinDailyChange);
  let changeColor = "";
  if (change < 0) {
    changeColor = "rgba(219, 40, 40, 0.9)";
  } else if (change > 0) {
    changeColor = "#04AA1D";
  }

  // insert row to table
  let tableBody = document.getElementById("table-body");
  let newTableRow = tableBody.insertRow();

  newTableRow.innerHTML = ` 
        <tr>
            <td class="right-justify"><img class='coin-img' src='${formattedCoin.coinImg}?width=100' alt=''></td>
            <td class="left-justify">${formattedCoin.coinName} (${formattedCoin.coinCode})</td>
            <td class="right-justify">${formattedCoin.price}</td>
            <td class="left-justify" id="change-text" style="color:${changeColor}">${change}%</td>
            <td class="center">${formattedCoin.coinHoldings}</td>
            <td class="right-justify last-column">${formattedCoin.coinCurrentValue}</td>
            <td class="last-column"><button class="btn" id='delete-selection-btn'>
            <i class="far fa-times-circle fa-2x" style="pointer-events: none;"></i>
            </button></td>
        </tr>`;

  // clear input boxes
  resetInput();
}

function saveWatchListItemToLocalStorage(symbol, quantity, holdings) {
  let itemId = 0;

  const watchListItem = {
    id: itemId,
    code: symbol,
    coins: quantity,
    holdings: holdings,
  };

  LocalStorageManager.addItemToLocalStorage("watchList", watchListItem);
}

function resetInput() {
  // clear input fields
  coinCodeInput.value = "";
  coinQuantity.value = "";
  inputOptions.innerHTML = "";
}

function removeItem(element) {
  // remove item/row from table
  var rowContent = element.parentNode.parentNode;
  let rowItemIndex = rowContent.rowIndex;

  LocalStorageManager.removeItemFromLocalStorage("watchList", rowItemIndex);

  clearTable();
  createWatchListItemsFromLocalStorage();
}

document.body.className = "visible";

function numberCounterAnimation() {
  // get number of digits of current networth
  // const netWorthNumDigits = Math.round(netWorthNumber).toString().length;

  netWorth.textContent =
    "$" + MathsHelpers.numberWithCommas(randomRange(2000, 9999));
}

function randomRange(min, max) {
  const random = Math.floor(Math.random() * (max - min)) + min;
  return random;
}
