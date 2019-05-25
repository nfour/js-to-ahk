import { Ahk } from './jsToAhk';

test('Ahk interface', async () => {
  expect(
    Ahk()
  ).toMatchSnapshot();
})
test('global commands, directives and functions', async () => {
  expect(
    Ahk()
      .IfWinActive('ahk_class foo')
      .InstallKeybdHook()
      .InstallMouseHook()
      .Persistent()
      .SingeInstance('Force')
      .MaxHotkeysPerInterval(200)
      .SetBatchLines('5ms')
      .Send('{Alt}')
      .Sleep(100)
      .SendInput('{Alt}')
      .GetKeyState('LShift', 'P')
      .SoundBeep(200, 10)
      .Reload()
      .Suspend('Toggle')
      .Exit()
      .toString()
  ).toMatchSnapshot();
})

test('bound functions and libraries', async () => {
  expect(
    Ahk({
      inlineLibraries: {
        add: `add(a, b){\nreturn a + b\n}`
      }
    })
      .IfWinActive('banana')
      .bind('x', (ahk) => {
        ahk.dependency('add')

        ahk.putFunction('add', 2, 3)
        ahk.Send('{Space}')
      })
      .toString()
  ).toMatchSnapshot()
})
