// ==UserScript==
// @name     DivineStumbler
// @version  1
// @grant    none
// @require https://cdn.rawgit.com/skepticfx/wshook/master/wsHook.js
// @run-at document-start
// @match https://play.idle.land/*
// ==/UserScript==

/* TODO *//*
- block outgoing undefined dd locations.
- Add pet auto-gather?
    - would require default pet to switch back to
- auto class change affirm
- When submitting ddStorage.list, sendDD
    - impossible without making ws globally exposed, better to way for next dd event?
- dd steps not updating
- new dd when reached checkpoint
*/
console.log('Loaded DivineStumbler!');

const options = {
    enabled: false,
    reverse: true
}
const ddStorage = {
    list: [],
    curr: 0,
    setDD: function () {
        if (this.curr > this.list.length) {
            this.curr = 0;
            this.list = this.list.reverse();
        }
        return this.list[++this.curr];
    }
}
const playerData = {
    currLoc: {
        x: null,
        y: null
    },
    dd: null
}

// add divine stumbler menu option and dialogue
const menuListInject = {
    cssSelector: '.ion-margin-bottom > ion-list:nth-child(1)',
    injected: false,
    inject: function () {
        let menuList = document.querySelector(this.cssSelector);
        if (menuList !== null) {
            // create and inject the menu item
            let menuItem = document.createElement('div');
            menuItem.innerHTML = `
            <ion-item onClick="showDialogue(); populateInput();" class="item-label hydrated item md in-list ion-activatable ion-focusable">
                <button type="button" class="item-native">
                    <div class="item-inner">
                        <div class="item-inner-highlight"></div>
                    </div>
                    <ion-ripple-effect role="presentation" class="md hydrated"></ion-ripple-effect>
                </button>
                <ion-label class="sc-ion-label-md-h sc-ion-label-md-s md hydrated"> Divine Stumbler </ion-label>
            </ion-item>
            `;
            menuList.appendChild(menuItem);
            // create and inject the dialogue
            let dialogue = document.createElement('div');
            dialogue.innerHTML = `
            <div id="divine-stumbler"
                style=" display: none; flex-direction: column; color:white; background: rgba(34,36,40,1); position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 25%; height: 50%;">
                <div style="position: absolute; margin: 0px; right: 0;"><button id="ds-hide" type="button" onclick="hideDialogue()" style="font-size: 30px; color: white; background: none; border: none;">✕</button></div>
                <h1 style="padding-left: 15px;">Divine Stumbler</h1>
                <div style="margin: -15px 15px 0px 15px;"><input id="ds-enable" onchange="dsEnable();" type="checkbox"><label> Enabled</label></div>
                <div style="margin: 0px 15px 0px 15px;"><input id="ds-reverse" onchange="dsReverse();" type="checkbox"><label> Reverse</label></div>
                <div style="flex: 1; margin: 5px 15px 0px 15px;"><textarea id="ds-input" style="padding: 5px; color: white; background: rgba(85,87,91,1); border:none; resize: none; width: 100%; height: 100%;"></textarea></div>
                <div style="margin: 10px 15px 10px 15px;"><button id="ds-submit" type="button" onclick="submitDS()" style="color: white; background: rgba(85,87,91,1); border: none; height: 30px; width: 100%;">Submit</button></div>
            </div>
            `;
            document.body.appendChild(dialogue);
            this.injected = true;
        }
    },
    // continue attempting to inject the html until success
    // this should only fail a couple times at most
    interval: setInterval(function () {
        if (menuListInject.injected) {
            clearInterval(menuListInject.interval);
        } else {
            menuListInject.inject();
        }
    }, 100)
}

// intercept outgoing data
wsHook.before = function (data, url, wsObject) {
    // // ignore heartbeat
    // if (data === '#2') return data;
    // let parsed = JSON.parse(data);
    // // if it is not a dd message
    // if (parsed.event !== 'character:divinedirection') return data;
    // // if the dd is included in the set list of dd locations
    // if (!ddStorage.list.some((dd => dd.x === parsed.data.x && dd.y === parsed.data.y))) {
    //     console.log(parsed.data)
    // }
    return data;
}

