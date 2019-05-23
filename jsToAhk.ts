import { writeFileSync } from 'fs';

export class AhkScript {
  filePath: string;

  buildContext: any;


  script: IAhkScriptConfig
  constructor (
    public saveTo

  ) {

  }

  write () {

  }
}

export type IAhkKeys = (
    '!'
  | '#'
  | '+'
  | '^'
  | '{'
  | '}'
  | 'Click' | 'WheelDown' | 'WheelUp' | 'WheelLeft' | 'WheelRight' | 'LButton' | 'RButton' | 'MButton' | 'XButton1' | 'XButton2'
  | 'Enter' | 'Escape' | 'Space' | 'Tab' | 'Backspace' | 'Delete' | 'Insert'
  | 'Up' | 'Down' | 'Left' | 'Right'
  | 'Home' | 'End' | 'PgUp' | 'PgDn'
  | 'CapsLock' | 'ScrollLock' | 'NumLock'
  | 'Control' | 'LControl' | 'RControl'
  | 'Alt' | 'LAlt' | 'RAlt'
  | 'Shift' | 'LShift' | 'RShift'
  | 'LWin' | 'RWin'
  | 'AppsKey' | 'Sleep'
  | 'Numpad0' | 'NumpadDot' | 'NumpadEnter' | 'NumpadMult' | 'NumpadDiv' | 'NumpadAdd' | 'NumpadSub' | 'NumpadDel' | 'NumpadIns' | 'NumpadClear' | 'NumpadUp' | 'NumpadDown' | 'NumpadLeft' | 'NumpadRight' | 'NumpadHome' | 'NumpadEnd' | 'NumpadPgUp' | 'NumpadPgDn'
  | 'Browser_Back' | 'Browser_Forward' | 'Browser_Refresh' | 'Browser_Stop' | 'Browser_Search' | 'Browser_Favorites' | 'Browser_Home'
  | 'Volume_Mute' | 'Volume_Down' | 'Volume_Up'
  | 'Media_Next' | 'Media_Prev' | 'Media_Stop' | 'Media_Play_Pause'
  | 'Launch_Mail' | 'Launch_Media' | 'Launch_App1' | 'Launch_App2'
  | 'PrintScreen' | 'CtrlBreak' | 'Pause'
  | 'Blind'
  | 'Raw'
)

/** Autohotkey signatures */
interface IAhk {
  globals: {
    SetBatchLines: [string]
    SendMode: ['Event' | 'Input' | 'Play']
    SetKeyDelay: [number, number]
    SingeInstance: ['Force']
    IfWinActive: ['ahk_class' | 'ahk_exe', string] | [string];
    Persistant: [];
    InstallKeybdHook: [];
    InstallMouseHook: [];
    /** @default 1 */
    MaxThreadsperHotkey: [number]
    /** Defines max hotkeys before a popup box warning will appear */
    MaxHotkeysPerInterval: [number];

    Send: [];
    GetKeyState: [string, 'P']
  }

  keyEvent: {
    key: IAhkKeys;
    state?: 'Down' | 'Up' | 'DownR' | 'DownTemp'
  }
}

/** The configuration by which to construct an AHK script */
interface IAhkScriptConfig {
  stack: [];

  /** @description Menu, Tray, Icon, shell32.dll, 46 */
  trayIcon: {
    /** @default shell32.dll */
    file: string;

    /** @default 46 */
    index: number;
  }

  /** @example [['SendMode', 'Input]] */
  globalOperations: [
    keyof IAhk['globals'],
    IAhk['globals'][keyof IAhk['globals']]
  ][]

  keyBindings: [
    IAhk['keyEvent'],
    Function
  ][]

}