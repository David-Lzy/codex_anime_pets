'use strict';
const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('pet', {
  ready: () => ipcRenderer.invoke('pet:ready'),
  menu: () => ipcRenderer.send('pet:menu'),
  gesture: name => ipcRenderer.send('pet:gesture', name),
  drag: point => ipcRenderer.send('pet:drag', point),
  loaded: ok => ipcRenderer.send('pet:loaded', ok === true),
  onUpdate: callback => { const listener = (_, state) => callback(state); ipcRenderer.on('pet:update', listener); return () => ipcRenderer.removeListener('pet:update', listener); }
});
