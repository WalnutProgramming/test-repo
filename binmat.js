const readline = require('readline-sync');

/*
valid operations:
d = draw
c = combat
p = play [face down]
u = play [face up]
x = discard

Examples:
d0 - draw from lane 0
c1 - initiate combat in lane 1
p54 - play card with value 5 from lane 4, face down
ua3 - play card with value a (which is 10) to lane 3, face up
x3a - discard card with value 3 to attacker discard
x?#4 - discard card with value ? (a bounce card) and suit # to lane 4
*/

//hands
var atkH = [], defH = []

/*
lane discard decks
lane decks
defender stacks
attacker stacks
defender stacks face up
attacker stacks face up
*/
var ldDk = [[], [], [], [], [], []]
var lDk = [[], [], [], [], [], []]
var dStk = [[], [], [], [], [], []]
var aStk = [[], [], [], [], [], []]
var dStkU = [false, false, false, false, false, false]
var aStkU = [false, false, false, false, false, false]

//attacker discard deck and attacker deck
var adDk = [], aDk = [];

function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

function setup () {
  var fullDk = []
  const cardTypes = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "@", "*", "?", ">"]

  cardTypes.forEach(type => {
    for(var i = 0; i < 6; i++){
      fullDk.push(type)
    }
  });

  shuffle(fullDk)
  shuffle(fullDk)
  shuffle(fullDk)
  shuffle(fullDk)
  shuffle(fullDk)

  for(var i = 0; i < 78; i+=6){
    for(var j = 0; j < 6; j++){
      lDk[j].push(fullDk[i+j])
    }
  }
}

setup()

var gameWon;

function draw(def, pos){
  if(pos === 'a'){
    if(def){
      console.log("Invalid Lane");
      return false
    }
    if(aDk && aDk.length){
      atkH.push(aDk.pop())
    }
    else{
      if(adDk && adDk.length){
        shuffle(adDk)
        aDk = adDk
        atkH.push(aDk.pop())
      }
      else{
        gameWon = true;
        console.log("Defender Won (Attacker Drawout)")
        return false
      }
    }
  }
  var lane = parseInt(pos, 10)
  if(lane > -1 && lane < 6){
    if(lDk[lane] && lDk[lane].length){
      if(def){
        defH.push(lDk[lane].pop())
      }
      else if(!def && !(dStk[lane] && dStk[lane].length)){
        atkH.push(lDk[lane].pop())
      }
      else{
        console.log("Invalid Drawing (Check Defender Stack)")
        return false
      }
    }
    else{
      if(ldDk[lane] && ldDk[lane].length){
        shuffle(ldDk[lane])
        lDk[lane] = ldDk[lane]
        defH.push(lDk[lane].pop())
      }
      else{
        gameWon = true;
        console.log("Attacker Won")
        return false
      }
    }
  }
  else{
    console.log("Invalid lane number");
    return false
  }
  if(def){
    //console.log(defH)
  }
  else{
    //console.log(atkH)
  }
  return true
}

function discard(card, pos){

  if(defH.includes(card)){
    const index = defH.indexOf(card);
    var popped
    if (index > -1) {
      popped = defH.splice(index, 1);
    }

    var lane = parseInt(pos, 10)
    if(lane > -1 && lane < 6){
      ldDk[lane] = ldDk[lane].concat(popped)
    }
    else{
      console.log("Invalid lane number")
      return false
    }
  }
  else{
    console.log("You don't have that card!")
    return false
  }

  return true

}

function amount(arr, str){
  var amt = 0;
  arr.forEach((element) => {
    if(element === str){
      amt += 1;
    }
  });
  return amt;
}

