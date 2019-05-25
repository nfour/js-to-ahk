import { Ahk } from './jsToAhk';

test('Ahk interface', async () => {
  expect(
    Ahk()
  ).toMatchSnapshot();
})
test('just the globals', async () => {
  expect(
    Ahk()
      .IfWinActive('ahk_class foo')
      .InstallKeybdHook()
      .InstallMouseHook()
      .Persistent()
      .SingeInstance('Force')
      .GetKeyState('LShift', 'P')
      .toString()
  ).toMatchSnapshot();
})

// test('basic script, bindings', async () => {
//   compileTo
// })
