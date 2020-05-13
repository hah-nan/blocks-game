import React from 'react'
import { ToastContainer, toast, Slide, Zoom, Flip, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default class Root extends React.Component{
  constructor(props) {
    super(props)

    this.state = {
      activeQuest: {},
      gameState: {},
      toastingActiveQuestGoalId: null,
      toastingActiveQuestGoalToastId : null,
    }

    this.onUpdateState = () => {
      const hero = GAME.heros[HERO.id]

      this.setState({
        activeQuest: this._getActiveQuest(hero),
        quests: hero.quests,
      }, () => {
        this._showActiveQuestGoalToast()
      })
    }
  }

  _getActiveQuest(hero) {
    let activeQuest;
    if(hero.questState) {
      Object.keys(hero.questState).forEach((questId) => {
        if(hero.questState[questId].active) {
          activeQuest = hero.quests[questId]
        }
      })
    }
    return activeQuest
  }

  _showActiveQuestGoalToast() {
    const {
      activeQuest,
      toastingActiveQuestGoalId,
      toastingActiveQuestGoalToastId
    } = this.state;

    if(!activeQuest) {
      if(toastingActiveQuestGoalToastId) {
        toast.dismiss(toastingActiveQuestGoalToastId)
      }
      this.setState({
        toastingActiveQuestGoalId: null,
        toastingActiveQuestGoalToastId: null,
      })

      return
    }

    if(activeQuest && activeQuest.id !== toastingActiveQuestGoalId) {
      if(toastingActiveQuestGoalToastId) {
        toast.dismiss(toastingActiveQuestGoalToastId)
      }

      this.setState({
        toastingActiveQuestGoalId: activeQuest.id,
        toastingActiveQuestGoalToastId: toast(activeQuest.goal)
      })
    }
  }

  render() {
    return (
      <div className="PlayerUI">
        <ToastContainer
          position="top-center"
          autoClose={false}
          closeOnClick={false}
          closeButton={false}
          hideProgressBar={true}
          newestOnTop={false}
          draggable={false}
          transition={Slide}
        />
      </div>
    )
  }
}
