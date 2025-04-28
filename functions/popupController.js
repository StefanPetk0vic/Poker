//settings-container-id , settings-popup-id
import { ShowCards } from "../script.js";

function SettingsPopup() {
    let popup = CreatePopup("settings","settings-container-id", "settings-popup-id", "Settings 🛠️", true, "settings-btn-id")
    let btn = popup.querySelector('#settings-btn-id');
    if (btn) {
        btn.innerHTML = "Show Cards";
        btn.addEventListener('click', () => {
            const popupContainer = btn.closest('.popup-container');
            if (popupContainer) {
                popupContainer.classList.add("loading-disabled");
            }
            ShowCards();
        });
    }
}
window.SettingsPopup=SettingsPopup;
function CreatePopup(ClassName,ContainerID, popupID, value, buttonFlag = false, buttonID) {
    let body = document.querySelector('body');
    let PopupContainer = document.createElement('div');
    let popup = document.createElement('div');
    let text = document.createElement('p');

    PopupContainer.classList.add("popup-container",ClassName);
    PopupContainer.id = ContainerID;
    popup.classList.add('popup');
    popup.id = popupID;
    text.innerText = value;
    popup.appendChild(text);
    if (buttonFlag) {
        let btn = document.createElement('button');
        btn.classList.add("main-btn")
        btn.id = buttonID;
        popup.appendChild(btn);
    }
    PopupContainer.appendChild(popup);
    body.appendChild(PopupContainer);
    return popup;
}