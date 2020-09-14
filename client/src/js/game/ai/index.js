
// OBJECT USING PATH
// _pathIdIndex: object._pathIdIndex,
// _pathOnWayBack:  object._pathOnWayBack,

// pathId:  object.pathId,

// PATH OBJECT
// pathParts:  [
//  gridX,
//  gridY,
//  x, y
//  width, height
//  index
// ]
// _pathUsesCustomGrid: object._pathUsesCustomGrid,
// customGridProps: object.customGridProps

// _pfGrid: object.pfGrid,

import pathfinding from '../../utils/pathfinding.js'
import collision from '../../utils/collisions'
import gridUtil from '../../utils/grid.js'

import { pathfindingAI, setTarget, setPathTarget } from './pathfinders'
import { spawnObject } from '../spawnZone'

function moveTowardsTarget(object, target, delta, options = { flat: false}) {
  let oldX = object.x
  let oldY = object.y

  if(typeof target.x == 'number' && object.x > target.x) {
    if(options.flat) object.velocityX = -object.mod().speed || -100
    else {
      object.velocityX -= (object.mod().speed || 100) * delta
    }
  }
  if(typeof target.x == 'number' && object.x < target.x) {
    if(options.flat) object.velocityX = object.mod().speed || 100
    else object.velocityX += (object.mod().speed || 100) * delta
  }
  let newX = object.x + object.velocityX * delta

  if(typeof target.y == 'number' && object.y > target.y) {
    if(options.flat) object.velocityY = -object.mod().speed || -100
    else object.velocityY -= (object.mod().speed || 100) * delta
  }
  if(typeof target.y == 'number' && object.y < target.y) {
    if(options.flat) object.velocityY = object.mod().speed || 100
    else object.velocityY += (object.mod().speed || 100) * delta
  }
  let newY = object.y + object.velocityY * delta

  if(typeof target.x == 'number' && (target.x < oldX && target.x > newX || target.x > oldX && target.x < newX || target.x === object.x)) {
    object.x = target.x
    target.x = null
    object.velocityX = 0
  }
  if(typeof target.y == 'number' && (target.y < oldY && target.y > newY || target.y > oldY && target.y < newY || target.y === object.y)) {
    object.y = target.y
    target.y = null
    object.velocityY = 0
  }
}

function moveOnPath(object, delta) {
  let pathX = (object.path[0].x * GAME.grid.nodeSize) + GAME.grid.startX
  let pathY = (object.path[0].y * GAME.grid.nodeSize) + GAME.grid.startY

  let pathSpeedX = object.mod().speed || -100
  let pathSpeedY = object.mod().speed || -100

  moveTowardsTarget(object, {x: pathX, y: pathY }, delta, { flat: true })

  let diffX = Math.abs(object.x - pathX)
  let diffY = Math.abs(object.y - pathY)

  const { gridX, gridY, x, y } = gridUtil.convertToGridXY(object)
  object.gridX = gridX
  object.gridY = gridY

  if(object.gridX == object.path[0].x && diffX <= 2) {
    object.x = pathX
    object.velocityX = 0
  }

  if(object.gridY == object.path[0].y && diffY <= 2) {
    object.y = pathY
    object.velocityY = 0
  }

  if(object.gridY == object.path[0].y && object.gridX == object.path[0].x && diffX <= 2 && diffY <= 2) {
    object.velocityX = 0
    object.velocityY = 0
    object.path.shift();
    return
  }
}

function onUpdate(objects, delta) {
  objects.forEach((object) => {
    if(object.removed) return
    //////////////////////////////////////////
    //////////////////////////////////////////
    //////////////////////////////////////////
    //////////////////////////////////////////
    //////////////////////////////////////////
    //////////////////////////////////////////
    //////////////////////////////////////////
    //MOVEMENT
    //////////////////////////////////////////
    //////////////////////////////////////////

    const shouldPursue = !object.pathId && (!object.path || object.path.length === 0) && object._targetPursueId
    if(shouldPursue && object.mod().tags['zombie']) {
      const target = OBJECTS.getObjectOrHeroById(object._targetPursueId)
      setTarget(object, target)
    }

    if(shouldPursue && object.mod().tags['homing']) {
      const target = OBJECTS.getObjectOrHeroById(object._targetPursueId)
      setPathTarget(object, target)
    }


    let readyForNextTarget = false
    if(object.mod().tags.pathfindDumb || object.mod().tags.pathfindDumb) {
      readyForNextTarget = !object.targetXY || (object.targetXY && object.targetXY.x == null && object.targetXY.y == null)
    } else {
      readyForNextTarget = (!object.path || (object.path && object.path.length === 0))
    }

    if(object.pathId && !object._pathWait && readyForNextTarget) {
      const target = OBJECTS.getObjectOrHeroById(object.pathId)
      console.log('getting next', object.targetXY)
      if(typeof object._pathIdIndex === 'number') {
        if(object.mod().tags.pathfindWait) {
          object._pathWait = true
          GAME.addTimeout(object.id + '-pathfindwait', 5, () => {
            object._pathIdIndex++
            object._pathWait = false
          })
        } else {
          object._pathIdIndex++
        }
      } else {
        object._pathIdIndex = 0
      }

      if (target && target.pathParts && target.pathParts.length) {
        if(target.pathParts[object._pathIdIndex]) {
          if(object.mod().tags.pathfindDumb) {
            setTarget(object, target.pathParts[object._pathIdIndex])
          } else {
            setPathTarget(object, target.pathParts[object._pathIdIndex])
          }
        } else if(object.mod().tags.pathfindLoop){
          object._pathIdIndex = 0
          if(object.mod().tags.pathfindDumb) {
            setTarget(object, target.pathParts[object._pathIdIndex])
          } else {
            setPathTarget(object, target.pathParts[object._pathIdIndex])
          }
        } else {
          object.pathId = null
          object._pathIdIndex = null
        }
      } else {
        delete object.pathId
        delete object._pathIdIndex
      }
    }

    if(object.path && object.path.length) {
      if(GAME.resetPaths && !object.pathId) {
        object.path = []
        object.velocityX = 0
        object.velocityY = 0
      } else {
        moveOnPath(object, delta)
      }
    } else if(object.targetXY) {
      moveTowardsTarget(object, object.targetXY, delta)
    }

    pathfindingAI(object)

    spawnObject(object)
  })
}

export default {
  onUpdate,
}
