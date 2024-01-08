import EventEmitter from 'wolfy87-eventemitter';

// Singleton event emitter manages events that occur in the editor
//    ie, editorOpened, clickPurchaseButton, clickExitEditor
export default new EventEmitter();