function trapping(def, pos){
  var traps = 0

  if(def){
    if(!dStkU[pos]){ //if defender stack face down
      traps = amount(defH, "@")
      for(var i = 0; i < traps; i++){
        if(aStk[pos].length > 0){
          aStk[pos].pop()
        }
      }
    }
    traps = amount(atkH, "@")
    for(var i = 0; i < traps; i++){
      if(dStk[pos].length > 0){
        dStk[pos].pop()
      }
    }
  }
  else{
    traps = amount(atkH, "@")
    for(var i = 0; i < traps; i++){
      if(dStk[pos].length > 0){
        dStk[pos].pop()
      }
    }
    traps = amount(defH, "@")
    for(var i = 0; i < traps; i++){
      if(aStk[pos].length > 0){
        aStk[pos].pop()
      }
    }
  }

}

function findPower(def, pos, breakm){
  var pow = [2,3,8,16,32,64,128,256,512,1024,2048]
  if(def){
    var total = 0
    var power = 0
    var wilds = amount(dStk[pos], "*")
    dStk[pos].forEach((element) => {
      if(Number.isInteger(element)){
        total += parseInt(element, 10)
      }
    });
    for(var i = 0; i < pow.length; i++){
      if(total == pow[i]){
        power = (i+1);
      }
      else if(total > pow[(i-1)] && total < pow[i] && wilds > 0){
        power = (i+1);
      }
    }
    power += wilds
    return power
  }
  else{
    var total = 0
    var power = 0
    var wilds = amount(aStk[pos], "*")
    if(!breakm){
      aStk[pos].forEach((element) => {
        if(Number.isInteger(element)){
          total += parseInt(element, 10)
        }
      });
    }
    else{
      total = dStk.length()
      for(var i = 0; i < pow.length; i++){
        if(total === pow[i]){
          return (i+1)
        }
      }
    }
    for(var i = 0; i < pow.length; i++){
      if(total == pow[i]){
        power = (i+1);
      }
      else if(total > pow[(i-1)] && total < pow[i] && wilds > 0){
        power = (i+1);
      }
    }
    power += wilds
    return power
  }
}

function combat(defStart, pos){
  //needs to look for modifiers and make sums and powers

  trapping(defStart, pos)

  dStkU[pos] = true

  if(dStk[pos].includes("?") || aStk[pos].includes("?")){
    for(var i = 0; i < dStk.length; i++){
      if(dStk[pos][i] === "?"){
        dStk[pos][i].splice(i,1)
      }
      if(aStk[pos][i] === "?"){
        aStk[pos][i].splice(i,1)
      }
    }
  }

  adDk += aStk[pos];
  aStk[pos] = []

  var dPow = findPower(true, pos, false)
  var aPow = findPower(false, pos, false)

  if(dStk[pos].includes(">") || aStk[pos].includes(">")){
    aPow = Math.max(findPower(false, pos, false), findPower(false,pos,true))
  }

  if(dPow > aPow){
    adDk += aStk[pos];
    aStk[pos] = []
  }
  else{
    var diff = (Math.abs(aPow-dPow) + 1)
    if(diff < dStk[pos].length){
      for(var i = 0; i < diff; i++){
        dStk.pop()
      }
    }
    else if(diff === dStk[pos].length){
      dStk[pos] = []
    }
    else{
      diff -= dStk.length
      for(var i = 0; i < diff; i++){
        draw(false, pos)
      }
    }
  }

  console.clear()
}