// intercept incoming data
wsHook.after = function (data, url, wsObject) {
    // ignore heartbeats
    if (data.data === '#1') return data;
    // parse interior data
    let parsed = JSON.parse(data.data);
    /* Ignore Unwanted Messages */
    if (parsed.rid) return data;
    if (parsed.channel === 'playerUpdates') return data;
    if (parsed.data.name !== 'character:patch') return data;

    // find current divine direction
    let tempDd = parsed.data.data.findPath('/divineDirection');
    playerData.dd = tempDd !== undefined ? tempDd : playerData.dd;
    // find possible new x
    let tempX = parsed.data.data.findPath('/x');
    playerData.currLoc.x = tempX !== undefined ? tempX : playerData.currLoc.x;
    // find possible new y
    let tempY = parsed.data.data.findPath('/y');
    playerData.currLoc.y = tempY !== undefined ? tempY : playerData.currLoc.y;

    // auto divine direction
    sendDd(wsObject);
    console.log(playerData)
    return data;
}

// send a new DD using the given websocket
const sendDd = (ws) => {
    // if nothing to send, don't send
    if (ddStorage.list.length <= 0) return;
    // 
    if (resetDd(playerData)) ws.send(formatDd(ddStorage.setDD()))
    // code for if we need to reset DD because it was not reached goes here
    // TODO
}

// Do I need to reset the dd?
// if ds is enabled => yes
// if current dd is null => yes
// if current location equals dd location => yes
const resetDd = (data) => options.enabled ?
    data.dd === null ?
        true : data.currLoc.x === data.dd.x && data.currLoc.y === data.dd.y ?
            true : false : false;

// given coords, return the dd object
const formatDd = (coords) =>
    JSON.stringify({
        'event': 'character:divinedirection',
        'data': coords
    });

// given a string, return an array of objects
// given an array, return a formatted string
const formatDdList = (given) => {
    // if it is not an array
    if (!Array.isArray(given)) {
        // remove all spaces except newline
        let noSpaces = given.replace(/ +?/g, '');
        // make an array of strings like ['1,2','3,4','5,6']
        let arr = noSpaces.split('\n');
        // return formatted array of objects
        let objs = arr.map(e => {
            let [x, y] = e.split(',').map(e => parseInt(e));
            if (!isNaN(x)&& !isNaN(y)) {
                return {
                    x,
                    y
                }
            }
        })
        return objs.filter(e => e !== undefined);
    } else {
        let strings = given.map(e => `${e.x},${e.y}`);
        return strings.join('\n');
    }
}

// enable checkbox for script
window.dsEnable = () => {
    let checkbox = document.getElementById('ds-enable');
    options.enabled = checkbox.checked;
}

// reverse checkbox for script
window.dsReverse = () => {
    let checkbox = document.getElementById('ds-reverse');
    options.reverse = checkbox.checked;
}

// fill textarea for dialogue with current ddList
window.populateInput = () => {
    let input = document.getElementById('ds-input');
    input.value = formatDdList(ddStorage.list);
}

// return the user's inputted ddList
window.submitDS = () => {
    let button = document.getElementById('ds-submit');
    button.style.background = 'rgba(85,87,91,0.5)';
    setTimeout(() => {
        button.style.background = 'rgba(85,87,91,1)';
    }, 100);
    let input = document.getElementById('ds-input');
    ddStorage.list = formatDdList(input.value);
}

// open the dialogue
window.showDialogue = () => {
    let button = document.getElementById('divine-stumbler');
    button.style.display = 'flex';
}

// hide the dialogue
window.hideDialogue = () => {
    let button = document.getElementById('divine-stumbler');
    button.style.display = 'none';
}

// given an array of objects like:
// { path: "string", value: "value" }
// find the one that matches the given path
Array.prototype.findPath = function (path) {
    let prospect = this.filter(obj => obj.path === path);
    if (prospect[0] !== undefined) return prospect[0].value;
    else return undefined;
}
