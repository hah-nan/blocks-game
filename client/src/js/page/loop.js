//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
/////// CORE LOOP
///////////////////////////////
///////////////////////////////
let updateInterval = 1000/60
let renderInterval = 1000/24
let mapNetworkInterval = 1000/8
let completeNetworkInterval = 1000/.5
var frameCount = 0;
var fps, startTime, now, deltaRender, deltaMapNetwork, deltaCompleteNetwork, thenRender, thenMapNetwork, thenCompleteNetwork, thenUpdate, deltaUpdate;
window.w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;
window.startGameLoop = function() {
  if(!GAME.objects || !GAME.world || !GAME.grid || !GAME.heros || (PAGE.role.isPlayer && !HERO.hero)) {
    console.log('game loaded without critical data, trying again soon', !GAME.objects, !GAME.world, !GAME.grid, !GAME.heros, (PAGE.role.isPlayer && !HERO.hero))
    setTimeout(startGameLoop, 1000)
    return
  }

  startTime = Date.now();
  thenMapNetwork = startTime;
  thenCompleteNetwork = startTime;
  thenUpdate = startTime;
  thenRender = startTime;

  // begin main loop
  mainLoop()
}

var mainLoop = function () {
  // Request to do this again ASAP
  requestAnimationFrame(mainLoop);

  // calc elapsed time since last loop
  now = Date.now();
  deltaRender = now - thenRender;
  deltaMapNetwork = now - thenMapNetwork;
  deltaCompleteNetwork = now - thenCompleteNetwork;
  deltaUpdate = now - thenUpdate;

  // if enough time has deltaRender, draw the next frame
  if (deltaRender > renderInterval) {
      // Get ready for next frame by setting then=now, but...
      // Also, adjust for gameInterval not being multiple of 16.67
      thenRender = now - (deltaRender % renderInterval);
      render(deltaRender / 1000)

      // TESTING...Report #seconds since start and achieved fps.
      var sinceStart = now - startTime;
      var currentFps = Math.round(1000 / (sinceStart / ++frameCount) * 100) / 100;
      if(frameCount > 10) {
        frameCount = 0
        startTime = Date.now()
      }

      PAGE.fps = currentFps;
  }

  if (deltaUpdate > updateInterval) {
    if(deltaUpdate > 23) deltaUpdate = 23
    thenUpdate = now - (deltaUpdate % updateInterval);
    update(deltaUpdate / 1000);
  }

  if (PAGE.role.isHost && deltaCompleteNetwork > completeNetworkInterval) {
    thenCompleteNetwork = now - (deltaCompleteNetwork % completeNetworkInterval);
    completeNetworkUpdate()
  } else if (PAGE.role.isHost && deltaMapNetwork > mapNetworkInterval) {
    thenMapNetwork = now - (deltaMapNetwork % mapNetworkInterval);
    mapNetworkUpdate()
  }
};

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
/////// UPDATE GAME OBJECTS AND RENDER
///////////////////////////////
///////////////////////////////

function update(delta) {
  window.local.emit('onUpdate', delta)
}

function render(delta) {
  window.local.emit('onRender', delta)
}

function mapNetworkUpdate() {
  window.socket.emit('updateObjects', GAME.objects.map(OBJECTS.getMapState))
  window.socket.emit('updateHeros', GAME.heroList.reduce((prev, hero) => {
    prev[hero.id] = HERO.getMapState(hero)
    return prev
  }, {}))
}

function completeNetworkUpdate() {
  window.socket.emit('updateObjectsComplete', GAME.objects)
  window.socket.emit('updateHerosComplete', GAME.heros)
  window.socket.emit('updateGameState', GAME.gameState)
  window.socket.emit('updateWorldOnServerOnly', GAME.world)
  if(GAME.gameState.started && GAME.world.storeEntireGameState) {
    let storedGameState = localStorage.getItem('gameStates')
    localStorage.setItem('gameStates', JSON.stringify({...JSON.parse(storedGameState), [GAME.id]: {...GAME, grid: {...GAME.grid, nodes: null }}}))
  }
}