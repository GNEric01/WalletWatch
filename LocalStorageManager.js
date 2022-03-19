export function getFromLocalStorage(localStorageName) {
    let items = JSON.parse(localStorage.getItem(localStorageName)|| '[]');
    return items;
}

// assumes itemToStore object has id attribute
export function getItemFromLocalStorage(localStorageName, localStorageItemId) {
    let items = JSON.parse(localStorage.getItem(localStorageName)).filter(item => item.id === localStorageItemId);
    return items;
}

export function saveToLocalStorage(localStorageName, itemsToStore) {
    localStorage.setItem(localStorageName, JSON.stringify(itemsToStore));
}

// assumes itemToStore object has id attribute
export function addItemToLocalStorage(localStorageName, itemToStore) {
    // get local storage to array
    let items = getFromLocalStorage(localStorageName);
    // add new item to array
    items.push(itemToStore);
    // add current item id to array items
    for (let index = 0; index < items.length; index++) {
        items[index].id = index + 1;
    }
    // save array to local storage
    saveToLocalStorage(localStorageName, items);
}

export function removeItemFromLocalStorage(localStorageName, itemToRemoveById) {
    // get local storage to array
    let items = getFromLocalStorage(localStorageName);
    // filter items array to remove item by item id
    const filteredItems = items.filter(item => item.id !== itemToRemoveById);
     // add current item id to array items
     for (let index = 0; index < filteredItems.length; index++) {
        filteredItems[index].id = index + 1;
    }
    // save array to local storage
    saveToLocalStorage(localStorageName, filteredItems);
}

 