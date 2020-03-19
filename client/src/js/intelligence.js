import pathfinding from './pathfinding.js'
import collision from './collisions'
import gridTool from './grid.js'

function init(hero, objects){


}

function moveOnPath(object) {
  const { x, y, diffX, diffY } = gridTool.convertToGridXY(object)
  object.gridX = x
  object.gridY = y

  if(object.gridY == object.path[0].y && object.gridX == object.path[0].x && diffX < 2 && diffY < 2) {
    object.velocityX = 0
    object.velocityY = 0
    object.path.shift();
    return
  }

  if(object.gridX == object.path[0].x && diffX < 2) {
    object.velocityX = 0
  } else if(object.gridX > object.path[0].x) {
    object.velocityX = -object.speed || -100
  } else if(object.gridX < object.path[0].x) {
    object.velocityX = object.speed || 100
  }

  if(object.gridY == object.path[0].y && diffY < 2) {
    object.velocityY = 0
  } else if(object.gridY > object.path[0].y) {
    object.velocityY = -object.speed || -100
  } else if(object.gridY < object.path[0].y) {
    object.velocityY = object.speed || 100
  }
}

function update(hero, objects, modifier) {
  objects.forEach((object) => {
    if(object.path && object.path.length) {
      moveOnPath(object)
    }

    if(object.tags && object.tags['monster']) {
      object.target = window.hero

      if(object.target.x > object.x) {
        object.velocityX = object.speed || 100
      } else if (object.target.x < object.x) {
        object.velocityX = -object.speed || -100
      }

      if(object.target.y > object.y) {
        object.velocityY = object.speed || 100
      } else if (object.target.y < object.y) {
        object.velocityY = -object.speed || -100
      }
    }

    if(object.tags && object.tags['obstacle']) {
      object.velocityY = 0
      object.velocityX = 0
      object.accY = 0
      object.accX = 0
    }


    if(object.tags && object.tags['patrol']) {
      if(!object.path || (object.path && !object.path.length)) {
        object.path = [pathfinding.walkAround(object)]
      }
    }

    if(object.tags && object.tags['goomba']) {
      if(!object.path || (object.path && !object.path.length)) {
        pathfinding.goombaWalk(object)
      }
    }
  })
}

export default {
  init,
  update,
}
