// var swipeItems = document.querySelector(".swipe-item");

var activeItem = null;
var initialXPos = 0;
var active = false;
export var del = false;
var swiper;

// swipeItems.addEventListener("touchstart", dragStart, false);
// swipeItems.addEventListener("touchend", dragEnd, false);
// swipeItems.addEventListener("touchmove", drag, false);

// swipeItems.addEventListener("mousedown", dragStart, false);
// swipeItems.addEventListener("mouseup", dragEnd, false);
// swipeItems.addEventListener("mousemove", drag, false);

export function applyDrag(dragTarget) {

  // const swipeItems = document.querySelector("." + dragTarget);
  // swiper = swipeItems;
  
  dragTarget.addEventListener("touchstart", dragStart, false);
  dragTarget.addEventListener("touchend", dragEnd, false);
  dragTarget.addEventListener("touchmove", drag, false);

  // swipeItems.addEventListener("mousedown", dragStart, false);
  // swipeItems.addEventListener("mouseup", dragEnd, false);
  // swipeItems.addEventListener("mousemove", drag, false);
}

function dragStart(e) {
  active = true;
  // this is the item we are interacting with
  activeItem = e.target;

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
      e.preventDefault();

      activeItem.currentX = e.touches[0].clientX - activeItem.initialX;

      // if swipe left > 300 action taken
      if (initialXPos - activeItem.currentX >= 300) {
        swiper.classList.add("swiped");
        active = false;
        console.log("TODO // delete");
      }

      // if swipe right return to start pos
      if (initialXPos - activeItem.currentX < -50) {
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
