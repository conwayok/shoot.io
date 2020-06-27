function getRandomInt (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function calcDistance (x1, y1, x2, y2) {
  return Math.sqrt(
    Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function getRandomPos (minX, minY, maxX, maxY) {
  let xPos = getRandomInt(minX, maxX);
  let yPos = getRandomInt(minY, maxY);
  return { x: xPos, y: yPos };
}

function getRandomElement (array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}