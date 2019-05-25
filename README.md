# (WIP) Simple AHK - A simple AHK transpiler

> Write Javscript and produce .ahk scripts

This project is limited in scope to:
- Set key bindings
- Set keys to repeat
- Set keys to toggle
- _A composition of the above_

- [Purpose](#purpose)
- [Example](#example)
- [API](#api)
- [Why](#why)

## Purpose

- Gaming. Write macros for games to fine tune bindings and reduce RSI
- Also useful for general simple desktop bindings
- Composition. Compose existing AHK scripts and arbitrary snippets to manage your scripts programmatically.

## Example

> Gaming example

```ts
import { Ahk, repeatWhilePressed, toggleRepeatOnTap, toggleOnTap } from 'simple-ahk

Ahk()
  .IfWinActive('ahk_class my_game')
  .bind('LShift', 'Space')
  .bind( '$~LButton', repeatWhilePressed({ whilePressed: 'LButton', repeatKeys: ['LButton'] }))
  .bind('$~RButton', toggleRepeatOnTap({ whenTapped: 'RButton', repeatKeys: ['RButton'] }))
  .bind('$x', toggleOnTap({ whenTapped: 'x', toogleKeys: ['z'] }))
  .toFile('./myScript.ahk')


const myScript = Ahk()
  .SingleInstance('Force')
  .bind('LShift', 'Space')
  .toString()


Ahk()
  .raw(`
    #IfWinActive, ahk_class foobar

    LShift::Space
  `)
  .toFile('./myRawScript.ahk')
```

## API

- `Ahk` exposes a fluid interface.
- Each method call pushes lines to the stack, so order matters.
  
```ts
const ahk = Ahk()

ahk.IfWinActive('ahk_class my_game')
// #IfWinActive, ahk_class my_game

ahk.bind('~LShift', 'Space')
// ~LShift::Space

ahk.raw(`~LButton::RButton`)
// ~LButton::RButton

ahk.toFile('./myScript.ahk')
// Writes the script to the path, which is relative to the file this is called from

ahk.toString() // Returns the script as as string.
/*
#IfWinActive, ahk_class my_game

~LShift::Space
~LButton::RButton
*/

ahk.stack // The current stack, as [[]]
```

## Why

- AHK is seems like the most dominant way of producing bindings in Windows effectively
- AHK is a miserable language to work in
- It's less complex to transpile to AHK than to use AHK libs, as the scope of this project is quite focused. The transpiled code can then be audited or checked out.