function place (faceUp, def, card, pos){
  var lane = parseInt(pos, 10)
  var hand
  if(def){
    hand = defH
  }
  else{
    hand = atkH
  }
  if(hand.includes(card)){
    const index = hand.indexOf(card);
    var popped
    if (index > -1) {
      popped = hand.splice(index, 1);
    }

    if(!(lane > -1 && lane < 6)){
      console.log("Invalid lane number")
      return false
    }
  }
  else{
    console.log("You don't have that card!")
    return false
  }

  if(def){
    if(faceUp && dStkU[lane]){ //faceup and stk is faceup
      dStk[lane] = dStk[lane].concat(popped)
    }
    else if(!faceUp && !dStkU[lane]){ //facedown and stk is facedown
      dStk[lane] = dStk[lane].concat(popped)
    }
    else if(faceUp && !(dStk[lane] && dStk[lane].length)){ //faceup and empty
      dStkU[lane] = true
      dStk[lane] = dStk[lane].concat(popped)
    }
    else{
      console.log("Orientation wrong check stacks")
      return false
    }
    console.log(dStkU[lane] + ' ' + dStk[lane])
    if(card === ">"){
      combat(true, pos)
    }
  }
  else{
    if(faceUp && aStkU[lane]){ //faceup and stk is faceup
      aStk[lane] = aStk[lane].concat(popped)
    }
    else if(!faceUp && !aStkU[lane]){ //facedown and stk is facedown
      aStk[lane] = aStk[lane].concat(popped)
    }
    else if(faceUp && !(aStk[lane] && aStk[lane].length)){ //faceup and empty
      aStkU[lane] = true
      aStk[lane] = aStk[lane].concat(popped)
    }
    else{
      console.log("Orientation wrong check stacks")
      return false
    }
    console.log(aStkU[lane] + ' ' + aStk[lane])
    if(card === ">"){
      combat(false, pos)
    }
  }
  return true
}

function twoChar(number){
  var num = number.toString();
  if(num.length < 2){
    return (" " + num)
  }
  else{
    return num.toString()
  }
}

function printEnvironment(def){
  console.log("|" + twoChar(aStk[0].length) + "|" + twoChar(aStk[1].length) + "|" + twoChar(aStk[2].length) + "|" + twoChar(aStk[3].length) + "|" + twoChar(aStk[4].length) + "|" + twoChar(aStk[5].length) + "|" + twoChar(aDk.length) + "|")
  console.log("|" + twoChar(dStk[0].length) + "|" + twoChar(dStk[1].length) + "|" + twoChar(dStk[2].length) + "|" + twoChar(dStk[3].length) + "|" + twoChar(dStk[4].length) + "|" + twoChar(dStk[5].length) + "|" + twoChar(adDk.length) + "|")
  console.log("|" + twoChar(lDk[0].length) + "|" + twoChar(lDk[1].length) + "|" + twoChar(lDk[2].length) + "|" + twoChar(lDk[3].length) + "|" + twoChar(lDk[4].length) + "|" + twoChar(lDk[5].length) + "|")
  console.log("|" + twoChar(ldDk[0].length) + "|" + twoChar(ldDk[1].length) + "|" + twoChar(ldDk[2].length) + "|" + twoChar(ldDk[3].length) + "|" + twoChar(ldDk[4].length) + "|" + twoChar(ldDk[5].length) + "|")
  console.log("defender hand length: " + defH.length)
  console.log("attacker hand length: " + atkH.length)
  if(def){
    console.log("defender hand: " + defH)
  }
  else{
    console.log("attacker hand: " + atkH)
  }
}

function play () {

  var def = true
  var turn = 0
  gameWon = false

  while(!gameWon){

    printEnvironment(def)

    if(turn === 110){
      gameWon = true
      console.log("Defender Won (110 Turns)")
      continue
    }

    var userinput = readline.question('').toString()
    var i = userinput.charAt(0)

    switch (userinput.charAt(0)) {
      case 'd':
        if(!draw(def, userinput.charAt(1))){
          continue
        }
            console.clear()
        break;
      case 'c':
        if(!def){
          if(!combat(def, userinput.charAt(1))){
            continue
          }
        }
        else{
          console.log("This is an attcker only action")
          continue
        }
        break;
      case 'p':
        if(!place(false,def,userinput.charAt(1),userinput.charAt(2))){
          continue
        }
        console.clear()
        break;
      case 'u':
        if(!place(true,def,userinput.charAt(1),userinput.charAt(2))){
          continue
        }
        console.clear()
        break;
      case 'x':
        if(def){
          if(!discard(userinput.charAt(1), userinput.charAt(2))){
            continue
          }
        }
        else{
          console.log("Attacker cannot discard")
          continue
        }
        console.clear()
        break;
      default:
        console.log("Invalid Command");
        continue;

    }

    def = !def
    turn++

  }

}

play()
