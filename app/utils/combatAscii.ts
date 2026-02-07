export type CombatFigure =
  | 'player'
  | 'companion'
  | 'defender'
  | 'dead'
  | 'gate'
  | 'gateDead'
  | 'archer'

const ASCII: Record<CombatFigure, string> = {
  player: ' o/ \n/|\\ \n/ \\ ',
  companion: ' o  \n/|\\ \n/ \\ ',
  defender: '\\o/ \n |  \n/ \\ ',
  dead: 'x_x \n___ \n    ',
  gate: '|  |\n|  |\n|  |\n|  |\n|  |\n+--+\n|##|\n|  |\n+--+\n|  |\n|  |\n|  |\n|  |\n|  |\n|  |',
  gateDead:
    '|  |\n|  |\n|  |\n|  |\n|  |\n+--+\n /# \n #\\ \n+--+\n|  |\n|  |\n|  |\n|  |\n|  |\n|  |',
  archer: ' o  \n/|) \n/ \\ ',
}

export function getCombatAscii(type: CombatFigure): string {
  return ASCII[type]
}
